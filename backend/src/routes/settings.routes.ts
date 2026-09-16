import { Router } from 'express';
import {
  getPublicSettings,
  getSuperAdminSettings,
  updateSuperAdminSettings,
  changeAdminCredentials,
  getSystemHealth,
  exportSystemBackup,
  purgeTestOrders
} from '../controllers/settings.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Public route for landing page & public clients
router.get('/public', getPublicSettings);

// Super Admin Protected Routes
router.get('/', authenticateToken, requireRole(['SUPER_ADMIN']), getSuperAdminSettings);
router.put('/', authenticateToken, requireRole(['SUPER_ADMIN']), updateSuperAdminSettings);
router.post('/credentials', authenticateToken, requireRole(['SUPER_ADMIN']), changeAdminCredentials);
router.get('/health', authenticateToken, requireRole(['SUPER_ADMIN']), getSystemHealth);
router.get('/backup', authenticateToken, requireRole(['SUPER_ADMIN']), exportSystemBackup);
router.post('/purge-test-orders', authenticateToken, requireRole(['SUPER_ADMIN']), purgeTestOrders);

export default router;
