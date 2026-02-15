/**
 * Maps granular muscle groups (from exercises) to parent body part categories
 * for a consistent high-level volume view.
 *
 * Based on standard fitness hierarchy:
 * - Arms: biceps, triceps, forearms
 * - Legs: quadriceps, hamstrings, glutes, calves, legs (generic)
 * - Core: abs, obliques, core (generic)
 * - Chest, Back, Shoulders stay as-is
 * - Cardio and Mobility are their own categories
 */
export const MUSCLE_GROUP_TO_PARENT: Record<string, string> = {
  chest: 'chest',
  back: 'back',
  shoulders: 'shoulders',
  biceps: 'arms',
  triceps: 'arms',
  forearms: 'arms',
  legs: 'legs',
  quadriceps: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  calves: 'legs',
  core: 'core',
  abs: 'core',
  obliques: 'core',
  cardio: 'cardio',
  'full body': 'mobility',
  mobility: 'mobility',
};

/** Canonical display order for parent body parts in the volume summary */
export const PARENT_BODY_PARTS_ORDER = [
  'chest',
  'back',
  'shoulders',
  'arms',
  'legs',
  'core',
  'cardio',
  'mobility',
] as const;

/** Resolve a granular muscle group to its parent. Unknown groups pass through. */
export const getParentBodyPart = (muscleGroup: string): string =>
  MUSCLE_GROUP_TO_PARENT[muscleGroup.toLowerCase()] ?? muscleGroup;
