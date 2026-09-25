import dns from 'dns';

// Monkey patch dns.lookup to force IPv4
try {
  dns.setDefaultResultOrder('ipv4first');
  const origLookup = dns.lookup;
  const patchedLookup: any = function (hostname: any, options: any, callback: any) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    } else if (typeof options === 'number') {
      options = { family: options };
    } else {
      options = { ...options };
    }
    options.family = 4;
    return (origLookup as any).call(dns, hostname, options, callback);
  };
  patchedLookup.__promisify__ = (origLookup as any).__promisify__;
  (dns as any).lookup = patchedLookup;
} catch {}

import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL must be configured');
}

// Robust PostgreSQL pool directly connected to Neon with IPv4 routing
export const db = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: Number(process.env.DB_POOL_MAX || 10),
  min: 1,                       // Keep at least 1 connection alive at all times
  idleTimeoutMillis: 25000,      // Neon disconnects idle clients after ~30s; purge at 25s
  connectionTimeoutMillis: 12000,
  statement_timeout: 15000,
  keepAlive: true,               // TCP keep-alive on the socket level
  keepAliveInitialDelayMillis: 10000,
});

// Attach error listener to prevent process crashes on idle client drops
db.on('error', (err: any) => {
  console.warn('⚡ Neon Pool notice (auto-recovering):', err?.message || err);
});

// Keep-alive ping: query the pool every 20 seconds so Neon never drops all connections.
// This eliminates the 5-second cold-start on the first request after idle.
const keepAliveInterval = setInterval(() => {
  db.query('SELECT 1').catch(() => {});
}, 20000);

// Allow process to exit cleanly when pool is shut down
keepAliveInterval.unref();

export const query = async (text: string, params?: any[]) => {
  try {
    return await db.query(text, params);
  } catch (err: any) {
    if (
      err?.message?.includes('Connection terminated') ||
      err?.message?.includes('connection timeout') ||
      err?.message?.includes('closed')
    ) {
      console.warn('Retrying database query after connection reset...');
      return await db.query(text, params);
    }
    throw err;
  }
};

/**
 * Enterprise-grade safe transaction executor
 * Guarantees client release and automatic ROLLBACK on errors
 */
export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
};

export default db;
