import { Request, Response } from 'express';
import { query } from '../lib/db';
import { AuthRequest } from '../middleware/auth.middleware';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';

// Public: Get platform public settings
export const getPublicSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT "platformName", "supportEmail", "supportPhone", "platformUrl", "currencySymbol", "defaultCurrency", "maintenanceMode", "maintenanceMessage", "autoApproveRestaurants", "freeTrialDays" FROM "SystemSettings" WHERE "id" = 'default' LIMIT 1;`
    );
    res.json({ settings: result.rows[0] || {} });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
};

// Super Admin: Get all system settings
export const getSuperAdminSettings = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT * FROM "SystemSettings" WHERE "id" = 'default' LIMIT 1;`
    );
    res.json({ settings: result.rows[0] || {} });
  } catch (error) {
    console.error('Error fetching super admin settings:', error);
    res.status(500).json({ message: 'Failed to fetch system settings' });
  }
};

// Super Admin: Update system settings
export const updateSuperAdminSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      platformName,
      supportEmail,
      supportPhone,
      platformUrl,
      currencySymbol,
      defaultCurrency,
      stripePublishableKey,
      stripeSecretKey,
      razorpayKeyId,
      razorpayKeySecret,
      defaultUpiId,
      paymentMode,
      maintenanceMode,
      maintenanceMessage,
      autoApproveRestaurants,
      freeTrialDays,
      enableCustomerFeedback,
      enableAudioAlerts,
    } = req.body;

    const result = await query(
      `
      UPDATE "SystemSettings"
      SET
        "platformName" = COALESCE($1, "platformName"),
        "supportEmail" = COALESCE($2, "supportEmail"),
        "supportPhone" = COALESCE($3, "supportPhone"),
        "platformUrl" = COALESCE($4, "platformUrl"),
        "currencySymbol" = COALESCE($5, "currencySymbol"),
        "defaultCurrency" = COALESCE($6, "defaultCurrency"),
        "stripePublishableKey" = COALESCE($7, "stripePublishableKey"),
        "stripeSecretKey" = COALESCE($8, "stripeSecretKey"),
        "razorpayKeyId" = COALESCE($9, "razorpayKeyId"),
        "razorpayKeySecret" = COALESCE($10, "razorpayKeySecret"),
        "defaultUpiId" = COALESCE($11, "defaultUpiId"),
        "paymentMode" = COALESCE($12, "paymentMode"),
        "maintenanceMode" = COALESCE($13, "maintenanceMode"),
        "maintenanceMessage" = COALESCE($14, "maintenanceMessage"),
        "autoApproveRestaurants" = COALESCE($15, "autoApproveRestaurants"),
        "freeTrialDays" = COALESCE($16, "freeTrialDays"),
        "enableCustomerFeedback" = COALESCE($17, "enableCustomerFeedback"),
        "enableAudioAlerts" = COALESCE($18, "enableAudioAlerts"),
        "updatedAt" = NOW()
      WHERE "id" = 'default'
      RETURNING *;
      `,
      [
        platformName !== undefined ? platformName : null,
        supportEmail !== undefined ? (supportEmail ? supportEmail.trim() : '') : null,
        supportPhone !== undefined ? (supportPhone ? supportPhone.trim() : '') : null,
        platformUrl !== undefined ? platformUrl : null,
        currencySymbol !== undefined ? currencySymbol : null,
        defaultCurrency !== undefined ? defaultCurrency : null,
        stripePublishableKey !== undefined ? stripePublishableKey : null,
        stripeSecretKey !== undefined ? stripeSecretKey : null,
        razorpayKeyId !== undefined ? razorpayKeyId : null,
        razorpayKeySecret !== undefined ? razorpayKeySecret : null,
        defaultUpiId !== undefined ? defaultUpiId : null,
        paymentMode !== undefined ? paymentMode : null,
        maintenanceMode !== undefined ? Boolean(maintenanceMode) : null,
        maintenanceMessage !== undefined ? maintenanceMessage : null,
        autoApproveRestaurants !== undefined ? Boolean(autoApproveRestaurants) : null,
        freeTrialDays !== undefined && freeTrialDays !== null ? parseInt(String(freeTrialDays)) : null,
        enableCustomerFeedback !== undefined ? Boolean(enableCustomerFeedback) : null,
        enableAudioAlerts !== undefined ? Boolean(enableAudioAlerts) : null,
      ]
    );

    res.json({
      settings: result.rows[0],
      message: 'System settings updated successfully!',
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({ message: 'Failed to update system settings' });
  }
};

// Super Admin: Change Super Admin Credentials
export const changeAdminCredentials = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || (req.user as any)?.userId;
    const { name, email, currentPassword, newPassword } = req.body;

    let targetUser = null;
    if (userId) {
      const userRes = await query(`SELECT * FROM "User" WHERE "id" = $1;`, [userId]);
      if (userRes.rows.length) targetUser = userRes.rows[0];
    }

    if (!targetUser) {
      const fallbackRes = await query(`SELECT * FROM "User" WHERE "role" = 'SUPER_ADMIN' LIMIT 1;`);
      if (fallbackRes.rows.length) targetUser = fallbackRes.rows[0];
    }

    if (!targetUser) {
      res.status(404).json({ message: 'Super admin user account not found.' });
      return;
    }

    // If changing password, verify current password
    let updatedHashedPassword = targetUser.password;
    if (newPassword && newPassword.trim()) {
      if (!currentPassword) {
        res.status(400).json({ message: 'Current password is required to set a new password.' });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, targetUser.password);
      if (!isMatch) {
        res.status(400).json({ message: 'Current password does not match.' });
        return;
      }

      if (newPassword.trim().length < 6) {
        res.status(400).json({ message: 'New password must be at least 6 characters long.' });
        return;
      }

      updatedHashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    }

    const cleanEmail = email ? email.trim().toLowerCase() : targetUser.email;
    const cleanName = name ? name.trim() : targetUser.name;

    const updatedUserRes = await query(
      `
      UPDATE "User"
      SET
        "name" = $1,
        "email" = $2,
        "password" = $3,
        "updatedAt" = NOW()
      WHERE "id" = $4
      RETURNING "id", "email", "name", "role", "restaurantId";
      `,
      [
        cleanName,
        cleanEmail,
        updatedHashedPassword,
        targetUser.id
      ]
    );

    const updatedUser = updatedUserRes.rows[0];
    
    // Generate fresh token
    const token = generateToken({
      id: updatedUser.id,
      role: updatedUser.role,
      restaurantId: updatedUser.restaurantId
    });

    res.json({
      user: updatedUser,
      token,
      message: 'Super Admin credentials updated successfully!',
    });
  } catch (error: any) {
    console.error('Error changing admin credentials:', error);
    if (error.code === '23505') {
      res.status(400).json({ message: 'This email is already in use by another account.' });
      return;
    }
    res.status(500).json({ message: 'Failed to update credentials' });
  }
};

// Super Admin: System Health & Diagnostics
export const getSystemHealth = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const startTime = Date.now();
    const dbPing = await query(`SELECT 1 as ping;`);
    const latencyMs = Date.now() - startTime;

    const [restaurantCount, userCount, orderCount, foodCount, adCount, planCount] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM "Restaurant";`),
      query(`SELECT COUNT(*) as count FROM "User";`),
      query(`SELECT COUNT(*) as count FROM "Order";`),
      query(`SELECT COUNT(*) as count FROM "FoodItem";`),
      query(`SELECT COUNT(*) as count FROM "Advertisement";`).catch(() => ({ rows: [{ count: 0 }] })),
      query(`SELECT COUNT(*) as count FROM "PricingPlan";`).catch(() => ({ rows: [{ count: 0 }] })),
    ]);

    const memoryUsage = process.memoryUsage();

    res.json({
      health: {
        status: 'HEALTHY',
        dbConnected: dbPing.rows.length > 0,
        latencyMs,
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
        memoryUsageMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        totalMemoryMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        counts: {
          restaurants: parseInt(restaurantCount.rows[0]?.count || '0'),
          users: parseInt(userCount.rows[0]?.count || '0'),
          orders: parseInt(orderCount.rows[0]?.count || '0'),
          foodItems: parseInt(foodCount.rows[0]?.count || '0'),
          advertisements: parseInt(adCount.rows[0]?.count || '0'),
          pricingPlans: parseInt(planCount.rows[0]?.count || '0'),
        }
      }
    });
  } catch (error) {
    console.error('Error getting system health:', error);
    res.status(500).json({ message: 'Failed to retrieve system health metrics' });
  }
};

// Super Admin: Export Database Backup JSON
export const exportSystemBackup = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [restaurants, users, categories, foods, plans, ads, settings] = await Promise.all([
      query(`SELECT id, slug, name, address, phone, "isActive", "createdAt" FROM "Restaurant";`),
      query(`SELECT id, email, name, role, "restaurantId", "createdAt" FROM "User";`),
      query(`SELECT * FROM "Category";`),
      query(`SELECT * FROM "FoodItem";`),
      query(`SELECT * FROM "PricingPlan";`).catch(() => ({ rows: [] })),
      query(`SELECT * FROM "Advertisement";`).catch(() => ({ rows: [] })),
      query(`SELECT * FROM "SystemSettings" WHERE "id" = 'default';`).catch(() => ({ rows: [] })),
    ]);

    const backupData = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      platform: 'OrderKare Multi-Tenant SaaS Platform',
      settings: settings.rows[0] || {},
      stats: {
        restaurantsCount: restaurants.rows.length,
        usersCount: users.rows.length,
        foodItemsCount: foods.rows.length,
        plansCount: plans.rows.length,
        adsCount: ads.rows.length,
      },
      data: {
        restaurants: restaurants.rows,
        users: users.rows,
        categories: categories.rows,
        foodItems: foods.rows,
        plans: plans.rows,
        advertisements: ads.rows,
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=orderkare_backup_${Date.now()}.json`);
    res.json(backupData);
  } catch (error) {
    console.error('Error exporting system backup:', error);
    res.status(500).json({ message: 'Failed to generate system backup' });
  }
};

// Super Admin: Purge test/demo orders safely
export const purgeTestOrders = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    await query(`
      DELETE FROM "OrderItem"
      WHERE "orderId" IN (
        SELECT id FROM "Order"
        WHERE "tableNumber" = '99' OR "customerName" ILIKE '%test%'
      );
    `);

    const deletedOrders = await query(`
      DELETE FROM "Order"
      WHERE "tableNumber" = '99' OR "customerName" ILIKE '%test%'
      RETURNING id;
    `);

    res.json({
      message: `Successfully purged ${deletedOrders.rows.length} test order(s).`,
      count: deletedOrders.rows.length
    });
  } catch (error) {
    console.error('Error purging test orders:', error);
    res.status(500).json({ message: 'Failed to purge test orders' });
  }
};
