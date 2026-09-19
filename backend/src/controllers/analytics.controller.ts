import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

export const getRestaurantAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId as string;
    const timeRange = (req.query.range as string) || 'today';

    if (!restaurantId) {
      res.status(403).json({ message: 'Restaurant context required' });
      return;
    }

    const now = new Date();
    let startDate = new Date();

    if (timeRange === 'week') {
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === 'month') {
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // today
      startDate.setHours(0, 0, 0, 0);
    }

    // 1. Fetch Orders for this restaurant in the time range
    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: startDate },
        status: { not: 'REJECTED' },
      },
      include: {
        items: {
          include: {
            foodItem: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const avgTicket = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // 2. Aggregate Popular Items
    const itemMap = new Map<string, { name: string; orders: number; revenue: number }>();
    const categoryMap = new Map<string, number>();

    for (const order of orders) {
      for (const item of order.items) {
        const food = item.foodItem;
        if (food) {
          const prev = itemMap.get(food.id) || { name: food.name, orders: 0, revenue: 0 };
          prev.orders += item.quantity;
          prev.revenue += (Number(item.price) || Number(food.price) || 0) * item.quantity;
          itemMap.set(food.id, prev);

          if (food.category?.name) {
            const catCount = categoryMap.get(food.category.name) || 0;
            categoryMap.set(food.category.name, catCount + item.quantity);
          }
        }
      }
    }

    const popularItems = Array.from(itemMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(item => ({
        name: item.name,
        orders: item.orders,
        revenue: `₹${item.revenue.toLocaleString('en-IN')}`,
        percentage: totalRevenue > 0 ? `${Math.round((item.revenue / totalRevenue) * 100)}%` : '0%',
      }));

    // Find top performing category
    let topCategory = 'None yet';
    let maxCatCount = 0;
    categoryMap.forEach((count, cat) => {
      if (count > maxCatCount) {
        maxCatCount = count;
        topCategory = cat;
      }
    });

    // 3. Daily breakdown for the last 7 days chart
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);

      const dayOrders = orders.filter(o => {
        const od = new Date(o.createdAt);
        return od >= d && od < nextD;
      });

      const dayRevenue = dayOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
      chartData.push({
        day: days[d.getDay()],
        revenue: dayRevenue,
        orders: dayOrders.length,
      });
    }

    res.json({
      timeRange,
      stats: {
        sales: `₹${totalRevenue.toLocaleString('en-IN')}`,
        salesRaw: totalRevenue,
        orders: totalOrders,
        avgTicket: `₹${avgTicket.toLocaleString('en-IN')}`,
        active: orders.filter(o => ['PENDING', 'ACCEPTED', 'PREPARING'].includes(o.status)).length,
        topCategory,
      },
      popularItems,
      chartData,
    });
  } catch (error) {
    console.error('getRestaurantAnalytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};
