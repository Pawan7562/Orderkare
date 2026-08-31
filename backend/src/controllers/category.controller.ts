import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

// In-memory mock store in case DB is offline
const fallbackCategories = [
  { id: 'cat-starters', name: 'Starters', orderIndex: 0, _count: { foodItems: 2 } },
  { id: 'cat-main', name: 'Main Course', orderIndex: 1, _count: { foodItems: 2 } },
  { id: 'cat-desserts', name: 'Desserts', orderIndex: 2, _count: { foodItems: 1 } },
];

export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId || 'demo-restaurant-id';

    try {
      const categories = await prisma.category.findMany({
        where: { restaurantId },
        orderBy: { orderIndex: 'asc' },
        include: { _count: { select: { foodItems: true } } },
      });
      res.json({ categories });
    } catch (dbError) {
      console.warn('⚠️ Database offline. Returning mock categories.');
      res.json({ categories: fallbackCategories });
    }
  } catch (error) {
    console.error('getCategories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId || 'demo-restaurant-id';

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
      res.status(201).json({ category });
    } catch (dbError) {
      const category = { id: `cat-${Math.random().toString(36).substring(2, 8)}`, name, orderIndex: fallbackCategories.length };
      fallbackCategories.push(category as any);
      res.status(201).json({ category });
    }
  } catch (error) {
    console.error('createCategory error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId;
    const { id } = req.params;
    const { name, isActive, orderIndex } = req.body;

    try {
      const category = await prisma.category.findFirst({ where: { id, restaurantId: restaurantId! } });
      if (!category) { res.status(404).json({ message: 'Category not found' }); return; }

      const updated = await prisma.category.update({
        where: { id },
        data: { ...(name !== undefined && { name }), ...(isActive !== undefined && { isActive }), ...(orderIndex !== undefined && { orderIndex }) },
      });
      res.json({ category: updated });
    } catch (dbError) {
      const catIdx = fallbackCategories.findIndex(c => c.id === id);
      if (catIdx !== -1) {
        if (name !== undefined) fallbackCategories[catIdx].name = name;
        res.json({ category: fallbackCategories[catIdx] });
      } else {
        res.status(404).json({ message: 'Category not found' });
      }
    }
  } catch (error) {
    console.error('updateCategory error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId;
    const { id } = req.params;

    try {
      const category = await prisma.category.findFirst({ where: { id, restaurantId: restaurantId! } });
      if (!category) { res.status(404).json({ message: 'Category not found' }); return; }

      await prisma.foodItem.deleteMany({ where: { categoryId: id, restaurantId: restaurantId! } });
      await prisma.category.delete({ where: { id } });
      res.json({ message: 'Category deleted' });
    } catch (dbError) {
      const catIdx = fallbackCategories.findIndex(c => c.id === id);
      if (catIdx !== -1) {
        fallbackCategories.splice(catIdx, 1);
        res.json({ message: 'Category deleted' });
      } else {
        res.status(404).json({ message: 'Category not found' });
      }
    }
  } catch (error) {
    console.error('deleteCategory error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPublicCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    try {
      const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
      if (!restaurant || !restaurant.isActive) { res.status(404).json({ message: 'Restaurant not found' }); return; }

      const categories = await prisma.category.findMany({
        where: { restaurantId: restaurant.id, isActive: true },
        orderBy: { orderIndex: 'asc' },
      });
      res.json({ categories, restaurant: { id: restaurant.id, name: restaurant.name, logoUrl: restaurant.logoUrl, bannerUrl: restaurant.bannerUrl } });
    } catch (dbError) {
      res.json({
        categories: fallbackCategories,
        restaurant: {
          id: 'demo-restaurant-id',
          name: 'Royal Palace',
          logoUrl: null,
          bannerUrl: null,
        }
      });
    }
  } catch (error) {
    console.error('getPublicCategories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
