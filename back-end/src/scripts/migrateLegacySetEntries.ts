/**
 * Migration: Populate setEntries from legacy top-level fields (weightValue, weightType, reps, sets)
 *
 * Run BEFORE deploying the refactor that removes legacy fallbacks.
 * Usage: ts-node ./src/scripts/migrateLegacySetEntries.ts
 *
 * Requires MONGODB_URI (or defaults to mongodb://localhost:27017/kinfit)
 */

import mongoose from 'mongoose';
import { connectDB } from '../services/mongooseService';

const STRENGTH_CATEGORIES = ['strength', undefined, null];

const MIGRATE = async () => {
  await connectDB();
  const collection = mongoose.connection.db!.collection('workouts');

  const workouts = await collection.find({}).toArray();
  let migratedWorkouts = 0;
  let migratedExercises = 0;

  for (const doc of workouts) {
    const exercises = (doc as { exercises?: unknown[] }).exercises;
    if (!Array.isArray(exercises) || exercises.length === 0) continue;

    let modified = false;
    const updatedExercises = exercises.map((ex) => {
      const exObj = ex as Record<string, unknown>;
      const setEntries = exObj.setEntries as unknown[] | undefined;
      const hasSetEntries = Array.isArray(setEntries) && setEntries.length > 0;
      const category = exObj.category as string | undefined;
      const isStrength = STRENGTH_CATEGORIES.includes(category);

      if (hasSetEntries || !isStrength) return exObj;

      // Legacy strength exercise with no setEntries — create from top-level fields
      const entry = {
        weightValue: exObj.weightValue ?? 0,
        weightType: exObj.weightType ?? 'a',
        reps: exObj.reps ?? 1,
        sets: exObj.sets ?? 1,
      };
      migratedExercises++;
      modified = true;
      return { ...exObj, setEntries: [entry] };
    });

    if (modified) {
      await collection.updateOne(
        { _id: doc._id },
        { $set: { exercises: updatedExercises } }
      );
      migratedWorkouts++;
    }
  }

  console.log(`📋 Migrated ${migratedExercises} exercise entries across ${migratedWorkouts} workouts`);
  console.log('✅ Migration complete');
  mongoose.connection.close();
  process.exit(0);
};

MIGRATE().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
