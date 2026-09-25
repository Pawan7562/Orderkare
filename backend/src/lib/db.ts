import { Pool } from 'pg';
import dns from 'dns';
import dotenv from 'dotenv';

dotenv.config();

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL must be configured');
}

export const db = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: Number(process.env.DB_POOL_MAX || 20),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

db.on('error', (err: any) => {
  console.warn('⚡ PostgreSQL Pool client notice (auto-recovering):', err.message || err);
});

export const query = async (text: string, params?: any[]) => {
  try {
    return await db.query(text, params);
  } catch (err: any) {
    if (err?.message?.includes('Connection terminated') || err?.message?.includes('connection timeout')) {
      return await db.query(text, params);
    }
    throw err;
  }
};

export default db;
