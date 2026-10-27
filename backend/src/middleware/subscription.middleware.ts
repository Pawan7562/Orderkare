import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { query } from '../lib/db';

// Blocks every restaurant feature while the subscription is inactive (new restaurant that has not paid,
// trial finished, or plan expired). Use it on all restaurant routes EXCEPT login, /subscriptions and /plans.

type SubRow = { status: string | null; validUntil: string | Date | null; paid: boolean };

const CACHE_TTL_MS = 20 * 1000; // the orders page polls often, so keep the lookup cheap
const cache = new Map<string, { at: number; row: SubRow }>();

// Call this right after a payment activates a subscription so the unlock is instant
export const clearSubscriptionCache = (restaurantId?: string) => {
  if (restaurantId) cache.delete(restaurantId);
  else cache.clear();
};

const loadRow = async (restaurantId: string): Promise<SubRow> => {
  const hit = cache.get(restaurantId);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.row;

  const res = await query(
    `SELECT "status", "validUntil", "amountPaid", "paymentReference"
       FROM "Subscription" WHERE "restaurantId" = $1 LIMIT 1;`,
    [restaurantId]
  );
  const r = res.rows[0];
  const row: SubRow = r
    ? {
        status: r.status,
        validUntil: r.validUntil,
        paid: Number(r.amountPaid || 0) > 0 && String(r.paymentReference || '').trim() !== '',
      }
    : { status: null, validUntil: null, paid: false };

  cache.set(restaurantId, { at: Date.now(), row });
  return row;
};

export const isSubscriptionActive = (row: SubRow) =>
  row.paid &&
  (row.status === 'ACTIVE' || row.status === 'TRIAL') &&
  !!row.validUntil &&
  new Date(row.validUntil) > new Date();

export const requireActiveSubscription = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role === 'SUPER_ADMIN') {
      next();
      return;
    }

    const restaurantId = req.user?.restaurantId as string | undefined;
    if (!restaurantId) {
      res.status(403).json({ message: 'Restaurant context required' });
      return;
    }

    const row = await loadRow(restaurantId);
    if (!isSubscriptionActive(row)) {
      res.status(403).json({
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'Your subscription is inactive. Please activate or renew it to use this feature.',
      });
      return;
    }

    next();
  } catch (error) {
    console.error('requireActiveSubscription error:', error);
    res.status(500).json({ message: 'Unable to verify subscription' });
  }
};