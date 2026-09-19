import { Router } from 'express';
import { createRazorpaySubscriptionOrder, getSubscriptionStatus, processSubscriptionPayment, verifyRazorpaySubscriptionPayment } from '../controllers/subscription.controller';
import { authenticateToken, requireRestaurantContext, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken, requireRestaurantContext);

router.get('/status', requireRole(['RESTAURANT_ADMIN', 'ADMIN', 'STAFF']), getSubscriptionStatus);
router.get('/current', requireRole(['RESTAURANT_ADMIN', 'ADMIN', 'STAFF']), getSubscriptionStatus);
router.post('/pay', requireRole(['RESTAURANT_ADMIN', 'ADMIN']), processSubscriptionPayment);
router.post('/payment-order', requireRole(['RESTAURANT_ADMIN', 'ADMIN']), createRazorpaySubscriptionOrder);
router.post('/payment-verify', requireRole(['RESTAURANT_ADMIN', 'ADMIN']), verifyRazorpaySubscriptionPayment);
router.post('/activate-trial', requireRole(['RESTAURANT_ADMIN', 'ADMIN']), processSubscriptionPayment);
router.post('/renew', requireRole(['RESTAURANT_ADMIN', 'ADMIN']), processSubscriptionPayment);

export default router;
