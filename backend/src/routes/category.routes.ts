import { Router } from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/category.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, requireRole(['RESTAURANT_ADMIN', 'STAFF']), getCategories);
router.post('/', authenticateToken, requireRole(['RESTAURANT_ADMIN']), createCategory);
router.put('/:id', authenticateToken, requireRole(['RESTAURANT_ADMIN']), updateCategory);
router.delete('/:id', authenticateToken, requireRole(['RESTAURANT_ADMIN']), deleteCategory);

export default router;
