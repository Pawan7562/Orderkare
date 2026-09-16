import { Router } from 'express';
import {
  getActivePlans,
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan
} from '../controllers/plan.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Public: View active plans for landing page / pricing table
router.get('/', getActivePlans);

// Super Admin Protected Routes
router.get('/all', authenticateToken, requireRole(['SUPER_ADMIN']), getAllPlans);
router.post('/', authenticateToken, requireRole(['SUPER_ADMIN']), createPlan);
router.put('/:id', authenticateToken, requireRole(['SUPER_ADMIN']), updatePlan);
router.delete('/:id', authenticateToken, requireRole(['SUPER_ADMIN']), deletePlan);

export default router;
