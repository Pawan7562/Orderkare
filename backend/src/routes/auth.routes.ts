import { Router } from 'express';
import { login, register, getMe, savePushToken, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 20,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	message: { message: 'Too many login attempts. Please try again later.' },
});

const forgotPasswordLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 15,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	message: { message: 'Too many password reset requests. Please try again later.' },
});

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', forgotPasswordLimiter, resetPassword);
router.get('/me', authenticateToken, getMe);
router.post('/push-token', authenticateToken, savePushToken);

export default router;
