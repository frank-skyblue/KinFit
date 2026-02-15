import { Router } from 'express';
import { getExercises, createExercise, getExerciseById, updateExercise, deleteExercise } from '../controllers/exerciseController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getExercises);
router.post('/', createExercise);
router.get('/:exerciseId', getExerciseById);
router.put('/:exerciseId', updateExercise);
router.delete('/:exerciseId', deleteExercise);

export default router;

