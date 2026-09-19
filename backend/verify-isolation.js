const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function testCleanRegistrationAndIsolation() {
  console.log('🚀 Running Multi-Tenant Isolation & Clean Onboarding Verification...');

  const timestamp = Date.now();
  const testEmailA = `hotel_alpha_${timestamp}@test.com`;
  const testEmailB = `hotel_beta_${timestamp}@test.com`;

  try {
    // 1. Register Hotel Admin Alpha
    console.log('1️⃣ Registering Hotel Alpha...');
    const regResA = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Alpha Manager',
      email: testEmailA,
      password: 'password123',
      restaurantName: 'Grand Hotel Alpha',
      address: 'Alpha Sector 1',
      phone: '9876543210',
    });

    const tokenA = regResA.data.token;
    const hotelA = regResA.data.restaurant;
    console.log(`   ✅ Hotel Alpha Registered. ID: ${hotelA.id}, Slug: ${hotelA.slug}`);

    // 2. Check that Hotel Alpha starts completely clean (0 categories, 0 foods, 0 tables, 0 orders)
    console.log('2️⃣ Verifying Hotel Alpha has 0 dummy categories, foods, tables, and orders...');
    const authHeadersA = { headers: { Authorization: `Bearer ${tokenA}` } };

    const [catsA, foodsA, tablesA, ordersA, statsA] = await Promise.all([
      axios.get(`${BASE_URL}/categories`, authHeadersA),
      axios.get(`${BASE_URL}/foods`, authHeadersA),
      axios.get(`${BASE_URL}/tables`, authHeadersA),
      axios.get(`${BASE_URL}/orders`, authHeadersA),
      axios.get(`${BASE_URL}/restaurants/dashboard/stats`, authHeadersA),
    ]);

    console.log(`   Categories count: ${catsA.data.categories?.length || 0} (Expected: 0)`);
    console.log(`   Foods count: ${foodsA.data.foods?.length || 0} (Expected: 0)`);
    console.log(`   Tables count: ${tablesA.data.tables?.length || 0} (Expected: 0)`);
    console.log(`   Orders count: ${ordersA.data.orders?.length || 0} (Expected: 0)`);
    console.log(`   Dashboard Sales: ₹${statsA.data.todaySales || 0} (Expected: 0)`);

    if (
      (catsA.data.categories?.length || 0) === 0 &&
      (foodsA.data.foods?.length || 0) === 0 &&
      (tablesA.data.tables?.length || 0) === 0 &&
      (ordersA.data.orders?.length || 0) === 0
    ) {
      console.log('   ✅ PASS: Hotel Alpha started with a 100% CLEAN DASHBOARD!');
    } else {
      console.error('   ❌ FAIL: Hotel Alpha contains lingering dummy data!');
      process.exit(1);
    }

    // 3. Register Hotel Admin Beta
    console.log('3️⃣ Registering Hotel Beta...');
    const regResB = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Beta Manager',
      email: testEmailB,
      password: 'password123',
      restaurantName: 'Royal Hotel Beta',
      address: 'Beta Sector 2',
      phone: '9876543211',
    });

    const tokenB = regResB.data.token;
    const hotelB = regResB.data.restaurant;
    const authHeadersB = { headers: { Authorization: `Bearer ${tokenB}` } };
    console.log(`   ✅ Hotel Beta Registered. ID: ${hotelB.id}, Slug: ${hotelB.slug}`);

    // 4. Add items & table for Hotel Alpha
    console.log('4️⃣ Adding category, food dish & table to Hotel Alpha...');
    const catResA = await axios.post(`${BASE_URL}/categories`, { name: 'Alpha Specials' }, authHeadersA);
    const catIdA = catResA.data.category.id;

    const foodResA = await axios.post(`${BASE_URL}/foods`, {
      name: 'Alpha Signature Pizza',
      description: 'Hand tossed dough with fresh basil',
      price: 350,
      isVeg: true,
      categoryId: catIdA,
    }, authHeadersA);
    const foodIdA = foodResA.data.food.id;

    const tableResA = await axios.post(`${BASE_URL}/tables`, { tableNumber: '01', capacity: 4 }, authHeadersA);
    console.log(`   ✅ Added Table #01 and Food Item "${foodResA.data.food.name}" to Hotel Alpha`);

    // 5. Place Customer Order for Hotel Alpha via Alpha's slug
    console.log('5️⃣ Placing customer order via QR slug for Hotel Alpha...');
    const orderRes = await axios.post(`${BASE_URL}/orders/place/${hotelA.slug}`, {
      customerName: 'Aarav Sharma',
      tableNumber: '01',
      phoneNumber: '9876500000',
      items: [{ foodItemId: foodIdA, quantity: 2 }],
    });
    console.log(`   ✅ Order placed successfully! ID: ${orderRes.data.order.id}, Total: ₹${orderRes.data.order.totalAmount}`);

    // 6. Verify Data Isolation: Order exists in Hotel Alpha, but NOT in Hotel Beta
    console.log('6️⃣ Verifying Strict Data Isolation between Alpha and Beta...');
    const [alphaOrdersAfter, betaOrdersAfter] = await Promise.all([
      axios.get(`${BASE_URL}/orders`, authHeadersA),
      axios.get(`${BASE_URL}/orders`, authHeadersB),
    ]);

    const alphaHasOrder = (alphaOrdersAfter.data.orders || []).some(o => o.id === orderRes.data.order.id);
    const betaHasOrder = (betaOrdersAfter.data.orders || []).some(o => o.id === orderRes.data.order.id);

    console.log(`   Alpha sees order: ${alphaHasOrder} (Expected: true)`);
    console.log(`   Beta sees order: ${betaHasOrder} (Expected: false, count=${betaOrdersAfter.data.orders?.length || 0})`);

    if (alphaHasOrder && !betaHasOrder && (betaOrdersAfter.data.orders?.length || 0) === 0) {
      console.log('   ✅ PASS: Complete Tenant Isolation! Orders are routed exclusively to Hotel Alpha.');
    } else {
      console.error('   ❌ FAIL: Order leaked to Hotel Beta!');
      process.exit(1);
    }

    // 7. Verify Analytics for Alpha vs Beta
    console.log('7️⃣ Verifying Analytics Isolation...');
    const [analyticsA, analyticsB] = await Promise.all([
      axios.get(`${BASE_URL}/restaurants/analytics`, authHeadersA),
      axios.get(`${BASE_URL}/restaurants/analytics`, authHeadersB),
    ]);

    console.log(`   Alpha Analytics Sales: ${analyticsA.data.stats.sales} (Expected: ₹700)`);
    console.log(`   Beta Analytics Sales: ${analyticsB.data.stats.sales} (Expected: ₹0)`);

    if (analyticsA.data.stats.salesRaw === 700 && analyticsB.data.stats.salesRaw === 0) {
      console.log('   ✅ PASS: Analytics are 100% isolated and accurate!');
    } else {
      console.error('   ❌ FAIL: Analytics mismatch!');
      process.exit(1);
    }

    console.log('\n🎉 ALL MULTI-TENANT ISOLATION & CLEAN ONBOARDING TESTS PASSED PERFECTLY! 🎉\n');
  } catch (err) {
    console.error('Test execution error:', err.response?.data || err.message);
    process.exit(1);
  }
}

testCleanRegistrationAndIsolation();
