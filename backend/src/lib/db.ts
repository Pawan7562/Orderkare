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

import { Pool, PoolClient,types } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL must be configured');
}
types.setTypeParser(1114, (value: string) => new Date(value.replace(' ', 'T') + 'Z'));
// Robust PostgreSQL pool directly connected to Neon with IPv4 routing
export const db = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: Number(process.env.DB_POOL_MAX || 20),
  min: 0,                         // Serverless: don't retain dead sockets when Neon suspends/idles
  idleTimeoutMillis: 15000,       // Neon disconnects idle clients quickly; purge early
  connectionTimeoutMillis: 10000,
  statement_timeout: 15000,
  keepAlive: true,                // TCP keep-alive on the socket level
  keepAliveInitialDelayMillis: 10000,
});

// Attach error listener to prevent process crashes on idle client drops
db.on('error', (err: any) => {
  console.warn('⚡ Neon Pool notice (auto-recovering):', err?.message || err);
});

// Keep-alive ping: lightweight query every 25 seconds to keep the compute warm during development
const keepAliveInterval = setInterval(() => {
  db.query('SELECT 1').catch(() => {});
}, 25000);

// Allow process to exit cleanly when pool is shut down
keepAliveInterval.unref();

export const query = async (text: string, params?: any[], retries = 2): Promise<any> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await db.query(text, params);
    } catch (err: any) {
      const isTransient =
        err?.message?.includes('Connection terminated') ||
        err?.message?.includes('connection timeout') ||
        err?.message?.includes('closed') ||
        err?.code === 'ECONNRESET' ||
        err?.code === '57P01';

      if (isTransient && attempt < retries) {
        console.warn(`⚡ DB connection reset on query (attempt ${attempt + 1}/${retries}). Reconnecting in 300ms...`);
        await new Promise(r => setTimeout(r, 300));
        continue;
      }
      throw err;
    }
  }
};

export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>,
  retries = 2
): Promise<T> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    let client: PoolClient | undefined;
    try {
      client = await db.connect();
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error: any) {
      await client?.query('ROLLBACK').catch(() => {});
      const isTransient =
        error?.message?.includes('Connection terminated') ||
        error?.message?.includes('connection timeout') ||
        error?.message?.includes('closed') ||
        error?.code === 'ECONNRESET';

      if (isTransient && attempt < retries) {
        console.warn(`⚡ DB connection reset on transaction (attempt ${attempt + 1}/${retries}). Reconnecting in 300ms...`);
        await new Promise(r => setTimeout(r, 300));
        continue;
      }
      throw error;
    } finally {
      client?.release();
    }
  }
  throw new Error('Transaction failed after retries');
};

export default db;
