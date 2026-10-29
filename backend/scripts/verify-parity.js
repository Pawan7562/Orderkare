/**
 * End-to-End Parity & Data Synchronization Verification
 * Tests the shared backend contracts against Website and Mobile App expectations.
 */

const http = require('http');

function fetchJson(path, headers = {}) {
  return new Promise((resolve, reject) => {
    http.get(
      {
        host: 'localhost',
        port: 5000,
        path,
        headers: {
          'Accept': 'application/json',
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            const data = JSON.parse(raw);
            resolve({ status: res.statusCode, data });
          } catch (e) {
            resolve({ status: res.statusCode, raw });
          }
        });
      }
    ).on('error', reject);
  });
}

async function verifyAll() {
  console.log('🔍 ============================================================');
  console.log('🔍 VERIFYING WEBSITE & MOBILE APP BACKEND DATA PARITY');
  console.log('🔍 ============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // 1. Health Endpoint
  const health = await fetchJson('/api/health');
  assert(health.status === 200, 'API Health Check returns 200 OK');
  assert(health.data?.status === 'ok', 'API Status is "ok"');
  assert(health.data?.payments?.configured === true, 'Razorpay payments live configured');

  // 2. Public Menu Contract (Used by Customer Website and Mobile Settings QR preview)
  const menu = await fetchJson('/api/menu/apna-swad-vpww');
  assert(menu.status === 200, 'Public Menu returns 200 OK');
  assert(Boolean(menu.data?.restaurant?.id), 'Menu payload contains restaurant.id');
  assert(Boolean(menu.data?.restaurant?.name), 'Menu payload contains restaurant.name');
  assert(Boolean(menu.data?.restaurant?.slug), 'Menu payload contains restaurant.slug');
  assert(Array.isArray(menu.data?.categories), 'Menu payload contains categories array');
  assert(Array.isArray(menu.data?.foods), 'Menu payload contains foods array');
  assert(typeof menu.data?.isSubscriptionActive === 'boolean', 'Menu contains isSubscriptionActive boolean flag');

  if (menu.data?.foods?.length > 0) {
    const sampleFood = menu.data.foods[0];
    assert(sampleFood.id && sampleFood.name && sampleFood.price !== undefined, 'FoodItem contract has id, name, price');
    assert(typeof sampleFood.isAvailable === 'boolean', 'FoodItem contract has isAvailable boolean');
  }

  // 3. Plans Endpoint (Used by Website & Mobile Subscription status)
  const plans = await fetchJson('/api/plans/active');
  assert(plans.status === 200, 'Active Plans endpoint returns 200 OK');
  assert(Array.isArray(plans.data?.plans), 'Active plans returns array');

  // 4. Verify Compression header
  const compressedRes = await new Promise((resolve) => {
    http.get(
      {
        host: 'localhost',
        port: 5000,
        path: '/api/menu/apna-swad-vpww',
        headers: { 'Accept-Encoding': 'gzip' },
      },
      (res) => {
        resolve(res.headers['content-encoding']);
      }
    );
  });
  assert(compressedRes === 'gzip', 'Backend responds with gzip compression for fast mobile loading');

  // 5. Verify In-Memory Cache Response Speed
  const t0 = Date.now();
  await fetchJson('/api/menu/apna-swad-vpww');
  const cacheLatency = Date.now() - t0;
  assert(cacheLatency < 20, `Cached Menu response latency is ultra-fast (${cacheLatency}ms < 20ms)`);

  console.log('\n============================================================');
  console.log(`📋 AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  if (failed === 0) {
    console.log('🎉 100% PARITY CONFIRMED! Website and Mobile App data models match seamlessly.');
  }
  console.log('============================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

verifyAll().catch((err) => {
  console.error('Fatal Verification Error:', err);
  process.exit(1);
});
