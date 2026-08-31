import { Router } from 'express';
import { getFoods, createFood, updateFood, deleteFood } from '../controllers/food.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, requireRole(['RESTAURANT_ADMIN', 'STAFF', 'ADMIN', 'SUPER_ADMIN']), getFoods);
router.post('/', authenticateToken, requireRole(['RESTAURANT_ADMIN', 'ADMIN', 'SUPER_ADMIN']), createFood);
router.put('/:id', authenticateToken, requireRole(['RESTAURANT_ADMIN', 'ADMIN', 'SUPER_ADMIN']), updateFood);
router.delete('/:id', authenticateToken, requireRole(['RESTAURANT_ADMIN', 'ADMIN', 'SUPER_ADMIN']), deleteFood);

export default router;
