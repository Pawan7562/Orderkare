import { Router } from 'express';
import { getOrders, updateOrderStatus, createOrder, getOrderStatus, getDashboardStats } from '../controllers/order.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Admin routes
router.get('/', authenticateToken, requireRole(['RESTAURANT_ADMIN', 'STAFF']), getOrders);
router.patch('/:id/status', authenticateToken, requireRole(['RESTAURANT_ADMIN', 'STAFF']), updateOrderStatus);

// Public routes (for customer ordering)
router.post('/place/:slug', createOrder);
router.get('/track/:id', getOrderStatus);

export default router;
