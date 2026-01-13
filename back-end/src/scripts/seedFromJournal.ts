/**
 * Seed Database from Parsed Gym Journal
 * Imports exercises and workouts into MongoDB
 */

import mongoose from 'mongoose';
import path from 'path';
import Exercise from '../models/Exercise';
import Workout from '../models/Workout';
import User from '../models/User';
import { connectDB } from '../services/mongooseService';
import { parseGymJournal, generateSummary, ParsedWorkout, ExtractedExercise } from './parseGymJournal';

interface SeedOptions {
    dryRun?: boolean;
    userId?: string;
    userEmail?: string;
    clearExisting?: boolean;
}

/**
 * Seed exercises from parsed data
 */
const seedExercises = async (
    exercises: ExtractedExercise[],
    options: SeedOptions
): Promise<Map<string, mongoose.Types.ObjectId>> => {
    const exerciseIdMap = new Map<string, mongoose.Types.ObjectId>();

    if (options.dryRun) {
        console.log(`\n🔍 [DRY RUN] Would seed ${exercises.length} exercises`);
        exercises.forEach((ex, i) => {
            const fakeId = new mongoose.Types.ObjectId();
            exerciseIdMap.set(ex.name.toLowerCase(), fakeId);
            if (i < 10) {
                console.log(`   - ${ex.name} [${ex.muscleGroups.join(', ')}]`);
            }
        });
        if (exercises.length > 10) {
            console.log(`   ... and ${exercises.length - 10} more`);
        }
        return exerciseIdMap;
    }

    console.log(`\n💪 Seeding ${exercises.length} exercises...`);

    for (const exercise of exercises) {
        // Check if exercise already exists (by name, case-insensitive)
        let existingExercise = await Exercise.findOne({
            name: { $regex: new RegExp(`^${escapeRegex(exercise.name)}$`, 'i') },
            isCustom: false,
        });

        if (existingExercise) {
            exerciseIdMap.set(exercise.name.toLowerCase(), existingExercise._id as mongoose.Types.ObjectId);
        } else {
            const newExercise = await Exercise.create({
                name: exercise.name,
                muscleGroups: exercise.muscleGroups,
                category: exercise.category,
                isCustom: false,
            });
            exerciseIdMap.set(exercise.name.toLowerCase(), newExercise._id as mongoose.Types.ObjectId);
        }
    }

    console.log(`✅ Seeded ${exerciseIdMap.size} exercises`);
    return exerciseIdMap;
};

/**
 * Seed workouts from parsed data
 */
const seedWorkouts = async (
    workouts: ParsedWorkout[],
    exerciseIdMap: Map<string, mongoose.Types.ObjectId>,
    userId: mongoose.Types.ObjectId,
    options: SeedOptions
): Promise<number> => {
    // Filter out symbolized workouts (they have no real exercise data)
    const validWorkouts = workouts.filter(w => !w.isSymbolized && w.exercises.length > 0);

    if (options.dryRun) {
        console.log(`\n🔍 [DRY RUN] Would seed ${validWorkouts.length} workouts (skipping ${workouts.length - validWorkouts.length} symbolized)`);
        validWorkouts.slice(0, 5).forEach(w => {
            console.log(`   - ${w.date.toDateString()} (${w.title}): ${w.exercises.length} exercises`);
        });
        if (validWorkouts.length > 5) {
            console.log(`   ... and ${validWorkouts.length - 5} more`);
        }
        return validWorkouts.length;
    }

    console.log(`\n📅 Seeding ${validWorkouts.length} workouts...`);

    if (options.clearExisting) {
        const deleted = await Workout.deleteMany({ userId });
        console.log(`   Cleared ${deleted.deletedCount} existing workouts for user`);
    }

    let seededCount = 0;
    let skippedCount = 0;

    for (const workout of validWorkouts) {
        // Check if workout already exists for this date
        const existingWorkout = await Workout.findOne({
            userId,
            date: {
                $gte: new Date(workout.date.setHours(0, 0, 0, 0)),
                $lt: new Date(workout.date.setHours(23, 59, 59, 999)),
            },
        });

        if (existingWorkout && !options.clearExisting) {
            skippedCount++;
            continue;
        }

        // Map exercises to their IDs
        const exercises = workout.exercises
            .filter(ex => ex.sets > 0 && ex.reps > 0) // Filter out invalid entries
            .map(ex => {
                const exerciseId = findExerciseId(ex.exerciseName, exerciseIdMap);
                if (!exerciseId) {
                    console.warn(`   ⚠️ Exercise not found: "${ex.exerciseName}"`);
                    return null;
                }
                return {
                    exerciseId,
                    exerciseName: ex.exerciseName,
                    weightValue: ex.weightValue,
                    weightType: ex.weightType,
                    reps: ex.reps,
                    sets: Math.max(1, ex.sets), // Ensure at least 1 set
                    notes: ex.notes || '',
                    orderIndex: ex.orderIndex,
                };
            })
            .filter(Boolean);

        if (exercises.length === 0) {
            skippedCount++;
            continue;
        }

        await Workout.create({
            userId,
            date: workout.date,
            title: workout.title,
            notes: workout.notes,
            visibility: 'private',
            exercises,
            duration: workout.duration,
            tags: workout.tags,
        });

        seededCount++;
    }

    console.log(`✅ Seeded ${seededCount} workouts (skipped ${skippedCount} duplicates/empty)`);
    return seededCount;
};

/**
 * Normalize exercise name for lookup (duplicated from parser for self-contained module)
 */
const normalizeForLookup = (name: string): string => {
    let normalized = name.trim().replace(/\s+/g, ' ');

    const expansions: [RegExp, string][] = [
        [/\bSL\s+DB\s+RDL\b/gi, 'Single Leg DB Romanian Deadlift'],
        [/\bDB\s+SL\s+RDL\b/gi, 'DB Single Leg Romanian Deadlift'],
        [/\bSL\s+RDL\b/gi, 'Single Leg Romanian Deadlift'],
        [/\bDB\s+RDL\b/gi, 'DB Romanian Deadlift'],
        [/\bDB\s+BSS\b/gi, 'DB Bulgarian Split Squat'],
        [/\bSL\s+DB\b/gi, 'Single Leg DB'],
        [/\bSL\s+Leg\s+Ext\b/gi, 'Single Leg Leg Extension'],
        [/\bSL\s+calf\b/gi, 'Single Leg Calf'],
        [/^RDL$/gi, 'Romanian Deadlift'],
        [/^DL$/gi, 'Deadlift'],
        [/^BSS$/gi, 'Bulgarian Split Squat'],
        [/\bBSS\b/gi, 'Bulgarian Split Squat'],
        [/\bRDL\b/gi, 'Romanian Deadlift'],
        [/\bLat\s+PD\b/gi, 'Lat Pulldown'],
        [/\bLat\s+[Pp]d\b/gi, 'Lat Pulldown'],
        [/\bPD\b/gi, 'Pulldown'],
        [/\bExt\b/gi, 'Extension'],
        [/\bDL\b/gi, 'Deadlift'],
        [/\bHS\b/gi, 'Hamstring'],
        [/\bSL\b/gi, 'Single Leg'],
        [/\bSH\b/gi, 'Single Hand'],
    ];

    for (const [pattern, replacement] of expansions) {
        normalized = normalized.replace(pattern, replacement);
    }

    return normalized.toLowerCase();
};

/**
 * Find exercise ID with fuzzy matching
 */
const findExerciseId = (
    exerciseName: string,
    exerciseIdMap: Map<string, mongoose.Types.ObjectId>
): mongoose.Types.ObjectId | null => {
    const lowerName = exerciseName.toLowerCase();
    const normalizedName = normalizeForLookup(exerciseName);

    // Direct match
    if (exerciseIdMap.has(lowerName)) {
        return exerciseIdMap.get(lowerName)!;
    }

    // Normalized match
    if (exerciseIdMap.has(normalizedName)) {
        return exerciseIdMap.get(normalizedName)!;
    }

    // Fuzzy match - find closest
    for (const [key, id] of exerciseIdMap.entries()) {
        if (normalizedName.includes(key) || key.includes(normalizedName)) {
            return id;
        }
        if (lowerName.includes(key) || key.includes(lowerName)) {
            return id;
        }
    }

    return null;
};

/**
 * Escape special regex characters
 */
const escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Main seeding function
 */
const seedFromJournal = async (options: SeedOptions = {}) => {
    const journalPath = path.resolve(__dirname, '../../../assets/Gym Journal 2025.txt');

    console.log('🚀 Starting gym journal import...\n');
    console.log(`Options: ${JSON.stringify(options)}`);

    // Parse the journal
    console.log('\n📖 Parsing gym journal...');
    const { workouts, exercises } = parseGymJournal(journalPath);
    const summary = generateSummary(workouts, exercises);

    console.log('\n' + '='.repeat(60));
    console.log('📊 PARSED DATA SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Workouts:      ${summary.totalWorkouts}`);
    console.log(`Valid Workouts:      ${summary.actualWorkouts}`);
    console.log(`Unique Exercises:    ${summary.uniqueExercises}`);
    console.log(`Date Range:          ${summary.dateRange.start?.toDateString()} - ${summary.dateRange.end?.toDateString()}`);

    if (options.dryRun) {
        console.log('\n🔍 DRY RUN MODE - No changes will be made to the database');
    }

    // Connect to database (unless dry run)
    if (!options.dryRun) {
        await connectDB();
    }

    // Get or create user
    let userId: mongoose.Types.ObjectId;
    if (options.userId) {
        userId = new mongoose.Types.ObjectId(options.userId);
        console.log(`\n👤 Using user ID: ${userId}`);
    } else if (options.userEmail && !options.dryRun) {
        // Look up user by email
        const user = await User.findOne({ email: options.userEmail });
        if (!user) {
            throw new Error(`User not found with email: ${options.userEmail}`);
        }
        userId = user._id as mongoose.Types.ObjectId;
        console.log(`\n👤 Found user: ${user.displayName} (${user.email})`);
    } else if (!options.dryRun) {
        // Find or create a default user for the import
        let user = await User.findOne({ email: 'journal@kinfit.app' });
        if (!user) {
            user = await User.create({
                email: 'journal@kinfit.app',
                username: 'journaluser',
                displayName: 'Journal Import User',
                password: 'placeholder-change-me-123',
            });
            console.log(`\n👤 Created placeholder user: ${user.email}`);
            console.log(`   ⚠️  Remember to update the password for this user!`);
        }
        userId = user._id as mongoose.Types.ObjectId;
    } else {
        userId = new mongoose.Types.ObjectId();
    }

    // Seed exercises
    const exerciseIdMap = await seedExercises(exercises, options);

    // Seed workouts
    const seededCount = await seedWorkouts(workouts, exerciseIdMap, userId, options);

    // Update user's totalWorkouts count
    if (!options.dryRun && seededCount > 0) {
        const totalWorkouts = await Workout.countDocuments({ userId });
        await User.findByIdAndUpdate(userId, { totalWorkouts });
        console.log(`\n📊 Updated user's totalWorkouts to ${totalWorkouts}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ IMPORT COMPLETE');
    console.log('='.repeat(60));

    if (!options.dryRun) {
        await mongoose.connection.close();
    }
};

// CLI execution
if (require.main === module) {
    const args = process.argv.slice(2);
    const options: SeedOptions = {
        dryRun: args.includes('--dry-run'),
        clearExisting: args.includes('--clear'),
        userId: args.find(a => a.startsWith('--user='))?.split('=')[1],
        userEmail: args.find(a => a.startsWith('--email='))?.split('=')[1],
    };

    seedFromJournal(options)
        .then(() => {
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error seeding from journal:', error);
            process.exit(1);
        });
}

export { seedFromJournal };
