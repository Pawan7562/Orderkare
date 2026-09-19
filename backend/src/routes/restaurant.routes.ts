import { Router } from 'express';
import { getDashboardStats } from '../controllers/order.controller';
import { getRestaurantAnalytics } from '../controllers/analytics.controller';
import { authenticateToken, requireRestaurantContext, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/dashboard/stats', authenticateToken, requireRestaurantContext, requireRole(['RESTAURANT_ADMIN', 'ADMIN', 'STAFF']), getDashboardStats);
router.get('/analytics', authenticateToken, requireRestaurantContext, requireRole(['RESTAURANT_ADMIN', 'ADMIN', 'STAFF']), getRestaurantAnalytics);

export default router;
