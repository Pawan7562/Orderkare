import { Router } from 'express';
import { login, register, getMe } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 10,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	message: { message: 'Too many login attempts. Please try again later.' },
});

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.get('/me', authenticateToken, getMe);

export default router;
