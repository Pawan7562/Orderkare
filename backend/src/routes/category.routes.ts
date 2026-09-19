import { Router } from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/category.controller';
import { authenticateToken, requireRestaurantContext, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken, requireRestaurantContext);
router.get('/', requireRole(['RESTAURANT_ADMIN', 'STAFF', 'ADMIN']), getCategories);
router.post('/', requireRole(['RESTAURANT_ADMIN', 'ADMIN']), createCategory);
router.put('/:id', requireRole(['RESTAURANT_ADMIN', 'ADMIN']), updateCategory);
router.delete('/:id', requireRole(['RESTAURANT_ADMIN', 'ADMIN']), deleteCategory);

export default router;
