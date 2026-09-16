import { Router } from 'express';
import { getPublicCategories } from '../controllers/category.controller';
import { getPublicFoods } from '../controllers/food.controller';
import { getPublicMenu } from '../controllers/menu.controller';

const router = Router();

// Public: customer scans QR → gets restaurant menu & categories
router.get('/public/:slug', getPublicMenu);
router.get('/:slug/categories', getPublicCategories);
router.get('/:slug/foods', getPublicFoods);
router.get('/:slug', getPublicMenu);

export default router;
