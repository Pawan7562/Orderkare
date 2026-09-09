import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

export const getFoods = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId: string = req.user?.restaurantId as string;
    const { categoryId } = req.query;

    try {
      const foods = await prisma.foodItem.findMany({
        where: {
          restaurantId,
          ...(categoryId ? { categoryId: categoryId as string } : {}),
        },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ foods });
    } catch (dbError) {
      res.status(503).json({ message: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('getFoods error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createFood = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId: string = req.user?.restaurantId as string;
    const { name, description, price, isVeg, isAvailable, categoryId, imageUrl } = req.body;

    if (!name || price === undefined || !categoryId) {
      res.status(400).json({ message: 'Name, price, and categoryId are required' });
      return;
    }

    try {
      const food = await prisma.foodItem.create({
        data: {
          name,
          description,
          price: parseFloat(price),
          isVeg: isVeg !== undefined ? isVeg : true,
          isAvailable: isAvailable !== undefined ? isAvailable : true,
          categoryId,
          restaurantId,
          imageUrl,
        },
        include: { category: true },
      });
      res.status(201).json({ food });
    } catch (dbError) {
      res.status(503).json({ message: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('createFood error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateFood = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId: string = req.user?.restaurantId as string;
    const id = req.params.id as string;
    const { name, description, price, isVeg, isAvailable, categoryId, imageUrl } = req.body;

    try {
      const food = await prisma.foodItem.findFirst({ where: { id, restaurantId } });
      if (!food) { res.status(404).json({ message: 'Food item not found' }); return; }

      const updated = await prisma.foodItem.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(price !== undefined && { price: parseFloat(price) }),
          ...(isVeg !== undefined && { isVeg }),
          ...(isAvailable !== undefined && { isAvailable }),
          ...(categoryId !== undefined && { categoryId }),
          ...(imageUrl !== undefined && { imageUrl }),
        },
      });
      res.json({ food: updated });
    } catch (dbError) {
      res.status(503).json({ message: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('updateFood error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteFood = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId: string = req.user?.restaurantId as string;
    const id = req.params.id as string;

    try {
      const food = await prisma.foodItem.findFirst({ where: { id, restaurantId } });
      if (!food) { res.status(404).json({ message: 'Food item not found' }); return; }

      await prisma.foodItem.delete({ where: { id } });
      res.json({ message: 'Food item deleted' });
    } catch (dbError) {
      res.status(503).json({ message: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('deleteFood error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPublicFoods = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug as string;
    const categoryId = req.query.categoryId as string | undefined;

    try {
      const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
      if (!restaurant || !restaurant.isActive) { res.status(404).json({ message: 'Restaurant not found' }); return; }

      const foods = await prisma.foodItem.findMany({
        where: {
          restaurantId: restaurant.id,
          isAvailable: true,
          ...(categoryId ? { categoryId: categoryId as string } : {}),
          category: { isActive: true },
        },
        include: { category: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ foods });
    } catch (dbError) {
      res.status(503).json({ message: 'Database temporarily unavailable' });
    }
  } catch (error) {
    console.error('getPublicFoods error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
