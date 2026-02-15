/**
 * Migration: Move muscleGroups → primaryMuscleGroups, then remove muscleGroups
 *
 * Run BEFORE deploying the schema change that removes muscleGroups.
 * Usage: ts-node ./src/scripts/migrateMuscleGroupsToPrimary.ts
 *
 * Requires MONGODB_URI (or defaults to mongodb://localhost:27017/kinfit)
 */

import mongoose from 'mongoose';
import { connectDB } from '../services/mongooseService';

const MIGRATE = async () => {
  await connectDB();
  const collection = mongoose.connection.db!.collection('exercises');

  // 1. Copy muscleGroups to primaryMuscleGroups where primaryMuscleGroups is empty
  const docsWithMuscleGroups = await collection
    .find({ muscleGroups: { $exists: true, $type: 'array' } })
    .toArray();

  let copied = 0;
  for (const doc of docsWithMuscleGroups) {
    const muscleGroups = doc.muscleGroups as string[];
    const primary = doc.primaryMuscleGroups as string[] | undefined;
    const primaryEmpty = !primary || !Array.isArray(primary) || primary.length === 0;
    const hasMuscleGroups = Array.isArray(muscleGroups) && muscleGroups.length > 0;

    if (primaryEmpty && hasMuscleGroups) {
      await collection.updateOne(
        { _id: doc._id },
        { $set: { primaryMuscleGroups: muscleGroups } }
      );
      copied++;
    }
  }
  console.log(`📋 Copied muscleGroups → primaryMuscleGroups for ${copied} documents`);

  // 2. Remove muscleGroups from all documents
  const unsetResult = await collection.updateMany(
    { muscleGroups: { $exists: true } },
    { $unset: { muscleGroups: '' } }
  );
  console.log(`🗑️ Removed muscleGroups field from ${unsetResult.modifiedCount} documents`);

  // 3. Drop old index if it exists (muscleGroups index)
  try {
    const indexes = await collection.indexes();
    const muscleGroupsIndex = indexes.find(
      (idx) => idx.name === 'muscleGroups_1' || (idx.key && 'muscleGroups' in idx.key)
    );
    if (muscleGroupsIndex?.name) {
      await collection.dropIndex(muscleGroupsIndex.name);
      console.log(`📉 Dropped index: ${muscleGroupsIndex.name}`);
    }
  } catch (err) {
    // Index might not exist
  }

  console.log('✅ Migration complete');
  mongoose.connection.close();
  process.exit(0);
};

MIGRATE().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
