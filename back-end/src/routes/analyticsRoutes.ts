import { Router } from 'express';
import { getVolumeSummary } from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/volume-summary', getVolumeSummary);

export default router;
