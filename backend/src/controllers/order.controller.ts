import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { notifyNewOrder, notifyOrderStatusUpdate, notifyNewFeedback } from '../utils/socket';
import { prisma } from '../lib/prisma';
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
      // Find restaurant by slug or id
      let restaurant = await prisma.restaurant.findFirst({
        where: {
          OR: [
            { slug: rawSlug },
            { id: rawSlug },
            { slug: rawSlug.toLowerCase() },
          ],
        },
      });

      if (!restaurant) {
        // Fallback: try finding first active restaurant if demo
        if (rawSlug === 'demo' || rawSlug === 'royal-palace') {
          restaurant = await prisma.restaurant.findFirst({ where: { isActive: true } });
        }
      }

      if (!restaurant || !restaurant.isActive) {
        res.status(404).json({ message: `Restaurant "${rawSlug}" not found or currently inactive` });
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
      const skip = ((parseInt(page as string) || 1) - 1) * take;

      const where: any = { restaurantId };
      if (status && status !== 'ALL') {
        const statusArray = (status as string).split(',').map(s => s.trim().toUpperCase());
        where.status = { in: statusArray };
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            items: {
              include: { foodItem: { select: { id: true, name: true, price: true, imageUrl: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
          take,
          skip,
        }),
        prisma.order.count({ where }),
      ]);

      res.json({ orders, total, page: parseInt(page as string) || 1, totalPages: Math.ceil(total / take) });
    } catch (dbError) {
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
  try {
    const restaurantId: string = req.user?.restaurantId as string;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalOrdersToday, totalRevenueAgg, activeOrdersCount, menuItemsCount] = await Promise.all([
        prisma.order.count({ where: { restaurantId, createdAt: { gte: today } } }),
        prisma.order.aggregate({
          where: { restaurantId, createdAt: { gte: today }, status: { not: 'REJECTED' } },
          _sum: { totalAmount: true },
        }),
        prisma.order.count({
          where: { restaurantId, status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] } },
        }),
        prisma.foodItem.count({ where: { restaurantId } }),
      ]);

      const rev = totalRevenueAgg._sum.totalAmount || 0;

      res.json({
        todayOrders: totalOrdersToday,
        todayRevenue: rev,
        todaySales: rev,
        activeOrders: activeOrdersCount,
        pendingOrders: activeOrdersCount,
        menuItems: menuItemsCount,
        activeTables: 0,
        totalTables: 20
      });
    } catch (dbError) {
      res.status(503).json({ message: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
