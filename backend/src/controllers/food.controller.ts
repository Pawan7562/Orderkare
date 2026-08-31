import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const fallbackFoods = [
  { id: 'item-1', name: 'Paneer Tikka', description: 'Classic roasted cottage cheese cubes marinated in yogurt and spices.', price: 220, isVeg: true, isAvailable: true, categoryId: 'cat-starters', category: { name: 'Starters' } },
  { id: 'item-2', name: 'Veg Spring Rolls', description: 'Crispy rolls filled with seasoned shredded vegetables.', price: 180, isVeg: true, isAvailable: true, categoryId: 'cat-starters', category: { name: 'Starters' } },
  { id: 'item-3', name: 'Butter Chicken', description: 'Tender chicken pieces cooked in rich, creamy tomato butter gravy.', price: 340, isVeg: false, isAvailable: true, categoryId: 'cat-main', category: { name: 'Main Course' } },
  { id: 'item-4', name: 'Dal Makhani', description: 'Slow cooked black lentils simmered with butter and fresh cream.', price: 260, isVeg: true, isAvailable: true, categoryId: 'cat-main', category: { name: 'Main Course' } },
  { id: 'item-5', name: 'Mango Lassi', description: 'Traditional creamy sweet yogurt drink blended with ripe mangoes.', price: 120, isVeg: true, isAvailable: true, categoryId: 'cat-beverages', category: { name: 'Beverages' } },
  { id: 'item-6', name: 'Chocolate Brownie', description: 'Warm fudge brownie topped with rich dark chocolate drizzle.', price: 160, isVeg: true, isAvailable: true, categoryId: 'cat-desserts', category: { name: 'Desserts' } },
];

export const getFoods = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId: string = (req.user?.restaurantId as string) || 'demo-restaurant-id';
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
      console.warn('⚠️ Database offline. Returning mock food items.');
      const filtered = categoryId ? fallbackFoods.filter(f => f.categoryId === categoryId) : fallbackFoods;
      res.json({ foods: filtered });
    }
  } catch (error) {
    console.error('getFoods error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createFood = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId: string = (req.user?.restaurantId as string) || 'demo-restaurant-id';
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
      const newFood = {
        id: `item-${Date.now()}`,
        name,
        description,
        price: parseFloat(price),
        isVeg: isVeg !== undefined ? isVeg : true,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        categoryId,
        imageUrl,
        category: { name: 'Custom' },
      };
      fallbackFoods.unshift(newFood);
      res.status(201).json({ food: newFood });
    }
  } catch (error) {
    console.error('createFood error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateFood = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const restaurantId: string = (req.user?.restaurantId as string) || 'demo-restaurant-id';
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
    const restaurantId: string = (req.user?.restaurantId as string) || 'demo-restaurant-id';
    const id = req.params.id as string;

    try {
      const food = await prisma.foodItem.findFirst({ where: { id, restaurantId } });
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
      res.json({ foods: fallbackFoods });
    }
  } catch (error) {
    console.error('getPublicFoods error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
