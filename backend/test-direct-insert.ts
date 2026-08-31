import { db, query } from './src/lib/db';
import bcrypt from 'bcryptjs';

async function testInsert() {
  try {
    console.log("⚡ Connecting to Neon PostgreSQL and creating a new hotel...");
    
    const email = 'taj@palacedining.com';
    const hashedPassword = await bcrypt.hash('password123', 10);
    const hotelId = 'hotel-' + Math.random().toString(36).substring(2, 8);
    const userId = 'user-' + Math.random().toString(36).substring(2, 8);
    const slug = 'taj-palace-' + Math.random().toString(36).substring(2, 6);

    // Insert Restaurant
    const resRest = await query(
      `INSERT INTO "Restaurant" ("id", "name", "slug", "address", "phone", "subscriptionStatus", "isActive")
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE', true)
       RETURNING *;`,
      [hotelId, 'Taj Palace Fine Dining', slug, 'Apollo Bunder, Mumbai', '+91 22 6665 3366']
    );
    console.log("✅ Restaurant inserted into Neon DB:", resRest.rows[0]);

    // Insert User
    const resUser = await query(
      `INSERT INTO "User" ("id", "email", "password", "name", "role", "restaurantId")
       VALUES ($1, $2, $3, $4, 'RESTAURANT_ADMIN', $5)
       RETURNING "id", "email", "name", "role", "restaurantId";`,
      [userId, email, hashedPassword, 'General Manager', hotelId]
    );
    console.log("✅ User inserted into Neon DB:", resUser.rows[0]);

    // Verify all restaurants currently in Neon DB
    const allHotels = await query(`SELECT "id", "name", "slug", "createdAt" FROM "Restaurant";`);
    console.log("📋 All Hotels currently in Neon DB:", allHotels.rows);

  } catch (err) {
    console.error("❌ Test insert error:", err);
  } finally {
    await db.end();
  }
}

testInsert();
