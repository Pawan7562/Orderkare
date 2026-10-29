import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { query } from '../lib/db';
import cache from '../lib/cache';

export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId: string = req.user?.restaurantId as string;

    try {
      const resCategories = await query(`
        SELECT 
          c.id, c.name, c."isActive", c."orderIndex",
          json_build_object('foodItems', COUNT(f.id)::int) as _count
        FROM "Category" c
        LEFT JOIN "FoodItem" f ON f."categoryId" = c.id
        WHERE c."restaurantId" = $1
        GROUP BY c.id
        ORDER BY c."orderIndex" ASC;
      `, [restaurantId]);

      res.json({ categories: resCategories.rows });
    } catch (dbError) {
      res.status(503).json({ message: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('getCategories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId: string = req.user?.restaurantId as string;
    const { name } = req.body;
    if (!name) { res.status(400).json({ message: 'Name is required' }); return; }

    try {
      const maxIndex = await prisma.category.findFirst({
        where: { restaurantId },
        orderBy: { orderIndex: 'desc' },
        select: { orderIndex: true },
      });

      const category = await prisma.category.create({
        data: { name, restaurantId, orderIndex: (maxIndex?.orderIndex ?? -1) + 1 },
      });

      // Invalidate public menu cache
      cache.delByPrefix('menu:public:').catch(() => {});

      res.status(201).json({ category });
    } catch (dbError) {
      res.status(503).json({ message: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('createCategory error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId: string = req.user?.restaurantId as string;
    const id = req.params.id as string;
    const { name, isActive, orderIndex } = req.body;

    try {
      const category = await prisma.category.findFirst({ where: { id, restaurantId } });
      if (!category) { res.status(404).json({ message: 'Category not found' }); return; }

      const updated = await prisma.category.update({
        where: { id },
        data: { ...(name !== undefined && { name }), ...(isActive !== undefined && { isActive }), ...(orderIndex !== undefined && { orderIndex }) },
      });

      // Invalidate public menu cache
      cache.delByPrefix('menu:public:').catch(() => {});

      res.json({ category: updated });
    } catch (dbError) {
      res.status(503).json({ message: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('updateCategory error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId: string = req.user?.restaurantId as string;
    const id = req.params.id as string;

    try {
      const category = await prisma.category.findFirst({ where: { id, restaurantId } });
      if (!category) { res.status(404).json({ message: 'Category not found' }); return; }

      await prisma.foodItem.deleteMany({ where: { categoryId: id, restaurantId } });
      await prisma.category.delete({ where: { id } });

      // Invalidate public menu cache
      cache.delByPrefix('menu:public:').catch(() => {});

      res.json({ message: 'Category deleted' });
    } catch (dbError) {
      res.status(503).json({ message: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('deleteCategory error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPublicCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug as string;
    const cacheKey = `menu:public:categories:${slug.toLowerCase()}`;

    try {
      const data = await cache.getOrSet(cacheKey, 60, async () => {
        const restaurant = await prisma.restaurant.findUnique({
          where: { slug },
          select: { id: true, name: true, logoUrl: true, bannerUrl: true, isActive: true },
        });
        if (!restaurant || !restaurant.isActive) return null;

        const categories = await prisma.category.findMany({
          where: { restaurantId: restaurant.id, isActive: true },
          orderBy: { orderIndex: 'asc' },
        });

        return {
          categories,
          restaurant: {
            id: restaurant.id,
            name: restaurant.name,
            logoUrl: restaurant.logoUrl,
            bannerUrl: restaurant.bannerUrl,
          },
        };
      });

      if (!data) { res.status(404).json({ message: 'Restaurant not found' }); return; }
      res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=30');
      res.json(data);
    } catch (dbError) {
      res.status(503).json({ message: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('getPublicCategories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
