import { Request, Response } from 'express';
import { query } from '../lib/db';
import { AuthRequest } from '../middleware/auth.middleware';

// Initialize Advertisement table in Neon DB
const initAdTable = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS "Advertisement" (
        "id" VARCHAR(255) PRIMARY KEY,
        "sponsor" VARCHAR(255) NOT NULL,
        "badge" VARCHAR(255) NOT NULL DEFAULT 'Sponsored Partner',
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT NOT NULL,
        "discountText" VARCHAR(255) NOT NULL,
        "promoCode" VARCHAR(255),
        "imageUrl" TEXT NOT NULL,
        "ctaText" VARCHAR(255) NOT NULL DEFAULT 'Claim Offer',
        "ctaLink" TEXT,
        "bgGradient" VARCHAR(255) NOT NULL DEFAULT 'from-red-950/90 via-slate-900 to-slate-950',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "orderIndex" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Check if initial ads exist, if empty, seed default campaigns
    const countRes = await query(`SELECT COUNT(*) as count FROM "Advertisement";`);
    if (countRes.rows[0]?.count === '0' || countRes.rows[0]?.count === 0) {
      await query(`
        INSERT INTO "Advertisement" 
        ("id", "sponsor", "badge", "title", "description", "discountText", "promoCode", "imageUrl", "ctaText", "bgGradient", "isActive", "orderIndex")
        VALUES 
        (
          'ad-coke-1', 
          'Coca-Cola Zero Sugar', 
          'Sponsored Partner', 
          'Pair Any Main Course with Chilled Coke', 
          'Get crisp zero-sugar refreshment. Add to cart & enjoy direct pairing combo.', 
          'Flat ₹50 OFF with Combo', 
          'COKEZERO', 
          'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=600&q=80', 
          'Claim Offer', 
          'from-red-950/90 via-slate-900 to-slate-950', 
          true, 
          1
        ),
        (
          'ad-dessert-2', 
          'Artisan Gelato & Bakery', 
          'Chef Special Offer', 
          'Warm Belgian Truffle Waffle', 
          'Fresh Belgian waffle topped with Madagascar vanilla bean gelato & melted dark chocolate.', 
          'Complimentary on ₹999+ Orders', 
          'SWEETTREAT', 
          'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80', 
          'View Dessert', 
          'from-amber-950/90 via-slate-900 to-slate-950', 
          true, 
          2
        ),
        (
          'ad-upi-3', 
          'Instant UPI Dining Pay', 
          'Bank Partner Offer', 
          'Pay with Any UPI App & Earn Instant Cashback', 
          'Scan & settle table bill with Google Pay, PhonePe, or Paytm for up to ₹100 scratch card.', 
          'Instant ₹100 Cashback', 
          'UPIDINE', 
          'https://images.unsplash.com/photo-1556742049-0a67e5572293?auto=format&fit=crop&w=600&q=80', 
          'Learn More', 
          'from-emerald-950/90 via-slate-900 to-slate-950', 
          true, 
          3
        );
      `);
    }
  } catch (err) {
    console.warn('Advertisement table init warning:', err);
  }
};

void initAdTable();

// Public: Get only active ads for customer menu
export const getActiveAds = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT * FROM "Advertisement" WHERE "isActive" = true ORDER BY "orderIndex" ASC, "createdAt" DESC;`
    );
    res.json({ ads: result.rows });
  } catch (error) {
    console.error('Error fetching active ads:', error);
    res.status(500).json({ message: 'Failed to fetch advertisements' });
  }
};

// Super Admin: Get all ads (active and inactive)
export const getAllAds = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT * FROM "Advertisement" ORDER BY "orderIndex" ASC, "createdAt" DESC;`
    );
    res.json({ ads: result.rows });
  } catch (error) {
    console.error('Error fetching all ads:', error);
    res.status(500).json({ message: 'Failed to fetch advertisements' });
  }
};

// Super Admin: Create new ad
export const createAd = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      sponsor,
      badge,
      title,
      description,
      discountText,
      promoCode,
      imageUrl,
      ctaText,
      ctaLink,
      bgGradient,
      isActive,
      orderIndex
    } = req.body;

    if (!sponsor || !title || !description || !discountText || !imageUrl) {
      res.status(400).json({ message: 'Sponsor, Title, Description, Discount Text, and Image URL are required' });
      return;
    }

    const id = 'ad-' + Math.random().toString(36).substring(2, 9);

    const result = await query(
      `INSERT INTO "Advertisement" (
        "id", "sponsor", "badge", "title", "description", "discountText",
        "promoCode", "imageUrl", "ctaText", "ctaLink", "bgGradient", "isActive", "orderIndex"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;`,
      [
        id,
        sponsor.trim(),
        badge?.trim() || 'Sponsored Partner',
        title.trim(),
        description.trim(),
        discountText.trim(),
        promoCode ? promoCode.trim().toUpperCase() : null,
        imageUrl.trim(),
        ctaText?.trim() || 'Claim Offer',
        ctaLink?.trim() || null,
        bgGradient || 'from-red-950/90 via-slate-900 to-slate-950',
        isActive !== undefined ? Boolean(isActive) : true,
        orderIndex ? Number(orderIndex) : 0
      ]
    );

    res.status(201).json({ message: 'Advertisement created successfully', ad: result.rows[0] });
  } catch (error) {
    console.error('Error creating ad:', error);
    res.status(500).json({ message: 'Failed to create advertisement' });
  }
};

// Super Admin: Update ad or toggle active status
export const updateAd = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      sponsor,
      badge,
      title,
      description,
      discountText,
      promoCode,
      imageUrl,
      ctaText,
      ctaLink,
      bgGradient,
      isActive,
      orderIndex
    } = req.body;

    const existing = await query(`SELECT * FROM "Advertisement" WHERE "id" = $1;`, [id]);
    if (!existing.rows || existing.rows.length === 0) {
      res.status(404).json({ message: 'Advertisement not found' });
      return;
    }

    const current = existing.rows[0];

    const result = await query(
      `UPDATE "Advertisement" SET
        "sponsor" = $1,
        "badge" = $2,
        "title" = $3,
        "description" = $4,
        "discountText" = $5,
        "promoCode" = $6,
        "imageUrl" = $7,
        "ctaText" = $8,
        "ctaLink" = $9,
        "bgGradient" = $10,
        "isActive" = $11,
        "orderIndex" = $12,
        "updatedAt" = NOW()
      WHERE "id" = $13
      RETURNING *;`,
      [
        sponsor !== undefined ? sponsor.trim() : current.sponsor,
        badge !== undefined ? badge.trim() : current.badge,
        title !== undefined ? title.trim() : current.title,
        description !== undefined ? description.trim() : current.description,
        discountText !== undefined ? discountText.trim() : current.discountText,
        promoCode !== undefined ? (promoCode ? promoCode.trim().toUpperCase() : null) : current.promoCode,
        imageUrl !== undefined ? imageUrl.trim() : current.imageUrl,
        ctaText !== undefined ? ctaText.trim() : current.ctaText,
        ctaLink !== undefined ? (ctaLink ? ctaLink.trim() : null) : current.ctaLink,
        bgGradient !== undefined ? bgGradient : current.bgGradient,
        isActive !== undefined ? Boolean(isActive) : current.isActive,
        orderIndex !== undefined ? Number(orderIndex) : current.orderIndex,
        id
      ]
    );

    res.json({ message: 'Advertisement updated successfully', ad: result.rows[0] });
  } catch (error) {
    console.error('Error updating ad:', error);
    res.status(500).json({ message: 'Failed to update advertisement' });
  }
};

// Super Admin: Delete ad
export const deleteAd = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM "Advertisement" WHERE "id" = $1 RETURNING *;`, [id]);

    if (!result.rows || result.rows.length === 0) {
      res.status(404).json({ message: 'Advertisement not found' });
      return;
    }

    res.json({ message: 'Advertisement removed successfully' });
  } catch (error) {
    console.error('Error deleting ad:', error);
    res.status(500).json({ message: 'Failed to delete advertisement' });
  }
};
