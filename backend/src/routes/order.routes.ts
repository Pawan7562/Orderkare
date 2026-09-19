import { Router } from 'express';
import { getOrders, updateOrderStatus, createOrder, getOrderStatus, getDashboardStats, submitOrderFeedback, getRestaurantFeedback } from '../controllers/order.controller';
import { authenticateToken, requireRestaurantContext, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Admin routes
router.get('/', authenticateToken, requireRestaurantContext, requireRole(['RESTAURANT_ADMIN', 'STAFF', 'ADMIN']), getOrders);
router.get('/feedback', authenticateToken, requireRestaurantContext, requireRole(['RESTAURANT_ADMIN', 'STAFF', 'ADMIN']), getRestaurantFeedback);
router.patch('/:id/status', authenticateToken, requireRestaurantContext, requireRole(['RESTAURANT_ADMIN', 'STAFF', 'ADMIN']), updateOrderStatus);

// Public routes (for customer ordering and live tracking)
router.post('/place/:slug', createOrder);
router.post('/:id/feedback', submitOrderFeedback);
router.get('/track/:id', getOrderStatus);
router.get('/status/:id', getOrderStatus);
router.get('/:id', getOrderStatus);

export default router;
