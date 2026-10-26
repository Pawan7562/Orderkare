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

// 🟢 PUBLIC: View active plans (For the Pricing/Subscription page)
// URL: GET /api/v1/plans/active
router.get('/active', getActivePlans);

// 🔴 SUPER ADMIN: View all plans (For Superadmin dashboard)
// URL: GET /api/v1/plans/admin/all
router.get('/admin/all', authenticateToken, requireRole(['SUPER_ADMIN']), getAllPlans);

// 🔴 SUPER ADMIN: Create a plan
// URL: POST /api/v1/plans/admin
router.post('/admin', authenticateToken, requireRole(['SUPER_ADMIN']), createPlan);

// 🔴 SUPER ADMIN: Update a plan
// URL: PUT /api/v1/plans/admin/:id
router.put('/admin/:id', authenticateToken, requireRole(['SUPER_ADMIN']), updatePlan);

// 🔴 SUPER ADMIN: Delete a plan
// URL: DELETE /api/v1/plans/admin/:id
router.delete('/admin/:id', authenticateToken, requireRole(['SUPER_ADMIN']), deletePlan);

export default router;