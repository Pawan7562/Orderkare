import { Router } from 'express';
import {
  getActiveAds,
  getAllAds,
  createAd,
  updateAd,
  deleteAd
} from '../controllers/ad.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Public route for customer menu
router.get('/', getActiveAds);

// Super Admin protected routes
router.get('/all', authenticateToken, requireRole(['SUPER_ADMIN']), getAllAds);
router.post('/', authenticateToken, requireRole(['SUPER_ADMIN']), createAd);
router.put('/:id', authenticateToken, requireRole(['SUPER_ADMIN']), updateAd);
router.delete('/:id', authenticateToken, requireRole(['SUPER_ADMIN']), deleteAd);

export default router;
