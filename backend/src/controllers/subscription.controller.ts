import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { clearSubscriptionCache } from '../middleware/subscription.middleware';
import { db, query } from '../lib/db';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { createAdminNotification } from './admin.controller';
import { notifySuperAdmin, notifySubscriptionUpdated } from '../utils/socket';

// ─── First-time offer: a small activation fee unlocks a trial period ───
export const FIRST_TIME_PLAN_ID = 'FIRST_TIME_ACTIVATION';
export const TRIAL_FEE = Number(process.env.TRIAL_FEE) || 11;    // one-time fee in INR
export const TRIAL_DAYS = Number(process.env.TRIAL_DAYS) || 14;  // trial length in days

let cachedRazorpayConfig: any = null;
let lastRazorpayFetch = 0;

const getRazorpayConfig = async () => {
  const now = Date.now();
  if (cachedRazorpayConfig && now - lastRazorpayFetch < 60000) {
    return cachedRazorpayConfig;
  }
  const result = await query(`
    SELECT "razorpayKeyId", "razorpayKeySecret", "defaultUpiId", COALESCE("paymentMode", 'live') AS "paymentMode"
    FROM "SystemSettings" WHERE "id" = 'default' LIMIT 1;
  `).catch(() => ({ rows: [] }));
  const settings = result.rows[0];
  cachedRazorpayConfig = {
    keyId: process.env.RAZORPAY_KEY_ID?.trim() || settings?.razorpayKeyId?.trim() || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET?.trim() || settings?.razorpayKeySecret?.trim() || '',
    upiId: settings?.defaultUpiId?.trim() || '',
    paymentMode: process.env.RAZORPAY_MODE?.trim() || settings?.paymentMode || 'live',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || '',
  };
  lastRazorpayFetch = now;
  return cachedRazorpayConfig;
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

// True if this restaurant has ever paid anything (so the one-time trial is already used)
const hasUsedTrial = async (restaurantId: string) => {
  const r = await query(
    `SELECT 1 FROM "Subscription"
      WHERE "restaurantId" = $1
        AND COALESCE("amountPaid", 0) > 0
        AND "paymentReference" IS NOT NULL
        AND TRIM("paymentReference") <> ''
      LIMIT 1;`,
    [restaurantId]
  );
  return r.rows.length > 0;
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

    await client.query(`UPDATE "Restaurant" SET "isActive" = true, "updatedAt" = NOW() WHERE "id" = $1;`, [restaurantId]);
    await client.query('COMMIT');

    // Unlock the restaurant's features immediately
    clearSubscriptionCache(restaurantId);

    // Notify Super Admin asynchronously
    void (async () => {
      try {
        const restResult = await query(`SELECT "name" FROM "Restaurant" WHERE "id" = $1;`, [restaurantId]);
        const restName = restResult.rows[0]?.name || 'Unknown Restaurant';
        const isTrial = status === 'TRIAL';
        const title = isTrial
          ? `🎉 New Hotel Activation: ${restName}`
          : `💳 Plan Purchased: ${restName} (₹${amount})`;
        const message = isTrial
          ? `${restName} paid ₹${amount} and started a ${days}-day trial. Reference: ${paymentReference}`
          : `${restName} subscribed to ${planId} plan for ₹${amount}. Reference: ${paymentReference}`;

        const notification = await createAdminNotification({
          type: isTrial ? 'TRIAL_ACTIVATED' : 'SUBSCRIPTION_PURCHASED',
          title,
          message,
          restaurantId,
          restaurantName: restName,
          amount,
          planName: planId,
        });

        notifySuperAdmin(notification);
        notifySubscriptionUpdated(restaurantId, {
          id: subscriptionId,
          status,
          planName: planId,
          amountPaid: amount,
          validUntil: validUntil.toISOString(),
          isSubscribed: true,
        });
      } catch (notifErr) {
        console.error('Failed to dispatch Super Admin notification:', notifErr);
      }
    })();

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
    const planKey = String(razorpayOrder.notes?.planId || '').trim();
    const restaurantId = String(razorpayOrder.notes?.restaurantId || '').trim();

    if (!restaurantId || !planKey) {
      res.status(400).json({ message: 'Webhook payment metadata is invalid' });
      return;
    }

    const paidAmount = Number(payment?.amount || order?.amount);

    // First-time trial payment
    if (planKey === FIRST_TIME_PLAN_ID) {
      if (paidAmount !== TRIAL_FEE * 100) {
        res.status(400).json({ message: 'Webhook payment metadata is invalid' });
        return;
      }
      await activateSubscription(restaurantId, planKey, paymentId, TRIAL_FEE, TRIAL_DAYS, 'TRIAL');
      res.status(200).json({ received: true });
      return;
    }

    // Paid plan: details come from the plans set by the Super Admin
    const planRes = await query(`SELECT * FROM "PricingPlan" WHERE "id" = $1;`, [planKey]);
    const plan = planRes.rows[0];

    if (!plan || paidAmount !== Number(plan.priceMonthly) * 100) {
      res.status(400).json({ message: 'Webhook payment metadata is invalid' });
      return;
    }

    await activateSubscription(restaurantId, planKey, paymentId, Number(plan.priceMonthly), Number(plan.days || 30), 'ACTIVE');
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('handleRazorpayWebhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

let schemaEnsured = false;
let schemaEnsuringPromise: Promise<void> | null = null;

const ensureSubscriptionSchema = async () => {
  if (schemaEnsured) return;
  if (schemaEnsuringPromise) return schemaEnsuringPromise;

  schemaEnsuringPromise = (async () => {
    try {
      await query(`
        DO $$ BEGIN
          CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIAL', 'EXPIRED', 'CANCELLED', 'PENDING');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `).catch(() => {});

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
      await query(`ALTER TABLE "Subscription" ALTER COLUMN "validUntil" DROP NOT NULL;`).catch(() => {});
      schemaEnsured = true;
    } catch (err) {
      // schema already ready
    } finally {
      schemaEnsuringPromise = null;
    }
  })();

  return schemaEnsuringPromise;
};

export const getSubscriptionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      res.status(403).json({ message: 'Restaurant context required' });
      return;
    }

    const restRes = await query(`
      SELECT 
        r.id, r.name, r.slug, r."isActive",
        s.id as sub_id, s.status as sub_status, s."planName" as sub_plan_name, 
        s."amountPaid" as sub_amount_paid, s."paymentReference" as sub_payment_reference, 
        s."validUntil" as sub_valid_until
      FROM "Restaurant" r
      LEFT JOIN "Subscription" s ON s."restaurantId" = r.id
      WHERE r.id = $1 LIMIT 1;
    `, [restaurantId]);

    if (!restRes.rows.length) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const row = restRes.rows[0];
    const restaurant = { id: row.id, name: row.name, slug: row.slug, isActive: row.isActive };
    const sub = row.sub_id ? {
      id: row.sub_id,
      status: row.sub_status,
      planName: row.sub_plan_name,
      amountPaid: row.sub_amount_paid,
      paymentReference: row.sub_payment_reference,
      validUntil: row.sub_valid_until,
    } : null;

    const now = new Date();
    let isSubscribed = false;
    let daysRemaining = 0;
    let status = 'PENDING';

    const hasEverPaid = Boolean(
      sub &&
      Number(sub.amountPaid || 0) > 0 &&
      sub.paymentReference &&
      String(sub.paymentReference).trim() !== ''
    );

    const isFirstTime = !hasEverPaid;

    if (hasEverPaid && sub && sub.validUntil) {
      const validUntil = new Date(sub.validUntil);
      if (validUntil > now && (sub.status === 'ACTIVE' || sub.status === 'TRIAL')) {
        isSubscribed = true;
        status = sub.status;
        daysRemaining = Math.max(0, Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      } else {
        status = 'EXPIRED';
        isSubscribed = false;
        daysRemaining = 0;
        if (sub.status !== 'EXPIRED') {
          await query(`UPDATE "Subscription" SET "status" = 'EXPIRED', "updatedAt" = NOW() WHERE "id" = $1;`, [sub.id]);
          clearSubscriptionCache(restaurantId);
        }
      }
    }

    const rzConfig = await getRazorpayConfig();

    const dynamicPlansRes = await query(
      `SELECT * FROM "PricingPlan" WHERE "isActive" = true ORDER BY "orderIndex" ASC, "priceMonthly" ASC;`
    );

    const formattedPlans = dynamicPlansRes.rows.map((p: any) => {
      let parsedFeatures: string[] = [];
      try {
        parsedFeatures = typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []);
      } catch {
        parsedFeatures = [];
      }

      // Use the real duration stored with the plan; only guess from the name when it is missing
      let planDays = Number(p.days) > 0 ? Number(p.days) : 30;
      if (!(Number(p.days) > 0)) {
        const nameLower = String(p.name || '').toLowerCase();
        if (nameLower.includes('6') || nameLower.includes('half')) planDays = 180;
        if (nameLower.includes('year') || nameLower.includes('annual')) planDays = 365;
      }

      return {
        id: p.id,
        name: p.name,
        price: Number(p.priceMonthly),
        durationDays: planDays,
        periodText: planDays === 30 ? 'per month' : `for ${planDays} days`,
        description: p.description || 'Premium SaaS dining plan.',
        features: parsedFeatures,
        isPopular: Boolean(p.isPopular),
      };
    });

    // Length of the period the restaurant is currently on (used by the progress bar)
    let totalDays = 30;
    if (sub?.planName === FIRST_TIME_PLAN_ID) totalDays = TRIAL_DAYS;
    else {
      const current = formattedPlans.find((p: any) => p.id === sub?.planName);
      if (current) totalDays = current.durationDays;
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
      totalDays,
      qrCodeAllowed: isSubscribed,
      locked: !isSubscribed, // every feature except the Subscription page is locked
      payment: {
        razorpayEnabled: Boolean(rzConfig.keyId),
        upiId: rzConfig.upiId,
      },
      plans: formattedPlans,
      firstTimeOffer: {
        id: FIRST_TIME_PLAN_ID,
        name: `${TRIAL_DAYS}-Day Trial Activation`,
        price: TRIAL_FEE,
        durationDays: TRIAL_DAYS,
        description: `Pay a one-time ₹${TRIAL_FEE} activation fee to unlock your QR codes and all features for ${TRIAL_DAYS} days.`,
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
    const selectedPlan = String(planId || planType || '').trim();

    if (!restaurantId) {
      res.status(403).json({ message: 'Restaurant context required' });
      return;
    }

    await ensureSubscriptionSchema();

    const planRes = await query(`SELECT * FROM "PricingPlan" WHERE "id" = $1;`, [selectedPlan]);
    const plan = planRes.rows[0];
    
    if (!plan) {
      res.status(400).json({ message: 'Invalid plan selected.' });
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

    const planId = String(req.body.planId || '').trim();

    if (!restaurantId) { res.status(403).json({ message: 'Restaurant context required' }); return; }

    let amount = 0;

    if (planId === FIRST_TIME_PLAN_ID) {
      // The trial can only be bought once per restaurant
      if (await hasUsedTrial(restaurantId)) {
        res.status(400).json({ message: 'The introductory trial has already been used. Please choose a plan.' });
        return;
      }
      amount = TRIAL_FEE;
    } else {
      const planRes = await query(`SELECT * FROM "PricingPlan" WHERE "id" = $1;`, [planId]);
      const plan = planRes.rows[0];

      if (!plan) { 
        res.status(400).json({ message: 'Invalid plan selected' }); 
        return; 
      }
      amount = Number(plan.priceMonthly);
    }

    const config = await getRazorpayConfig();
    if (!config.keyId || !config.keySecret) {
      res.status(503).json({ message: 'Online payment is not configured. Use the UPI payment option and submit the UTR for verification.' });
      return;
    }

    const order = await razorpayRequest('/orders', 'POST', {
      amount: amount * 100, 
      currency: 'INR',
      receipt: `sub_${restaurantId.slice(0, 8)}_${Date.now()}`,
      notes: { restaurantId, planId },
    }, config.keyId, config.keySecret);

    res.json({ 
      gateway: 'razorpay', 
      keyId: config.keyId, 
      orderId: order.id, 
      amount: amount * 100, 
      currency: 'INR', 
      planId, 
      mode: config.paymentMode 
    });
  } catch (error) {
    console.error('createRazorpaySubscriptionOrder error:', error);
    res.status(502).json({ message: 'Unable to start secure payment. Please try again.' });
  }
};

export const verifyRazorpaySubscriptionPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId;
    const { planId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
    
    const planKey = String(planId || '').trim();
    
    if (!restaurantId) { res.status(403).json({ message: 'Restaurant context required' }); return; }
    if (!orderId || !paymentId || !signature) { res.status(400).json({ message: 'Incomplete payment verification details' }); return; }

    let amount = 0;
    let days = 0;
    let status: 'ACTIVE' | 'TRIAL' = 'ACTIVE';

    if (planKey === FIRST_TIME_PLAN_ID) {
      amount = TRIAL_FEE;
      days = TRIAL_DAYS;
      status = 'TRIAL';
    } else {
      const planRes = await query(`SELECT * FROM "PricingPlan" WHERE "id" = $1;`, [planKey]);
      const plan = planRes.rows[0];
      if (!plan) { res.status(400).json({ message: 'Invalid plan selected' }); return; }
      
      amount = Number(plan.priceMonthly);
      days = Number(plan.days || 30);
    }

    const config = await getRazorpayConfig();
    if (!config.keyId || !config.keySecret) { res.status(503).json({ message: 'Online payment is not configured' }); return; }
    
    const expected = createHmac('sha256', config.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    const expectedBuf = Buffer.from(expected, 'utf8');
    const sigBuf = Buffer.from(String(signature || ''), 'utf8');
    const signaturesMatch = expectedBuf.length === sigBuf.length && timingSafeEqual(expectedBuf, sigBuf);
    
    if (!signaturesMatch) { res.status(400).json({ message: 'Payment signature verification failed' }); return; }

    let payment = await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`, 'GET', undefined, config.keyId, config.keySecret);
    
    if (payment.order_id !== orderId || Number(payment.amount) !== amount * 100) {
      res.status(400).json({ message: 'Payment amount or order mismatch' });
      return;
    }

    if (payment.status === 'authorized') {
      payment = await razorpayRequest(
        `/payments/${encodeURIComponent(paymentId)}/capture`,
        'POST',
        { amount: amount * 100, currency: 'INR' },
        config.keyId,
        config.keySecret
      );
    }

    if (payment.status !== 'captured') {
      res.status(400).json({ message: `Payment is in ${payment.status} state, not captured.` });
      return;
    }

    const razorpayOrder = await razorpayRequest(`/orders/${encodeURIComponent(orderId)}`, 'GET', undefined, config.keyId, config.keySecret);
    if (razorpayOrder.notes?.restaurantId !== restaurantId || String(razorpayOrder.notes?.planId || '').trim() !== planKey) {
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

    const subscription = await activateSubscription(restaurantId, planKey, paymentId, amount, days, status);
    
    res.json({ success: true, message: 'Payment verified. Your QR ordering is now active.', subscription });
  } catch (error) {
    console.error('verifyRazorpaySubscriptionPayment error:', error);
    res.status(502).json({ message: 'Payment verification failed. Please contact support if your account was charged.' });
  }
};