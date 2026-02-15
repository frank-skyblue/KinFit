import axios from 'axios';

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
  const token = localStorage.getItem('authToken');
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
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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
  units: 'lbs' | 'kg';
  birthdate?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  height?: number;
  weight?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  totalWorkouts?: number;
  currentStreak?: number;
  settings?: {
    defaultWorkoutVisibility: 'private' | 'shared';
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
  units?: 'lbs' | 'kg';
  birthdate?: string | null;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  height?: number | null;
  weight?: number | null;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  settings?: User['settings'];
}

export interface Exercise {
  _id: string;
  name: string;
  muscleGroups: string[];
  category: string;
  isCustom: boolean;
  description?: string;
}

export interface SetEntry {
  // Strength fields
  weightValue?: number;
  weightType?: 'e' | 'a' | 'bw';
  reps?: number;
  sets?: number;
  // Cardio fields
  duration?: number;       // in minutes
  intensityZone?: number;  // 1–4
}

export interface ExerciseEntry {
  exerciseId: string;
  exerciseName: string;
  category?: 'strength' | 'cardio' | 'flexibility' | 'other';
  weightValue?: number;
  weightType?: 'e' | 'a' | 'bw';
  reps?: number;
  sets?: number;
  setEntries?: SetEntry[];
  notes?: string;
  orderIndex: number;
  /** Client-only stable ID for drag-and-drop — stripped before saving */
  _dragId?: string;
}

/** Generate a unique ID — uses crypto.randomUUID() in secure contexts, falls back for plain HTTP */
let _uid = 0;
export const uniqueId = (): string => {
  try { return crypto.randomUUID(); }
  catch { return `_drag_${Date.now()}_${++_uid}`; }
};

/** Resolve set entries from an exercise, falling back to legacy single-line fields */
export const getSetEntries = (exercise: ExerciseEntry): SetEntry[] => {
  if (exercise.setEntries && exercise.setEntries.length > 0) return exercise.setEntries;
  if (exercise.category === 'cardio') return [{ duration: 30, intensityZone: 2 }];
  if (exercise.category === 'flexibility') return [{ duration: 30 }];
  if (exercise.category === 'other') return [];
  return [{ weightValue: exercise.weightValue, weightType: exercise.weightType || 'a', reps: exercise.reps || 1, sets: exercise.sets || 1 }];
};

/** Format a single set entry as compact notation */
export const formatSetNotation = (entry: SetEntry, category?: string): string => {
  if (category === 'cardio') {
    const zone = entry.intensityZone ? `Z${entry.intensityZone}` : '';
    return `${entry.duration || 0}min${zone ? ` · ${zone}` : ''}`;
  }
  if (category === 'flexibility') return `${entry.duration || 0}min`;
  if (entry.weightType === 'bw') return `bw × ${entry.reps} × ${entry.sets}`;
  return `${entry.weightValue || 0}${entry.weightType || 'a'} × ${entry.reps} × ${entry.sets}`;
};

/** Build a notation summary for an exercise (returns empty string for "other") */
export const buildNotationSummary = (exercise: ExerciseEntry): string => {
  if (exercise.category === 'other') return exercise.notes || '';
  const entries = getSetEntries(exercise);
  return entries.map((e) => formatSetNotation(e, exercise.category)).join(' · ');
};

/** Normalize an exercise before saving — sets legacy fields from first setEntry for backward compat */
export const normalizeExerciseForSave = (exercise: ExerciseEntry): ExerciseEntry => {
  const entries = getSetEntries(exercise);
  const first = entries[0];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _dragId, ...rest } = exercise;

  if (exercise.category === 'cardio' || exercise.category === 'flexibility' || exercise.category === 'other') {
    return { ...rest, setEntries: entries.length > 0 ? entries : undefined };
  }

  return {
    ...rest,
    weightValue: first?.weightValue,
    weightType: first?.weightType,
    reps: first?.reps,
    sets: first?.sets,
    setEntries: entries,
  };
};

export interface Workout {
  _id?: string;
  userId?: string;
  date: string;
  title?: string;
  notes?: string;
  visibility: 'private' | 'shared';
  exercises: ExerciseEntry[];
  totalVolume?: number;
  duration?: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Authentication
export const register = async (data: RegisterData) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const login = async (data: LoginData) => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

export const verifyAuth = async () => {
  const response = await api.get('/auth/verify');
  return response.data;
};

// Workouts
export const createWorkout = async (workout: Workout) => {
  const response = await api.post('/workouts', workout);
  return response.data;
};

export const getWorkouts = async (page = 1, limit = 20) => {
  const response = await api.get('/workouts', { params: { page, limit } });
  return response.data;
};

export const getWorkoutById = async (workoutId: string) => {
  const response = await api.get(`/workouts/${workoutId}`);
  return response.data;
};

export const updateWorkout = async (workoutId: string, workout: Partial<Workout>) => {
  const response = await api.put(`/workouts/${workoutId}`, workout);
  return response.data;
};

export const deleteWorkout = async (workoutId: string) => {
  const response = await api.delete(`/workouts/${workoutId}`);
  return response.data;
};

export const getExerciseHistory = async (exerciseId: string) => {
  const response = await api.get(`/workouts/exercise/${exerciseId}/history`);
  return response.data;
};

// Exercises
export const getExercises = async (params?: { search?: string; category?: string; muscleGroup?: string }) => {
  const response = await api.get('/exercises', { params });
  return response.data;
};

export const createExercise = async (exercise: { name: string; muscleGroups?: string[]; description?: string; category?: string }) => {
  const response = await api.post('/exercises', exercise);
  return response.data;
};

export const getExerciseById = async (exerciseId: string) => {
  const response = await api.get(`/exercises/${exerciseId}`);
  return response.data;
};

export const updateExercise = async (exerciseId: string, data: { name?: string; muscleGroups?: string[]; description?: string; category?: string }) => {
  const response = await api.put(`/exercises/${exerciseId}`, data);
  return response.data;
};

export const deleteExercise = async (exerciseId: string) => {
  const response = await api.delete(`/exercises/${exerciseId}`);
  return response.data;
};

// Profile
export const getProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

export const updateProfile = async (data: ProfileUpdateData) => {
  const response = await api.put('/profile', data);
  return response.data;
};

export default api;

