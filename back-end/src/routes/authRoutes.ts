import { Router } from 'express';
import { register, login, verifyAuth } from '../controllers/authenticationController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify', authenticateToken, verifyAuth);

export default router;

