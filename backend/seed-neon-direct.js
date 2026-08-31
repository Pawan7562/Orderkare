const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const bcrypt = require('bcryptjs');

neonConfig.webSocketConstructor = ws;

const connectionString = "postgresql://neondb_owner:npg_6qwSBRlnKui4@ep-silent-darkness-aeuf1dek-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function main() {
  console.log("⚡ Connecting to Neon PostgreSQL via Serverless WebSocket (Port 443)...");
  const pool = new Pool({ connectionString });

  try {
    // 1. Create Enums
    console.log("📦 Creating database enums & schema...");
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'STAFF');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'REJECTED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIAL', 'EXPIRED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create Tables
    console.log("🛠️ Creating tables...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Restaurant" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "logoUrl" TEXT,
        "bannerUrl" TEXT,
        "address" TEXT,
        "phone" TEXT,
        "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "role" "Role" NOT NULL DEFAULT 'RESTAURANT_ADMIN',
        "restaurantId" TEXT REFERENCES "Restaurant"("id") ON DELETE SET NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Category" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "orderIndex" INT NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "restaurantId" TEXT NOT NULL REFERENCES "Restaurant"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "FoodItem" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "price" DOUBLE PRECISION NOT NULL,
        "isVeg" BOOLEAN NOT NULL DEFAULT true,
        "isAvailable" BOOLEAN NOT NULL DEFAULT true,
        "imageUrl" TEXT,
        "categoryId" TEXT NOT NULL REFERENCES "Category"("id") ON DELETE CASCADE,
        "restaurantId" TEXT NOT NULL REFERENCES "Restaurant"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Table" (
        "id" TEXT PRIMARY KEY,
        "tableNumber" TEXT NOT NULL,
        "qrCodeUrl" TEXT,
        "isOccupied" BOOLEAN NOT NULL DEFAULT false,
        "restaurantId" TEXT NOT NULL REFERENCES "Restaurant"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Order" (
        "id" TEXT PRIMARY KEY,
        "customerName" TEXT NOT NULL,
        "tableNumber" TEXT NOT NULL,
        "phoneNumber" TEXT,
        "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
        "totalAmount" DOUBLE PRECISION NOT NULL,
        "restaurantId" TEXT NOT NULL REFERENCES "Restaurant"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "OrderItem" (
        "id" TEXT PRIMARY KEY,
        "orderId" TEXT NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
        "foodItemId" TEXT NOT NULL REFERENCES "FoodItem"("id") ON DELETE CASCADE,
        "quantity" INT NOT NULL DEFAULT 1,
        "price" DOUBLE PRECISION NOT NULL
      );
    `);

    // 3. Seed Super Admin & Restaurant Admin
    console.log("🌱 Seeding production data into Neon PostgreSQL...");
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Insert Super Admin
    await pool.query(`
      INSERT INTO "User" ("id", "email", "password", "name", "role")
      VALUES ('user-superadmin', 'superadmin@orderkare.com', $1, 'Super Admin', 'SUPER_ADMIN')
      ON CONFLICT ("email") DO UPDATE SET "password" = $1;
    `, [hashedPassword]);

    // Insert Demo Restaurant
    await pool.query(`
      INSERT INTO "Restaurant" ("id", "name", "slug", "address", "phone", "subscriptionStatus", "isActive")
      VALUES ('demo-restaurant-id', 'Royal Palace Dining', 'royal-palace', 'Sector 62, Noida', '+91 98765 43210', 'ACTIVE', true)
      ON CONFLICT ("slug") DO NOTHING;
    `);

    // Insert Restaurant Admin User
    await pool.query(`
      INSERT INTO "User" ("id", "email", "password", "name", "role", "restaurantId")
      VALUES ('user-demo-admin', 'demo@restaurant.com', $1, 'Royal Palace Admin', 'RESTAURANT_ADMIN', 'demo-restaurant-id')
      ON CONFLICT ("email") DO UPDATE SET "restaurantId" = 'demo-restaurant-id', "password" = $1;
    `, [hashedPassword]);

    // Insert Categories
    const categories = [
      { id: 'cat-starters', name: 'Starters', orderIndex: 1 },
      { id: 'cat-main', name: 'Main Course', orderIndex: 2 },
      { id: 'cat-beverages', name: 'Beverages', orderIndex: 3 },
      { id: 'cat-desserts', name: 'Desserts', orderIndex: 4 },
    ];

    for (const c of categories) {
      await pool.query(`
        INSERT INTO "Category" ("id", "name", "orderIndex", "restaurantId")
        VALUES ($1, $2, $3, 'demo-restaurant-id')
        ON CONFLICT ("id") DO NOTHING;
      `, [c.id, c.name, c.orderIndex]);
    }

    // Insert Food Items
    const foods = [
      {
        id: 'item-1',
        name: 'Paneer Tikka Specially Grilled',
        description: 'Fresh cottage cheese marinated in hung curd, spices and chargrilled in clay tandoor.',
        price: 220,
        isVeg: true,
        imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&q=80',
        categoryId: 'cat-starters',
      },
      {
        id: 'item-2',
        name: 'Crispy Veg Spring Rolls',
        description: 'Golden wok-fried spring rolls filled with crunchy garden vegetables & glass noodles.',
        price: 180,
        isVeg: true,
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
        categoryId: 'cat-starters',
      },
      {
        id: 'item-3',
        name: 'Royal Butter Chicken',
        description: 'Tender chicken smoked in tandoor & simmered in rich creamy tomato cashew gravy.',
        price: 340,
        isVeg: false,
        imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=400&q=80',
        categoryId: 'cat-main',
      },
      {
        id: 'item-4',
        name: 'Dal Makhani Shahi',
        description: 'Slow cooked black lentils simmered overnight with white butter, cream & fresh spices.',
        price: 260,
        isVeg: true,
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80',
        categoryId: 'cat-main',
      },
      {
        id: 'item-5',
        name: 'Classic Mango Lassi',
        description: 'Thick churned sweet yogurt blended with fresh Alphonso mango pulp.',
        price: 120,
        isVeg: true,
        imageUrl: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?auto=format&fit=crop&w=400&q=80',
        categoryId: 'cat-beverages',
      },
      {
        id: 'item-6',
        name: 'Chocolate Lava Cake',
        description: 'Warm cocoa cake with molten chocolate core served with vanilla bean scoop.',
        price: 190,
        isVeg: true,
        imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80',
        categoryId: 'cat-desserts',
      },
    ];

    for (const f of foods) {
      await pool.query(`
        INSERT INTO "FoodItem" ("id", "name", "description", "price", "isVeg", "imageUrl", "categoryId", "restaurantId")
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'demo-restaurant-id')
        ON CONFLICT ("id") DO NOTHING;
      `, [f.id, f.name, f.description, f.price, f.isVeg, f.imageUrl, f.categoryId]);
    }

    // Insert Tables
    for (let t = 1; t <= 10; t++) {
      const tableNum = t < 10 ? `0${t}` : `${t}`;
      await pool.query(`
        INSERT INTO "Table" ("id", "tableNumber", "restaurantId")
        VALUES ($1, $2, 'demo-restaurant-id')
        ON CONFLICT ("id") DO NOTHING;
      `, [`table-${t}`, tableNum]);
    }

    console.log("✅ SUCCESS! Neon PostgreSQL database schema & initial seed populated 100%!");
  } catch (err) {
    console.error("❌ Neon Database Error:", err);
  } finally {
    await pool.end();
  }
}

main();
