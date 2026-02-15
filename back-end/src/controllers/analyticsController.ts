import mongoose from 'mongoose';
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendError } from '../utils/errorResponse';
import Workout from '../models/Workout';
import Exercise from '../models/Exercise';
import { getParentBodyPart, PARENT_BODY_PARTS_ORDER } from '../constants/bodyPartMapping';

interface BodyPartAccumulator {
  sets: number;
  lastTrainedDate: Date | null;
}

/**
 * Count total sets for a single exercise entry.
 * - Strength: sum of entry.sets across setEntries, or fallback to exercise.sets
 * - Cardio/flexibility/other: count as 1 set per entry (or 1 if no setEntries)
 */
const countSets = (exercise: {
  category?: string;
  sets?: number;
  setEntries?: { sets?: number }[];
}): number => {
  const isStrength = !exercise.category || exercise.category === 'strength';

  if (exercise.setEntries && exercise.setEntries.length > 0) {
    if (isStrength) {
      return exercise.setEntries.reduce((sum, entry) => sum + (entry.sets || 1), 0);
    }
    // Non-strength: each setEntry counts as 1 set
    return exercise.setEntries.length;
  }

  // Legacy fields fallback
  return isStrength ? (exercise.sets || 1) : 1;
};

/** GET /api/analytics/volume-summary — rolling 7-day sets per body part */
export const getVolumeSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Fetch workouts from the last 7 days
    const workouts = await Workout.find({
      userId: new mongoose.Types.ObjectId(userId),
      date: { $gte: sevenDaysAgo },
    }).lean();

    // 2. Collect all unique exerciseIds used in these workouts
    const exerciseIdSet = new Set<string>();
    for (const workout of workouts) {
      for (const entry of workout.exercises) {
        exerciseIdSet.add(entry.exerciseId.toString());
      }
    }

    // 3. Fetch exercise definitions to get muscleGroups mapping
    const exerciseIds = Array.from(exerciseIdSet).map((id) => new mongoose.Types.ObjectId(id));
    const exercises = await Exercise.find({ _id: { $in: exerciseIds } }).lean();
    const muscleGroupMap = new Map<string, string[]>();
    for (const ex of exercises) {
      muscleGroupMap.set(ex._id.toString(), ex.muscleGroups);
    }

    // 4. Aggregate sets per parent body part + track last trained date
    const bodyPartMap = new Map<string, BodyPartAccumulator>();

    for (const workout of workouts) {
      const workoutDate = new Date(workout.date);

      for (const entry of workout.exercises) {
        const groups = muscleGroupMap.get(entry.exerciseId.toString()) || [];
        const sets = countSets(entry);

        for (const granularGroup of groups) {
          const parent = getParentBodyPart(granularGroup);
          const current = bodyPartMap.get(parent) || { sets: 0, lastTrainedDate: null };
          current.sets += sets;

          if (!current.lastTrainedDate || workoutDate > current.lastTrainedDate) {
            current.lastTrainedDate = workoutDate;
          }

          bodyPartMap.set(parent, current);
        }
      }
    }

    // 5. Build response: consistent set of parent body parts in canonical order
    const targetSetsPerWeek = 10; // Default target — future: per-user customization

    const bodyParts = PARENT_BODY_PARTS_ORDER.map((name) => {
      const data = bodyPartMap.get(name) || { sets: 0, lastTrainedDate: null };
      const daysSinceLastTrained = data.lastTrainedDate
        ? Math.floor((now.getTime() - data.lastTrainedDate.getTime()) / (24 * 60 * 60 * 1000))
        : null;

      return {
        name,
        setsThisWeek: data.sets,
        targetSets: targetSetsPerWeek,
        daysSinceLastTrained,
        lastTrainedDate: data.lastTrainedDate ? data.lastTrainedDate.toISOString() : null,
      };
    });

    res.status(200).json({ bodyParts, targetSetsPerWeek });
  } catch (error) {
    console.error('Volume summary error:', error);
    return sendError(res, 500, 'Failed to fetch volume summary');
  }
};
