import { Router } from 'express';
import { getExercises, createExercise, getExerciseById } from '../controllers/exerciseController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getExercises);
router.post('/', createExercise);
router.get('/:exerciseId', getExerciseById);

export default router;

