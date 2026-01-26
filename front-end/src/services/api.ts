import axios from 'axios';

// In production (Vercel), use relative URL. In development, use localhost.
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:5001/api');

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
  units: 'lbs' | 'kg';
  totalWorkouts?: number;
  currentStreak?: number;
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

export default api;

