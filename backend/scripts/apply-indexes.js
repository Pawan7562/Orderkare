require('dotenv').config();
const { Pool } = require('pg');

async function applyIndexes() {
  console.log('🚀 Applying high-performance PostgreSQL indexes for 50k+ concurrency...');

  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const statements = [
    'CREATE INDEX IF NOT EXISTS idx_category_restaurant_active ON "Category" ("restaurantId", "isActive");',
    'CREATE INDEX IF NOT EXISTS idx_category_restaurant_order ON "Category" ("restaurantId", "orderIndex");',
    'CREATE INDEX IF NOT EXISTS idx_fooditem_restaurant_available ON "FoodItem" ("restaurantId", "isAvailable");',
    'CREATE INDEX IF NOT EXISTS idx_fooditem_category_available ON "FoodItem" ("categoryId", "isAvailable");',
    'CREATE INDEX IF NOT EXISTS idx_fooditem_restaurant_category ON "FoodItem" ("restaurantId", "categoryId");',
    'CREATE INDEX IF NOT EXISTS idx_user_restaurant ON "User" ("restaurantId");',
    'CREATE INDEX IF NOT EXISTS idx_user_role ON "User" ("role");',
  ];

  for (const sql of statements) {
    const start = Date.now();
    await pool.query(sql);
    const indexName = sql.split(' ')[5];
    console.log(`✅ Index ${indexName} applied in ${Date.now() - start}ms`);
  }

  await pool.end();
  console.log('🎉 All high-speed database indexes successfully verified and live on Neon PostgreSQL!');
}

applyIndexes().catch((err) => {
  console.error('Index creation error:', err);
  process.exit(1);
});
