import { Router } from 'express';
import { getFoods, createFood, updateFood, deleteFood } from '../controllers/food.controller';
import { authenticateToken, requireRestaurantContext, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken, requireRestaurantContext);
router.get('/', requireRole(['RESTAURANT_ADMIN', 'STAFF', 'ADMIN']), getFoods);
router.post('/', requireRole(['RESTAURANT_ADMIN', 'ADMIN']), createFood);
router.put('/:id', requireRole(['RESTAURANT_ADMIN', 'ADMIN']), updateFood);
router.delete('/:id', requireRole(['RESTAURANT_ADMIN', 'ADMIN']), deleteFood);

export default router;
