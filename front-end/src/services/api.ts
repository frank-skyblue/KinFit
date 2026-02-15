import axios, { type AxiosRequestConfig } from 'axios';
import { AUTH_TOKEN_KEY, USER_KEY } from '../constants/auth';
import { DURATION_BASED_CATEGORIES, EXERCISE_CATEGORY, type ActivityLevel, type ExerciseCategory, type Gender, type Units, type Visibility, type WeightType } from '../constants/options';
import type { MuscleGroup } from '../constants/muscleGroups';

// -----------------------------------------------------------------------------
// Axios Setup
// -----------------------------------------------------------------------------

// API URL configuration:
// - VITE_API_URL env var: Use if explicitly set
// - Otherwise: Always use relative /api so the Vite proxy (or production reverse-proxy) handles routing.
//   This ensures the app works from any device on the network (phone, tablet, etc.)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (redirect to login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/** Wraps axios methods to return response.data directly, reducing boilerplate. */
const request = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.get<T>(url, config).then((r) => r.data),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    api.post<T>(url, data, config).then((r) => r.data),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    api.put<T>(url, data, config).then((r) => r.data),
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.delete<T>(url, config).then((r) => r.data),
};

// -----------------------------------------------------------------------------
// Types — Auth & User
// -----------------------------------------------------------------------------

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  profilePhoto?: string;
  bio?: string;
  fitnessGoals?: string;
  units: Units;
  birthdate?: string;
  gender?: Gender;
  height?: number;
  weight?: number;
  activityLevel?: ActivityLevel;
  totalWorkouts: number; // Backend always provides (default 0)
  currentStreak: number; // Backend always provides (default 0)
  isAdmin?: boolean;
  settings?: {
    defaultWorkoutVisibility: Visibility;
    notifications: {
      partnerPRs: boolean;
      partnerWorkouts: boolean;
      comments: boolean;
      reactions: boolean;
    };
  };
  createdAt?: string;
}

export interface ProfileUpdateData {
  displayName?: string;
  bio?: string;
  fitnessGoals?: string;
  units?: Units;
  birthdate?: string | null;
  gender?: Gender | null;
  height?: number | null;
  weight?: number | null;
  activityLevel?: ActivityLevel | null;
  settings?: User['settings'];
}

// -----------------------------------------------------------------------------
// Types — Exercise & Workout
// -----------------------------------------------------------------------------

export interface Exercise {
  _id: string;
  name: string;
  primaryMuscleGroups: MuscleGroup[];
  secondaryMuscleGroups: MuscleGroup[];
  category: ExerciseCategory;
  isCustom: boolean;
  description?: string;
}

export interface SetEntry {
  // Strength fields
  weightValue?: number;
  weightType?: WeightType;
  reps?: number;
  sets?: number;
  // Cardio fields
  duration?: number;       // in minutes
  intensityZone?: number;  // 1–4
}

export interface ExerciseEntry {
  exerciseId: string;
  exerciseName: string;
  category?: ExerciseCategory;
  weightValue?: number;
  weightType?: WeightType;
  reps?: number;
  sets?: number;
  setEntries?: SetEntry[];
  notes?: string;
  orderIndex: number;
  /** Client-only stable ID for drag-and-drop — stripped before saving */
  _dragId?: string;
}

// -----------------------------------------------------------------------------
// Exercise Helpers (createExerciseEntry, getSetEntries, etc.)
// -----------------------------------------------------------------------------

/** Generate a unique ID — uses crypto.randomUUID() in secure contexts, falls back for plain HTTP */
let _uid = 0;
export const uniqueId = (): string => {
  try { return crypto.randomUUID(); }
  catch { return `_drag_${Date.now()}_${++_uid}`; }
};

/** Create a new ExerciseEntry from an Exercise, with defaults based on category */
export const createExerciseEntry = (
  exercise: Exercise,
  orderIndex: number
): ExerciseEntry => {
  const cat = exercise.category;
  let defaultEntries: SetEntry[];
  switch (cat) {
    case EXERCISE_CATEGORY.CARDIO:
      defaultEntries = [{ duration: 30, intensityZone: 2 }];
      break;
    case EXERCISE_CATEGORY.FLEXIBILITY:
      defaultEntries = [{ duration: 30 }];
      break;
    case EXERCISE_CATEGORY.OTHER:
      defaultEntries = [];
      break;
    default:
      defaultEntries = [{ weightValue: 0, weightType: 'a', reps: 10, sets: 3 }];
  }
  return {
    exerciseId: exercise._id,
    exerciseName: exercise.name,
    category: cat,
    setEntries: defaultEntries.length > 0 ? defaultEntries : undefined,
    notes: '',
    orderIndex,
    _dragId: uniqueId(),
  };
};

/** Resolve set entries from an exercise. Returns category-specific defaults when setEntries is empty. */
export const getSetEntries = (exercise: ExerciseEntry): SetEntry[] => {
  if (exercise.setEntries && exercise.setEntries.length > 0) return exercise.setEntries;
  if (exercise.category === EXERCISE_CATEGORY.CARDIO) return [{ duration: 30, intensityZone: 2 }];
  if (exercise.category === EXERCISE_CATEGORY.FLEXIBILITY) return [{ duration: 30 }];
  if (exercise.category === EXERCISE_CATEGORY.OTHER) return [];
  return [{ weightValue: 0, weightType: 'a', reps: 10, sets: 3 }];
};

/** Format a single set entry as compact notation */
export const formatSetNotation = (entry: SetEntry, category?: ExerciseCategory): string => {
  if (category === EXERCISE_CATEGORY.CARDIO) {
    const zone = entry.intensityZone ? `Z${entry.intensityZone}` : '';
    return `${entry.duration || 0}min${zone ? ` · ${zone}` : ''}`;
  }
  if (category === EXERCISE_CATEGORY.FLEXIBILITY) return `${entry.duration || 0}min`;
  if (entry.weightType === 'bw') return `bw × ${entry.reps} × ${entry.sets}`;
  return `${entry.weightValue || 0}${entry.weightType || 'a'} × ${entry.reps} × ${entry.sets}`;
};

/** Build a notation summary for an exercise (returns empty string for "other") */
export const buildNotationSummary = (exercise: ExerciseEntry): string => {
  if (exercise.category === EXERCISE_CATEGORY.OTHER) return exercise.notes || '';
  const entries = getSetEntries(exercise);
  return entries.map((e) => formatSetNotation(e, exercise.category)).join(' · ');
};

/** Normalize an exercise before saving — strip client-only fields, ensure setEntries format. */
export const normalizeExerciseForSave = (exercise: ExerciseEntry): ExerciseEntry => {
  const entries = getSetEntries(exercise);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _dragId, ...rest } = exercise;

  if (exercise.category && DURATION_BASED_CATEGORIES.includes(exercise.category)) {
    return { ...rest, setEntries: entries.length > 0 ? entries : undefined };
  }

  return { ...rest, setEntries: entries };
};

export interface Workout {
  _id?: string;
  userId?: string;
  date: string;
  title?: string;
  notes?: string;
  visibility: Visibility;
  exercises: ExerciseEntry[];
  totalVolume: number; // Backend always provides (default 0)
  duration?: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// -----------------------------------------------------------------------------
// API — Authentication
// -----------------------------------------------------------------------------

export const register = (data: RegisterData) => request.post('/auth/register', data);

export const login = (data: LoginData) => request.post('/auth/login', data);

export const verifyAuth = () => request.get('/auth/verify');

// -----------------------------------------------------------------------------
// API — Workouts
// -----------------------------------------------------------------------------

export const createWorkout = (workout: Workout) => request.post('/workouts', workout);

export const getWorkouts = (page = 1, limit = 20) =>
  request.get('/workouts', { params: { page, limit } });

export const getWorkoutById = (workoutId: string) => request.get(`/workouts/${workoutId}`);

export const updateWorkout = (workoutId: string, workout: Partial<Workout>) =>
  request.put(`/workouts/${workoutId}`, workout);

export const deleteWorkout = (workoutId: string) => request.delete(`/workouts/${workoutId}`);

export const getExerciseHistory = (exerciseId: string) =>
  request.get(`/workouts/exercise/${exerciseId}/history`);

// -----------------------------------------------------------------------------
// API — Exercises
// -----------------------------------------------------------------------------

/** Optional server-side filters. When omitted, returns all exercises (filter client-side if needed). */
export interface GetExercisesParams {
  search?: string;
  category?: ExerciseCategory;
  muscleGroup?: MuscleGroup;
}

export const getExercises = (params?: GetExercisesParams) =>
  request.get('/exercises', { params: params ?? {} });

export const createExercise = (exercise: {
  name: string;
  primaryMuscleGroups?: MuscleGroup[];
  secondaryMuscleGroups?: MuscleGroup[];
  description?: string;
  category: ExerciseCategory;
}) => request.post('/exercises', exercise);

export const getExerciseById = (exerciseId: string) => request.get(`/exercises/${exerciseId}`);

export const updateExercise = (
  exerciseId: string,
  data: {
    name?: string;
    primaryMuscleGroups?: MuscleGroup[];
    secondaryMuscleGroups?: MuscleGroup[];
    description?: string;
    category?: ExerciseCategory;
  }
) => request.put(`/exercises/${exerciseId}`, data);

export const deleteExercise = (exerciseId: string) => request.delete(`/exercises/${exerciseId}`);

// -----------------------------------------------------------------------------
// API — Analytics
// -----------------------------------------------------------------------------
export interface VolumeContribution {
  exerciseName: string;
  amount: number;
  weight: number; // 1 = primary, 0.5 = secondary
}

export interface BodyPartVolumeSets {
  name: string;
  unit: 'sets';
  setsThisWeek: number;
  targetSets: number;
  daysSinceLastTrained: number | null;
  lastTrainedDate: string | null;
  contributions?: VolumeContribution[];
}

export interface BodyPartVolumeMinutes {
  name: string;
  unit: 'minutes';
  minutesThisWeek: number;
  targetMinutes: number;
  daysSinceLastTrained: number | null;
  lastTrainedDate: string | null;
  contributions?: VolumeContribution[];
}

export type BodyPartVolume = BodyPartVolumeSets | BodyPartVolumeMinutes;

export interface VolumeSummaryResponse {
  bodyParts: BodyPartVolume[];
  targetSetsPerWeek: number;
}

export const getVolumeSummary = (): Promise<VolumeSummaryResponse> =>
  request.get('/analytics/volume-summary');

// -----------------------------------------------------------------------------
// API — Profile
// -----------------------------------------------------------------------------

export const getProfile = () => request.get('/profile');

export const updateProfile = (data: ProfileUpdateData) => request.put('/profile', data);

export default api;

