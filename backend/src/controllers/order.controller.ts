import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { notifyNewOrder, notifyOrderStatusUpdate } from '../utils/socket';
import { prisma } from '../lib/prisma';
import { OrderStatus } from '@prisma/client';

const feedbackStore: any[] = [];

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug as string;
    const { customerName, tableNumber, phoneNumber, items } = req.body;

    if (!customerName || !tableNumber || !items || !items.length) {
      res.status(400).json({ message: 'Customer name, table number, and items are required' });
      return;
    }

    try {
      const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
      if (!restaurant || !restaurant.isActive) {
        res.status(404).json({ message: 'Restaurant not found or inactive' });
        return;
      }

      const foodIds = items.map((i: any) => i.foodItemId);
      const foodItems = await prisma.foodItem.findMany({
        where: { id: { in: foodIds }, restaurantId: restaurant.id, isAvailable: true },
      });

      if (foodItems.length !== foodIds.length) {
        res.status(400).json({ message: 'Some items are unavailable or invalid' });
        return;
      }

      const foodMap = new Map(foodItems.map(f => [f.id, f]));
      let totalAmount = 0;
      const orderItemsData = items.map((item: any) => {
        const food = foodMap.get(item.foodItemId)!;
        totalAmount += food.price * item.quantity;
        return {
          foodItemId: item.foodItemId,
          quantity: item.quantity,
          price: food.price,
        };
      });

      const order = await prisma.order.create({
        data: {
          customerName,
          tableNumber,
          phoneNumber,
          totalAmount,
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

      notifyNewOrder(restaurant.id, order);
      res.status(201).json({ order });
    } catch (dbError) {
      res.status(503).json({ message: 'Database temporarily unavailable' });
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
          totalAmount: true,
          status: true,
          createdAt: true,
          restaurant: { select: { name: true } },
          items: { include: { foodItem: { select: { name: true, price: true } } } },
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
      if (status) {
        const statusArray = (status as string).split(',');
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
    const status = typeof rawStatus === 'string' ? rawStatus : Array.isArray(rawStatus) ? rawStatus[0] : '';

    if (!status) {
      res.status(400).json({ message: 'Order status is required' });
      return;
    }

    try {
      const order = await prisma.order.findFirst({ where: { id, restaurantId } });
      if (!order) { res.status(404).json({ message: 'Order not found' }); return; }

      const updated = await prisma.order.update({ where: { id }, data: { status: status as OrderStatus } });
      notifyOrderStatusUpdate(id, status);
      res.json({ order: updated });
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
    const { rating, comment, customerName } = req.body || {};
    const parsedRating = Number(rating);

    if (!id || Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      res.status(400).json({ message: 'Valid rating is required.' });
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
    const foodSummary = order.items.map((item: any) => item.foodItem?.name || item.name).join(', ');

    const payload = {
      id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      orderId: id,
      restaurantId,
      customerName: customerName || order.customerName || 'Guest',
      foodName: foodSummary,
      rating: parsedRating,
      comment: comment || '',
      createdAt: new Date().toISOString(),
    };

    feedbackStore.push(payload);

    res.status(201).json({ feedback: payload, message: 'Feedback submitted successfully.' });
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
