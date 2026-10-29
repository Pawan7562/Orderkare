import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import cache from '../lib/cache';

export const getPublicMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawSlug = (req.params.slug as string || '').trim();
    if (!rawSlug) {
      res.status(400).json({ message: 'Restaurant identifier is required' });
      return;
    }

    const cacheKey = `menu:public:${rawSlug.toLowerCase()}`;

    try {
      // High-performance cached retrieval (60s TTL, invalidated on item/category edit)
      const menuPayload = await cache.getOrSet(cacheKey, 60, async () => {
        // Find restaurant strictly by slug or id
        const restaurant = await prisma.restaurant.findFirst({
          where: {
            OR: [
              { slug: rawSlug },
              { id: rawSlug },
              { slug: rawSlug.toLowerCase() },
            ],
          },
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            bannerUrl: true,
            address: true,
            phone: true,
            isActive: true,
          },
        });

        if (!restaurant || !restaurant.isActive) {
          return null;
        }

        // Check subscription
        const sub = await prisma.subscription.findUnique({
          where: { restaurantId: restaurant.id },
          select: {
            status: true,
            validUntil: true,
          },
        });

        const now = new Date();
        const isSubscriptionActive =
          sub &&
          sub.validUntil &&
          new Date(sub.validUntil) > now &&
          ['ACTIVE', 'TRIAL'].includes(sub.status);

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

        return {
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
        };
      });

      if (!menuPayload) {
        res.status(404).json({ message: `Restaurant "${rawSlug}" not found or inactive` });
        return;
      }

      // Add HTTP caching headers for client browsers (public cache with ETag)
      res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=30');
      res.json(menuPayload);
    } catch (dbError) {
      console.error('getPublicMenu dbError:', dbError);
      res.status(503).json({ message: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('getPublicMenu error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
