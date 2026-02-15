import mongoose from 'mongoose';
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendError } from '../utils/errorResponse';
import Workout from '../models/Workout';
import Exercise from '../models/Exercise';
import { getParentBodyPart, PARENT_BODY_PARTS_ORDER } from '../constants/bodyPartMapping';

interface ExerciseContribution {
  exerciseName: string;
  amount: number;
  weight: number; // 1 = primary, 0.5 = secondary
}

interface BodyPartAccumulator {
  sets: number;
  minutes: number;
  lastTrainedDate: Date | null;
  contributions: Map<string, ExerciseContribution>; // exerciseId -> contribution
}

/**
 * Count total sets for a single exercise entry.
 * Uses setEntries only; no legacy fallback.
 */
const countSets = (exercise: {
  category?: string;
  setEntries?: { sets?: number }[];
}): number => {
  const isStrength = !exercise.category || exercise.category === 'strength';

  if (!exercise.setEntries || exercise.setEntries.length === 0) return 0;

  if (isStrength) {
    return exercise.setEntries.reduce((sum, entry) => sum + (entry.sets || 1), 0);
  }
  return exercise.setEntries.length;
};

/** Sum duration (minutes) from setEntries. Used for cardio/mobility. */
const countMinutes = (exercise: {
  setEntries?: { duration?: number }[];
}): number => {
  if (!exercise.setEntries || exercise.setEntries.length === 0) return 0;
  return exercise.setEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
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

    // 3. Fetch exercise definitions: primary (1x) and secondary (0.5x) muscle groups
    const exerciseIds = Array.from(exerciseIdSet).map((id) => new mongoose.Types.ObjectId(id));
    const exercises = await Exercise.find({ _id: { $in: exerciseIds } }).lean();
    const muscleGroupMap = new Map<
      string,
      { primary: string[]; secondary: string[] }
    >();
    for (const ex of exercises) {
      const primary = ex.primaryMuscleGroups ?? [];
      const secondary = ex.secondaryMuscleGroups ?? [];
      muscleGroupMap.set(ex._id.toString(), { primary, secondary });
    }

    // 4. Aggregate sets/minutes per parent. Primary = 1x, secondary = 0.5x
    const bodyPartMap = new Map<string, BodyPartAccumulator>();
    const MINUTE_BODY_PARTS = new Set(['cardio', 'mobility']);

    for (const workout of workouts) {
      const workoutDate = new Date(workout.date);

      for (const entry of workout.exercises) {
        const { primary, secondary } =
          muscleGroupMap.get(entry.exerciseId.toString()) || {
            primary: [],
            secondary: [],
          };

        const sets = countSets(entry);
        const minutes = countMinutes(entry);

        const primaryParents = [
          ...new Set(primary.map((g) => getParentBodyPart(g)).filter(Boolean)),
        ];
        const secondaryParents = [
          ...new Set(secondary.map((g) => getParentBodyPart(g)).filter(Boolean)),
        ];
        const allParents = new Map<string, number>();
        for (const p of primaryParents)
          allParents.set(p, (allParents.get(p) ?? 0) + 1);
        for (const p of secondaryParents)
          allParents.set(p, (allParents.get(p) ?? 0) + 0.5);
        for (const [parent, weight] of allParents.entries()) {
          const current = bodyPartMap.get(parent) || {
            sets: 0,
            minutes: 0,
            lastTrainedDate: null,
            contributions: new Map<string, ExerciseContribution>(),
          };

          const contribAmount = MINUTE_BODY_PARTS.has(parent) ? minutes : sets;
          if (MINUTE_BODY_PARTS.has(parent)) {
            current.minutes += minutes * weight;
          } else {
            current.sets += sets * weight;
          }

          const exId = entry.exerciseId.toString();
          const prev = current.contributions.get(exId);
          if (prev) {
            prev.amount += contribAmount * weight;
          } else {
            current.contributions.set(exId, {
              exerciseName: entry.exerciseName || 'Unknown',
              amount: contribAmount * weight,
              weight,
            });
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
        contributions: new Map<string, ExerciseContribution>(),
      };
      const daysSinceLastTrained = data.lastTrainedDate
        ? Math.floor((now.getTime() - data.lastTrainedDate.getTime()) / (24 * 60 * 60 * 1000))
        : null;

      const contributions = Array.from(data.contributions.values())
        .sort((a, b) => b.amount - a.amount)
        .map((c) => ({
          exerciseName: c.exerciseName,
          amount: Math.round(c.amount * 10) / 10,
          weight: c.weight,
        }));

      const base = {
        name,
        daysSinceLastTrained,
        lastTrainedDate: data.lastTrainedDate ? data.lastTrainedDate.toISOString() : null,
        contributions,
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

    res.status(200).json({ bodyParts, targetSetsPerWeek });
  } catch (error) {
    console.error('Volume summary error:', error);
    return sendError(res, 500, 'Failed to fetch volume summary');
  }
};
