import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getPublicMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawSlug = (req.params.slug as string || '').trim();

    try {
      // Find restaurant strictly by slug or id (case-insensitive or direct match)
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
        res.status(404).json({ message: `Restaurant "${rawSlug}" not found or inactive` });
        return;
      }

      // Check subscription
      const sub = await prisma.subscription.findUnique({
        where: { restaurantId: restaurant.id },
      });

      const now = new Date();
      const isSubscriptionActive = sub && sub.validUntil && new Date(sub.validUntil) > now && ['ACTIVE', 'TRIAL'].includes(sub.status);

      const [categories, foods] = await Promise.all([
        prisma.category.findMany({
          where: { restaurantId: restaurant.id, isActive: true },
          orderBy: { orderIndex: 'asc' },
        }),
        prisma.foodItem.findMany({
          where: { restaurantId: restaurant.id, isAvailable: true },
          include: { category: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      res.json({
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          logoUrl: restaurant.logoUrl,
          bannerUrl: restaurant.bannerUrl,
          address: restaurant.address,
          phone: restaurant.phone,
          isSubscriptionActive: Boolean(isSubscriptionActive),
          subscriptionStatus: sub?.status || 'PENDING',
        },
        isSubscriptionActive: Boolean(isSubscriptionActive),
        categories,
        foods,
      });
    } catch (dbError) {
      console.error('getPublicMenu dbError:', dbError);
      res.status(503).json({ message: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('getPublicMenu error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
