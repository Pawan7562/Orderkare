import { Router } from 'express';
import {
  getAdminStats,
  getAdminHotels,
  getAdminSubscriptions,
  getAdminAnalytics,
  getAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  toggleHotelStatus,
} from '../controllers/admin.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Protect all admin routes for SUPER_ADMIN role
router.use(authenticateToken, requireRole(['SUPER_ADMIN']));

router.get('/stats', getAdminStats);
router.get('/hotels', getAdminHotels);
router.get('/subscriptions', getAdminSubscriptions);
router.get('/analytics', getAdminAnalytics);
router.get('/notifications', getAdminNotifications);
router.post('/notifications/read-all', markAllNotificationsRead);
router.post('/notifications/:id/read', markNotificationRead);
router.put('/hotels/:id/toggle', toggleHotelStatus);

export default router;
