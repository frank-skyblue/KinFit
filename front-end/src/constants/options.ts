/**
 * Shared option types and dropdown option arrays for profile, workouts, etc.
 * Single source of truth for values shown in selects/radios.
 */

// -----------------------------------------------------------------------------
// Gender
// -----------------------------------------------------------------------------

export const GENDER_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const;

export type Gender = (typeof GENDER_OPTIONS)[number]['value'];

// -----------------------------------------------------------------------------
// Activity Level
// -----------------------------------------------------------------------------

export const ACTIVITY_LEVEL_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
  { value: 'light', label: 'Light (1-3 days/week)' },
  { value: 'moderate', label: 'Moderate (3-5 days/week)' },
  { value: 'active', label: 'Active (6-7 days/week)' },
  { value: 'very_active', label: 'Very Active (2x per day)' },
] as const;

export type ActivityLevel = (typeof ACTIVITY_LEVEL_OPTIONS)[number]['value'];

// -----------------------------------------------------------------------------
// Units
// -----------------------------------------------------------------------------

export const UNITS_OPTIONS = [
  { value: 'lbs', label: 'Pounds (lbs)' },
  { value: 'kg', label: 'Kilograms (kg)' },
] as const;

export type Units = (typeof UNITS_OPTIONS)[number]['value'];

// -----------------------------------------------------------------------------
// Visibility (workout)
// -----------------------------------------------------------------------------

export const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private', shortLabel: 'Private', icon: '🔒' },
  { value: 'shared', label: 'Shared with Partners', shortLabel: 'Shared', icon: '👥' },
] as const;

export type Visibility = (typeof VISIBILITY_OPTIONS)[number]['value'];

/** Get label and icon for a visibility value (shortLabel for compact display) */
export const getVisibilityDisplay = (visibility: Visibility) => {
  const opt = VISIBILITY_OPTIONS.find((o) => o.value === visibility);
  return opt ? { label: opt.label, shortLabel: opt.shortLabel, icon: opt.icon } : { label: visibility, shortLabel: visibility, icon: '🔒' };
};

// -----------------------------------------------------------------------------
// Exercise Category
// -----------------------------------------------------------------------------

/** Single source of truth — use these constants instead of string literals */
export const EXERCISE_CATEGORY = {
  STRENGTH: 'strength',
  CARDIO: 'cardio',
  FLEXIBILITY: 'flexibility',
  OTHER: 'other',
} as const;

export type ExerciseCategory = (typeof EXERCISE_CATEGORY)[keyof typeof EXERCISE_CATEGORY];

export const EXERCISE_CATEGORY_OPTIONS = [
  { value: EXERCISE_CATEGORY.STRENGTH, label: 'Strength' },
  { value: EXERCISE_CATEGORY.CARDIO, label: 'Cardio' },
  { value: EXERCISE_CATEGORY.FLEXIBILITY, label: 'Flexibility' },
  { value: EXERCISE_CATEGORY.OTHER, label: 'Other' },
] as const;

/** Default category when none specified */
export const DEFAULT_EXERCISE_CATEGORY: ExerciseCategory = EXERCISE_CATEGORY.STRENGTH;

/** Categories that use duration/sets format rather than weight×reps×sets */
export const DURATION_BASED_CATEGORIES: readonly ExerciseCategory[] = [
  EXERCISE_CATEGORY.CARDIO,
  EXERCISE_CATEGORY.FLEXIBILITY,
  EXERCISE_CATEGORY.OTHER,
];

// -----------------------------------------------------------------------------
// Weight Type (strength set entries: a=actual/total, e=each hand, bw=bodyweight)
// -----------------------------------------------------------------------------

export const WEIGHT_TYPE_OPTIONS = [
  { value: 'a', label: 'act' },
  { value: 'e', label: 'ea' },
  { value: 'bw', label: 'bw' },
] as const;

export type WeightType = (typeof WEIGHT_TYPE_OPTIONS)[number]['value'];
