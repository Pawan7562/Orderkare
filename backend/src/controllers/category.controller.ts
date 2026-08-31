import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

// In-memory mock store in case DB is offline
const fallbackCategories = [
  { id: 'cat-starters', name: 'Starters', orderIndex: 1, isActive: true, _count: { foodItems: 4 } },
  { id: 'cat-main', name: 'Main Course', orderIndex: 2, isActive: true, _count: { foodItems: 6 } },
  { id: 'cat-beverages', name: 'Beverages', orderIndex: 3, isActive: true, _count: { foodItems: 3 } },
  { id: 'cat-desserts', name: 'Desserts', orderIndex: 4, isActive: true, _count: { foodItems: 2 } },
];

export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId: string = (req.user?.restaurantId as string) || 'demo-restaurant-id';

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
    const restaurantId: string = (req.user?.restaurantId as string) || 'demo-restaurant-id';
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
      const newCat = {
        id: `cat-${Date.now()}`,
        name,
        orderIndex: fallbackCategories.length + 1,
        isActive: true,
        _count: { foodItems: 0 },
      };
      fallbackCategories.push(newCat);
      res.status(201).json({ category: newCat });
    }
  } catch (error) {
    console.error('createCategory error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId: string = (req.user?.restaurantId as string) || 'demo-restaurant-id';
    const id = req.params.id as string;
    const { name, isActive, orderIndex } = req.body;

    try {
      const category = await prisma.category.findFirst({ where: { id, restaurantId } });
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
    const restaurantId: string = (req.user?.restaurantId as string) || 'demo-restaurant-id';
    const id = req.params.id as string;

    try {
      const category = await prisma.category.findFirst({ where: { id, restaurantId } });
      if (!category) { res.status(404).json({ message: 'Category not found' }); return; }

      await prisma.foodItem.deleteMany({ where: { categoryId: id, restaurantId } });
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
    const slug = req.params.slug as string;
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
        restaurant: { id: 'demo-restaurant-id', name: 'Royal Palace Dining', logoUrl: null, bannerUrl: null },
      });
    }
  } catch (error) {
    console.error('getPublicCategories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
