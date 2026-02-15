import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import { cors } from '../_lib/cors';
import connectDB from '../_lib/db';
import { authenticate } from '../_lib/auth';
import { sendError } from '../_lib/errorResponse';
import { getParentBodyPart, PARENT_BODY_PARTS_ORDER } from '../_lib/bodyPartMapping';
import Workout from '../_lib/models/Workout';
import Exercise from '../_lib/models/Exercise';

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
    return exercise.setEntries.length;
  }

  return isStrength ? (exercise.sets || 1) : 1;
};

/** Sum duration (minutes) from setEntries. Used for cardio/mobility. */
const countMinutes = (exercise: {
  setEntries?: { duration?: number }[];
}): number => {
  if (!exercise.setEntries || exercise.setEntries.length === 0) return 0;
  return exercise.setEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
};

interface BodyPartAccumulator {
  sets: number;
  minutes: number;
  lastTrainedDate: Date | null;
}

const MINUTE_BODY_PARTS = new Set(['cardio', 'mobility']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  const user = authenticate(req, res);
  if (!user) return;

  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  await connectDB();

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Fetch workouts from the last 7 days
    const workouts = await Workout.find({
      userId: new mongoose.Types.ObjectId(user.userId),
      date: { $gte: sevenDaysAgo },
    }).lean();

    // 2. Collect all unique exerciseIds used in these workouts
    const exerciseIdSet = new Set<string>();
    for (const workout of workouts) {
      for (const entry of (workout as any).exercises) {
        exerciseIdSet.add(entry.exerciseId.toString());
      }
    }

    // 3. Fetch exercise definitions to get muscleGroups mapping
    const exerciseIds = Array.from(exerciseIdSet).map((id) => new mongoose.Types.ObjectId(id));
    const exercises = await Exercise.find({ _id: { $in: exerciseIds } }).lean();
    const muscleGroupMap = new Map<string, string[]>();
    for (const ex of exercises) {
      muscleGroupMap.set((ex as any)._id.toString(), (ex as any).muscleGroups);
    }

    // 4. Aggregate sets (strength) or minutes (cardio/mobility) per parent body part
    const bodyPartMap = new Map<string, BodyPartAccumulator>();

    for (const workout of workouts) {
      const workoutDate = new Date((workout as any).date);

      for (const entry of (workout as any).exercises) {
        const groups = muscleGroupMap.get(entry.exerciseId.toString()) || [];
        // Dedupe by parent: legs + quadriceps both map to legs, count sets once per parent
        const uniqueParents = [
          ...new Set(
            groups.map((g: string) => getParentBodyPart(g)).filter(Boolean)
          ),
        ];

        for (const parent of uniqueParents) {
          const current = bodyPartMap.get(parent) || {
            sets: 0,
            minutes: 0,
            lastTrainedDate: null,
          };

          if (MINUTE_BODY_PARTS.has(parent)) {
            current.minutes += countMinutes(entry);
          } else {
            current.sets += countSets(entry);
          }

          if (!current.lastTrainedDate || workoutDate > current.lastTrainedDate) {
            current.lastTrainedDate = workoutDate;
          }

          bodyPartMap.set(parent, current);
        }
      }
    }

    // 5. Build response: sets for strength body parts, minutes for cardio/mobility
    const targetSetsPerWeek = 10;
    const targetMinutesCardio = 150;
    const targetMinutesMobility = 60;

    const bodyParts = PARENT_BODY_PARTS_ORDER.map((name) => {
      const data = bodyPartMap.get(name) || {
        sets: 0,
        minutes: 0,
        lastTrainedDate: null,
      };
      const daysSinceLastTrained = data.lastTrainedDate
        ? Math.floor((now.getTime() - data.lastTrainedDate.getTime()) / (24 * 60 * 60 * 1000))
        : null;

      const base = {
        name,
        daysSinceLastTrained,
        lastTrainedDate: data.lastTrainedDate ? data.lastTrainedDate.toISOString() : null,
      };

      if (MINUTE_BODY_PARTS.has(name)) {
        const target =
          name === 'cardio' ? targetMinutesCardio : targetMinutesMobility;
        return {
          ...base,
          unit: 'minutes' as const,
          minutesThisWeek: data.minutes,
          targetMinutes: target,
        };
      }
      return {
        ...base,
        unit: 'sets' as const,
        setsThisWeek: data.sets,
        targetSets: targetSetsPerWeek,
      };
    });

    return res.status(200).json({ bodyParts, targetSetsPerWeek });
  } catch (error) {
    console.error('Volume summary error:', error);
    return sendError(res, 500, 'Failed to fetch volume summary');
  }
}
