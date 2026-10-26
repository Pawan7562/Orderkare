import { Request, Response } from 'express';
import { query } from '../lib/db';
import { AuthRequest } from '../middleware/auth.middleware';

// Initialize PricingPlan table in Neon DB
const initPlanTable = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS "PricingPlan" (
        "id" VARCHAR(255) PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT NOT NULL,
        "priceMonthly" DOUBLE PRECISION NOT NULL,
        "priceYearly" DOUBLE PRECISION NOT NULL,
        "maxItems" VARCHAR(255) NOT NULL DEFAULT 'Unlimited Items',
        "features" TEXT NOT NULL,
        "isPopular" BOOLEAN NOT NULL DEFAULT false,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "ctaText" VARCHAR(255) NOT NULL DEFAULT 'Start 14-Day Trial',
        "ctaLink" VARCHAR(255) NOT NULL DEFAULT '/register',
        "orderIndex" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Seed defaults if empty
    const countRes = await query(`SELECT COUNT(*) as count FROM "PricingPlan";`);
    if (countRes.rows[0]?.count === '0' || countRes.rows[0]?.count === 0) {
      const defaultFeaturesBasic = JSON.stringify(['1 Restaurant Location', 'Custom Table QR Generator', 'Customer Digital Menu & Ordering']);
      const defaultFeaturesPro = JSON.stringify(['Everything in Basic +', 'Unlimited Dishes & Categories', 'Real-Time Kitchen Audio Ringtone']);

      await query(`
        INSERT INTO "PricingPlan" 
        ("id", "name", "description", "priceMonthly", "priceYearly", "maxItems", "features", "isPopular", "isActive", "ctaText", "ctaLink", "orderIndex")
        VALUES 
        ('plan-starter', 'Starter Plan', 'Designed for standalone cafes.', 999, 9589, 'Up to 30 Items', $1, false, true, 'Start Free Trial', '/register', 1),
        ('plan-professional', 'Professional Plan', 'Ideal for bustling dine-in restaurants.', 1999, 19189, 'Unlimited Items', $2, true, true, 'Start 14-Day Free Trial', '/register', 2);
      `, [defaultFeaturesBasic, defaultFeaturesPro]);
    }
  } catch (err) {
    console.warn('PricingPlan table init warning:', err);
  }
};

void initPlanTable();

const formatPlan = (row: any) => {
  let parsedFeatures: string[] = [];
  try {
    parsedFeatures = typeof row.features === 'string' ? JSON.parse(row.features) : (row.features || []);
  } catch {
    parsedFeatures = typeof row.features === 'string' ? row.features.split(',').map((s: string) => s.trim()) : [];
  }
  return {
    ...row,
    features: parsedFeatures,
    priceMonthly: Number(row.priceMonthly),
    priceYearly: Number(row.priceYearly),
  };
};

// Public: Get active pricing plans for website
export const getActivePlans = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT * FROM "PricingPlan" WHERE "isActive" = true ORDER BY "orderIndex" ASC, "priceMonthly" ASC;`
    );
    res.json({ plans: result.rows.map(formatPlan) });
  } catch (error) {
    console.error('Error fetching active plans:', error);
    res.status(500).json({ message: 'Failed to fetch pricing plans' });
  }
};

// Super Admin: Get all plans
export const getAllPlans = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(`SELECT * FROM "PricingPlan" ORDER BY "orderIndex" ASC, "createdAt" ASC;`);
    res.json({ plans: result.rows.map(formatPlan) });
  } catch (error) {
    console.error('Error fetching all plans:', error);
    res.status(500).json({ message: 'Failed to fetch SaaS pricing plans' });
  }
};

// Super Admin: Create new Plan
export const createPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, priceMonthly, priceYearly, maxItems = 'Unlimited Items', features = [], isPopular = false, isActive = true, ctaText = 'Start Free Trial', ctaLink = '/register', orderIndex = 0 } = req.body;

    if (!name || priceMonthly === undefined || priceMonthly === null) {
      res.status(400).json({ message: 'Plan name and monthly price are required.' });
      return;
    }

    const id = `plan-${Date.now()}`;
    const featuresJson = JSON.stringify(Array.isArray(features) ? features : [features]);
    
    // FIX: Correct yearly calculation (12 months * 0.8 discount)
    const computedYearly = priceYearly !== undefined && priceYearly !== '' 
      ? Number(priceYearly) 
      : Math.round(Number(priceMonthly) * 12 * 0.8);

    const result = await query(
      `
      INSERT INTO "PricingPlan" 
      ("id", "name", "description", "priceMonthly", "priceYearly", "maxItems", "features", "isPopular", "isActive", "ctaText", "ctaLink", "orderIndex")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *;
      `,
      [id, name.trim(), (description || '').trim(), Number(priceMonthly), computedYearly, maxItems, featuresJson, Boolean(isPopular), Boolean(isActive), ctaText, ctaLink, Number(orderIndex) || 0]
    );

    res.status(201).json({ plan: formatPlan(result.rows[0]), message: 'Pricing plan created successfully.' });
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ message: 'Failed to create pricing plan' });
  }
};

// Super Admin: Update Plan
export const updatePlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id); // FIX: Cast to string for TS
    const { name, description, priceMonthly, priceYearly, maxItems, features, isPopular, isActive, ctaText, ctaLink, orderIndex } = req.body;

    const existing = await query(`SELECT * FROM "PricingPlan" WHERE "id" = $1;`, [id]);
    if (!existing.rows.length) {
      res.status(404).json({ message: 'Plan not found' });
      return;
    }

    const current = existing.rows[0];
    const updatedFeatures = features !== undefined ? JSON.stringify(Array.isArray(features) ? features : [features]) : current.features;

    const result = await query(
      `
      UPDATE "PricingPlan"
      SET 
        "name" = COALESCE($1, "name"),
        "description" = COALESCE($2, "description"),
        "priceMonthly" = COALESCE($3, "priceMonthly"),
        "priceYearly" = COALESCE($4, "priceYearly"),
        "maxItems" = COALESCE($5, "maxItems"),
        "features" = $6,
        "isPopular" = COALESCE($7, "isPopular"),
        "isActive" = COALESCE($8, "isActive"),
        "ctaText" = COALESCE($9, "ctaText"),
        "ctaLink" = COALESCE($10, "ctaLink"),
        "orderIndex" = COALESCE($11, "orderIndex"),
        "updatedAt" = NOW()
      WHERE "id" = $12 RETURNING *;
      `,
      [name ? name.trim() : null, description ? description.trim() : null, priceMonthly ? Number(priceMonthly) : null, priceYearly ? Number(priceYearly) : null, maxItems || null, updatedFeatures, isPopular !== undefined ? Boolean(isPopular) : null, isActive !== undefined ? Boolean(isActive) : null, ctaText || null, ctaLink || null, orderIndex !== undefined ? Number(orderIndex) : null, id]
    );

    res.json({ plan: formatPlan(result.rows[0]), message: 'Pricing plan updated successfully.' });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ message: 'Failed to update pricing plan' });
  }
};

// Super Admin: Delete Plan
export const deletePlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id); // FIX: Cast to string for TS
    await query(`DELETE FROM "PricingPlan" WHERE "id" = $1;`, [id]);
    res.json({ message: 'Pricing plan deleted successfully.' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ message: 'Failed to delete pricing plan' });
  }
};