import { Router } from 'express';
import { getTables, createTable, batchCreateTables, updateTableStatus, deleteTable } from '../controllers/table.controller';
import { authenticateToken, requireRestaurantContext, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken, requireRestaurantContext);

router.get('/', requireRole(['RESTAURANT_ADMIN', 'STAFF', 'ADMIN']), getTables);
router.post('/', requireRole(['RESTAURANT_ADMIN', 'ADMIN']), createTable);
router.post('/batch', requireRole(['RESTAURANT_ADMIN', 'ADMIN']), batchCreateTables);
router.patch('/:id/status', requireRole(['RESTAURANT_ADMIN', 'STAFF', 'ADMIN']), updateTableStatus);
router.put('/:id', requireRole(['RESTAURANT_ADMIN', 'ADMIN']), updateTableStatus);
router.delete('/:id', requireRole(['RESTAURANT_ADMIN', 'ADMIN']), deleteTable);

export default router;
