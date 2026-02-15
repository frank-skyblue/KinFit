/**
 * Allowed muscle groups for exercises. Matches body part mappings.
 * No free text — exercises must use one of these values.
 * Excludes "full body" (replaced by mobility).
 */
export const ALLOWED_MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'legs',
  'quadriceps',
  'hamstrings',
  'glutes',
  'calves',
  'core',
  'abs',
  'obliques',
  'cardio',
  'mobility',
] as const;

export type MuscleGroup = (typeof ALLOWED_MUSCLE_GROUPS)[number];

/** Grouped for better scanability in the form */
export const MUSCLE_GROUP_SECTIONS: { label: string; values: readonly string[] }[] = [
  { label: 'Upper', values: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms'] },
  { label: 'Lower', values: ['legs', 'quadriceps', 'hamstrings', 'glutes', 'calves'] },
  { label: 'Core', values: ['core', 'abs', 'obliques'] },
  { label: 'Other', values: ['cardio', 'mobility'] },
];

/** Format for display (e.g. "rear delts" → "Rear Delts") */
export const formatMuscleGroupLabel = (value: string): string =>
  value
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
