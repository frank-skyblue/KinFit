import { Navigate, RouteObject } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Dashboard from './components/dashboard/Dashboard';
import WorkoutList from './components/workouts/WorkoutList';
import WorkoutDetail from './components/workouts/WorkoutDetail';
import NewWorkout from './components/workouts/NewWorkout';
import ExerciseLibrary from './components/exercises/ExerciseLibrary';
import Profile from './components/profile/Profile';

const withProtected = (Component: React.ComponentType) => (
  <ProtectedRoute>
    <Component />
  </ProtectedRoute>
);

export const routes: RouteObject[] = [
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/dashboard', element: withProtected(Dashboard) },
  { path: '/workouts', element: withProtected(WorkoutList) },
  { path: '/workouts/new', element: withProtected(NewWorkout) },
  { path: '/workouts/:workoutId', element: withProtected(WorkoutDetail) },
  { path: '/exercises', element: withProtected(ExerciseLibrary) },
  { path: '/profile', element: withProtected(Profile) },
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
];
