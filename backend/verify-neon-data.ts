import { query, db } from './src/lib/db';

async function listAll() {
  try {
    const restaurants = await query(`SELECT "id", "name", "slug", "createdAt" FROM "Restaurant" ORDER BY "createdAt" DESC;`);
    console.log("=== ALL RESTAURANTS IN NEON POSTGRESQL ===");
    console.table(restaurants.rows);

    const users = await query(`SELECT "id", "email", "name", "role", "restaurantId", "createdAt" FROM "User" ORDER BY "createdAt" DESC;`);
    console.log("=== ALL USERS IN NEON POSTGRESQL ===");
    console.table(users.rows);

    const categories = await query(`SELECT "id", "name", "restaurantId" FROM "Category" ORDER BY "createdAt" DESC;`);
    console.log("=== TOTAL CATEGORIES IN NEON ===", categories.rows.length);

    const foods = await query(`SELECT "id", "name", "price", "restaurantId" FROM "FoodItem" ORDER BY "createdAt" DESC;`);
    console.log("=== TOTAL FOOD ITEMS IN NEON ===", foods.rows.length);
  } catch (e) {
    console.error(e);
  } finally {
    await db.end();
  }
}

listAll();
