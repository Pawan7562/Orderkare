import { Router } from 'express';
import {
  getOrders,
  updateOrderStatus,
  closeBill,
  createOrder,
  getOrderStatus,
  getDashboardStats,
  submitOrderFeedback,
  getRestaurantFeedback,
  getTableBill,
  callStaff,
  getRangeStats,
  setOrderEstimate
} from '../controllers/order.controller';
import { authenticateToken, requireRestaurantContext, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Admin routes
router.get('/', authenticateToken, requireRestaurantContext, requireRole(['RESTAURANT_ADMIN', 'STAFF', 'ADMIN']), getOrders);
router.get('/feedback', authenticateToken, requireRestaurantContext, requireRole(['RESTAURANT_ADMIN', 'STAFF', 'ADMIN']), getRestaurantFeedback);
router.patch('/:id/status', authenticateToken, requireRestaurantContext, requireRole(['RESTAURANT_ADMIN', 'STAFF', 'ADMIN']), updateOrderStatus);

router.patch('/:id/bill', authenticateToken, requireRestaurantContext, requireRole(['RESTAURANT_ADMIN', 'STAFF', 'ADMIN']), closeBill);
router.patch('/:id/estimate', authenticateToken, requireRestaurantContext, requireRole(['RESTAURANT_ADMIN', 'STAFF', 'ADMIN']),setOrderEstimate );
router.get('/table-bill/:tableNumber', authenticateToken, requireRestaurantContext, getTableBill);
router.post('/call-staff/:slug', callStaff);
router.get('/range-stats', authenticateToken, requireRestaurantContext, requireRole(['RESTAURANT_ADMIN', 'STAFF', 'ADMIN']), getRangeStats);
// Public routes (for customer ordering and live tracking)
router.post('/place/:slug', createOrder);
router.post('/:id/feedback', submitOrderFeedback);
router.get('/track/:id', getOrderStatus);
router.get('/status/:id', getOrderStatus);
router.get('/:id', getOrderStatus);

export default router;