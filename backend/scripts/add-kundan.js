const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const connectionString = process.env.DATABASE_URL;

async function run() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to DB.');

  // Find the primary restaurant (Royal Palace)
  const restRes = await client.query('SELECT id, name, slug FROM "Restaurant" WHERE slug = $1 LIMIT 1;', ['royal-palace']);
  const restaurant = restRes.rows[0];
  if (!restaurant) {
    throw new Error('Restaurant royal-palace not found');
  }
  console.log('Found restaurant:', restaurant);

  // Hash standard password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Insert or update Kundan@gmail.com
  const email = 'kundan@gmail.com';
  const name = 'Kundan (Hotel Admin)';
  const id = `user-kundan-${Date.now()}`;

  await client.query(`
    INSERT INTO "User" ("id", "email", "password", "name", "role", "restaurantId", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, 'RESTAURANT_ADMIN', $5, NOW(), NOW())
    ON CONFLICT ("email")
    DO UPDATE SET "password" = $3, "role" = 'RESTAURANT_ADMIN', "restaurantId" = $5, "name" = $4;
  `, [id, email, hashedPassword, name, restaurant.id]);

  console.log(`✅ Kundan account successfully created/updated in database!`);
  console.log(`Email: ${email}`);
  console.log(`Password: password123`);
  console.log(`Role: RESTAURANT_ADMIN`);
  console.log(`Restaurant: ${restaurant.name} (${restaurant.slug})`);

  await client.end();
}

run().catch(err => {
  console.error('Error adding Kundan:', err);
  process.exit(1);
});
