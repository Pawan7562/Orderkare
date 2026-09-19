const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function testSubscriptionAndQRWorkflow() {
  console.log('🚀 Running Comprehensive Subscription & QR Activation Workflow Test...\n');

  const timestamp = Date.now();
  const testEmail = `hotel_sub_${timestamp}@test.com`;

  try {
    // 1. Register a fresh new hotel admin
    console.log('1️⃣ Registering fresh new hotel admin...');
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Sub Test Manager',
      email: testEmail,
      password: 'password123',
      restaurantName: 'Sub Palace Dining',
      address: 'Test Boulevard 101',
      phone: '9988776655',
    });

    const token = regRes.data.token;
    const hotel = regRes.data.restaurant;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    console.log(`   ✅ Registered Hotel. ID: ${hotel.id}, Slug: ${hotel.slug}`);

    // 2. Check initial subscription status (Must be PENDING / Unpaid, QR disallowed)
    console.log('2️⃣ Verifying initial subscription status is PENDING / Unpaid...');
    const initialSubRes = await axios.get(`${BASE_URL}/subscriptions/status`, authHeaders);
    console.log(`   isSubscribed: ${initialSubRes.data.isSubscribed} (Expected: false)`);
    console.log(`   isFirstTime: ${initialSubRes.data.isFirstTime} (Expected: true)`);
    console.log(`   qrCodeAllowed: ${initialSubRes.data.qrCodeAllowed} (Expected: false)`);
    console.log(`   firstTimeOffer.price: ₹${initialSubRes.data.firstTimeOffer.price} (Expected: ₹1)`);

    if (!initialSubRes.data.isSubscribed && initialSubRes.data.isFirstTime && !initialSubRes.data.qrCodeAllowed) {
      console.log('   ✅ PASS: New admin is correctly locked until ₹1 payment!');
    } else {
      console.error('   ❌ FAIL: Initial subscription state is incorrect!');
      process.exit(1);
    }

    // 3. Add a category and food item
    const catRes = await axios.post(`${BASE_URL}/categories`, { name: 'Main Dishes' }, authHeaders);
    const foodRes = await axios.post(`${BASE_URL}/foods`, {
      name: 'Paneer Butter Masala',
      price: 250,
      categoryId: catRes.data.category.id,
    }, authHeaders);

    // 4. Try placing customer order BEFORE payment (Must be rejected with 403)
    console.log('3️⃣ Verifying customer order is blocked BEFORE activation payment...');
    try {
      await axios.post(`${BASE_URL}/orders/place/${hotel.slug}`, {
        customerName: 'Guest Tester',
        tableNumber: '01',
        items: [{ foodItemId: foodRes.data.food.id, quantity: 1 }],
      });
      console.error('   ❌ FAIL: Order succeeded without active subscription!');
      process.exit(1);
    } catch (orderErr) {
      if (orderErr.response?.status === 403) {
        console.log(`   ✅ PASS: Order correctly rejected with 403 (${orderErr.response.data.message})`);
      } else {
        console.error('   ❌ FAIL: Unexpected error code on order:', orderErr.response?.status);
        process.exit(1);
      }
    }

    // 5. Complete First-Time ₹1 Activation
    console.log('4️⃣ Completing ₹1 First-Time Activation payment...');
    const payTrialRes = await axios.post(`${BASE_URL}/subscriptions/pay`, {
      planId: 'FIRST_TIME_ACTIVATION',
      paymentReference: 'UPI-TEST-FIRST-1',
    }, authHeaders);

    console.log(`   Response: ${payTrialRes.data.message}`);
    console.log(`   Status: ${payTrialRes.data.subscription.status}, Amount: ₹${payTrialRes.data.subscription.amountPaid}, Days: ${payTrialRes.data.subscription.daysRemaining}`);

    // 6. Check subscription status after ₹1 payment (Must be active for 30 days)
    console.log('5️⃣ Verifying subscription is now ACTIVE with 1 Month Free Trial...');
    const activeSubRes = await axios.get(`${BASE_URL}/subscriptions/status`, authHeaders);
    console.log(`   isSubscribed: ${activeSubRes.data.isSubscribed} (Expected: true)`);
    console.log(`   status: ${activeSubRes.data.status} (Expected: TRIAL or ACTIVE)`);
    console.log(`   qrCodeAllowed: ${activeSubRes.data.qrCodeAllowed} (Expected: true)`);
    console.log(`   daysRemaining: ${activeSubRes.data.daysRemaining} (Expected: ~30)`);

    if (activeSubRes.data.isSubscribed && activeSubRes.data.qrCodeAllowed && activeSubRes.data.daysRemaining >= 29) {
      console.log('   ✅ PASS: ₹1 Activation unlocked QR codes and gave 30 free days!');
    } else {
      console.error('   ❌ FAIL: Activation failed to unlock QR codes!');
      process.exit(1);
    }

    // 7. Place customer order AFTER payment (Must succeed!)
    console.log('6️⃣ Placing customer order AFTER activation...');
    const liveOrderRes = await axios.post(`${BASE_URL}/orders/place/${hotel.slug}`, {
      customerName: 'Satisfied Customer',
      tableNumber: '01',
      items: [{ foodItemId: foodRes.data.food.id, quantity: 2 }],
    });
    console.log(`   ✅ Order placed successfully! ID: ${liveOrderRes.data.order.id}, Total: ₹${liveOrderRes.data.order.totalAmount}`);

    // 8. Test Renewal with Monthly (₹249), 6 Months (₹1199), and Annual (₹1999)
    console.log('7️⃣ Testing Renewal with 6 Months Plan (₹1,199)...');
    const renewRes = await axios.post(`${BASE_URL}/subscriptions/pay`, {
      planId: 'SIX_MONTHS',
      paymentReference: 'UPI-RENEW-6M',
    }, authHeaders);

    console.log(`   Response: ${renewRes.data.message}`);
    console.log(`   New Days Remaining: ${renewRes.data.subscription.daysRemaining} (Expected: ~210 days combined)`);

    if (renewRes.data.subscription.daysRemaining >= 200) {
      console.log('   ✅ PASS: Subscription renewal successfully extended validity!');
    } else {
      console.error('   ❌ FAIL: Renewal duration calculation error!');
      process.exit(1);
    }

    console.log('\n🎉 ALL SUBSCRIPTION, ₹1 ACTIVATION & QR LIFECYCLE TESTS PASSED! 🎉\n');
  } catch (err) {
    console.error('Test execution error:', err.response?.data || err.message);
    process.exit(1);
  }
}

testSubscriptionAndQRWorkflow();
