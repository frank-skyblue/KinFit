import { Router } from 'express';
import {
  createWorkout,
  getWorkouts,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
  getExerciseHistory,
} from '../controllers/workoutController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/', createWorkout);
router.get('/', getWorkouts);
router.get('/:workoutId', getWorkoutById);
router.put('/:workoutId', updateWorkout);
router.delete('/:workoutId', deleteWorkout);
router.get('/exercise/:exerciseId/history', getExerciseHistory);

export default router;

