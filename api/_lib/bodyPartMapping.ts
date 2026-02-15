/**
 * Maps granular muscle groups (from exercises) to parent body part categories
 * for a consistent high-level volume view.
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

export const getParentBodyPart = (muscleGroup: string): string =>
  MUSCLE_GROUP_TO_PARENT[muscleGroup.toLowerCase()] ?? muscleGroup;
