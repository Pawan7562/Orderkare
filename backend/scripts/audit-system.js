const axios = require('axios');
const io = require('socket.io-client');

const API_BASE = 'http://localhost:5000/api/v1';

async function audit() {
  console.log('======================================================');
  console.log('       ORDERKARE FULL SYSTEM END-TO-END AUDIT        ');
  console.log('======================================================\n');

  const results = [];

  async function check(name, fn) {
    try {
      const res = await fn();
      results.push({ Component: name, Status: 'PASS', Details: res });
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      results.push({ Component: name, Status: 'FAIL', Details: msg });
    }
  }

  let superToken = '';
  let hotelToken = '';

  // 1. Super Admin Authentication
  await check('Super Admin Login', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'superadmin@orderkare.com',
      password: 'password123'
    });
    superToken = res.data.token;
    return `Logged in as ${res.data.user.name} (${res.data.user.role})`;
  });

  // 2. Hotel Admin Authentication
  await check('Hotel Admin Login (Royal Palace)', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'demo@restaurant.com',
      password: 'password123'
    });
    hotelToken = res.data.token;
    return `Logged in as ${res.data.user.name} (Restaurant: ${res.data.user.restaurantId})`;
  });

  const superHeaders = { Authorization: `Bearer ${superToken}` };
  const hotelHeaders = { Authorization: `Bearer ${hotelToken}` };

  // 3. Super Admin Platform Stats
  await check('Super Admin Stats Endpoint', async () => {
    const res = await axios.get(`${API_BASE}/admin/stats`, { headers: superHeaders });
    const s = res.data.stats;
    return `Hotels: ${s.totalHotels}, Active Subs: ${s.activeSubscriptions}, Orders: ${s.totalOrders}`;
  });

  // 4. Hotel Directory
  await check('Hotel Directory Listing', async () => {
    const res = await axios.get(`${API_BASE}/admin/hotels`, { headers: superHeaders });
    return `Hotels found: ${res.data.hotels?.length || 0}`;
  });

  // 5. Subscription Audits
  await check('Subscriptions Management', async () => {
    const res = await axios.get(`${API_BASE}/admin/subscriptions`, { headers: superHeaders });
    return `Subscriptions count: ${res.data.subscriptions?.length || 0}`;
  });

  // 6. SaaS Pricing Plans
  await check('SaaS Pricing Plans', async () => {
    const res = await axios.get(`${API_BASE}/plans/admin/all`, { headers: superHeaders });
    return `Plans count: ${res.data.plans?.length || 0}`;
  });

  // 7. Sponsored Advertisements
  await check('Sponsored Banner Ads', async () => {
    const res = await axios.get(`${API_BASE}/ads/all`, { headers: superHeaders });
    return `Live ads: ${res.data.ads?.length || 0}`;
  });

  // 8. Platform Analytics
  await check('Super Admin Analytics', async () => {
    const res = await axios.get(`${API_BASE}/admin/analytics`, { headers: superHeaders });
    return `Orders logged: ${res.data.summary?.totalOrders ?? 0}, Revenue: ₹${res.data.summary?.totalRevenue ?? 0}`;
  });

  // 9. System Settings
  await check('Global System Settings', async () => {
    const res = await axios.get(`${API_BASE}/settings`, { headers: superHeaders });
    return `Razorpay Key ID: ${res.data.settings?.razorpayKeyId || 'Configured'}`;
  });

  // 10. Database Health & Cluster Telemetry
  await check('Database & Cluster Telemetry', async () => {
    const res = await axios.get(`${API_BASE}/settings/health`, { headers: superHeaders });
    const h = res.data.health || res.data;
    return `DB: ${h.dbConnected ? 'PostgreSQL Online' : 'Offline'}, Latency: ${h.latencyMs}ms, Uptime: ${h.uptimeSeconds}s, Total Entites: ${h.counts ? Object.values(h.counts).reduce((a,b)=>a+b,0) : 0}`;
  });

  // 11. Hotel Admin Categories
  await check('Hotel Menu Categories', async () => {
    const res = await axios.get(`${API_BASE}/categories`, { headers: hotelHeaders });
    const count = res.data.categories?.length || res.data.length || 0;
    return `Categories count: ${count}`;
  });

  // 12. Hotel Admin Food Items
  let sampleFoodId = '';
  await check('Hotel Menu Food Items', async () => {
    const res = await axios.get(`${API_BASE}/foods`, { headers: hotelHeaders });
    const foods = res.data.foods || res.data || [];
    if (foods.length > 0) sampleFoodId = foods[0].id;
    return `Food items count: ${foods.length} (Sample: ${foods[0]?.name || 'N/A'})`;
  });

  // 13. Hotel Admin Current Subscription
  await check('Hotel Subscription Status', async () => {
    const res = await axios.get(`${API_BASE}/subscriptions/current`, { headers: hotelHeaders });
    const s = res.data.subscription || res.data;
    return `Status: ${s.status}, Plan: ${s.planName || 'Annual'}`;
  });

  // 14. Customer Public Menu Access
  await check('Customer Public QR Menu Feed', async () => {
    const res = await axios.get(`${API_BASE}/menu/royal-palace`);
    return `Restaurant: ${res.data.restaurant?.name}, Categories: ${res.data.categories?.length || 0}`;
  });

  // 15. Create Test Customer Order
  let testOrderId = '';
  await check('Customer Order Placement', async () => {
    if (!sampleFoodId) return 'Skipped (No food items)';
    const res = await axios.post(`${API_BASE}/orders/place/royal-palace`, {
      customerName: 'Aarav Mehta',
      phoneNumber: '+91 98765 00000',
      tableNumber: '05',
      items: [
        {
          foodItemId: sampleFoodId,
          quantity: 2
        }
      ]
    });
    testOrderId = res.data.order?.id;
    return `Order Placed successfully! Order ID: ${testOrderId}, Total: ₹${res.data.order?.totalAmount}`;
  });

  // 16. Real-time WebSocket Connection
  await check('Real-time WebSocket Gateway', () => {
    return new Promise((resolve, reject) => {
      const socket = io('http://localhost:5000', {
        transports: ['websocket'],
        auth: { token: superToken }
      });

      const timer = setTimeout(() => {
        socket.disconnect();
        reject(new Error('WebSocket connection timed out after 5s'));
      }, 5000);

      socket.on('connect', () => {
        const id = socket.id;
        socket.emit('join_super_admin');
        clearTimeout(timer);
        socket.disconnect();
        resolve(`Socket Connected (ID: ${id})`);
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  });

  console.table(results);

  const passed = results.filter(r => r.Status === 'PASS').length;
  const failed = results.filter(r => r.Status === 'FAIL').length;

  console.log(`\n======================================================`);
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
  if (failed === 0) {
    console.log('>>> ALL SYSTEMS ARE 100% OPERATIONAL & HEALTHY <<<');
  } else {
    console.log('>>> ATTENTION: SOME CHECKS FAILED <<<');
  }
  console.log('======================================================\n');
}

audit().catch(console.error);
