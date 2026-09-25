import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import type { PoolClient } from 'pg';
import { Role } from '@prisma/client';
import { generateToken } from '../utils/jwt';
import { db, query } from '../lib/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { validateRealEmail } from '../utils/emailValidator';

export const register = async (req: Request, res: Response): Promise<void> => {
  let client: PoolClient | undefined;
  try {
    const { email, password, name, restaurantName, address, phone } = req.body;

    if (!email || !password || !name || !restaurantName) {
      res.status(400).json({ message: 'All required fields (Name, Email, Password, Restaurant Name) must be provided' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const emailValidation = await validateRealEmail(cleanEmail);
    if (!emailValidation.valid) {
      res.status(400).json({ message: emailValidation.reason || 'Please provide a genuine, active email address.' });
      return;
    }

    if (typeof password !== 'string' || password.length < 6 || password.length > 100) {
      res.status(400).json({ message: 'Password must be between 6 and 100 characters long.' });
      return;
    }

    const cleanName = String(name).trim().slice(0, 100);
    const cleanRestaurant = String(restaurantName).trim().slice(0, 120);
    const cleanAddress = String(address || 'Main City Plaza').trim().slice(0, 255);
    const cleanPhone = String(phone || '').trim().slice(0, 25);

    client = await db.connect();
    const slug = cleanRestaurant.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
    const hashedPassword = await bcrypt.hash(password, 10);
    const hotelId = 'hotel-' + Math.random().toString(36).substring(2, 8);
    const userId = 'user-' + Math.random().toString(36).substring(2, 8);

    await client.query('BEGIN');

    // 1. Check if user exists in Neon DB
    const existingUser = await client.query(`SELECT "id" FROM "User" WHERE "email" = $1 LIMIT 1;`, [cleanEmail]);
    if (existingUser.rows && existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      res.status(400).json({ message: 'Email already registered. Please sign in.' });
      return;
    }

    // 2. Insert the restaurant in its initial pending state.
    const restRes = await client.query(
      `INSERT INTO "Restaurant" ("id", "name", "slug", "address", "phone")
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [hotelId, cleanRestaurant, slug, cleanAddress, cleanPhone]
    );
    const restaurant = restRes.rows[0];

    // 3. Insert User directly into Neon PostgreSQL
    const userRes = await client.query(
      `INSERT INTO "User" ("id", "email", "password", "name", "role", "restaurantId")
       VALUES ($1, $2, $3, $4, 'RESTAURANT_ADMIN', $5)
       RETURNING "id", "email", "name", "role", "restaurantId";`,
      [userId, cleanEmail, hashedPassword, cleanName, hotelId]
    );
    const user = userRes.rows[0];

    // 4. Create initial PENDING Subscription record
    const subId = 'sub-' + Math.random().toString(36).substring(2, 8);
    await client.query(
      `INSERT INTO "Subscription" ("id", "status", "planName", "validUntil", "amountPaid", "restaurantId")
       VALUES ($1, 'PENDING', 'NONE', NOW(), 0, $2)
       ON CONFLICT ("restaurantId") DO NOTHING;`,
      [subId, hotelId]
    );

    await client.query('COMMIT');

    // Newly created admin starts with clean state
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
    await client?.query('ROLLBACK').catch(() => {});
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  } finally {
    client?.release();
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

import { registerPushToken } from '../utils/push';

export const savePushToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pushToken, restaurantId: bodyRestId } = req.body;
    const restaurantId = req.user?.restaurantId || bodyRestId || 'global_all';

    if (!pushToken || typeof pushToken !== 'string') {
      res.status(400).json({ message: 'Valid pushToken is required' });
      return;
    }

    registerPushToken(restaurantId, pushToken);
    
    res.json({ message: 'Push token registered successfully', pushToken, restaurantId });
  } catch (error) {
    console.error('savePushToken error:', error);
    res.status(500).json({ message: 'Failed to save push token' });
  }
};

// Hotel Admin / User: Request Password Reset Verification Code
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: 'Email address is required' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRes = await query(
      `SELECT id, email, name, role FROM "User" WHERE LOWER(email) = $1 LIMIT 1;`,
      [cleanEmail]
    );

    if (!userRes.rows.length) {
      res.status(404).json({ message: 'No registered hotel admin account found with this email.' });
      return;
    }

    // Generate 6-digit verification security code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins validity

    await query(
      `UPDATE "User" SET "resetToken" = $1, "resetTokenExpiry" = $2 WHERE LOWER(email) = $3;`,
      [resetCode, expiry, cleanEmail]
    );

    res.json({
      message: 'Password reset verification code generated.',
      email: cleanEmail,
      ...(process.env.NODE_ENV !== 'production' ? { resetCode } : {}),
      expiresIn: '15 minutes'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to process password reset request.' });
  }
};

// Hotel Admin / User: Verify Code & Set New Password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      res.status(400).json({ message: 'Email, verification code, and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters long.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRes = await query(
      `SELECT id, email, "resetToken", "resetTokenExpiry" FROM "User" WHERE LOWER(email) = $1 LIMIT 1;`,
      [cleanEmail]
    );

    if (!userRes.rows.length) {
      res.status(404).json({ message: 'Account not found.' });
      return;
    }

    const user = userRes.rows[0];

    if (!user.resetToken || user.resetToken.trim() !== String(code).trim()) {
      res.status(400).json({ message: 'Invalid or incorrect 6-digit verification code.' });
      return;
    }

    if (user.resetTokenExpiry && new Date(user.resetTokenExpiry) < new Date()) {
      res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await query(
      `UPDATE "User" SET "password" = $1, "resetToken" = NULL, "resetTokenExpiry" = NULL, "updatedAt" = NOW() WHERE "id" = $2;`,
      [hashedPassword, user.id]
    );

    res.json({
      message: 'Password has been reset successfully! You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password. Please try again.' });
  }
};

