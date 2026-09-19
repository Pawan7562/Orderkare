import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db, query } from '../lib/db';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

const plans: Record<string, { amount: number; days: number; status: 'ACTIVE' | 'TRIAL' }> = {
  FIRST_TIME_ACTIVATION: { amount: 1, days: 30, status: 'TRIAL' },
  MONTHLY: { amount: 249, days: 30, status: 'ACTIVE' },
  SIX_MONTHS: { amount: 1199, days: 180, status: 'ACTIVE' },
  ANNUAL: { amount: 1999, days: 365, status: 'ACTIVE' },
};

const getPlan = (value: unknown) => plans[String(value || '').toUpperCase().trim()];

const getRazorpayConfig = async () => {
  const result = await query(`
    SELECT "razorpayKeyId", "razorpayKeySecret", "defaultUpiId", COALESCE("paymentMode", 'live') AS "paymentMode"
    FROM "SystemSettings" WHERE "id" = 'default' LIMIT 1;
  `).catch(() => ({ rows: [] }));
  const settings = result.rows[0];
  return {
    keyId: process.env.RAZORPAY_KEY_ID?.trim() || settings?.razorpayKeyId?.trim() || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET?.trim() || settings?.razorpayKeySecret?.trim() || '',
    upiId: settings?.defaultUpiId?.trim() || '',
    paymentMode: process.env.RAZORPAY_MODE?.trim() || settings?.paymentMode || 'live',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || '',
  };
};

const razorpayRequest = async (path: string, method: 'GET' | 'POST', body: unknown, keyId: string, keySecret: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`https://api.razorpay.com/v1${path}`, {
      method,
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: method === 'POST' ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const payload = await response.json() as any;
    if (!response.ok) {
      throw new Error(payload?.error?.description || 'Razorpay request failed');
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
};

const activateSubscription = async (restaurantId: string, planId: string, paymentReference: string, amount: number, days: number, status: 'ACTIVE' | 'TRIAL') => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SELECT "id" FROM "Restaurant" WHERE "id" = $1 FOR UPDATE;`, [restaurantId]);
    const existing = await client.query(`SELECT * FROM "Subscription" WHERE "restaurantId" = $1 LIMIT 1 FOR UPDATE;`, [restaurantId]);
    const current = existing.rows[0] || null;

    if (current?.paymentReference === paymentReference) {
      await client.query('COMMIT');
      return current;
    }

    const now = new Date();
    const startDate = current?.validUntil && new Date(current.validUntil) > now ? new Date(current.validUntil) : now;
    const validUntil = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
    const subscriptionId = current?.id || randomUUID();

    if (current) {
      await client.query(
        `UPDATE "Subscription" SET "status" = $1, "planName" = $2, "amountPaid" = $3, "paymentReference" = $4, "validUntil" = $5, "updatedAt" = NOW() WHERE "id" = $6 AND "restaurantId" = $7;`,
        [status, planId, amount, paymentReference, validUntil, subscriptionId, restaurantId]
      );
    } else {
      await client.query(
        `INSERT INTO "Subscription" ("id", "status", "planName", "amountPaid", "paymentReference", "validUntil", "restaurantId") VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [subscriptionId, status, planId, amount, paymentReference, validUntil, restaurantId]
      );
    }

    await client.query(`UPDATE "Restaurant" SET "subscriptionStatus" = 'ACTIVE', "isActive" = true, "updatedAt" = NOW() WHERE "id" = $1;`, [restaurantId]);
    await client.query('COMMIT');
    return { id: subscriptionId, status, planName: planId, amountPaid: amount, paymentReference, validUntil: validUntil.toISOString() };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const isValidWebhookSignature = (rawBody: Buffer, signature: string, secret: string) => {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(signature || '', 'utf8');
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
};

export const handleRazorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await getRazorpayConfig();
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from('');
    const signature = String(req.headers['x-razorpay-signature'] || '');
    if (!config.webhookSecret || !isValidWebhookSignature(rawBody, signature, config.webhookSecret)) {
      res.status(401).json({ message: 'Invalid webhook signature' });
      return;
    }

    const payload = JSON.parse(rawBody.toString('utf8')) as any;
    if (!['payment.captured', 'order.paid'].includes(payload.event)) {
      res.status(200).json({ received: true });
      return;
    }

    const payment = payload.payload?.payment?.entity;
    const order = payload.payload?.order?.entity;
    const paymentId = payment?.id;
    const orderId = payment?.order_id || order?.id;
    if (!paymentId || !orderId) {
      res.status(200).json({ received: true });
      return;
    }

    const razorpayOrder = await razorpayRequest(`/orders/${encodeURIComponent(orderId)}`, 'GET', undefined, config.keyId, config.keySecret);
    const planKey = String(razorpayOrder.notes?.planId || '').toUpperCase().trim();
    const restaurantId = String(razorpayOrder.notes?.restaurantId || '').trim();
    const plan = getPlan(planKey);
    if (!restaurantId || !plan || Number(payment?.amount || order?.amount) !== plan.amount * 100) {
      res.status(400).json({ message: 'Webhook payment metadata is invalid' });
      return;
    }

    await activateSubscription(restaurantId, planKey, paymentId, plan.amount, plan.days, plan.status);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('handleRazorpayWebhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

const ensureSubscriptionSchema = async () => {
  try {
    // 1. Ensure SubscriptionStatus enum exists or is safe
    await query(`
      DO $$ BEGIN
        CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIAL', 'EXPIRED', 'CANCELLED', 'PENDING');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `).catch(() => {});

    // 2. Ensure Subscription table exists
    await query(`
      CREATE TABLE IF NOT EXISTS "Subscription" (
        "id" TEXT PRIMARY KEY,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "planName" TEXT NOT NULL DEFAULT 'NONE',
        "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "paymentReference" TEXT,
        "validUntil" TIMESTAMP(3),
        "restaurantId" TEXT UNIQUE NOT NULL REFERENCES "Restaurant"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    await query(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0;`).catch(() => {});
    await query(`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "paymentReference" TEXT;`).catch(() => {});
  } catch (err) {
    // schema already ready
  }
};

export const getSubscriptionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      res.status(403).json({ message: 'Restaurant context required' });
      return;
    }

    await ensureSubscriptionSchema();

    // Fetch Restaurant & Subscription
    const restRes = await query(`SELECT * FROM "Restaurant" WHERE "id" = $1 LIMIT 1;`, [restaurantId]);
    if (!restRes.rows.length) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }
    const restaurant = restRes.rows[0];

    const subRes = await query(`SELECT * FROM "Subscription" WHERE "restaurantId" = $1 LIMIT 1;`, [restaurantId]);
    let sub = subRes.rows[0] || null;

    const now = new Date();
    let isSubscribed = false;
    let isFirstTime = !sub || sub.planName === 'NONE' || sub.status === 'PENDING';
    let daysRemaining = 0;
    let status = sub ? sub.status : 'PENDING';

    if (sub && sub.validUntil) {
      const validUntil = new Date(sub.validUntil);
      if (validUntil > now && (sub.status === 'ACTIVE' || sub.status === 'TRIAL')) {
        isSubscribed = true;
        daysRemaining = Math.max(0, Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      } else {
        // Expired
        status = 'EXPIRED';
        isSubscribed = false;
        if (sub.status !== 'EXPIRED') {
          await query(`UPDATE "Subscription" SET "status" = 'EXPIRED', "updatedAt" = NOW() WHERE "id" = $1;`, [sub.id]);
          await query(`UPDATE "Restaurant" SET "subscriptionStatus" = 'EXPIRED' WHERE "id" = $1;`, [restaurantId]);
        }
      }
    }

    res.json({
      restaurantId,
      restaurantName: restaurant.name,
      slug: restaurant.slug,
      isSubscribed,
      isFirstTime,
      status,
      planName: sub ? sub.planName : 'NONE',
      validUntil: sub ? sub.validUntil : null,
      daysRemaining,
      qrCodeAllowed: isSubscribed,
      payment: {
        razorpayEnabled: Boolean((await getRazorpayConfig()).keyId),
        upiId: (await getRazorpayConfig()).upiId,
      },
      plans: [
        {
          id: 'MONTHLY',
          name: 'Monthly Plan',
          price: 249,
          durationDays: 30,
          periodText: 'per month',
          description: 'Standard monthly plan for ongoing digital QR ordering.',
          features: [
            'Permanent Table QR Generation',
            'Full Digital Menu & Real-Time Orders',
            'Live Kitchen Dispatch & Audio Notifications',
            'Customer Reviews & Ratings',
            'Standard Email Support'
          ],
          isPopular: false
        },
        {
          id: 'SIX_MONTHS',
          name: '6 Months Plan',
          price: 1199,
          durationDays: 180,
          periodText: 'for 6 months (~₹199/mo)',
          description: 'Most popular choice for steady dining operations. Save 20% compared to monthly.',
          features: [
            'Everything in Monthly +',
            'Save 20% on monthly billing',
            'Priority Live Order Dispatch',
            'Table QR Standee Print Presets',
            'Dedicated WhatsApp Support'
          ],
          isPopular: true
        },
        {
          id: 'ANNUAL',
          name: 'Annual Plan',
          price: 1999,
          durationDays: 365,
          periodText: 'per year (~₹166/mo)',
          description: 'Best value for year-round dining. Save 33% with total peace of mind.',
          features: [
            'Everything in 6 Months +',
            'Save 33% - Best Value',
            'Unlimited Table QR Codes',
            'Comprehensive Revenue Analytics',
            'Zero Commission on Customer Orders',
            'VIP 24/7 Phone & Priority Support'
          ],
          isPopular: false
        }
      ],
      firstTimeOffer: {
        id: 'FIRST_TIME_ACTIVATION',
        name: 'First-Time Activation (1 Month Free)',
        price: 1,
        durationDays: 30,
        description: 'Pay ₹1 one-time activation fee to unlock your QR codes and enjoy 30 days completely free.',
      }
    });
  } catch (error) {
    console.error('getSubscriptionStatus error:', error);
    res.status(500).json({ message: 'Failed to fetch subscription status' });
  }
};

export const processSubscriptionPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId;
    const { planId, planType, paymentReference } = req.body;
    const selectedPlan = String(planId || planType || '').toUpperCase().trim();

    if (!restaurantId) {
      res.status(403).json({ message: 'Restaurant context required' });
      return;
    }

    await ensureSubscriptionSchema();

    const plan = getPlan(selectedPlan);
    if (!plan) {
      res.status(400).json({ message: 'Invalid plan selected. Choose FIRST_TIME_ACTIVATION, MONTHLY, SIX_MONTHS, or ANNUAL.' });
      return;
    }

    const utr = String(paymentReference || '').trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{5,63}$/.test(utr)) {
      res.status(400).json({ message: 'A valid UPI UTR/reference number is required. Online payment verification is unavailable.' });
      return;
    }
    res.status(202).json({ success: false, pending: true, message: 'Payment reference submitted for verification. QR ordering will unlock after payment confirmation.', paymentReference: utr });
  } catch (error) {
    console.error('processSubscriptionPayment error:', error);
    res.status(500).json({ message: 'Failed to process subscription payment' });
  }
};

export const createRazorpaySubscriptionOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId;
    const planId = String(req.body.planId || '').toUpperCase().trim();
    const plan = getPlan(planId);
    if (!restaurantId) { res.status(403).json({ message: 'Restaurant context required' }); return; }
    if (!plan) { res.status(400).json({ message: 'Invalid plan selected' }); return; }

    const config = await getRazorpayConfig();
    if (!config.keyId || !config.keySecret) {
      res.status(503).json({ message: 'Online payment is not configured. Use the UPI payment option and submit the UTR for verification.' });
      return;
    }

    const order = await razorpayRequest('/orders', 'POST', {
      amount: plan.amount * 100,
      currency: 'INR',
      receipt: `sub_${restaurantId.slice(0, 8)}_${Date.now()}`,
      notes: { restaurantId, planId },
    }, config.keyId, config.keySecret);

    res.json({ gateway: 'razorpay', keyId: config.keyId, orderId: order.id, amount: plan.amount * 100, currency: 'INR', planId, mode: config.paymentMode });
  } catch (error) {
    console.error('createRazorpaySubscriptionOrder error:', error);
    res.status(502).json({ message: 'Unable to start secure payment. Please try again.' });
  }
};

export const verifyRazorpaySubscriptionPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId;
    const { planId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
    const planKey = String(planId || '').toUpperCase().trim();
    const plan = getPlan(planKey);
    if (!restaurantId) { res.status(403).json({ message: 'Restaurant context required' }); return; }
    if (!plan || !orderId || !paymentId || !signature) { res.status(400).json({ message: 'Incomplete payment verification details' }); return; }

    const config = await getRazorpayConfig();
    if (!config.keyId || !config.keySecret) { res.status(503).json({ message: 'Online payment is not configured' }); return; }
    const expected = createHmac('sha256', config.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    const signaturesMatch = expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    if (!signaturesMatch) { res.status(400).json({ message: 'Payment signature verification failed' }); return; }

    let payment = await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`, 'GET', undefined, config.keyId, config.keySecret);
    if (payment.order_id !== orderId || Number(payment.amount) !== plan.amount * 100) {
      res.status(400).json({ message: 'Payment was not captured for the selected plan' });
      return;
    }

    if (payment.status === 'authorized') {
      payment = await razorpayRequest(
        `/payments/${encodeURIComponent(paymentId)}/capture`,
        'POST',
        { amount: plan.amount * 100, currency: 'INR' },
        config.keyId,
        config.keySecret
      );
    }

    if (payment.status !== 'captured') {
      res.status(400).json({ message: 'Payment was not captured for the selected plan' });
      return;
    }

    const razorpayOrder = await razorpayRequest(`/orders/${encodeURIComponent(orderId)}`, 'GET', undefined, config.keyId, config.keySecret);
    if (razorpayOrder.notes?.restaurantId !== restaurantId || razorpayOrder.notes?.planId !== planKey) {
      res.status(403).json({ message: 'Payment does not belong to this restaurant or plan' });
      return;
    }

    const alreadyApplied = await query(
      `SELECT * FROM "Subscription" WHERE "restaurantId" = $1 AND "paymentReference" = $2 LIMIT 1;`,
      [restaurantId, paymentId]
    );
    if (alreadyApplied.rows[0]) {
      res.json({ success: true, message: 'Payment was already verified.', subscription: alreadyApplied.rows[0] });
      return;
    }

    const subscription = await activateSubscription(restaurantId, planKey, paymentId, plan.amount, plan.days, plan.status);
    res.json({ success: true, message: 'Payment verified. Your QR ordering is now active.', subscription });
  } catch (error) {
    console.error('verifyRazorpaySubscriptionPayment error:', error);
    res.status(502).json({ message: 'Payment verification failed. Please contact support if your account was charged.' });
  }
};
