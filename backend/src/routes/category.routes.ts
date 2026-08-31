import { Router } from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/category.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, requireRole(['RESTAURANT_ADMIN', 'STAFF', 'ADMIN', 'SUPER_ADMIN']), getCategories);
router.post('/', authenticateToken, requireRole(['RESTAURANT_ADMIN', 'ADMIN', 'SUPER_ADMIN']), createCategory);
router.put('/:id', authenticateToken, requireRole(['RESTAURANT_ADMIN', 'ADMIN', 'SUPER_ADMIN']), updateCategory);
router.delete('/:id', authenticateToken, requireRole(['RESTAURANT_ADMIN', 'ADMIN', 'SUPER_ADMIN']), deleteCategory);

export default router;
