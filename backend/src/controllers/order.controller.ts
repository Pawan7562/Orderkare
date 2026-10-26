/*import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { notifyNewOrder, notifyOrderStatusUpdate, notifyNewFeedback, notifyStaffCall } from '../utils/socket';
import { prisma } from '../lib/prisma';
import { query } from '../lib/db';
import { OrderStatus } from '@prisma/client';
 
// Feedback database me 90 din tak store rehta hai
const FEEDBACK_RETENTION_DAYS = 90;
let lastFeedbackPurge = 0;
 
// 90 din se purana feedback delete karta hai (6 ghante me ek baar chalta hai)
const purgeOldFeedback = async () => {
  const now = Date.now();
  if (now - lastFeedbackPurge < 6 * 60 * 60 * 1000) return;
  lastFeedbackPurge = now;
  try {
    await prisma.feedback.deleteMany({
      where: { createdAt: { lt: new Date(now - FEEDBACK_RETENTION_DAYS * 24 * 60 * 60 * 1000) } },
    });
  } catch (err) {
    console.error('purgeOldFeedback error:', err);
  }
};
 
// Waiter / bill call spam se bachav (server side)
const lastCallAt = new Map<string, number>();
 
// Final bill print na hua ho to itne time tak naya order usi bill me judega
const MERGE_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 ghante
 
// Replace the whole createOrder function in src/controllers/order.controller.ts with this.
// It needs MERGE_WINDOW_MS and the imports (prisma, notifyNewOrder, Request, Response) that already exist in that file.

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawSlug = (req.params.slug as string || '').trim();
    const { customerName, tableNumber, phoneNumber, items, notes, specialInstructions, customerKey } = req.body;

    if (!customerName || !tableNumber || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Customer name, table number, and items are required' });
      return;
    }

    try {
      // Find restaurant by slug or id strictly
      const restaurant = await prisma.restaurant.findFirst({
        where: {
          OR: [
            { slug: rawSlug },
            { id: rawSlug },
            { slug: rawSlug.toLowerCase() },
          ],
        },
      });

      if (!restaurant || !restaurant.isActive) {
        res.status(404).json({ message: `Restaurant "${rawSlug}" not found or currently inactive` });
        return;
      }

      // Check active subscription validity
      const sub = await prisma.subscription.findUnique({
        where: { restaurantId: restaurant.id },
      });

      const now = new Date();
      const isSubscribed = sub && sub.validUntil && new Date(sub.validUntil) > now && ['ACTIVE', 'TRIAL'].includes(sub.status);

      if (!isSubscribed) {
        res.status(403).json({
          message: 'Digital menu ordering is temporarily paused for this restaurant due to an expired or pending subscription. Please ask restaurant management to renew.',
          isExpired: true,
        });
        return;
      }

      const foodIds = items.map((i: any) => i.foodItemId || i.id).filter(Boolean);
      const foodItems = await prisma.foodItem.findMany({
        where: { id: { in: foodIds }, restaurantId: restaurant.id },
      });

      if (foodItems.length === 0) {
        res.status(400).json({ message: 'No valid food items found for this restaurant' });
        return;
      }

      const foodMap = new Map(foodItems.map(f => [f.id, f]));
      let totalAmount = 0;
      const orderItemsData: { foodItemId: string; quantity: number; price: number }[] = [];

      for (const item of items) {
        const itemId = item.foodItemId || item.id;
        const food = foodMap.get(itemId);
        if (food) {
          const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
          const price = Number(food.price) || 0;
          totalAmount += price * qty;
          orderItemsData.push({
            foodItemId: food.id,
            quantity: qty,
            price: price,
          });
        }
      }

      if (orderItemsData.length === 0) {
        res.status(400).json({ message: 'Could not match any valid items for this order' });
        return;
      }

      const cleanCustomerName = String(customerName).trim();
      const cleanTableNumber = String(tableNumber).replace(/^Table\s*#?/i, '').trim() || '1';
      const cleanPhone = phoneNumber ? String(phoneNumber).trim() : null;
      const cleanNotes = (notes || specialInstructions) ? String(notes || specialInstructions).trim() : null;
      // Anonymous per-device id from the customer's phone. Each guest at a table gets a separate bill.
      const cleanKey = customerKey ? String(customerKey).trim().slice(0, 100) : null;
      // A new order joins an open bill only if it belongs to the same guest (device id, or phone number as a fallback)
      const ownerFilter = cleanKey ? { customerKey: cleanKey } : cleanPhone ? { phoneNumber: cleanPhone } : null;

      // A new order joins the same guest's open bill (billedAt = null) at this table.
      // Other guests at the same table always get their own bill. After a bill is finalized, the next order starts a new bill.
      const { order, merged } = await prisma.$transaction(async (tx) => {
        const open = !ownerFilter ? null : await tx.order.findFirst({
          where: {
            ...ownerFilter,
            restaurantId: restaurant.id,
            tableNumber: cleanTableNumber,
            billedAt: null,
            status: { not: 'REJECTED' },
            updatedAt: { gte: new Date(Date.now() - MERGE_WINDOW_MS) },
          },
          orderBy: { createdAt: 'desc' },
          include: { items: { select: { batch: true } } },
        });

        // This guest already has an open bill at this table: add the new items to it
        if (open) {
          const nextBatch = Math.max(1, ...open.items.map(i => i.batch)) + 1;
          const mergedNotes = cleanNotes
            ? [open.notes, `Add-on #${nextBatch}: ${cleanNotes}`].filter(Boolean).join(' | ')
            : open.notes;

          const updated = await tx.order.update({
            where: { id: open.id },
            data: {
              totalAmount: Math.round((open.totalAmount + totalAmount) * 100) / 100,
              status: 'PENDING', // show the order to the kitchen again
              notes: mergedNotes,
              phoneNumber: open.phoneNumber || cleanPhone,
              items: {
                create: orderItemsData.map(i => ({ ...i, batch: nextBatch })),
              },
            },
            include: { items: { include: { foodItem: true } } },
          });
          return { order: updated, merged: true };
        }

        // No open bill for this guest (or the last one was finalized): create a new order with a new bill number
        const lastOrder = await tx.order.aggregate({
          where: { restaurantId: restaurant.id },
          _max: { billNo: true },
        });
        const nextBillNo = (lastOrder._max.billNo || 0) + 1;

        const created = await tx.order.create({
          data: {
            billNo: nextBillNo,
            customerKey: cleanKey,
            customerName: cleanCustomerName,
            tableNumber: cleanTableNumber,
            phoneNumber: cleanPhone,
            notes: cleanNotes,
            totalAmount: Math.round(totalAmount * 100) / 100,
            restaurantId: restaurant.id,
            status: 'PENDING',
            items: {
              create: orderItemsData.map(i => ({ ...i, batch: 1 })),
            },
          },
          include: { items: { include: { foodItem: true } } },
        });
        return { order: created, merged: false };
      });

      console.log(`✅ Order ${merged ? 'merged' : 'created'}: BillNo=#${order.billNo}, Table=${order.tableNumber}, Restaurant=${restaurant.name}`);

      // Real-time notification to the restaurant dashboard (the merged flag marks an add-on)
      notifyNewOrder(restaurant.id, { ...order, merged });

      res.status(201).json({
        order,
        merged,
        message: merged ? 'Items added to your existing order' : 'Order placed successfully',
      });
    } catch (dbError) {
      console.error('Database error in createOrder:', dbError);
      res.status(503).json({ message: 'Database temporarily unavailable. Please try again in a moment.' });
    }
  } catch (error) {
    console.error('createOrder error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
 
export const getTableBill = async (req: any, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId as string;
    const tableNumber = String(req.params.tableNumber);
 
    if (!tableNumber) {
      res.status(400).json({ message: 'Table number is required' });
      return;
    }
 
    // Is table ka open bill (final bill abhi print nahi hua)
    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        tableNumber,
        billedAt: null,
        status: { not: 'REJECTED' },
      },
      include: { items: { include: { foodItem: true } } },
      orderBy: { createdAt: 'asc' },
    });
 
    if (!orders.length) {
      res.status(404).json({ message: 'No open bill found for this table' });
      return;
    }
 
    const mergedItems = orders.flatMap((o: any) => o.items);
    const grandTotal = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const last = orders[orders.length - 1];
 
    res.json({
      tableNumber,
      customerName: last.customerName,
      orders,
      items: mergedItems,
      grandTotal,
      latestBillNo: last.billNo,
    });
  } catch (error) {
    console.error('getTableBill error:', error);
    res.status(500).json({ message: 'Failed to fetch table bill' });
  }
};
 
export const getOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    try {
      const order = await prisma.order.findUnique({
        where: { id },
        select: {
          id: true,
          billNo: true,
          billedAt: true,
          customerName: true,
          tableNumber: true,
          phoneNumber: true,
          notes: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          restaurantId: true,
          restaurant: { select: { id: true, name: true, slug: true } },
          items: { include: { foodItem: { select: { id: true, name: true, price: true, imageUrl: true } } } },
        },
      });
      if (!order) { res.status(404).json({ message: 'Order not found' }); return; }
      res.json({ order });
    } catch (dbError) {
      res.status(503).json({ message: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('getOrderStatus error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
 
export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId: string = req.user?.restaurantId as string;
    const { status, limit = '50', page = '1' } = req.query;
 
    try {
      const take = Math.min(parseInt(limit as string) || 50, 100);
      const currentPage = Math.max(parseInt(page as string) || 1, 1);
      const skip = (currentPage - 1) * take;
 
      let statusArray: string[] | null = null;
      if (status && status !== 'ALL') {
        statusArray = (status as string).split(',').map(s => s.trim().toUpperCase());
      }
 
      const resOrders = await query(`
        SELECT
          o.id,
          o."billNo",
          o."billedAt",
          o."customerName",
          o."tableNumber",
          o."phoneNumber",
          o."specialInstructions" AS notes,
          o.status,
          o."totalAmount",
          o."restaurantId",
          o."createdAt",
          o."updatedAt",
          COUNT(*) OVER() AS full_count,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', oi.id,
                  'quantity', oi.quantity,
                  'batch', oi.batch,
                  'price', oi.price,
                  'foodItemId', oi."foodItemId",
                  'foodItem', json_build_object(
                    'id', fi.id,
                    'name', fi.name,
                    'price', fi.price,
                    'imageUrl', fi."imageUrl"
                  )
                )
                ORDER BY oi.batch, oi.id
              )
              FROM "OrderItem" oi
              LEFT JOIN "FoodItem" fi ON fi.id = oi."foodItemId"
              WHERE oi."orderId" = o.id
            ),
            '[]'::json
          ) AS items
        FROM "Order" o
        WHERE o."restaurantId" = $1
          AND ($2::text[] IS NULL OR o.status::text = ANY($2::text[]))
        ORDER BY o."createdAt" DESC
        LIMIT $3 OFFSET $4;
      `, [restaurantId, statusArray, take, skip]);
 
      const total = resOrders.rows.length > 0 ? parseInt(resOrders.rows[0].full_count, 10) : 0;
      const orders = resOrders.rows.map(({ full_count, ...order }) => order);
 
      res.json({
        orders,
        total,
        page: currentPage,
        totalPages: Math.ceil(total / take) || 0
      });
    } catch (dbError) {
      console.error('getOrders dbError:', dbError);
      res.status(503).json({ message: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('getOrders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
 
export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId: string = req.user?.restaurantId as string;
    const id = req.params.id as string;
    const rawStatus = req.body.status;
    const status = typeof rawStatus === 'string' ? rawStatus.toUpperCase() : Array.isArray(rawStatus) ? rawStatus[0].toUpperCase() : '';
 
    if (!status) {
      res.status(400).json({ message: 'Order status is required' });
      return;
    }
 
    try {
      const order = await prisma.order.findFirst({ where: { id, restaurantId } });
      if (!order) { res.status(404).json({ message: 'Order not found' }); return; }
 
      // Final bill print ho chuka hai to status dobara nahi badlega
      if (order.billedAt) {
        res.status(400).json({ message: 'Bill already closed for this order' });
        return;
      }
 
      const updated = await prisma.order.update({
        where: { id },
        data: { status: status as OrderStatus },
        include: {
          items: {
            include: { foodItem: true },
          },
        },
      });
 
      // Dispatch order status update to customer and hotel screens
      notifyOrderStatusUpdate(id, status, restaurantId);
 
      res.json({ order: updated, message: `Order status updated to ${status}` });
    } catch (dbError) {
      res.status(503).json({ message: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
 
// Final bill print hone par bill band karta hai. Iske baad us table ka naya order naya bill banayega.
export const closeBill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId as string;
    const id = req.params.id as string;
 
    const existing = await prisma.order.findFirst({ where: { id, restaurantId } });
    if (!existing) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
 
    const updated = await prisma.order.update({
      where: { id },
      data: {
        billedAt: existing.billedAt ?? new Date(), // dobara print par time nahi badlega
        status: 'COMPLETED',
      },
    });
 
    notifyOrderStatusUpdate(id, 'COMPLETED', restaurantId);
    res.json({ order: updated, message: 'Bill closed' });
  } catch (error) {
    console.error('closeBill error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
 
// ─── FEEDBACK (database me save, 90 din tak) ───
export const submitOrderFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const idParam = req.params.id;
    const id = typeof idParam === 'string' ? idParam : Array.isArray(idParam) ? idParam[0] : '';
    const { rating, comment, customerName, tags, favoriteDishes } = req.body || {};
    const parsedRating = Number(rating);
 
    if (!id || Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      res.status(400).json({ message: 'Valid rating (1-5) is required.' });
      return;
    }
 
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { foodItem: true } } },
    });
 
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
 
    const restaurantId = order.restaurantId;
    const foodSummary =
      order.items.map((item: any) => item.foodItem?.name || item.name).filter(Boolean).join(', ') ||
      'Custom Dining Order';
 
    // Database me save
    const saved = await prisma.feedback.create({
      data: {
        orderId: id,
        restaurantId,
        customerName: String(customerName || order.customerName || 'Guest').trim(),
        tableNumber: order.tableNumber || null,
        foodName: foodSummary,
        rating: Math.round(parsedRating),
        tags: Array.isArray(tags) ? tags.map((t: any) => String(t)) : [],
        favoriteDishes: Array.isArray(favoriteDishes) ? favoriteDishes.map((d: any) => String(d)) : [],
        comment: comment ? String(comment).trim() : null,
      },
    });
 
    // 90 din se purana feedback saaf karo (background me)
    void purgeOldFeedback();
 
    // Real-time notification admin dashboard ko
    notifyNewFeedback(restaurantId, saved);
 
    res.status(201).json({ feedback: saved, message: 'Thank you! Your feedback has been received.' });
  } catch (error) {
    console.error('submitOrderFeedback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
 
export const getRestaurantFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId as string;
 
    const days = Math.min(
      Math.max(parseInt(req.query.days as string) || FEEDBACK_RETENTION_DAYS, 1),
      FEEDBACK_RETENTION_DAYS
    );
    const rating = parseInt(req.query.rating as string);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
 
    const baseWhere = { restaurantId, createdAt: { gte: since } };
    const listWhere = rating >= 1 && rating <= 5 ? { ...baseWhere, rating } : baseWhere;
 
    const [feedback, total, agg, groups] = await Promise.all([
      prisma.feedback.findMany({
        where: listWhere,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.feedback.count({ where: listWhere }),
      prisma.feedback.aggregate({
        where: baseWhere,
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.feedback.groupBy({
        by: ['rating'],
        where: baseWhere,
        _count: { _all: true },
      }),
    ]);
 
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    groups.forEach(g => {
      distribution[g.rating] = g._count._all;
    });
 
    res.json({
      feedback,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      averageRating: (agg._avg.rating || 0).toFixed(1),
      totalRatings: agg._count._all,
      distribution,
      retentionDays: FEEDBACK_RETENTION_DAYS,
    });
  } catch (error) {
    console.error('getRestaurantFeedback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
 
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  console.log('>>> [ORDER_CONTROLLER_FAST] getDashboardStats CALLED at', new Date().toISOString());
  try {
    const restaurantId: string = req.user?.restaurantId as string;
 
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
 
      const statsRes = await query(`
        WITH stats AS (
          SELECT
            COUNT(*) FILTER (WHERE "createdAt" >= $2) AS today_orders,
            COALESCE(SUM("totalAmount") FILTER (WHERE "createdAt" >= $2 AND "status" != 'REJECTED'), 0) AS today_revenue,
            COUNT(*) FILTER (WHERE "status" IN ('PENDING', 'ACCEPTED', 'PREPARING', 'READY')) AS active_orders,
            COUNT(DISTINCT "tableNumber") FILTER (WHERE "status" IN ('PENDING', 'ACCEPTED', 'PREPARING', 'READY')) AS active_tables
          FROM "Order"
          WHERE "restaurantId" = $1
        ),
        items AS (
          SELECT COUNT(*) AS menu_items FROM "FoodItem" WHERE "restaurantId" = $1
        )
        SELECT
          stats.today_orders,
          stats.today_revenue,
          stats.active_orders,
          stats.active_tables,
          items.menu_items
        FROM stats CROSS JOIN items;
      `, [restaurantId, today]);
 
      const row = statsRes.rows[0] || {};
      const todayOrders = parseInt(row.today_orders || '0', 10);
      const todayRevenue = parseFloat(row.today_revenue || '0');
      const activeOrders = parseInt(row.active_orders || '0', 10);
      const activeTables = parseInt(row.active_tables || '0', 10);
      const menuItems = parseInt(row.menu_items || '0', 10);
 
      res.json({
        todayOrders,
        todayRevenue,
        todaySales: todayRevenue,
        activeOrders,
        pendingOrders: activeOrders,
        menuItems,
        activeTables,
        totalTables: 20
      });
    } catch (dbError) {
      console.error('getDashboardStats dbError:', dbError);
      res.status(503).json({ message: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
 
// Customer ke "Call waiter" / "Ask for bill" button ka route (public)
export const callStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawSlug = (req.params.slug as string || '').trim();
    const { tableNumber, type, customerName } = req.body || {};
    const callType = String(type || '').toUpperCase();
 
    if (!['WAITER', 'BILL'].includes(callType) || !tableNumber) {
      res.status(400).json({ message: 'Valid table number and type are required' });
      return;
    }
 
    const restaurant = await prisma.restaurant.findFirst({
      where: { OR: [{ slug: rawSlug }, { id: rawSlug }, { slug: rawSlug.toLowerCase() }] },
      select: { id: true, isActive: true },
    });
    if (!restaurant || !restaurant.isActive) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }
 
    const cleanTable = String(tableNumber).replace(/^Table\s*#?/i, '').trim() || '1';
    const key = `${restaurant.id}:${cleanTable}:${callType}`;
    const now = Date.now();
    if (now - (lastCallAt.get(key) || 0) < 20_000) {
      res.json({ message: 'Staff already notified', throttled: true });
      return;
    }
    lastCallAt.set(key, now);
 
    notifyStaffCall(restaurant.id, {
      tableNumber: cleanTable,
      type: callType as 'WAITER' | 'BILL',
      customerName: customerName ? String(customerName).trim() : undefined,
      at: new Date().toISOString(),
    });
 
    res.json({ message: 'Staff notified' });
  } catch (error) {
    console.error('callStaff error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
 
export const getDashboardOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId: string = req.user?.restaurantId as string;
    if (!restaurantId) {
      res.status(403).json({ message: 'Restaurant context required' });
      return;
    }
 
    const today = new Date();
    today.setHours(0, 0, 0, 0);
 
    // Parallel fetch for stats, active orders, and subscription
    const [statsRes, ordersRes, subRes] = await Promise.all([
      query(`
        WITH stats AS (
          SELECT
            COUNT(*) FILTER (WHERE "createdAt" >= $2) AS today_orders,
            COALESCE(SUM("totalAmount") FILTER (WHERE "createdAt" >= $2 AND "status" != 'REJECTED'), 0) AS today_revenue,
            COUNT(*) FILTER (WHERE "status" IN ('PENDING', 'ACCEPTED', 'PREPARING', 'READY')) AS active_orders,
            COUNT(DISTINCT "tableNumber") FILTER (WHERE "status" IN ('PENDING', 'ACCEPTED', 'PREPARING', 'READY')) AS active_tables
          FROM "Order"
          WHERE "restaurantId" = $1
        ),
        items AS (
          SELECT COUNT(*) AS menu_items FROM "FoodItem" WHERE "restaurantId" = $1
        )
        SELECT
          stats.today_orders,
          stats.today_revenue,
          stats.active_orders,
          stats.active_tables,
          items.menu_items
        FROM stats CROSS JOIN items;
      `, [restaurantId, today]).catch(() => ({ rows: [] })),
 
      query(`
        SELECT
          o.id,
          o."billNo",
          o."billedAt",
          o."customerName",
          o."tableNumber",
          o."phoneNumber",
          o."specialInstructions" AS notes,
          o.status,
          o."totalAmount",
          o."restaurantId",
          o."createdAt",
          o."updatedAt",
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', oi.id,
                  'quantity', oi.quantity,
                  'batch', oi.batch,
                  'price', oi.price,
                  'foodItemId', oi."foodItemId",
                  'foodItem', json_build_object(
                    'id', fi.id,
                    'name', fi.name,
                    'price', fi.price,
                    'imageUrl', fi."imageUrl"
                  )
                )
                ORDER BY oi.batch, oi.id
              )
              FROM "OrderItem" oi
              LEFT JOIN "FoodItem" fi ON fi.id = oi."foodItemId"
              WHERE oi."orderId" = o.id
            ),
            '[]'::json
          ) AS items
        FROM "Order" o
        WHERE o."restaurantId" = $1
          AND o.status::text = ANY(ARRAY['PENDING', 'ACCEPTED', 'PREPARING'])
        ORDER BY o."createdAt" DESC
        LIMIT 50;
      `, [restaurantId]).catch(() => ({ rows: [] })),
 
      query(`
        SELECT 
          r.id, r.name, r.slug, r."isActive", r."subscriptionStatus",
          s.id as sub_id, s.status as sub_status, s."planName" as sub_plan_name, 
          s."amountPaid" as sub_amount_paid, s."paymentReference" as sub_payment_reference, 
          s."validUntil" as sub_valid_until
        FROM "Restaurant" r
        LEFT JOIN "Subscription" s ON s."restaurantId" = r.id
        WHERE r.id = $1 LIMIT 1;
      `, [restaurantId]).catch(() => ({ rows: [] }))
    ]);
 
    const statRow = statsRes.rows[0] || {};
    const todayOrders = parseInt(statRow.today_orders || '0', 10);
    const todayRevenue = parseFloat(statRow.today_revenue || '0');
    const activeOrders = parseInt(statRow.active_orders || '0', 10);
    const activeTables = parseInt(statRow.active_tables || '0', 10);
    const menuItems = parseInt(statRow.menu_items || '0', 10);
 
    const stats = {
      todayOrders,
      todayRevenue,
      todaySales: todayRevenue,
      activeOrders,
      pendingOrders: activeOrders,
      menuItems,
      activeTables,
      totalTables: 20
    };
 
    const orders = ordersRes.rows || [];
 
    // Parse subscription
    let subscription: any = { isSubscribed: false, status: 'PENDING', daysRemaining: 0 };
    if (subRes.rows.length) {
      const row = subRes.rows[0];
      const now = new Date();
      const hasEverPaid = Boolean(
        row.sub_id &&
        Number(row.sub_amount_paid || 0) > 0 &&
        row.sub_payment_reference &&
        String(row.sub_payment_reference).trim() !== ''
      );
      if (hasEverPaid && row.sub_valid_until) {
        const validUntil = new Date(row.sub_valid_until);
        if (validUntil > now && (row.sub_status === 'ACTIVE' || row.sub_status === 'TRIAL')) {
          subscription = {
            isSubscribed: true,
            status: row.sub_status,
            planName: row.sub_plan_name,
            validUntil: row.sub_valid_until,
            daysRemaining: Math.max(0, Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
            amountPaid: row.sub_amount_paid
          };
        } else {
          subscription = {
            isSubscribed: false,
            status: 'EXPIRED',
            planName: row.sub_plan_name,
            validUntil: row.sub_valid_until,
            daysRemaining: 0
          };
        }
      }
    }
 
    // Latest feedback ab database se aata hai
    const feedback = await prisma.feedback.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
 
    res.json({
      stats,
      orders,
      subscription,
      feedback
    });
  } catch (error) {
    console.error('getDashboardOverview error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
 
// ─── DASHBOARD: kisi bhi din / date range ka hisaab (calendar ke liye) ───
// GET /orders/range-stats?from=YYYY-MM-DD&to=YYYY-MM-DD   (dates India time IST me)
export const getRangeStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId as string;
    if (!restaurantId) {
      res.status(403).json({ message: 'Restaurant context required' });
      return;
    }
 
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    let from = String(req.query.from || '');
    let to = String(req.query.to || from);
 
    if (!dateRe.test(from) || !dateRe.test(to)) {
      res.status(400).json({ message: 'from and to must be in YYYY-MM-DD format' });
      return;
    }
    if (from > to) [from, to] = [to, from];
 
    const spanDays = Math.round((Date.parse(to) - Date.parse(from)) / 86400000);
    if (spanDays > 365) {
      res.status(400).json({ message: 'Date range cannot be longer than 365 days' });
      return;
    }
 
    // createdAt UTC me store hota hai, usse India time (IST) me badal kar din ke hisaab se group karte hain
    const LOCAL = `((o."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata')`;
    const WHERE = `o."restaurantId" = $1 AND ${LOCAL} >= $2::date AND ${LOCAL} < ($3::date + INTERVAL '1 day')`;
    const params = [restaurantId, from, to];
 
    const fromUtc = new Date(`${from}T00:00:00+05:30`);
    const toUtc = new Date(`${to}T23:59:59.999+05:30`);
 
    const [summaryRes, dailyRes, topRes, hourlyRes, statusRes, recentRes, fbAgg] = await Promise.all([
      query(
        `SELECT
           COUNT(*) FILTER (WHERE o.status <> 'REJECTED') AS orders,
           COALESCE(SUM(o."totalAmount") FILTER (WHERE o.status <> 'REJECTED'), 0) AS revenue,
           COUNT(*) FILTER (WHERE o.status = 'REJECTED') AS rejected,
           COUNT(DISTINCT o."tableNumber") FILTER (WHERE o.status <> 'REJECTED') AS tables_served
         FROM "Order" o
         WHERE ${WHERE};`,
        params
      ),
      query(
        `SELECT
           to_char(${LOCAL}::date, 'YYYY-MM-DD') AS day,
           COUNT(*) FILTER (WHERE o.status <> 'REJECTED') AS orders,
           COALESCE(SUM(o."totalAmount") FILTER (WHERE o.status <> 'REJECTED'), 0) AS revenue
         FROM "Order" o
         WHERE ${WHERE}
         GROUP BY 1
         ORDER BY 1;`,
        params
      ),
      query(
        `SELECT fi.name AS name,
                SUM(oi.quantity)::int AS qty,
                COALESCE(SUM(oi.quantity * oi.price), 0) AS revenue
         FROM "OrderItem" oi
         JOIN "Order" o ON o.id = oi."orderId"
         JOIN "FoodItem" fi ON fi.id = oi."foodItemId"
         WHERE ${WHERE} AND o.status <> 'REJECTED'
         GROUP BY fi.name
         ORDER BY qty DESC
         LIMIT 5;`,
        params
      ),
      query(
        `SELECT EXTRACT(HOUR FROM ${LOCAL})::int AS hour, COUNT(*)::int AS orders
         FROM "Order" o
         WHERE ${WHERE} AND o.status <> 'REJECTED'
         GROUP BY 1
         ORDER BY 1;`,
        params
      ),
      query(
        `SELECT o.status AS status, COUNT(*)::int AS count
         FROM "Order" o
         WHERE ${WHERE}
         GROUP BY o.status;`,
        params
      ),
      query(
        `SELECT o.id, o."billNo", o."tableNumber", o."customerName", o."totalAmount", o.status, o."createdAt"
         FROM "Order" o
         WHERE ${WHERE}
         ORDER BY o."createdAt" DESC
         LIMIT 8;`,
        params
      ),
      prisma.feedback.aggregate({
        where: { restaurantId, createdAt: { gte: fromUtc, lte: toUtc } },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);
 
    const sRow = summaryRes.rows[0] || {};
    const orders = parseInt(sRow.orders || '0', 10);
    const revenue = parseFloat(sRow.revenue || '0');
 
    const statusBreakdown: Record<string, number> = {};
    statusRes.rows.forEach((r: any) => {
      statusBreakdown[r.status] = Number(r.count) || 0;
    });
 
    res.json({
      from,
      to,
      summary: {
        orders,
        revenue,
        rejected: parseInt(sRow.rejected || '0', 10),
        tablesServed: parseInt(sRow.tables_served || '0', 10),
        avgOrderValue: orders > 0 ? revenue / orders : 0,
      },
      daily: dailyRes.rows.map((r: any) => ({
        day: r.day,
        orders: parseInt(r.orders || '0', 10),
        revenue: parseFloat(r.revenue || '0'),
      })),
      hourly: hourlyRes.rows.map((r: any) => ({ hour: Number(r.hour), orders: Number(r.orders) })),
      topDishes: topRes.rows.map((r: any) => ({
        name: r.name,
        qty: Number(r.qty) || 0,
        revenue: parseFloat(r.revenue || '0'),
      })),
      statusBreakdown,
      feedback: {
        average: Number(fbAgg._avg.rating || 0),
        count: fbAgg._count._all,
      },
      recent: recentRes.rows,
    });
  } catch (error) {
    console.error('getRangeStats error:', error);
    res.status(500).json({ message: 'Failed to load dashboard data' });
  }
};*/

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { notifyNewOrder, notifyOrderStatusUpdate, notifyNewFeedback, notifyStaffCall } from '../utils/socket';
import { prisma } from '../lib/prisma';
import { query } from '../lib/db';
import { OrderStatus } from '@prisma/client';

// Feedback database me 90 din tak store rehta hai
const FEEDBACK_RETENTION_DAYS = 90;
let lastFeedbackPurge = 0;

// 90 din se purana feedback delete karta hai (6 ghante me ek baar chalta hai)
const purgeOldFeedback = async () => {
  const now = Date.now();
  if (now - lastFeedbackPurge < 6 * 60 * 60 * 1000) return;
  lastFeedbackPurge = now;
  try {
    await prisma.feedback.deleteMany({
      where: { createdAt: { lt: new Date(now - FEEDBACK_RETENTION_DAYS * 24 * 60 * 60 * 1000) } },
    });
  } catch (err) {
    console.error('purgeOldFeedback error:', err);
  }
};

// Waiter / bill call spam se bachav (server side)
const lastCallAt = new Map<string, number>();

// While a guest's bill is not finalized, new orders from that guest join it for this long
const MERGE_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 ghante

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawSlug = (req.params.slug as string || '').trim();
    const { customerName, tableNumber, phoneNumber, items, notes, specialInstructions, customerKey } = req.body;

    if (!customerName || !tableNumber || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Customer name, table number, and items are required' });
      return;
    }

    try {
      // Find restaurant by slug or id strictly
      const restaurant = await prisma.restaurant.findFirst({
        where: {
          OR: [
            { slug: rawSlug },
            { id: rawSlug },
            { slug: rawSlug.toLowerCase() },
          ],
        },
      });

      if (!restaurant || !restaurant.isActive) {
        res.status(404).json({ message: `Restaurant "${rawSlug}" not found or currently inactive` });
        return;
      }

      // Check active subscription validity
      const sub = await prisma.subscription.findUnique({
        where: { restaurantId: restaurant.id },
      });

      const now = new Date();
      const isSubscribed = sub && sub.validUntil && new Date(sub.validUntil) > now && ['ACTIVE', 'TRIAL'].includes(sub.status);

      if (!isSubscribed) {
        res.status(403).json({
          message: 'Digital menu ordering is temporarily paused for this restaurant due to an expired or pending subscription. Please ask restaurant management to renew.',
          isExpired: true,
        });
        return;
      }

      const foodIds = items.map((i: any) => i.foodItemId || i.id).filter(Boolean);
      const foodItems = await prisma.foodItem.findMany({
        where: { id: { in: foodIds }, restaurantId: restaurant.id },
      });

      if (foodItems.length === 0) {
        res.status(400).json({ message: 'No valid food items found for this restaurant' });
        return;
      }

      const foodMap = new Map(foodItems.map(f => [f.id, f]));
      let totalAmount = 0;
      const orderItemsData: { foodItemId: string; quantity: number; price: number }[] = [];

      for (const item of items) {
        const itemId = item.foodItemId || item.id;
        const food = foodMap.get(itemId);
        if (food) {
          const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
          const price = Number(food.price) || 0;
          totalAmount += price * qty;
          orderItemsData.push({
            foodItemId: food.id,
            quantity: qty,
            price: price,
          });
        }
      }

      if (orderItemsData.length === 0) {
        res.status(400).json({ message: 'Could not match any valid items for this order' });
        return;
      }

      const cleanCustomerName = String(customerName).trim();
      const cleanTableNumber = String(tableNumber).replace(/^Table\s*#?/i, '').trim() || '1';
      const cleanPhone = phoneNumber ? String(phoneNumber).trim() : null;
      const cleanNotes = (notes || specialInstructions) ? String(notes || specialInstructions).trim() : null;
      // Anonymous per-device id from the customer's phone. Each guest at a table gets a separate bill.
      const cleanKey = customerKey ? String(customerKey).trim().slice(0, 100) : null;
      // A new order joins an open bill only if it belongs to the same guest (device id, or phone number as a fallback)
      const ownerFilter = cleanKey ? { customerKey: cleanKey } : cleanPhone ? { phoneNumber: cleanPhone } : null;

      // A new order joins the same guest's open bill (billedAt = null) at this table.
      // Other guests at the same table always get their own bill. After a bill is finalized, the next order starts a new bill.
      const { order, merged } = await prisma.$transaction(async (tx) => {
        const open = !ownerFilter ? null : await tx.order.findFirst({
          where: {
            ...ownerFilter,
            restaurantId: restaurant.id,
            tableNumber: cleanTableNumber,
            billedAt: null,
            status: { not: 'REJECTED' },
            updatedAt: { gte: new Date(Date.now() - MERGE_WINDOW_MS) },
          },
          orderBy: { createdAt: 'desc' },
          include: { items: { select: { batch: true } } },
        });

        // This guest already has an open bill at this table: add the new items to it
        if (open) {
          const nextBatch = Math.max(1, ...open.items.map(i => i.batch)) + 1;
          const mergedNotes = cleanNotes
            ? [open.notes, `Add-on #${nextBatch}: ${cleanNotes}`].filter(Boolean).join(' | ')
            : open.notes;

          const updated = await tx.order.update({
            where: { id: open.id },
            data: {
              totalAmount: Math.round((open.totalAmount + totalAmount) * 100) / 100,
              status: 'PENDING', // show the order to the kitchen again
              estimatedReadyAt: null, // the old estimate no longer applies after an add-on
              notes: mergedNotes,
              phoneNumber: open.phoneNumber || cleanPhone,
              items: {
                create: orderItemsData.map(i => ({ ...i, batch: nextBatch })),
              },
            },
            include: { items: { include: { foodItem: true } } },
          });
          return { order: updated, merged: true };
        }

        // No open bill for this guest (or the last one was finalized): create a new order with a new bill number
        const lastOrder = await tx.order.aggregate({
          where: { restaurantId: restaurant.id },
          _max: { billNo: true },
        });
        const nextBillNo = (lastOrder._max.billNo || 0) + 1;

        const created = await tx.order.create({
          data: {
            billNo: nextBillNo,
            customerKey: cleanKey,
            customerName: cleanCustomerName,
            tableNumber: cleanTableNumber,
            phoneNumber: cleanPhone,
            notes: cleanNotes,
            totalAmount: Math.round(totalAmount * 100) / 100,
            restaurantId: restaurant.id,
            status: 'PENDING',
            items: {
              create: orderItemsData.map(i => ({ ...i, batch: 1 })),
            },
          },
          include: { items: { include: { foodItem: true } } },
        });
        return { order: created, merged: false };
      });

      console.log(`✅ Order ${merged ? 'merged' : 'created'}: BillNo=#${order.billNo}, Table=${order.tableNumber}, Restaurant=${restaurant.name}`);

      // Real-time notification to the restaurant dashboard (the merged flag marks an add-on)
      notifyNewOrder(restaurant.id, { ...order, merged });

      res.status(201).json({
        order,
        merged,
        message: merged ? 'Items added to your existing order' : 'Order placed successfully',
      });
    } catch (dbError) {
      console.error('Database error in createOrder:', dbError);
      res.status(503).json({ message: 'Database temporarily unavailable. Please try again in a moment.' });
    }
  } catch (error) {
    console.error('createOrder error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTableBill = async (req: any, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId as string;
    const tableNumber = String(req.params.tableNumber);

    if (!tableNumber) {
      res.status(400).json({ message: 'Table number is required' });
      return;
    }

    // Open bills of this table (final bill not printed yet)
    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        tableNumber,
        billedAt: null,
        status: { not: 'REJECTED' },
      },
      include: { items: { include: { foodItem: true } } },
      orderBy: { createdAt: 'asc' },
    });

    if (!orders.length) {
      res.status(404).json({ message: 'No open bill found for this table' });
      return;
    }

    const mergedItems = orders.flatMap((o: any) => o.items);
    const grandTotal = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const last = orders[orders.length - 1];

    res.json({
      tableNumber,
      customerName: last.customerName,
      orders,
      items: mergedItems,
      grandTotal,
      latestBillNo: last.billNo,
    });
  } catch (error) {
    console.error('getTableBill error:', error);
    res.status(500).json({ message: 'Failed to fetch table bill' });
  }
};

export const getOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    try {
      const order = await prisma.order.findUnique({
        where: { id },
        select: {
          id: true,
          billNo: true,
          billedAt: true,
          gstEnabled: true,
          serviceChargePct: true,
          gstAmount: true,
          serviceAmount: true,
          finalAmount: true,
          estimatedReadyAt: true,
          customerName: true,
          tableNumber: true,
          phoneNumber: true,
          notes: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          restaurantId: true,
          restaurant: { select: { id: true, name: true, slug: true } },
          items: { include: { foodItem: { select: { id: true, name: true, price: true, imageUrl: true } } } },
        },
      });
      if (!order) { res.status(404).json({ message: 'Order not found' }); return; }
      res.json({ order });
    } catch (dbError) {
      res.status(503).json({ message: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('getOrderStatus error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId: string = req.user?.restaurantId as string;
    const { status, limit = '50', page = '1' } = req.query;

    try {
      const take = Math.min(parseInt(limit as string) || 50, 100);
      const currentPage = Math.max(parseInt(page as string) || 1, 1);
      const skip = (currentPage - 1) * take;

      let statusArray: string[] | null = null;
      if (status && status !== 'ALL') {
        statusArray = (status as string).split(',').map(s => s.trim().toUpperCase());
      }

      const resOrders = await query(`
        SELECT
          o.id,
          o."billNo",
          o."billedAt",
          o."gstEnabled",
          o."serviceChargePct",
          o."gstAmount",
          o."serviceAmount",
          o."finalAmount",
          o."estimatedReadyAt",
          o."customerName",
          o."tableNumber",
          o."phoneNumber",
          o."specialInstructions" AS notes,
          o.status,
          o."totalAmount",
          o."restaurantId",
          o."createdAt",
          o."updatedAt",
          COUNT(*) OVER() AS full_count,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', oi.id,
                  'quantity', oi.quantity,
                  'batch', oi.batch,
                  'price', oi.price,
                  'foodItemId', oi."foodItemId",
                  'foodItem', json_build_object(
                    'id', fi.id,
                    'name', fi.name,
                    'price', fi.price,
                    'imageUrl', fi."imageUrl"
                  )
                )
                ORDER BY oi.batch, oi.id
              )
              FROM "OrderItem" oi
              LEFT JOIN "FoodItem" fi ON fi.id = oi."foodItemId"
              WHERE oi."orderId" = o.id
            ),
            '[]'::json
          ) AS items
        FROM "Order" o
        WHERE o."restaurantId" = $1
          AND ($2::text[] IS NULL OR o.status::text = ANY($2::text[]))
        ORDER BY o."createdAt" DESC
        LIMIT $3 OFFSET $4;
      `, [restaurantId, statusArray, take, skip]);

      const total = resOrders.rows.length > 0 ? parseInt(resOrders.rows[0].full_count, 10) : 0;
      const orders = resOrders.rows.map(({ full_count, ...order }) => order);

      res.json({
        orders,
        total,
        page: currentPage,
        totalPages: Math.ceil(total / take) || 0
      });
    } catch (dbError) {
      console.error('getOrders dbError:', dbError);
      res.status(503).json({ message: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('getOrders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId: string = req.user?.restaurantId as string;
    const id = req.params.id as string;
    const rawStatus = req.body.status;
    const status = typeof rawStatus === 'string' ? rawStatus.toUpperCase() : Array.isArray(rawStatus) ? rawStatus[0].toUpperCase() : '';

    if (!status) {
      res.status(400).json({ message: 'Order status is required' });
      return;
    }

    try {
      const order = await prisma.order.findFirst({ where: { id, restaurantId } });
      if (!order) { res.status(404).json({ message: 'Order not found' }); return; }

      // The status of a finalized bill can no longer be changed
      if (order.billedAt) {
        res.status(400).json({ message: 'Bill already closed for this order' });
        return;
      }

      const updated = await prisma.order.update({
        where: { id },
        data: { status: status as OrderStatus },
        include: {
          items: {
            include: { foodItem: true },
          },
        },
      });

      // Dispatch order status update to customer and hotel screens
      notifyOrderStatusUpdate(id, status, restaurantId);

      res.json({ order: updated, message: `Order status updated to ${status}` });
    } catch (dbError) {
      res.status(503).json({ message: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Closes (finalizes) a bill. The server calculates GST and service charge and stores them with the order,
// so a finalized bill can never be changed or recalculated later (reprints always use the stored values).
const BILL_GST_RATE = 0.05;
const round2 = (n: number) => Math.round(n * 100) / 100;

export const closeBill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId as string;
    const id = req.params.id as string;

    const existing = await prisma.order.findFirst({ where: { id, restaurantId } });
    if (!existing) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // A rejected order is never billed (this also stops it from being switched to COMPLETED)
    if (existing.status === 'REJECTED') {
      res.status(400).json({ message: 'A rejected order cannot be billed' });
      return;
    }

    // Already finalized: return the stored bill untouched
    if (existing.billedAt) {
      res.json({ order: existing, message: 'Bill already closed' });
      return;
    }

    const gstOn = req.body?.gstOn !== false;
    const pctRaw = Number(req.body?.servicePct);
    const servicePct = Number.isFinite(pctRaw) ? Math.min(10, Math.max(0, Math.round(pctRaw))) : 0;

    const subtotal = Number(existing.totalAmount) || 0;
    const gstAmount = gstOn ? round2(subtotal * BILL_GST_RATE) : 0;
    const serviceAmount = round2((subtotal * servicePct) / 100);
    const finalAmount = round2(subtotal + gstAmount + serviceAmount);

    const updated = await prisma.order.update({
      where: { id },
      data: {
        billedAt: new Date(),
        status: 'COMPLETED',
        gstEnabled: gstOn,
        serviceChargePct: servicePct,
        gstAmount,
        serviceAmount,
        finalAmount,
      },
    });

    notifyOrderStatusUpdate(id, 'COMPLETED', restaurantId);
    res.json({ order: updated, message: 'Bill closed' });
  } catch (error) {
    console.error('closeBill error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin sets (or clears) the estimated preparation time of one order. The customer sees it on the tracking screen.
export const setOrderEstimate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId as string;
    const id = req.params.id as string;
    const raw = req.body?.minutes;

    const order = await prisma.order.findFirst({ where: { id, restaurantId } });
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    if (order.billedAt || ['REJECTED', 'COMPLETED', 'SERVED'].includes(order.status)) {
      res.status(400).json({ message: 'The estimated time can only be changed for active orders' });
      return;
    }

    let estimatedReadyAt: Date | null = null; // null clears the estimate
    if (raw !== null && raw !== undefined && raw !== '') {
      const minutes = Math.round(Number(raw));
      if (!Number.isFinite(minutes) || minutes < 1 || minutes > 180) {
        res.status(400).json({ message: 'Minutes must be between 1 and 180' });
        return;
      }
      estimatedReadyAt = new Date(Date.now() + minutes * 60 * 1000);
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { estimatedReadyAt },
      select: { id: true, status: true, estimatedReadyAt: true },
    });

    res.json({ order: updated, message: 'Estimated time updated' });
  } catch (error) {
    console.error('setOrderEstimate error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── FEEDBACK (stored in the database for 90 days) ───
export const submitOrderFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const idParam = req.params.id;
    const id = typeof idParam === 'string' ? idParam : Array.isArray(idParam) ? idParam[0] : '';
    const { rating, comment, customerName, tags, favoriteDishes } = req.body || {};
    const parsedRating = Number(rating);

    if (!id || Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      res.status(400).json({ message: 'Valid rating (1-5) is required.' });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { foodItem: true } } },
    });

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const restaurantId = order.restaurantId;
    const foodSummary =
      order.items.map((item: any) => item.foodItem?.name || item.name).filter(Boolean).join(', ') ||
      'Custom Dining Order';

    // Database me save
    const saved = await prisma.feedback.create({
      data: {
        orderId: id,
        restaurantId,
        customerName: String(customerName || order.customerName || 'Guest').trim(),
        tableNumber: order.tableNumber || null,
        foodName: foodSummary,
        rating: Math.round(parsedRating),
        tags: Array.isArray(tags) ? tags.map((t: any) => String(t)) : [],
        favoriteDishes: Array.isArray(favoriteDishes) ? favoriteDishes.map((d: any) => String(d)) : [],
        comment: comment ? String(comment).trim() : null,
      },
    });

    // 90 din se purana feedback saaf karo (background me)
    void purgeOldFeedback();

    // Real-time notification admin dashboard ko
    notifyNewFeedback(restaurantId, saved);

    res.status(201).json({ feedback: saved, message: 'Thank you! Your feedback has been received.' });
  } catch (error) {
    console.error('submitOrderFeedback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getRestaurantFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId as string;

    const days = Math.min(
      Math.max(parseInt(req.query.days as string) || FEEDBACK_RETENTION_DAYS, 1),
      FEEDBACK_RETENTION_DAYS
    );
    const rating = parseInt(req.query.rating as string);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const baseWhere = { restaurantId, createdAt: { gte: since } };
    const listWhere = rating >= 1 && rating <= 5 ? { ...baseWhere, rating } : baseWhere;

    const [feedback, total, agg, groups] = await Promise.all([
      prisma.feedback.findMany({
        where: listWhere,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.feedback.count({ where: listWhere }),
      prisma.feedback.aggregate({
        where: baseWhere,
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.feedback.groupBy({
        by: ['rating'],
        where: baseWhere,
        _count: { _all: true },
      }),
    ]);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    groups.forEach(g => {
      distribution[g.rating] = g._count._all;
    });

    res.json({
      feedback,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      averageRating: (agg._avg.rating || 0).toFixed(1),
      totalRatings: agg._count._all,
      distribution,
      retentionDays: FEEDBACK_RETENTION_DAYS,
    });
  } catch (error) {
    console.error('getRestaurantFeedback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  console.log('>>> [ORDER_CONTROLLER_FAST] getDashboardStats CALLED at', new Date().toISOString());
  try {
    const restaurantId: string = req.user?.restaurantId as string;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const statsRes = await query(`
        WITH stats AS (
          SELECT
            COUNT(*) FILTER (WHERE "createdAt" >= $2) AS today_orders,
            COALESCE(SUM("totalAmount") FILTER (WHERE "createdAt" >= $2 AND "status" != 'REJECTED'), 0) AS today_revenue,
            COUNT(*) FILTER (WHERE "status" IN ('PENDING', 'ACCEPTED', 'PREPARING', 'READY')) AS active_orders,
            COUNT(DISTINCT "tableNumber") FILTER (WHERE "status" IN ('PENDING', 'ACCEPTED', 'PREPARING', 'READY')) AS active_tables
          FROM "Order"
          WHERE "restaurantId" = $1
        ),
        items AS (
          SELECT COUNT(*) AS menu_items FROM "FoodItem" WHERE "restaurantId" = $1
        )
        SELECT
          stats.today_orders,
          stats.today_revenue,
          stats.active_orders,
          stats.active_tables,
          items.menu_items
        FROM stats CROSS JOIN items;
      `, [restaurantId, today]);

      const row = statsRes.rows[0] || {};
      const todayOrders = parseInt(row.today_orders || '0', 10);
      const todayRevenue = parseFloat(row.today_revenue || '0');
      const activeOrders = parseInt(row.active_orders || '0', 10);
      const activeTables = parseInt(row.active_tables || '0', 10);
      const menuItems = parseInt(row.menu_items || '0', 10);

      res.json({
        todayOrders,
        todayRevenue,
        todaySales: todayRevenue,
        activeOrders,
        pendingOrders: activeOrders,
        menuItems,
        activeTables,
        totalTables: 20
      });
    } catch (dbError) {
      console.error('getDashboardStats dbError:', dbError);
      res.status(503).json({ message: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Public route behind the customer's "Call the waiter" / "Ask for bill" buttons
export const callStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawSlug = (req.params.slug as string || '').trim();
    const { tableNumber, type, customerName } = req.body || {};
    const callType = String(type || '').toUpperCase();

    if (!['WAITER', 'BILL'].includes(callType) || !tableNumber) {
      res.status(400).json({ message: 'Valid table number and type are required' });
      return;
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: { OR: [{ slug: rawSlug }, { id: rawSlug }, { slug: rawSlug.toLowerCase() }] },
      select: { id: true, isActive: true },
    });
    if (!restaurant || !restaurant.isActive) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const cleanTable = String(tableNumber).replace(/^Table\s*#?/i, '').trim() || '1';
    const key = `${restaurant.id}:${cleanTable}:${callType}`;
    const now = Date.now();
    if (now - (lastCallAt.get(key) || 0) < 20_000) {
      res.json({ message: 'Staff already notified', throttled: true });
      return;
    }
    lastCallAt.set(key, now);

    notifyStaffCall(restaurant.id, {
      tableNumber: cleanTable,
      type: callType as 'WAITER' | 'BILL',
      customerName: customerName ? String(customerName).trim() : undefined,
      at: new Date().toISOString(),
    });

    res.json({ message: 'Staff notified' });
  } catch (error) {
    console.error('callStaff error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDashboardOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId: string = req.user?.restaurantId as string;
    if (!restaurantId) {
      res.status(403).json({ message: 'Restaurant context required' });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parallel fetch for stats, active orders, and subscription
    const [statsRes, ordersRes, subRes] = await Promise.all([
      query(`
        WITH stats AS (
          SELECT
            COUNT(*) FILTER (WHERE "createdAt" >= $2) AS today_orders,
            COALESCE(SUM("totalAmount") FILTER (WHERE "createdAt" >= $2 AND "status" != 'REJECTED'), 0) AS today_revenue,
            COUNT(*) FILTER (WHERE "status" IN ('PENDING', 'ACCEPTED', 'PREPARING', 'READY')) AS active_orders,
            COUNT(DISTINCT "tableNumber") FILTER (WHERE "status" IN ('PENDING', 'ACCEPTED', 'PREPARING', 'READY')) AS active_tables
          FROM "Order"
          WHERE "restaurantId" = $1
        ),
        items AS (
          SELECT COUNT(*) AS menu_items FROM "FoodItem" WHERE "restaurantId" = $1
        )
        SELECT
          stats.today_orders,
          stats.today_revenue,
          stats.active_orders,
          stats.active_tables,
          items.menu_items
        FROM stats CROSS JOIN items;
      `, [restaurantId, today]).catch(() => ({ rows: [] })),

      query(`
        SELECT
          o.id,
          o."billNo",
          o."billedAt",
          o."gstEnabled",
          o."serviceChargePct",
          o."gstAmount",
          o."serviceAmount",
          o."finalAmount",
          o."estimatedReadyAt",
          o."customerName",
          o."tableNumber",
          o."phoneNumber",
          o."specialInstructions" AS notes,
          o.status,
          o."totalAmount",
          o."restaurantId",
          o."createdAt",
          o."updatedAt",
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', oi.id,
                  'quantity', oi.quantity,
                  'batch', oi.batch,
                  'price', oi.price,
                  'foodItemId', oi."foodItemId",
                  'foodItem', json_build_object(
                    'id', fi.id,
                    'name', fi.name,
                    'price', fi.price,
                    'imageUrl', fi."imageUrl"
                  )
                )
                ORDER BY oi.batch, oi.id
              )
              FROM "OrderItem" oi
              LEFT JOIN "FoodItem" fi ON fi.id = oi."foodItemId"
              WHERE oi."orderId" = o.id
            ),
            '[]'::json
          ) AS items
        FROM "Order" o
        WHERE o."restaurantId" = $1
          AND o.status::text = ANY(ARRAY['PENDING', 'ACCEPTED', 'PREPARING'])
        ORDER BY o."createdAt" DESC
        LIMIT 50;
      `, [restaurantId]).catch(() => ({ rows: [] })),

      query(`
        SELECT 
          r.id, r.name, r.slug, r."isActive", r."subscriptionStatus",
          s.id as sub_id, s.status as sub_status, s."planName" as sub_plan_name, 
          s."amountPaid" as sub_amount_paid, s."paymentReference" as sub_payment_reference, 
          s."validUntil" as sub_valid_until
        FROM "Restaurant" r
        LEFT JOIN "Subscription" s ON s."restaurantId" = r.id
        WHERE r.id = $1 LIMIT 1;
      `, [restaurantId]).catch(() => ({ rows: [] }))
    ]);

    const statRow = statsRes.rows[0] || {};
    const todayOrders = parseInt(statRow.today_orders || '0', 10);
    const todayRevenue = parseFloat(statRow.today_revenue || '0');
    const activeOrders = parseInt(statRow.active_orders || '0', 10);
    const activeTables = parseInt(statRow.active_tables || '0', 10);
    const menuItems = parseInt(statRow.menu_items || '0', 10);

    const stats = {
      todayOrders,
      todayRevenue,
      todaySales: todayRevenue,
      activeOrders,
      pendingOrders: activeOrders,
      menuItems,
      activeTables,
      totalTables: 20
    };

    const orders = ordersRes.rows || [];

    // Parse subscription
    let subscription: any = { isSubscribed: false, status: 'PENDING', daysRemaining: 0 };
    if (subRes.rows.length) {
      const row = subRes.rows[0];
      const now = new Date();
      const hasEverPaid = Boolean(
        row.sub_id &&
        Number(row.sub_amount_paid || 0) > 0 &&
        row.sub_payment_reference &&
        String(row.sub_payment_reference).trim() !== ''
      );
      if (hasEverPaid && row.sub_valid_until) {
        const validUntil = new Date(row.sub_valid_until);
        if (validUntil > now && (row.sub_status === 'ACTIVE' || row.sub_status === 'TRIAL')) {
          subscription = {
            isSubscribed: true,
            status: row.sub_status,
            planName: row.sub_plan_name,
            validUntil: row.sub_valid_until,
            daysRemaining: Math.max(0, Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
            amountPaid: row.sub_amount_paid
          };
        } else {
          subscription = {
            isSubscribed: false,
            status: 'EXPIRED',
            planName: row.sub_plan_name,
            validUntil: row.sub_valid_until,
            daysRemaining: 0
          };
        }
      }
    }

    // Latest feedback ab database se aata hai
    const feedback = await prisma.feedback.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({
      stats,
      orders,
      subscription,
      feedback
    });
  } catch (error) {
    console.error('getDashboardOverview error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── DASHBOARD: kisi bhi din / date range ka hisaab (calendar ke liye) ───
// GET /orders/range-stats?from=YYYY-MM-DD&to=YYYY-MM-DD   (dates India time IST me)
export const getRangeStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId as string;
    if (!restaurantId) {
      res.status(403).json({ message: 'Restaurant context required' });
      return;
    }

    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    let from = String(req.query.from || '');
    let to = String(req.query.to || from);

    if (!dateRe.test(from) || !dateRe.test(to)) {
      res.status(400).json({ message: 'from and to must be in YYYY-MM-DD format' });
      return;
    }
    if (from > to) [from, to] = [to, from];

    const spanDays = Math.round((Date.parse(to) - Date.parse(from)) / 86400000);
    if (spanDays > 365) {
      res.status(400).json({ message: 'Date range cannot be longer than 365 days' });
      return;
    }

    // createdAt UTC me store hota hai, usse India time (IST) me badal kar din ke hisaab se group karte hain
    const LOCAL = `((o."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata')`;
    const WHERE = `o."restaurantId" = $1 AND ${LOCAL} >= $2::date AND ${LOCAL} < ($3::date + INTERVAL '1 day')`;
    const params = [restaurantId, from, to];

    const fromUtc = new Date(`${from}T00:00:00+05:30`);
    const toUtc = new Date(`${to}T23:59:59.999+05:30`);

    const [summaryRes, dailyRes, topRes, hourlyRes, statusRes, recentRes, fbAgg] = await Promise.all([
      query(
        `SELECT
           COUNT(*) FILTER (WHERE o.status <> 'REJECTED') AS orders,
           COALESCE(SUM(o."totalAmount") FILTER (WHERE o.status <> 'REJECTED'), 0) AS revenue,
           COUNT(*) FILTER (WHERE o.status = 'REJECTED') AS rejected,
           COUNT(DISTINCT o."tableNumber") FILTER (WHERE o.status <> 'REJECTED') AS tables_served
         FROM "Order" o
         WHERE ${WHERE};`,
        params
      ),
      query(
        `SELECT
           to_char(${LOCAL}::date, 'YYYY-MM-DD') AS day,
           COUNT(*) FILTER (WHERE o.status <> 'REJECTED') AS orders,
           COALESCE(SUM(o."totalAmount") FILTER (WHERE o.status <> 'REJECTED'), 0) AS revenue
         FROM "Order" o
         WHERE ${WHERE}
         GROUP BY 1
         ORDER BY 1;`,
        params
      ),
      query(
        `SELECT fi.name AS name,
                SUM(oi.quantity)::int AS qty,
                COALESCE(SUM(oi.quantity * oi.price), 0) AS revenue
         FROM "OrderItem" oi
         JOIN "Order" o ON o.id = oi."orderId"
         JOIN "FoodItem" fi ON fi.id = oi."foodItemId"
         WHERE ${WHERE} AND o.status <> 'REJECTED'
         GROUP BY fi.name
         ORDER BY qty DESC
         LIMIT 5;`,
        params
      ),
      query(
        `SELECT EXTRACT(HOUR FROM ${LOCAL})::int AS hour, COUNT(*)::int AS orders
         FROM "Order" o
         WHERE ${WHERE} AND o.status <> 'REJECTED'
         GROUP BY 1
         ORDER BY 1;`,
        params
      ),
      query(
        `SELECT o.status AS status, COUNT(*)::int AS count
         FROM "Order" o
         WHERE ${WHERE}
         GROUP BY o.status;`,
        params
      ),
      query(
        `SELECT o.id, o."billNo", o."tableNumber", o."customerName", o."totalAmount", o.status, o."createdAt"
         FROM "Order" o
         WHERE ${WHERE}
         ORDER BY o."createdAt" DESC
         LIMIT 8;`,
        params
      ),
      prisma.feedback.aggregate({
        where: { restaurantId, createdAt: { gte: fromUtc, lte: toUtc } },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);

    const sRow = summaryRes.rows[0] || {};
    const orders = parseInt(sRow.orders || '0', 10);
    const revenue = parseFloat(sRow.revenue || '0');

    const statusBreakdown: Record<string, number> = {};
    statusRes.rows.forEach((r: any) => {
      statusBreakdown[r.status] = Number(r.count) || 0;
    });

    res.json({
      from,
      to,
      summary: {
        orders,
        revenue,
        rejected: parseInt(sRow.rejected || '0', 10),
        tablesServed: parseInt(sRow.tables_served || '0', 10),
        avgOrderValue: orders > 0 ? revenue / orders : 0,
      },
      daily: dailyRes.rows.map((r: any) => ({
        day: r.day,
        orders: parseInt(r.orders || '0', 10),
        revenue: parseFloat(r.revenue || '0'),
      })),
      hourly: hourlyRes.rows.map((r: any) => ({ hour: Number(r.hour), orders: Number(r.orders) })),
      topDishes: topRes.rows.map((r: any) => ({
        name: r.name,
        qty: Number(r.qty) || 0,
        revenue: parseFloat(r.revenue || '0'),
      })),
      statusBreakdown,
      feedback: {
        average: Number(fbAgg._avg.rating || 0),
        count: fbAgg._count._all,
      },
      recent: recentRes.rows,
    });
  } catch (error) {
    console.error('getRangeStats error:', error);
    res.status(500).json({ message: 'Failed to load dashboard data' });
  }
};