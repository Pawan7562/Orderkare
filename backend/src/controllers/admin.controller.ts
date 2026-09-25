import { Request, Response } from 'express';
import { query } from '../lib/db';
import { AuthRequest } from '../middleware/auth.middleware';

// ── Ensure AdminNotification table exists ────────────────────────────
const ensureNotificationTable = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS "AdminNotification" (
        "id" TEXT PRIMARY KEY,
        "type" TEXT NOT NULL DEFAULT 'SUBSCRIPTION',
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "restaurantId" TEXT,
        "restaurantName" TEXT,
        "amount" DOUBLE PRECISION DEFAULT 0,
        "planName" TEXT,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});
  } catch { /* already exists */ }
};

void ensureNotificationTable();

// ── Helper: create a notification record ─────────────────────────────
export const createAdminNotification = async (data: {
  type: string;
  title: string;
  message: string;
  restaurantId?: string;
  restaurantName?: string;
  amount?: number;
  planName?: string;
}) => {
  const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await query(
    `INSERT INTO "AdminNotification" ("id","type","title","message","restaurantId","restaurantName","amount","planName")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8);`,
    [id, data.type, data.title, data.message, data.restaurantId || null, data.restaurantName || null, data.amount || 0, data.planName || null]
  ).catch(() => {});
  return { id, ...data, isRead: false, createdAt: new Date().toISOString() };
};

// ═══════════════════════════════════════════════════════════════════════
//  GET /admin/stats — real platform-wide KPIs
// ═══════════════════════════════════════════════════════════════════════
export const getAdminStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalHotelsRes,
      activeSubsRes,
      revenueRes,
      totalOrdersRes,
      newThisMonthRes,
      expiredSubsRes,
      activeHotelsRes,
      inactiveHotelsRes,
      pendingHotelsRes,
    ] = await Promise.all([
      // Total registered restaurants
      query(`SELECT COUNT(*) as count FROM "Restaurant";`),
      // Active subscriptions (validUntil in future & real payment)
      query(`
        SELECT COUNT(*) as count FROM "Subscription"
        WHERE "status" IN ('ACTIVE','TRIAL')
          AND "validUntil" > NOW()
          AND "amountPaid" > 0
          AND "paymentReference" IS NOT NULL
          AND "paymentReference" != '';
      `),
      // Real revenue from verified payments
      query(`
        SELECT COALESCE(SUM("amountPaid"), 0) as total FROM "Subscription"
        WHERE "amountPaid" > 0
          AND "paymentReference" IS NOT NULL
          AND "paymentReference" != '';
      `),
      // Total orders in DB
      query(`SELECT COUNT(*) as count FROM "Order";`),
      // New hotel registrations this month
      query(`SELECT COUNT(*) as count FROM "Restaurant" WHERE "createdAt" >= date_trunc('month', CURRENT_DATE);`),
      // Expired subscriptions
      query(`
        SELECT COUNT(*) as count FROM "Subscription"
        WHERE ("status" = 'EXPIRED' OR ("validUntil" IS NOT NULL AND "validUntil" <= NOW()))
          AND "amountPaid" > 0;
      `),
      // Genuinely active hotels (hotel isActive true + valid active/trial subscription)
      query(`
        SELECT COUNT(*) as count FROM "Restaurant" r
        JOIN "Subscription" s ON s."restaurantId" = r."id"
        WHERE r."isActive" = true
          AND s."validUntil" > NOW()
          AND s."status" IN ('ACTIVE','TRIAL')
          AND s."amountPaid" > 0
          AND s."paymentReference" IS NOT NULL
          AND s."paymentReference" != '';
      `),
      // Inactive/Suspended hotels
      query(`
        SELECT COUNT(*) as count FROM "Restaurant" r
        LEFT JOIN "Subscription" s ON s."restaurantId" = r."id"
        WHERE r."isActive" = false
           OR (s."validUntil" IS NOT NULL AND s."validUntil" <= NOW() AND s."amountPaid" > 0);
      `),
      // Pending hotels (newly registered, awaiting initial payment)
      query(`
        SELECT COUNT(*) as count FROM "Restaurant" r
        LEFT JOIN "Subscription" s ON s."restaurantId" = r."id"
        WHERE s."id" IS NULL
           OR s."amountPaid" = 0
           OR s."paymentReference" IS NULL
           OR s."paymentReference" = ''
           OR s."status" = 'PENDING';
      `),
    ]);

    const totalHotels = parseInt(totalHotelsRes.rows[0]?.count || '0');
    const activeHotels = parseInt(activeHotelsRes.rows[0]?.count || '0');
    const inactiveHotels = parseInt(inactiveHotelsRes.rows[0]?.count || '0');
    const pendingHotels = parseInt(pendingHotelsRes.rows[0]?.pendingHotels || totalHotels - activeHotels - inactiveHotels);

    res.json({
      stats: {
        totalHotels,
        activeHotels,
        inactiveHotels,
        pendingHotels: Math.max(0, pendingHotels),
        activeSubscriptions: parseInt(activeSubsRes.rows[0]?.count || '0'),
        totalRevenue: parseFloat(revenueRes.rows[0]?.total || '0'),
        totalOrders: parseInt(totalOrdersRes.rows[0]?.count || '0'),
        newThisMonth: parseInt(newThisMonthRes.rows[0]?.count || '0'),
        expiredSubscriptions: parseInt(expiredSubsRes.rows[0]?.count || '0'),
      },
    });
  } catch (error) {
    console.error('getAdminStats error:', error);
    res.status(500).json({ message: 'Failed to fetch platform stats' });
  }
};

// ═══════════════════════════════════════════════════════════════════════
//  GET /admin/hotels — real hotel directory with admin details + orders
// ═══════════════════════════════════════════════════════════════════════
export const getAdminHotels = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(`
      SELECT
        r."id",
        r."name",
        r."slug",
        r."address",
        r."phone",
        r."isActive",
        r."subscriptionStatus",
        r."createdAt",
        u."name"  AS "adminName",
        u."email" AS "adminEmail",
        s."status" AS "subStatus",
        s."planName",
        s."amountPaid",
        s."validUntil",
        s."paymentReference",
        COALESCE(o."orderCount", 0) AS "ordersCount",
        COALESCE(o."totalRevenue", 0) AS "totalRevenue"
      FROM "Restaurant" r
      LEFT JOIN "User" u ON u."restaurantId" = r."id" AND u."role" = 'RESTAURANT_ADMIN'
      LEFT JOIN "Subscription" s ON s."restaurantId" = r."id"
      LEFT JOIN (
        SELECT "restaurantId",
               COUNT(*) AS "orderCount",
               COALESCE(SUM("totalAmount"), 0) AS "totalRevenue"
        FROM "Order"
        GROUP BY "restaurantId"
      ) o ON o."restaurantId" = r."id"
      ORDER BY r."createdAt" DESC;
    `);

    const hotels = result.rows.map((row: any) => {
      const now = new Date();
      const validUntil = row.validUntil ? new Date(row.validUntil) : null;
      const hasPaid = Boolean(
        Number(row.amountPaid || 0) > 0 &&
        row.paymentReference &&
        String(row.paymentReference).trim() !== ''
      );

      let status = 'PENDING';
      let qrAllowed = false;

      if (hasPaid && validUntil) {
        if (validUntil > now) {
          status = row.subStatus === 'TRIAL' || row.amountPaid === 1 ? 'TRIAL' : 'ACTIVE';
          qrAllowed = Boolean(row.isActive);
        } else {
          status = 'EXPIRED';
          qrAllowed = false;
        }
      } else {
        status = 'PENDING';
        qrAllowed = false;
      }

      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        address: row.address || '',
        phone: row.phone || '',
        adminName: row.adminName || 'Admin',
        adminEmail: row.adminEmail || 'N/A',
        isActive: Boolean(row.isActive),
        qrAllowed,
        plan: hasPaid ? row.planName || 'NONE' : 'UNPAID',
        ordersCount: parseInt(row.ordersCount || '0'),
        revenue: parseFloat(row.totalRevenue || '0'),
        status,
        amountPaid: parseFloat(row.amountPaid || '0'),
        validUntil: row.validUntil,
        paymentReference: row.paymentReference || '',
        joinedDate: row.createdAt,
      };
    });

    res.json({ hotels });
  } catch (error) {
    console.error('getAdminHotels error:', error);
    res.status(500).json({ message: 'Failed to fetch hotel directory' });
  }
};

// ═══════════════════════════════════════════════════════════════════════
//  GET /admin/subscriptions — all subscription records with restaurant
// ═══════════════════════════════════════════════════════════════════════
export const getAdminSubscriptions = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(`
      SELECT
        s."id",
        s."status",
        s."planName",
        s."amountPaid",
        s."paymentReference",
        s."validUntil",
        s."createdAt",
        s."updatedAt",
        r."name" AS "restaurantName",
        r."slug" AS "restaurantSlug",
        r."id"   AS "restaurantId"
      FROM "Subscription" s
      JOIN "Restaurant" r ON r."id" = s."restaurantId"
      ORDER BY s."updatedAt" DESC;
    `);

    // Compute summary stats from real data
    const now = new Date();
    let activeCount = 0;
    let trialCount = 0;
    let expiredCount = 0;
    let pendingCount = 0;
    let totalMrr = 0;

    const subscriptions = result.rows.map((row: any) => {
      const validUntil = row.validUntil ? new Date(row.validUntil) : null;
      const hasPaid = Boolean(
        Number(row.amountPaid || 0) > 0 &&
        row.paymentReference &&
        String(row.paymentReference).trim() !== ''
      );

      let computedStatus = 'PENDING';
      if (hasPaid && validUntil) {
        if (validUntil > now) {
          computedStatus = row.status === 'TRIAL' || row.amountPaid === 1 ? 'TRIAL' : 'ACTIVE';
        } else {
          computedStatus = 'EXPIRED';
        }
      } else {
        computedStatus = 'PENDING';
      }

      if (computedStatus === 'ACTIVE') {
        activeCount++;
        totalMrr += parseFloat(row.amountPaid || '0');
      } else if (computedStatus === 'TRIAL') {
        trialCount++;
        totalMrr += parseFloat(row.amountPaid || '0');
      } else if (computedStatus === 'EXPIRED') {
        expiredCount++;
      } else {
        pendingCount++;
      }

      return {
        id: row.id,
        restaurantName: row.restaurantName,
        restaurantSlug: row.restaurantSlug,
        restaurantId: row.restaurantId,
        plan: hasPaid ? row.planName : 'UNPAID',
        amount: parseFloat(row.amountPaid || '0'),
        status: computedStatus,
        paymentReference: row.paymentReference || '',
        validUntil: row.validUntil,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    });

    res.json({
      subscriptions,
      summary: { activeCount, trialCount, expiredCount, pendingCount, totalMrr },
    });
  } catch (error) {
    console.error('getAdminSubscriptions error:', error);
    res.status(500).json({ message: 'Failed to fetch subscriptions' });
  }
};

// ═══════════════════════════════════════════════════════════════════════
//  GET /admin/analytics — comprehensive real platform analytics
// ═══════════════════════════════════════════════════════════════════════
export const getAdminAnalytics = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      subRevenueRes,
      orderGmvRes,
      orderStatsRes,
      hotelCountsRes,
      planBreakdownRes,
      activeSubsRes,
      monthlySubRevenueRes,
      monthlyOrderRevenueRes,
      monthlyRegistrationsRes,
      topVenuesRes,
      recentTransactionsRes,
    ] = await Promise.all([
      // 1. Subscription revenue & transaction count
      query(`
        SELECT
          COALESCE(SUM(CASE WHEN "amountPaid" > 0 AND "paymentReference" IS NOT NULL AND "paymentReference" != '' THEN "amountPaid" ELSE 0 END), 0) AS "totalSubRevenue",
          COUNT(*) AS "subTxCount",
          COUNT(CASE WHEN "amountPaid" > 0 AND "paymentReference" IS NOT NULL AND "paymentReference" != '' THEN 1 END) AS "successfulSubTx",
          COUNT(CASE WHEN "amountPaid" = 0 OR "paymentReference" IS NULL OR "paymentReference" = '' THEN 1 END) AS "pendingSubTx"
        FROM "Subscription";
      `),
      // 2. Order GMV & transaction count
      query(`
        SELECT
          COALESCE(SUM("totalAmount"), 0) AS "totalOrderGmv",
          COUNT(*) AS "totalOrders",
          COALESCE(AVG("totalAmount"), 0) AS "avgTicketSize",
          COUNT(CASE WHEN "status" IN ('COMPLETED', 'SERVED', 'READY', 'PREPARING', 'ACCEPTED') THEN 1 END) AS "successfulOrders",
          COUNT(CASE WHEN "status" = 'REJECTED' THEN 1 END) AS "rejectedOrders",
          COUNT(CASE WHEN "status" = 'PENDING' THEN 1 END) AS "pendingOrders"
        FROM "Order";
      `),
      // 3. QR & Hotel status metrics
      query(`
        SELECT
          COUNT(*) AS "totalHotels",
          COUNT(CASE WHEN "createdAt" >= date_trunc('month', CURRENT_DATE) THEN 1 END) AS "newThisMonth",
          COUNT(CASE WHEN "createdAt" >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) AS "newThisWeek",
          COUNT(CASE WHEN "createdAt" >= CURRENT_DATE THEN 1 END) AS "newToday"
        FROM "Restaurant";
      `),
      // 4. QR Active vs Inactive counts based on subscription validity and isActive flag
      query(`
        SELECT
          COUNT(CASE WHEN r."isActive" = true AND s."validUntil" > NOW() AND s."status" IN ('ACTIVE','TRIAL') AND s."amountPaid" > 0 AND s."paymentReference" IS NOT NULL AND s."paymentReference" != '' THEN 1 END) AS "activeQrCount",
          COUNT(CASE WHEN r."isActive" = false OR s."validUntil" IS NULL OR s."validUntil" <= NOW() OR s."status" = 'EXPIRED' OR s."amountPaid" = 0 OR s."paymentReference" IS NULL OR s."paymentReference" = '' THEN 1 END) AS "inactiveQrCount"
        FROM "Restaurant" r
        LEFT JOIN "Subscription" s ON s."restaurantId" = r."id";
      `),
      // 5. Subscription Plan breakdown (only verified paid plans)
      query(`
        SELECT
          "planName",
          COUNT(*) AS "count",
          COALESCE(SUM("amountPaid"), 0) AS "revenue"
        FROM "Subscription"
        WHERE "amountPaid" > 0 AND "paymentReference" IS NOT NULL AND "paymentReference" != ''
        GROUP BY "planName";
      `),
      // 6. Active vs Trial vs Expired vs Pending subscriptions
      query(`
        SELECT
          COUNT(CASE WHEN "status" = 'ACTIVE' AND "validUntil" > NOW() AND "amountPaid" > 0 AND "paymentReference" IS NOT NULL AND "paymentReference" != '' THEN 1 END) AS "activeCount",
          COUNT(CASE WHEN "status" = 'TRIAL' AND "validUntil" > NOW() AND "amountPaid" > 0 AND "paymentReference" IS NOT NULL AND "paymentReference" != '' THEN 1 END) AS "trialCount",
          COUNT(CASE WHEN ("status" = 'EXPIRED' OR ("validUntil" IS NOT NULL AND "validUntil" <= NOW())) AND "amountPaid" > 0 AND "paymentReference" IS NOT NULL AND "paymentReference" != '' THEN 1 END) AS "expiredCount",
          COUNT(CASE WHEN "status" = 'PENDING' OR "amountPaid" = 0 OR "paymentReference" IS NULL OR "paymentReference" = '' THEN 1 END) AS "pendingCount"
        FROM "Subscription";
      `),
      // 7. Monthly Subscription Revenue trend (last 12 months)
      query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') AS "monthLabel",
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') AS "month",
          DATE_TRUNC('month', "createdAt") AS "monthDate",
          COALESCE(SUM("amountPaid"), 0) AS "revenue",
          COUNT(*) AS "count"
        FROM "Subscription"
        WHERE "createdAt" >= NOW() - INTERVAL '12 months'
          AND "amountPaid" > 0
          AND "paymentReference" IS NOT NULL
          AND "paymentReference" != ''
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt") ASC;
      `),
      // 8. Monthly Order Volume & GMV trend (last 12 months)
      query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') AS "monthLabel",
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') AS "month",
          DATE_TRUNC('month', "createdAt") AS "monthDate",
          COALESCE(SUM("totalAmount"), 0) AS "gmv",
          COUNT(*) AS "orderCount"
        FROM "Order"
        WHERE "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt") ASC;
      `),
      // 9. Monthly Hotel Registrations trend (last 12 months)
      query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') AS "monthLabel",
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') AS "month",
          DATE_TRUNC('month', "createdAt") AS "monthDate",
          COUNT(*) AS "hotelCount"
        FROM "Restaurant"
        WHERE "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt") ASC;
      `),
      // 10. Top performing venues
      query(`
        SELECT
          r."id",
          r."name",
          r."slug",
          r."address" AS "city",
          r."isActive",
          s."planName",
          s."status" AS "subStatus",
          COUNT(o."id") AS "orders",
          COALESCE(SUM(o."totalAmount"), 0) AS "revenue"
        FROM "Restaurant" r
        LEFT JOIN "Subscription" s ON s."restaurantId" = r."id"
        LEFT JOIN "Order" o ON o."restaurantId" = r."id"
        GROUP BY r."id", r."name", r."slug", r."address", r."isActive", s."planName", s."status"
        ORDER BY "revenue" DESC, "orders" DESC
        LIMIT 10;
      `),
      // 11. Recent 15 transactions (Subscriptions with payment reference)
      query(`
        SELECT
          s."id",
          s."planName",
          s."amountPaid",
          s."paymentReference",
          s."status",
          s."createdAt",
          r."name" AS "restaurantName",
          r."slug" AS "restaurantSlug"
        FROM "Subscription" s
        JOIN "Restaurant" r ON r."id" = s."restaurantId"
        WHERE s."paymentReference" IS NOT NULL AND s."paymentReference" != ''
        ORDER BY s."updatedAt" DESC
        LIMIT 15;
      `),
    ]);

    // Parse Subscription breakdown
    const planMap: Record<string, { count: number; revenue: number }> = {
      FIRST_TIME_ACTIVATION: { count: 0, revenue: 0 },
      MONTHLY: { count: 0, revenue: 0 },
      SIX_MONTHS: { count: 0, revenue: 0 },
      ANNUAL: { count: 0, revenue: 0 },
    };

    let otherPlansCount = 0;
    let otherPlansRevenue = 0;

    planBreakdownRes.rows.forEach((row: any) => {
      const plan = String(row.planName || '').toUpperCase().trim();
      const count = parseInt(row.count || '0');
      const rev = parseFloat(row.revenue || '0');

      if (planMap[plan]) {
        planMap[plan].count += count;
        planMap[plan].revenue += rev;
      } else {
        otherPlansCount += count;
        otherPlansRevenue += rev;
      }
    });

    const totalSubRevenue = parseFloat(subRevenueRes.rows[0]?.totalSubRevenue || '0');
    const totalOrderGmv = parseFloat(orderGmvRes.rows[0]?.totalOrderGmv || '0');
    const totalOrders = parseInt(orderGmvRes.rows[0]?.totalOrders || '0');
    const successfulOrders = parseInt(orderGmvRes.rows[0]?.successfulOrders || '0');
    const rejectedOrders = parseInt(orderGmvRes.rows[0]?.rejectedOrders || '0');
    const pendingOrders = parseInt(orderGmvRes.rows[0]?.pendingOrders || '0');
    const subTxCount = parseInt(subRevenueRes.rows[0]?.subTxCount || '0');
    const successfulSubTx = parseInt(subRevenueRes.rows[0]?.successfulSubTx || '0');
    const pendingSubTx = parseInt(subRevenueRes.rows[0]?.pendingSubTx || '0');

    const totalTransactions = subTxCount + totalOrders;
    const successfulPayments = successfulSubTx + successfulOrders;
    const failedPayments = rejectedOrders;

    const totalHotels = parseInt(hotelCountsRes.rows[0]?.totalHotels || '0');
    const activeQrCount = parseInt(activeSubsRes.rows[0]?.activeQrCount || '0');
    const inactiveQrCount = parseInt(activeSubsRes.rows[0]?.inactiveQrCount || totalHotels - activeQrCount);
    const qrActivationRate = totalHotels > 0 ? Math.round((activeQrCount / totalHotels) * 100) : 0;

    const topVenues = topVenuesRes.rows.map((v: any) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      city: v.city || 'N/A',
      plan: v.planName || 'NONE',
      subStatus: v.subStatus || 'PENDING',
      isActive: Boolean(v.isActive),
      orders: parseInt(v.orders || '0'),
      revenue: parseFloat(v.revenue || '0'),
    }));

    const recentTransactions = recentTransactionsRes.rows.map((t: any) => ({
      id: t.id,
      restaurantName: t.restaurantName,
      restaurantSlug: t.restaurantSlug,
      planName: t.planName,
      amount: parseFloat(t.amountPaid || '0'),
      paymentReference: t.paymentReference || 'N/A',
      status: t.status,
      createdAt: t.createdAt,
    }));

    // Merge monthly timeline trends
    const monthSet = new Map<string, { month: string; monthLabel: string; subRevenue: number; orderGmv: number; orders: number; registrations: number }>();

    monthlySubRevenueRes.rows.forEach((r: any) => {
      const key = r.monthLabel;
      if (!monthSet.has(key)) {
        monthSet.set(key, { month: r.month, monthLabel: r.monthLabel, subRevenue: 0, orderGmv: 0, orders: 0, registrations: 0 });
      }
      monthSet.get(key)!.subRevenue += parseFloat(r.revenue || '0');
    });

    monthlyOrderRevenueRes.rows.forEach((r: any) => {
      const key = r.monthLabel;
      if (!monthSet.has(key)) {
        monthSet.set(key, { month: r.month, monthLabel: r.monthLabel, subRevenue: 0, orderGmv: 0, orders: 0, registrations: 0 });
      }
      monthSet.get(key)!.orderGmv += parseFloat(r.gmv || '0');
      monthSet.get(key)!.orders += parseInt(r.orderCount || '0');
    });

    monthlyRegistrationsRes.rows.forEach((r: any) => {
      const key = r.monthLabel;
      if (!monthSet.has(key)) {
        monthSet.set(key, { month: r.month, monthLabel: r.monthLabel, subRevenue: 0, orderGmv: 0, orders: 0, registrations: 0 });
      }
      monthSet.get(key)!.registrations += parseInt(r.hotelCount || '0');
    });

    const monthlyTrends = Array.from(monthSet.values());

    res.json({
      analytics: {
        revenue: {
          totalSubscriptionRevenue: totalSubRevenue,
          totalOrderGMV: totalOrderGmv,
          grossPlatformRevenue: totalSubRevenue + totalOrderGmv,
          avgTicketSize: Math.round(parseFloat(orderStatsRes.rows[0]?.avgTicketSize || '0')),
        },
        transactions: {
          totalTransactions,
          successfulPayments,
          failedPayments,
          pendingPayments: pendingOrders + pendingSubTx,
          successfulSubCount: successfulSubTx,
          successfulOrderCount: successfulOrders,
        },
        subscriptions: {
          activeCount: parseInt(activeSubsRes.rows[0]?.activeCount || '0'),
          trialCount: parseInt(activeSubsRes.rows[0]?.trialCount || '0'),
          expiredCount: parseInt(activeSubsRes.rows[0]?.expiredCount || '0'),
          pendingCount: parseInt(activeSubsRes.rows[0]?.pendingCount || '0'),
          plans: {
            firstTime: planMap.FIRST_TIME_ACTIVATION,
            monthly: planMap.MONTHLY,
            sixMonths: planMap.SIX_MONTHS,
            annual: planMap.ANNUAL,
            other: { count: otherPlansCount, revenue: otherPlansRevenue },
          },
        },
        qrStats: {
          totalHotels,
          activeQrCount,
          inactiveQrCount,
          activationRate: qrActivationRate,
          newThisMonth: parseInt(hotelCountsRes.rows[0]?.newThisMonth || '0'),
          newThisWeek: parseInt(hotelCountsRes.rows[0]?.newThisWeek || '0'),
          newToday: parseInt(hotelCountsRes.rows[0]?.newToday || '0'),
        },
        monthlyTrends,
        topVenues,
        recentTransactions,
      },
    });
  } catch (error) {
    console.error('getAdminAnalytics error:', error);
    res.status(500).json({ message: 'Failed to fetch comprehensive platform analytics' });
  }
};

// ═══════════════════════════════════════════════════════════════════════
//  GET /admin/notifications — recent admin notifications
// ═══════════════════════════════════════════════════════════════════════
export const getAdminNotifications = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    await ensureNotificationTable();
    const result = await query(
      `SELECT * FROM "AdminNotification" ORDER BY "createdAt" DESC LIMIT 50;`
    );
    const unreadCount = result.rows.filter((r: any) => !r.isRead).length;
    res.json({ notifications: result.rows, unreadCount });
  } catch (error) {
    console.error('getAdminNotifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// ═══════════════════════════════════════════════════════════════════════
//  POST /admin/notifications/:id/read — mark notification as read
// ═══════════════════════════════════════════════════════════════════════
export const markNotificationRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await query(`UPDATE "AdminNotification" SET "isRead" = true WHERE "id" = $1;`, [id]);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('markNotificationRead error:', error);
    res.status(500).json({ message: 'Failed to update notification' });
  }
};

// ═══════════════════════════════════════════════════════════════════════
//  POST /admin/notifications/read-all — mark all notifications read
// ═══════════════════════════════════════════════════════════════════════
export const markAllNotificationsRead = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    await query(`UPDATE "AdminNotification" SET "isRead" = true WHERE "isRead" = false;`);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('markAllNotificationsRead error:', error);
    res.status(500).json({ message: 'Failed to update notifications' });
  }
};

// ═══════════════════════════════════════════════════════════════════════
//  PUT /admin/hotels/:id/toggle — toggle hotel active status
// ═══════════════════════════════════════════════════════════════════════
export const toggleHotelStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE "Restaurant" SET "isActive" = NOT "isActive", "updatedAt" = NOW() WHERE "id" = $1 RETURNING "id", "name", "isActive";`,
      [id]
    );
    if (!result.rows.length) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }
    res.json({ restaurant: result.rows[0], message: `Restaurant ${result.rows[0].isActive ? 'activated' : 'suspended'} successfully` });
  } catch (error) {
    console.error('toggleHotelStatus error:', error);
    res.status(500).json({ message: 'Failed to toggle hotel status' });
  }
};

// ═══════════════════════════════════════════════════════════════════════
//  DELETE /admin/hotels/:id — permanently delete hotel and all data
// ═══════════════════════════════════════════════════════════════════════
export const deleteHotel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // 1. Delete associated users for this restaurant
    await query(`DELETE FROM "User" WHERE "restaurantId" = $1;`, [id]);
    
    // 2. Delete feedback and admin notifications referencing this restaurant
    await query(`DELETE FROM "Feedback" WHERE "restaurantId" = $1;`, [id]).catch(() => {});
    await query(`DELETE FROM "AdminNotification" WHERE "restaurantId" = $1;`, [id]).catch(() => {});

    // 3. Delete restaurant (cascades to Subscription, Category, FoodItem, Order, OrderItem, Table, Payment)
    const result = await query(
      `DELETE FROM "Restaurant" WHERE "id" = $1 RETURNING "id", "name";`,
      [id]
    );

    if (!result.rows.length) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    res.json({ message: `Restaurant "${result.rows[0].name}" and all associated data deleted successfully.` });
  } catch (error) {
    console.error('deleteHotel error:', error);
    res.status(500).json({ message: 'Failed to delete restaurant' });
  }
};

