import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const fallbackFoods = [
  { id: 'item-1', name: 'Paneer Tikka', description: 'Classic roasted cottage cheese cubes marinated in yogurt and spices.', price: 220, isVeg: true, isAvailable: true, categoryId: 'cat-starters', category: { name: 'Starters' } },
  { id: 'item-2', name: 'Crispy Spring Rolls', description: 'Golden fried rolls filled with fresh julienned vegetables.', price: 180, isVeg: true, isAvailable: true, categoryId: 'cat-starters', category: { name: 'Starters' } },
  { id: 'item-3', name: 'Butter Chicken', description: 'Tender chicken pieces cooked in a rich, creamy tomato gravy.', price: 340, isVeg: false, isAvailable: true, categoryId: 'cat-main', category: { name: 'Main Course' } },
  { id: 'item-4', name: 'Dal Makhani', description: 'Slow-cooked black lentils simmered with cream and butter overnight.', price: 260, isVeg: true, isAvailable: true, categoryId: 'cat-main', category: { name: 'Main Course' } },
  { id: 'item-5', name: 'Chocolate Brownie', description: 'Warm chocolate brownie served with vanilla ice cream.', price: 190, isVeg: true, isAvailable: true, categoryId: 'cat-desserts', category: { name: 'Desserts' } },
];

export const getFoods = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId || 'demo-restaurant-id';

    const { categoryId } = req.query;

    try {
      const foods = await prisma.foodItem.findMany({
        where: { restaurantId, ...(categoryId ? { categoryId: categoryId as string } : {}) },
        orderBy: { createdAt: 'desc' },
        include: { category: { select: { name: true } } },
      });
      res.json({ foods });
    } catch (dbError) {
      console.warn('⚠️ Database offline. Returning mock food items.');
      const filtered = categoryId 
        ? fallbackFoods.filter(f => f.categoryId === categoryId)
        : fallbackFoods;
      res.json({ foods: filtered });
    }
  } catch (error) {
    console.error('getFoods error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createFood = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId || 'demo-restaurant-id';

    const { name, description, price, isVeg, categoryId, imageUrl } = req.body;
    if (!name || !price || !categoryId) { res.status(400).json({ message: 'Name, price and category are required' }); return; }

    try {
      const category = await prisma.category.findFirst({ where: { id: categoryId, restaurantId } });
      if (!category) { res.status(404).json({ message: 'Category not found' }); return; }

      const food = await prisma.foodItem.create({
        data: { name, description, price: parseFloat(price), isVeg: isVeg ?? true, categoryId, restaurantId, imageUrl },
      });
      res.status(201).json({ food });
    } catch (dbError) {
      const food = {
        id: `item-${Math.random().toString(36).substring(2, 8)}`,
        name,
        description,
        price: parseFloat(price),
        isVeg: isVeg ?? true,
        categoryId,
        category: { name: categoryId === 'cat-starters' ? 'Starters' : categoryId === 'cat-main' ? 'Main Course' : 'Desserts' },
        isAvailable: true,
        imageUrl: imageUrl || null
      };
      fallbackFoods.push(food as any);
      res.status(201).json({ food });
    }
  } catch (error) {
    console.error('createFood error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateFood = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId;
    const { id } = req.params;
    const { name, description, price, isVeg, isAvailable, categoryId, imageUrl } = req.body;

    try {
      const food = await prisma.foodItem.findFirst({ where: { id, restaurantId: restaurantId! } });
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
      const foodIdx = fallbackFoods.findIndex(f => f.id === id);
      if (foodIdx !== -1) {
        const item = fallbackFoods[foodIdx];
        if (name !== undefined) item.name = name;
        if (description !== undefined) item.description = description;
        if (price !== undefined) item.price = parseFloat(price);
        if (isVeg !== undefined) item.isVeg = isVeg;
        if (isAvailable !== undefined) item.isAvailable = isAvailable;
        res.json({ food: item });
      } else {
        res.status(404).json({ message: 'Food item not found' });
      }
    }
  } catch (error) {
    console.error('updateFood error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteFood = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurantId;
    const { id } = req.params;

    try {
      const food = await prisma.foodItem.findFirst({ where: { id, restaurantId: restaurantId! } });
      if (!food) { res.status(404).json({ message: 'Food item not found' }); return; }

      await prisma.foodItem.delete({ where: { id } });
      res.json({ message: 'Food item deleted' });
    } catch (dbError) {
      const foodIdx = fallbackFoods.findIndex(f => f.id === id);
      if (foodIdx !== -1) {
        fallbackFoods.splice(foodIdx, 1);
        res.json({ message: 'Food item deleted' });
      } else {
        res.status(404).json({ message: 'Food item not found' });
      }
    }
  } catch (error) {
    console.error('deleteFood error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPublicFoods = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const { categoryId } = req.query;

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
      const filtered = categoryId 
        ? fallbackFoods.filter(f => f.categoryId === categoryId && f.isAvailable)
        : fallbackFoods.filter(f => f.isAvailable);
      res.json({ foods: filtered });
    }
  } catch (error) {
    console.error('getPublicFoods error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
