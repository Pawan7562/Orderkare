const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const connectionString = process.env.DATABASE_URL;

async function seed() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to Neon database for full seed.');

  const hashedPassword = await bcrypt.hash('password123', 10);
  const myPassword = await bcrypt.hash('mypassword123', 10);

  // 1. Ensure Super Admins
  const superAdmins = [
    { email: 'superadmin@orderkare.com', name: 'OrderKare Super Admin', pass: hashedPassword },
    { email: 'admin@orderkare.com', name: 'System Administrator', pass: hashedPassword },
    { email: 'pawankumaryadav75628697@gmail.com', name: 'Pawan Kumar', pass: hashedPassword }
  ];

  for (const sa of superAdmins) {
    await client.query(`
      INSERT INTO "User" ("id", "email", "password", "name", "role", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, 'SUPER_ADMIN', NOW(), NOW())
      ON CONFLICT ("email") 
      DO UPDATE SET "password" = $3, "role" = 'SUPER_ADMIN', "name" = $4;
    `, [`sa-${Math.random().toString(36).slice(2, 9)}`, sa.email, sa.pass, sa.name]);
    console.log(`✅ Super Admin ready: ${sa.email}`);
  }

  // 2. Ensure Restaurants
  const restaurantDefs = [
    {
      name: 'Royal Palace Dining',
      slug: 'royal-palace',
      address: 'Tech Hub Complex, Sector 62, Noida, India',
      phone: '+91 98765 43210'
    },
    {
      name: 'Spicewood Bistro',
      slug: 'spicewood-bistro',
      address: 'Connaught Place, New Delhi',
      phone: '+91 99887 76655'
    },
    {
      name: 'Le Meridien Gourmet',
      slug: 'le-meridien-gourmet',
      address: 'Windsor Place, New Delhi',
      phone: '+91 11 2371 0101'
    }
  ];

  const restaurantIds = {};

  for (const r of restaurantDefs) {
    const res = await client.query(`
      INSERT INTO "Restaurant" ("id", "name", "slug", "address", "phone", "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
      ON CONFLICT ("slug") 
      DO UPDATE SET "name" = $2, "address" = $4, "phone" = $5, "isActive" = true
      RETURNING "id";
    `, [`res-${r.slug}`, r.name, r.slug, r.address, r.phone]);

    const actualId = res.rows[0].id;
    restaurantIds[r.slug] = actualId;

    // Active Subscription for each
    await client.query(`
      INSERT INTO "Subscription" ("id", "restaurantId", "status", "planName", "amountPaid", "paymentReference", "validUntil", "createdAt", "updatedAt")
      VALUES ($1, $2, 'ACTIVE', 'Annual Enterprise', 1999, 'PAY_VERIFIED_REF', NOW() + INTERVAL '365 days', NOW(), NOW())
      ON CONFLICT ("restaurantId")
      DO UPDATE SET "status" = 'ACTIVE', "validUntil" = NOW() + INTERVAL '365 days', "amountPaid" = 1999, "paymentReference" = 'PAY_VERIFIED_REF';
    `, [`sub-${actualId}`, actualId]);

    console.log(`🏨 Restaurant & Active Subscription ready: ${r.name} (id: ${actualId})`);
  }

  // 3. Ensure Hotel Admins
  const hotelAdmins = [
    { email: 'demo@restaurant.com', name: 'Rajesh Kumar (Manager)', slug: 'royal-palace', pass: hashedPassword },
    { email: 'hoteladmin@orderkare.com', name: 'Hotel Administrator', slug: 'royal-palace', pass: hashedPassword },
    { email: 'aman@spicewood.com', name: 'Aman Sharma', slug: 'spicewood-bistro', pass: myPassword },
    { email: 'karan@lemeridien.com', name: 'Karan Mehra', slug: 'le-meridien-gourmet', pass: hashedPassword }
  ];

  for (const ha of hotelAdmins) {
    const rId = restaurantIds[ha.slug];
    await client.query(`
      INSERT INTO "User" ("id", "email", "password", "name", "role", "restaurantId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, 'RESTAURANT_ADMIN', $5, NOW(), NOW())
      ON CONFLICT ("email")
      DO UPDATE SET "password" = $3, "role" = 'RESTAURANT_ADMIN', "restaurantId" = $5, "name" = $4;
    `, [`ha-${Math.random().toString(36).slice(2, 9)}`, ha.email, ha.pass, ha.name, rId]);
    console.log(`👤 Hotel Admin ready: ${ha.email} (Restaurant: ${ha.slug})`);
  }

  // 4. Ensure Categories & Food Items for Royal Palace
  const royalId = restaurantIds['royal-palace'];
  const categories = [
    { id: `cat-starters-${royalId}`, name: 'Starters', orderIndex: 1 },
    { id: `cat-main-${royalId}`, name: 'Main Course', orderIndex: 2 },
    { id: `cat-beverages-${royalId}`, name: 'Beverages', orderIndex: 3 },
    { id: `cat-desserts-${royalId}`, name: 'Desserts', orderIndex: 4 },
  ];

  for (const c of categories) {
    await client.query(`
      INSERT INTO "Category" ("id", "name", "orderIndex", "restaurantId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT ("id") DO NOTHING;
    `, [c.id, c.name, c.orderIndex, royalId]);
  }

  const foods = [
    { id: `item-1-${royalId}`, name: 'Paneer Tikka Specially Grilled', description: 'Fresh cottage cheese chargrilled in tandoor.', price: 220, isVeg: true, categoryId: `cat-starters-${royalId}` },
    { id: `item-2-${royalId}`, name: 'Crispy Veg Spring Rolls', description: 'Golden fried rolls with garden vegetables.', price: 180, isVeg: true, categoryId: `cat-starters-${royalId}` },
    { id: `item-3-${royalId}`, name: 'Royal Butter Chicken', description: 'Tender chicken in rich creamy tomato cashew gravy.', price: 340, isVeg: false, categoryId: `cat-main-${royalId}` },
    { id: `item-4-${royalId}`, name: 'Dal Makhani Shahi', description: 'Slow cooked black lentils with white butter.', price: 260, isVeg: true, categoryId: `cat-main-${royalId}` },
    { id: `item-5-${royalId}`, name: 'Classic Mango Lassi', description: 'Thick sweet yogurt blended with Alphonso mango.', price: 120, isVeg: true, categoryId: `cat-beverages-${royalId}` },
    { id: `item-6-${royalId}`, name: 'Chocolate Brownie with Ice Cream', description: 'Warm fudge brownie served with vanilla scoop.', price: 190, isVeg: true, categoryId: `cat-desserts-${royalId}` },
  ];

  for (const f of foods) {
    await client.query(`
      INSERT INTO "FoodItem" ("id", "name", "description", "price", "isVeg", "isAvailable", "categoryId", "restaurantId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, true, $6, $7, NOW(), NOW())
      ON CONFLICT ("id") DO NOTHING;
    `, [f.id, f.name, f.description, f.price, f.isVeg, f.categoryId, royalId]);
  }

  // 5. Ensure Subscription Plans
  const plans = [
    { id: 'plan-first-time', code: 'FIRST_TIME_ACTIVATION', name: 'First-Time Activation', amount: 1, days: 30, status: 'TRIAL' },
    { id: 'plan-monthly', code: 'MONTHLY', name: 'Monthly Standard', amount: 249, days: 30, status: 'ACTIVE' },
    { id: 'plan-six-months', code: 'SIX_MONTHS', name: 'Six Months Growth', amount: 1199, days: 180, status: 'ACTIVE' },
    { id: 'plan-annual', code: 'ANNUAL', name: 'Annual Enterprise', amount: 1999, days: 365, status: 'ACTIVE' }
  ];

  for (const p of plans) {
    await client.query(`
      INSERT INTO "SubscriptionPlan" ("id", "code", "name", "amount", "days", "status", "isVisible", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
      ON CONFLICT ("code") DO UPDATE SET "amount" = $4, "name" = $3, "days" = $5, "status" = $6;
    `, [p.id, p.code, p.name, p.amount, p.days, p.status]);
  }
  console.log('💳 Subscription Plans ready.');

  // 6. Ensure System Settings
  await client.query(`
    INSERT INTO "SystemSettings" ("id", "platformName", "supportEmail", "supportPhone", "platformUrl", "currencySymbol", "defaultCurrency", "paymentMode", "maintenanceMode", "autoApproveRestaurants", "freeTrialDays", "enableCustomerFeedback", "enableAudioAlerts", "updatedAt")
    VALUES ('default', 'OrderKare Technologies', 'support@orderkare.com', '+91 98765 43210', 'https://orderkare.co.in', '₹', 'INR', 'live', false, true, 14, true, true, NOW())
    ON CONFLICT ("id") DO UPDATE SET "platformName" = 'OrderKare Technologies';
  `);
  console.log('⚙️ SystemSettings ready.');

  // Summary
  const userCheck = await client.query('SELECT email, role, "restaurantId" FROM "User" ORDER BY role, email;');
  console.log('\n📊 ALL ACCOUNTS READY IN DATABASE:');
  console.table(userCheck.rows);

  await client.end();
}

seed().catch(err => {
  console.error('Seed Error:', err);
  process.exit(1);
});
