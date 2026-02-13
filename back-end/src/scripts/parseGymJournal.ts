/**
 * Gym Journal Parser
 * Parses the gym journal text file into structured Exercise and Workout data
 */

import fs from 'fs';
import path from 'path';

// Types matching our models
export interface ParsedExerciseEntry {
    exerciseName: string;
    weightValue?: number;
    weightType: 'e' | 'a' | 'bw';
    reps: number;
    sets: number;
    notes?: string;
    isUnilateral: boolean;
    orderIndex: number;
}

export interface ParsedWorkout {
    date: Date;
    title: string;
    notes: string;
    exercises: ParsedExerciseEntry[];
    duration?: number;
    tags: string[];
    isSymbolized: boolean;
}

export interface ExtractedExercise {
    name: string;
    muscleGroups: string[];
    category: 'strength' | 'cardio' | 'flexibility' | 'other';
}

// Muscle group mappings based on exercise names
const MUSCLE_GROUP_KEYWORDS: Record<string, string[]> = {
    // Chest
    'chest press': ['chest', 'triceps'],
    'bench press': ['chest', 'triceps', 'shoulders'],
    'db press': ['chest', 'triceps'],
    'db bench': ['chest', 'triceps'],
    'incline': ['chest', 'shoulders'],
    'decline': ['chest'],
    'fly': ['chest'],
    'push up': ['chest', 'triceps', 'core'],
    'pushup': ['chest', 'triceps', 'core'],
    'serratus': ['serratus', 'core'],
    'machine press': ['chest', 'triceps'],

    // Back
    'deadlift': ['back', 'hamstrings', 'glutes', 'core'],
    'dl': ['back', 'hamstrings', 'glutes', 'core'],
    'rdl': ['hamstrings', 'glutes', 'back'],
    'sl rdl': ['hamstrings', 'glutes', 'balance'],
    'sl db rdl': ['hamstrings', 'glutes', 'balance'],
    'db rdl': ['hamstrings', 'glutes', 'back'],
    'row': ['back', 'lats'],
    'seated row': ['back', 'lats'],
    'lat pulldown': ['lats', 'biceps'],
    'lat pd': ['lats', 'biceps'],
    'pullover': ['lats', 'chest'],
    'pull up': ['lats', 'biceps', 'back'],
    'pullup': ['lats', 'biceps', 'back'],
    'assisted pull': ['lats', 'biceps'],

    // Shoulders
    'military press': ['shoulders', 'triceps'],
    'overhead press': ['shoulders', 'triceps'],
    'side delt': ['shoulders'],
    'lateral raise': ['shoulders'],
    'rear delt': ['rear delts', 'shoulders'],
    'external rotation': ['rotator cuff', 'shoulders'],
    'ext rot': ['rotator cuff', 'shoulders'],
    'shrug': ['traps'],

    // Arms
    'bicep curl': ['biceps'],
    'viking curl': ['biceps'],
    'incline curl': ['biceps'],
    'hammer curl': ['biceps', 'forearms'],
    'tricep ext': ['triceps'],
    'tricep push': ['triceps'],
    'tricep pull': ['triceps'],

    // Legs
    'squat': ['quadriceps', 'glutes', 'core'],
    'leg press': ['quadriceps', 'glutes'],
    'leg ext': ['quadriceps'],
    'leg curl': ['hamstrings'],
    'hamstring curl': ['hamstrings'],
    'hs curl': ['hamstrings'],
    'bss': ['quadriceps', 'glutes', 'balance'],
    'split squat': ['quadriceps', 'glutes'],
    'lunge': ['quadriceps', 'glutes'],
    'calf': ['calves'],
    'adduct': ['adductors'],
    'abduct': ['abductors', 'glutes'],

    // Core
    'plank': ['core', 'abs'],
    'crunch': ['abs'],
    'leg raise': ['abs', 'hip flexors'],
    'twist': ['obliques', 'abs'],
    'russian': ['obliques', 'abs'],
    'woodchop': ['obliques', 'core'],
    'lumberjack': ['obliques', 'core'],
    'deadbug': ['core', 'abs'],
    'side bend': ['obliques'],

    // Stability
    'kettle': ['shoulders', 'core', 'stability'],
    'stability': ['core', 'stability'],
};

// Workout type to tags mapping
const WORKOUT_TYPE_TAGS: Record<string, string[]> = {
    'chest/back': ['chest', 'back'],
    'back/chest': ['back', 'chest'],
    'legs': ['legs'],
    'arms/abs': ['arms', 'abs'],
    'shoulder/abs': ['shoulders', 'abs'],
    'back/chest/abs': ['back', 'chest', 'abs'],
};

/**
 * Parse the gym journal file
 */
export const parseGymJournal = (filePath: string): { workouts: ParsedWorkout[]; exercises: ExtractedExercise[] } => {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Split by separator
    const entries = content.split(/_{10,}/);

    const workouts: ParsedWorkout[] = [];
    const exerciseMap = new Map<string, ExtractedExercise>();

    for (const entry of entries) {
        const trimmedEntry = entry.trim();
        if (!trimmedEntry || trimmedEntry.length < 10) continue;

        const workout = parseWorkoutEntry(trimmedEntry);
        if (workout) {
            workouts.push(workout);

            // Extract unique exercises
            for (const ex of workout.exercises) {
                const normalizedName = normalizeExerciseName(ex.exerciseName);
                if (!exerciseMap.has(normalizedName)) {
                    exerciseMap.set(normalizedName, {
                        name: normalizedName,
                        muscleGroups: inferMuscleGroups(ex.exerciseName),
                        category: 'strength',
                    });
                }
            }
        }
    }

    return {
        workouts: workouts.sort((a, b) => a.date.getTime() - b.date.getTime()),
        exercises: Array.from(exerciseMap.values()),
    };
};

/**
 * Parse a single workout entry
 */
const parseWorkoutEntry = (entry: string): ParsedWorkout | null => {
    const lines = entry.split('\n').map(l => l.trim()).filter(l => l);

    // Find date header - format: "Jan 1, 2025 (chest/back)"
    const dateHeaderRegex = /^([A-Z][a-z]{2,8}\s+\d{1,2},\s*\d{4})\s*\(([^)]*)\)?/;
    let dateMatch: RegExpMatchArray | null = null;
    let headerLineIndex = -1;

    for (let i = 0; i < Math.min(lines.length, 5); i++) {
        dateMatch = lines[i].match(dateHeaderRegex);
        if (dateMatch) {
            headerLineIndex = i;
            break;
        }
    }

    if (!dateMatch || headerLineIndex === -1) {
        return null;
    }

    const dateStr = dateMatch[1];
    const workoutType = dateMatch[2] || '';

    // Parse date (fix common year typos - 2024 should be 2025 for Jan entries)
    let date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        return null;
    }

    // Fix year typos (entries marked 2024 in Jan should be 2025)
    if (dateStr.includes('2024') && dateStr.includes('Jan')) {
        date = new Date(dateStr.replace('2024', '2025'));
    }

    // Check for symbolized workouts
    const isSymbolized = lines.some(l =>
        l.toLowerCase().includes('symbolize') ||
        l.toLowerCase().includes('symbolized')
    );

    // Parse exercises
    const exercises: ParsedExerciseEntry[] = [];
    let currentExercise: string | null = null;
    let workoutNotes = '';
    let duration: number | undefined;
    let orderIndex = 0;

    for (let i = headerLineIndex + 1; i < lines.length; i++) {
        const line = lines[i];

        // Skip empty lines and braces (superset markers)
        if (!line || line === '{' || line === '}' || line.startsWith('( -supers') || line === ')') {
            continue;
        }

        // Check for duration
        const durationMatch = line.match(/Duration:\s*(\d+)\s*minutes?/i);
        if (durationMatch) {
            duration = parseInt(durationMatch[1], 10);
            continue;
        }

        // Check for workout notes at the end
        if (line.toLowerCase().startsWith('notes:')) {
            workoutNotes = line.substring(6).trim();
            continue;
        }

        // Check for exercise name (not starting with *)
        if (!line.startsWith('*') && !line.toLowerCase().startsWith('notes:')) {
            // This might be an exercise name
            // Skip lines that look like numbers/times or contain only special chars
            // Allow short abbreviations like "DL", "BSS" (min length 2)
            if (!line.match(/^\d/) && !line.match(/^\d+\s*x\s*\d+/) && line.length >= 2 && !line.match(/^[\s\d{}()\[\]]+$/)) {
                currentExercise = line.replace(/\s*\(.*\)\s*$/, '').trim(); // Remove trailing parenthetical notes
                continue;
            }
        }

        // Parse exercise set line: "* 90a x 10 x 3" or "* bw x 10 x 3"
        if (line.startsWith('*')) {
            const exerciseData = parseExerciseLine(line, currentExercise);
            if (exerciseData) {
                exerciseData.orderIndex = orderIndex++;
                exercises.push(exerciseData);
            }
        }
    }

    // Derive tags from workout type
    const tags = deriveTagsFromType(workoutType);

    return {
        date,
        title: workoutType,
        notes: workoutNotes,
        exercises,
        duration,
        tags,
        isSymbolized,
    };
};

/**
 * Parse an exercise line like "* 90a x 10 x 3"
 */
const parseExerciseLine = (line: string, exerciseName: string | null): ParsedExerciseEntry | null => {
    // Remove leading * and trim
    let content = line.replace(/^\*\s*/, '').trim();

    // Handle notes at the end (after "Notes:")
    let notes = '';
    const notesMatch = content.match(/Notes?:\s*(.*)$/i);
    if (notesMatch) {
        notes = notesMatch[1].trim();
        content = content.substring(0, content.indexOf(notesMatch[0])).trim();
    }

    // Pattern: weight[type] x reps x [LR x] sets
    // Examples: "90a x 10 x 3", "30e x 10 x LR x 3", "bw x 10 x 3", "Bw x 12 x 1"

    // Handle bodyweight
    const bwMatch = content.match(/^[Bb]w\s*x\s*(\d+)\s*(?:sec\s*(?:hold\s*)?)?x\s*(?:LR\s*x\s*)?(\d+)/i);
    if (bwMatch) {
        return {
            exerciseName: exerciseName || 'Unknown Exercise',
            weightType: 'bw',
            reps: parseInt(bwMatch[1], 10),
            sets: parseInt(bwMatch[2], 10),
            notes,
            isUnilateral: content.toLowerCase().includes(' lr '),
            orderIndex: 0,
        };
    }

    // Handle weighted exercises: "90a x 10 x 3" or "30e x 10 x LR x 3"
    // Also handle machine notation like "130 (/2) x 10 x 3"
    const weightedMatch = content.match(
        /^(\d+\.?\d*)\s*(?:\(\/2\))?\s*(e|a)?\s*x\s*(\d+)\s*(?:sec\s*(?:hold\s*)?)?x\s*(?:LR\s*x\s*)?(\d+)/i
    );

    if (weightedMatch) {
        const rawWeight = parseFloat(weightedMatch[1]);
        const weightType = (weightedMatch[2]?.toLowerCase() || 'a') as 'e' | 'a';
        const reps = parseInt(weightedMatch[3], 10);
        const sets = parseInt(weightedMatch[4], 10);

        // Handle (/2) notation - machine shows half weight
        const isHalfWeight = content.includes('(/2)');
        const weightValue = isHalfWeight ? rawWeight / 2 : rawWeight;

        return {
            exerciseName: exerciseName || 'Unknown Exercise',
            weightValue,
            weightType,
            reps,
            sets,
            notes,
            isUnilateral: content.toLowerCase().includes(' lr '),
            orderIndex: 0,
        };
    }

    // Handle time-based exercises: "bw x 45 sec x LR x 2"
    const timeMatch = content.match(/^[Bb]w\s*x\s*(\d+)\s*(?:sec|min)/i);
    if (timeMatch) {
        return {
            exerciseName: exerciseName || 'Unknown Exercise',
            weightType: 'bw',
            reps: parseInt(timeMatch[1], 10), // Treat seconds/duration as "reps"
            sets: 1,
            notes: notes || 'Time-based exercise',
            isUnilateral: content.toLowerCase().includes(' lr '),
            orderIndex: 0,
        };
    }

    return null;
};

/**
 * Normalize exercise name for consistency
 */
const normalizeExerciseName = (name: string): string => {
    let normalized = name
        .trim()
        .replace(/\s+/g, ' ');

    // Expand common abbreviations (order matters - do specific ones first)
    const expansions: [RegExp, string][] = [
        [/\bSL\s+DB\s+RDL\b/gi, 'Single Leg DB Romanian Deadlift'],
        [/\bDB\s+SL\s+RDL\b/gi, 'DB Single Leg Romanian Deadlift'],
        [/\bSL\s+RDL\b/gi, 'Single Leg Romanian Deadlift'],
        [/\bDB\s+RDL\b/gi, 'DB Romanian Deadlift'],
        [/\bDB\s+BSS\b/gi, 'DB Bulgarian Split Squat'],
        [/\bSL\s+DB\b/gi, 'Single Leg DB'],
        [/^RDL$/gi, 'Romanian Deadlift'],
        [/^DL$/gi, 'Deadlift'],
        [/^BSS$/gi, 'Bulgarian Split Squat'],
        [/\bBSS\b/gi, 'Bulgarian Split Squat'],
        [/\bRDL\b/gi, 'Romanian Deadlift'],
        [/\bLat\s+PD\b/gi, 'Lat Pulldown'],
        [/\bLat\s+Pd\b/gi, 'Lat Pulldown'],
        [/\bPD\b/gi, 'Pulldown'],
        [/\bExt\b/gi, 'Extension'],
        [/\bDL\b/gi, 'Deadlift'],
        [/\bHS\b/gi, 'Hamstring'],
        [/\bSL\b/gi, 'Single Leg'],
        [/\bSH\b/gi, 'Single Hand'],
        [/\bDB\b/gi, 'DB'],
    ];

    for (const [pattern, replacement] of expansions) {
        normalized = normalized.replace(pattern, replacement);
    }

    return normalized;
};

/**
 * Infer muscle groups from exercise name
 */
const inferMuscleGroups = (exerciseName: string): string[] => {
    const lowerName = exerciseName.toLowerCase();
    const muscleGroups = new Set<string>();

    for (const [keyword, groups] of Object.entries(MUSCLE_GROUP_KEYWORDS)) {
        if (lowerName.includes(keyword.toLowerCase())) {
            groups.forEach(g => muscleGroups.add(g));
        }
    }

    // Default to 'other' if no groups found
    if (muscleGroups.size === 0) {
        muscleGroups.add('other');
    }

    return Array.from(muscleGroups);
};

/**
 * Derive tags from workout type
 */
const deriveTagsFromType = (workoutType: string): string[] => {
    const lowerType = workoutType.toLowerCase();

    // Check predefined mappings first
    for (const [type, tags] of Object.entries(WORKOUT_TYPE_TAGS)) {
        if (lowerType === type) {
            return tags;
        }
    }

    // Parse from the type string (e.g., "chest/back" -> ["chest", "back"])
    const tags = workoutType
        .toLowerCase()
        .split(/[\/,]/)
        .map(t => t.trim())
        .filter(t => t.length > 0);

    return tags.length > 0 ? tags : ['general'];
};

/**
 * Generate summary statistics
 */
export const generateSummary = (workouts: ParsedWorkout[], exercises: ExtractedExercise[]) => {
    const totalWorkouts = workouts.length;
    const symbolizedWorkouts = workouts.filter(w => w.isSymbolized).length;
    const totalExerciseEntries = workouts.reduce((sum, w) => sum + w.exercises.length, 0);

    const workoutsByMonth: Record<string, number> = {};
    for (const workout of workouts) {
        const monthKey = `${workout.date.getFullYear()}-${String(workout.date.getMonth() + 1).padStart(2, '0')}`;
        workoutsByMonth[monthKey] = (workoutsByMonth[monthKey] || 0) + 1;
    }

    const workoutsByType: Record<string, number> = {};
    for (const workout of workouts) {
        const type = workout.title || 'unknown';
        workoutsByType[type] = (workoutsByType[type] || 0) + 1;
    }

    return {
        totalWorkouts,
        symbolizedWorkouts,
        actualWorkouts: totalWorkouts - symbolizedWorkouts,
        uniqueExercises: exercises.length,
        totalExerciseEntries,
        workoutsByMonth,
        workoutsByType,
        dateRange: {
            start: workouts[0]?.date,
            end: workouts[workouts.length - 1]?.date,
        },
    };
};

// CLI execution
if (require.main === module) {
    const journalPath = path.resolve(__dirname, '../../../assets/Gym Journal 2025.txt');

    console.log('📖 Parsing gym journal...\n');

    try {
        const { workouts, exercises } = parseGymJournal(journalPath);
        const summary = generateSummary(workouts, exercises);

        console.log('='.repeat(60));
        console.log('📊 PARSING SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Workouts:        ${summary.totalWorkouts}`);
        console.log(`Actual Workouts:       ${summary.actualWorkouts}`);
        console.log(`Symbolized Workouts:   ${summary.symbolizedWorkouts}`);
        console.log(`Unique Exercises:      ${summary.uniqueExercises}`);
        console.log(`Total Exercise Entries: ${summary.totalExerciseEntries}`);
        console.log(`Date Range:            ${summary.dateRange.start?.toDateString()} - ${summary.dateRange.end?.toDateString()}`);

        console.log('\n📅 Workouts by Month:');
        for (const [month, count] of Object.entries(summary.workoutsByMonth)) {
            console.log(`  ${month}: ${count}`);
        }

        console.log('\n🏋️ Workouts by Type:');
        for (const [type, count] of Object.entries(summary.workoutsByType).sort((a, b) => b[1] - a[1])) {
            console.log(`  ${type}: ${count}`);
        }

        console.log('\n💪 Sample Exercises (first 20):');
        exercises.slice(0, 20).forEach((ex, i) => {
            console.log(`  ${i + 1}. ${ex.name} [${ex.muscleGroups.join(', ')}]`);
        });

        // Output to JSON for review
        const outputDir = path.resolve(__dirname, '../../../assets');
        const exercisesOutput = path.join(outputDir, 'parsed_exercises.json');
        const workoutsOutput = path.join(outputDir, 'parsed_workouts.json');

        fs.writeFileSync(exercisesOutput, JSON.stringify(exercises, null, 2));
        fs.writeFileSync(workoutsOutput, JSON.stringify(workouts, null, 2));

        console.log(`\n✅ Parsed data saved to:`);
        console.log(`   - ${exercisesOutput}`);
        console.log(`   - ${workoutsOutput}`);

    } catch (error) {
        console.error('❌ Error parsing journal:', error);
        process.exit(1);
    }
}
