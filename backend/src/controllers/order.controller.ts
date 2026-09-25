import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { notifyNewOrder, notifyOrderStatusUpdate, notifyNewFeedback } from '../utils/socket';
import { prisma } from '../lib/prisma';
import { query } from '../lib/db';
import { OrderStatus } from '@prisma/client';

const feedbackStore: any[] = [];

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawSlug = (req.params.slug as string || '').trim();
    const { customerName, tableNumber, phoneNumber, items, notes, specialInstructions } = req.body;

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

      const order = await prisma.order.create({
        data: {
          customerName: cleanCustomerName,
          tableNumber: cleanTableNumber,
          phoneNumber: cleanPhone,
          notes: cleanNotes,
          totalAmount: Math.round(totalAmount * 100) / 100,
          restaurantId: restaurant.id,
          status: 'PENDING',
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: { foodItem: true },
          },
        },
      });

      console.log(`✅ Order created successfully: ID=${order.id}, Table=${order.tableNumber}, Notes="${order.notes || ''}", Restaurant=${restaurant.name} (${restaurant.id})`);

      // Dispatch real-time notifications to hotel admin
      notifyNewOrder(restaurant.id, order);

      res.status(201).json({ order, message: 'Order placed successfully' });
    } catch (dbError) {
      console.error('Database error in createOrder:', dbError);
      res.status(503).json({ message: 'Database temporarily unavailable. Please try again in a moment.' });
    }
  } catch (error) {
    console.error('createOrder error:', error);
    res.status(500).json({ message: 'Internal server error' });
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
                  'price', oi.price,
                  'foodItemId', oi."foodItemId",
                  'foodItem', json_build_object(
                    'id', fi.id,
                    'name', fi.name,
                    'price', fi.price,
                    'imageUrl', fi."imageUrl"
                  )
                )
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
    const foodSummary = order.items.map((item: any) => item.foodItem?.name || item.name).filter(Boolean).join(', ') || 'Custom Dining Order';

    const payload = {
      id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      orderId: id,
      restaurantId,
      customerName: customerName || order.customerName || 'Guest',
      tableNumber: order.tableNumber || '',
      foodName: foodSummary,
      rating: parsedRating,
      tags: Array.isArray(tags) ? tags : [],
      favoriteDishes: Array.isArray(favoriteDishes) ? favoriteDishes : [],
      comment: comment ? String(comment).trim() : '',
      createdAt: new Date().toISOString(),
    };

    feedbackStore.unshift(payload);
    // Keep max 200 feedback entries in memory
    if (feedbackStore.length > 200) feedbackStore.pop();

    // Broadcast in real-time to Hotel Admin dashboard
    notifyNewFeedback(restaurantId, payload);

    res.status(201).json({ feedback: payload, message: 'Thank you! Your feedback has been received.' });
  } catch (error) {
    console.error('submitOrderFeedback error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getRestaurantFeedback = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId as string;
    const feedback = feedbackStore
      .filter((entry) => entry.restaurantId === restaurantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);

    const averageRating = feedback.length
      ? (feedback.reduce((total, entry) => total + Number(entry.rating || 0), 0) / feedback.length).toFixed(1)
      : '0.0';

    res.json({
      feedback,
      averageRating,
      totalRatings: feedback.length,
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
                  'price', oi.price,
                  'foodItemId', oi."foodItemId",
                  'foodItem', json_build_object(
                    'id', fi.id,
                    'name', fi.name,
                    'price', fi.price,
                    'imageUrl', fi."imageUrl"
                  )
                )
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

    const feedback = feedbackStore.filter(f => f.restaurantId === restaurantId);

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

