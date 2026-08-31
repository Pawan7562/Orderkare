import { Router } from 'express';
import { getPublicCategories } from '../controllers/category.controller';
import { getPublicFoods } from '../controllers/food.controller';

const router = Router();

// Public: customer scans QR → gets restaurant menu
router.get('/:slug/categories', getPublicCategories);
router.get('/:slug/foods', getPublicFoods);

export default router;
