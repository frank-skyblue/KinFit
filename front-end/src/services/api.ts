import axios from 'axios';

// API URL configuration:
// - VITE_API_URL env var: Use if explicitly set
// - Production: Use relative /api (same domain)
// - Development with vercel dev: Use relative /api (port 3000)
// - Development with Express backend: Use localhost:5001
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api' : 
    (window.location.port === '3000' ? '/api' : 'http://localhost:5001/api'));

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

export interface ExerciseEntry {
  exerciseId: string;
  exerciseName: string;
  weightValue?: number;
  weightType: 'e' | 'a' | 'bw';
  reps: number;
  sets: number;
  notes?: string;
  orderIndex: number;
}

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

