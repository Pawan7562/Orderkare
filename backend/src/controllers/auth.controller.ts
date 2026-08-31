import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { generateToken } from '../utils/jwt';
import { query } from '../lib/db';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, restaurantName, address, phone } = req.body;

    if (!email || !password || !name || !restaurantName) {
      res.status(400).json({ message: 'All required fields (Name, Email, Password, Restaurant Name) must be provided' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const slug = restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
    const hashedPassword = await bcrypt.hash(password, 10);
    const hotelId = 'hotel-' + Math.random().toString(36).substring(2, 8);
    const userId = 'user-' + Math.random().toString(36).substring(2, 8);

    // 1. Check if user exists in Neon DB
    const existingUser = await query(`SELECT * FROM "User" WHERE "email" = $1 LIMIT 1;`, [cleanEmail]);
    if (existingUser.rows && existingUser.rows.length > 0) {
      res.status(400).json({ message: 'Email already registered. Please sign in.' });
      return;
    }

    // 2. Insert Restaurant directly into Neon PostgreSQL
    const restRes = await query(
      `INSERT INTO "Restaurant" ("id", "name", "slug", "address", "phone", "subscriptionStatus", "isActive")
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE', true)
       RETURNING *;`,
      [hotelId, restaurantName, slug, address || 'Main City Plaza', phone || '']
    );
    const restaurant = restRes.rows[0];

    // 3. Insert User directly into Neon PostgreSQL
    const userRes = await query(
      `INSERT INTO "User" ("id", "email", "password", "name", "role", "restaurantId")
       VALUES ($1, $2, $3, $4, 'RESTAURANT_ADMIN', $5)
       RETURNING "id", "email", "name", "role", "restaurantId";`,
      [userId, cleanEmail, hashedPassword, name, hotelId]
    );
    const user = userRes.rows[0];

    // 4. Auto-create starter menu categories and food items in Neon PostgreSQL
    try {
      const catStartersId = 'cat-' + Math.random().toString(36).substring(2, 8);
      const catMainId = 'cat-' + Math.random().toString(36).substring(2, 8);
      const catDrinksId = 'cat-' + Math.random().toString(36).substring(2, 8);

      await query(
        `INSERT INTO "Category" ("id", "name", "orderIndex", "restaurantId")
         VALUES ($1, 'Starters', 1, $4), ($2, 'Main Course', 2, $4), ($3, 'Beverages', 3, $4);`,
        [catStartersId, catMainId, catDrinksId, hotelId]
      );

      // Add starter dishes
      await query(
        `INSERT INTO "FoodItem" ("id", "name", "description", "price", "isVeg", "imageUrl", "categoryId", "restaurantId")
         VALUES 
         ($1, 'Chef Special Paneer Tikka', 'Tandoori roasted cottage cheese cubes marinated in herbs.', 220, true, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&q=80', $4, $7),
         ($2, 'Royal Signature Curry', 'Creamy rich aromatic curry cooked with slow-simmered spices.', 320, true, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80', $5, $7),
         ($3, 'Fresh Mint Mojito', 'Chilled sparkling lime refresher with crushed garden mint.', 140, true, 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=400&q=80', $6, $7);`,
        [
          'item-' + Math.random().toString(36).substring(2, 8),
          'item-' + Math.random().toString(36).substring(2, 8),
          'item-' + Math.random().toString(36).substring(2, 8),
          catStartersId,
          catMainId,
          catDrinksId,
          hotelId
        ]
      );

      // Add Tables 01 to 05
      for (let i = 1; i <= 5; i++) {
        const tableNum = i < 10 ? `0${i}` : `${i}`;
        await query(
          `INSERT INTO "Table" ("id", "tableNumber", "restaurantId")
           VALUES ($1, $2, $3);`,
          ['table-' + Math.random().toString(36).substring(2, 8), tableNum, hotelId]
        );
      }
    } catch (seedErr) {
      console.warn('Optional starter seed warning:', seedErr);
    }

    const fullUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      restaurantId: hotelId,
      restaurant
    };

    const token = generateToken({
      id: user.id,
      role: user.role,
      restaurantId: hotelId
    });

    res.status(201).json({
      message: 'Account and Restaurant created successfully',
      token,
      user: fullUser,
      restaurant
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query Neon PostgreSQL for User
    const userRes = await query(
      `SELECT u."id", u."email", u."password", u."name", u."role", u."restaurantId",
              r."name" as "restaurantName", r."slug" as "restaurantSlug", r."address" as "restaurantAddress",
              r."phone" as "restaurantPhone", r."logoUrl" as "restaurantLogo", r."isActive" as "restaurantIsActive"
       FROM "User" u
       LEFT JOIN "Restaurant" r ON u."restaurantId" = r."id"
       WHERE u."email" = $1 LIMIT 1;`,
      [cleanEmail]
    );

    if (userRes.rows && userRes.rows.length > 0) {
      const dbUser = userRes.rows[0];
      const isMatch = await bcrypt.compare(password, dbUser.password);

      if (isMatch) {
        const restaurantObj = dbUser.restaurantId ? {
          id: dbUser.restaurantId,
          name: dbUser.restaurantName,
          slug: dbUser.restaurantSlug,
          address: dbUser.restaurantAddress,
          phone: dbUser.restaurantPhone,
          logoUrl: dbUser.restaurantLogo,
          isActive: dbUser.restaurantIsActive
        } : null;

        const userPayload = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          restaurantId: dbUser.restaurantId,
          restaurant: restaurantObj
        };

        const token = generateToken({
          id: dbUser.id,
          role: dbUser.role,
          restaurantId: dbUser.restaurantId
        });

        res.json({ token, user: userPayload });
        return;
      }
    }

    res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMe = async (req: Request | any, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    const userRes = await query(
      `SELECT u."id", u."email", u."name", u."role", u."restaurantId",
              r."name" as "restaurantName", r."slug" as "restaurantSlug", r."address" as "restaurantAddress",
              r."phone" as "restaurantPhone", r."logoUrl" as "restaurantLogo", r."isActive" as "restaurantIsActive"
       FROM "User" u
       LEFT JOIN "Restaurant" r ON u."restaurantId" = r."id"
       WHERE u."id" = $1 LIMIT 1;`,
      [userId]
    );

    if (userRes.rows && userRes.rows.length > 0) {
      const dbUser = userRes.rows[0];
      const restaurantObj = dbUser.restaurantId ? {
        id: dbUser.restaurantId,
        name: dbUser.restaurantName,
        slug: dbUser.restaurantSlug,
        address: dbUser.restaurantAddress,
        phone: dbUser.restaurantPhone,
        logoUrl: dbUser.restaurantLogo,
        isActive: dbUser.restaurantIsActive
      } : null;

      res.json({
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          restaurantId: dbUser.restaurantId,
          restaurant: restaurantObj
        }
      });
      return;
    }

    res.status(404).json({ message: 'User not found' });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
