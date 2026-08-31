import { Router } from 'express';
import { getDashboardStats } from '../controllers/order.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/dashboard/stats', authenticateToken, requireRole(['RESTAURANT_ADMIN', 'ADMIN', 'STAFF', 'SUPER_ADMIN']), getDashboardStats);

export default router;
