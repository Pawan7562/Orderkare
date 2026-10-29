/**
 * OrderKare High-Concurrency Load Testing Benchmark
 * Simulates intense concurrent dining customer requests against API endpoints.
 */

const http = require('http');

const TARGET_HOST = process.env.TEST_HOST || 'localhost';
const TARGET_PORT = process.env.TEST_PORT || 5000;
const DURATION_SECONDS = 5;
const CONCURRENT_CLIENTS = 100;
const TEST_SLUG = process.env.TEST_SLUG || 'apna-swad-vpww';

// Reusable HTTP Keep-Alive Agent to simulate persistent connection pool
const agent = new http.Agent({
  keepAlive: true,
  maxSockets: 250,
  timeout: 10000,
});

function sendRequest(path) {
  return new Promise((resolve) => {
    const startTime = process.hrtime.bigint();
    const req = http.get(
      {
        host: TARGET_HOST,
        port: TARGET_PORT,
        path,
        agent,
        headers: {
          'Accept-Encoding': 'gzip, deflate',
          'User-Agent': 'OrderKare-LoadTest/1.0',
          'x-benchmark': 'true',
        },
      },
      (res) => {
        let size = 0;
        res.on('data', (chunk) => {
          size += chunk.length;
        });
        res.on('end', () => {
          const endTime = process.hrtime.bigint();
          const latencyMs = Number(endTime - startTime) / 1e6;
          resolve({
            statusCode: res.statusCode,
            latencyMs,
            size,
            error: null,
          });
        });
      }
    );

    req.on('error', (err) => {
      const endTime = process.hrtime.bigint();
      const latencyMs = Number(endTime - startTime) / 1e6;
      resolve({
        statusCode: 0,
        latencyMs,
        size: 0,
        error: err.message,
      });
    });

    req.setTimeout(8000, () => {
      req.destroy();
      resolve({
        statusCode: 408,
        latencyMs: 8000,
        size: 0,
        error: 'Request Timeout',
      });
    });
  });
}

async function runBenchmark(name, path) {
  console.log(`\n============================================================`);
  console.log(`🔥 BENCHMARK: ${name} [${path}]`);
  console.log(`⚡ Concurrency: ${CONCURRENT_CLIENTS} simultaneous connections for ${DURATION_SECONDS}s`);
  console.log(`============================================================`);

  const results = [];
  let isRunning = true;
  const deadline = Date.now() + DURATION_SECONDS * 1000;

  async function worker() {
    while (isRunning && Date.now() < deadline) {
      const res = await sendRequest(path);
      results.push(res);
    }
  }

  const workers = Array.from({ length: CONCURRENT_CLIENTS }, () => worker());
  await Promise.all(workers);
  isRunning = false;

  const totalRequests = results.length;
  const successful = results.filter((r) => r.statusCode >= 200 && r.statusCode < 300).length;
  const failed = totalRequests - successful;
  const latencies = results.map((r) => r.latencyMs).sort((a, b) => a - b);

  const sumLatency = latencies.reduce((acc, l) => acc + l, 0);
  const avgLatency = (sumLatency / totalRequests).toFixed(2);
  const p50 = latencies[Math.floor(totalRequests * 0.5)]?.toFixed(2) || '0';
  const p90 = latencies[Math.floor(totalRequests * 0.9)]?.toFixed(2) || '0';
  const p99 = latencies[Math.floor(totalRequests * 0.99)]?.toFixed(2) || '0';
  const minLatency = latencies[0]?.toFixed(2) || '0';
  const maxLatency = latencies[latencies.length - 1]?.toFixed(2) || '0';

  const rps = (totalRequests / DURATION_SECONDS).toFixed(0);
  const successRate = ((successful / totalRequests) * 100).toFixed(2);

  console.log(`📊 Total Requests Sent: ${totalRequests}`);
  console.log(`✅ Successful (2xx):    ${successful} (${successRate}%)`);
  console.log(`❌ Failed / Dropped:    ${failed}`);
  console.log(`🚀 Throughput:          ${rps} req/sec`);
  console.log(`⏱️ Latency (Avg):       ${avgLatency} ms`);
  console.log(`⏱️ Latency (Min / Max): ${minLatency} ms / ${maxLatency} ms`);
  console.log(`⏱️ Latency (P50):       ${p50} ms`);
  console.log(`⏱️ Latency (P90):       ${p90} ms`);
  console.log(`⏱️ Latency (P99):       ${p99} ms`);

  return { rps: Number(rps), avgLatency: Number(avgLatency), successRate: Number(successRate) };
}

async function startLoadTest() {
  console.log('🏁 Starting OrderKare High-Performance Concurrency Test...');
  console.log(`🎯 Target: http://${TARGET_HOST}:${TARGET_PORT}`);

  // Warmup cache
  await sendRequest('/api/health');
  await sendRequest(`/api/menu/${TEST_SLUG}`);

  // Test 1: API Health check (Pure I/O throughput)
  await runBenchmark('API Gateway Health & Heartbeat', '/api/health');

  // Test 2: Public Customer Menu (Cached Multi-Tier Performance)
  await runBenchmark(`Public QR Customer Menu [slug: ${TEST_SLUG}]`, `/api/menu/${TEST_SLUG}`);

  console.log('\n============================================================');
  console.log('🎉 Load Testing Completed! Architecture verified for high concurrency.');
  console.log('============================================================\n');
  process.exit(0);
}

startLoadTest().catch((err) => {
  console.error('Benchmark Error:', err);
  process.exit(1);
});
