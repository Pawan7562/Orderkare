import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';

dotenv.config();

// Configure WebSocket constructor for Node.js environment
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL must be configured');
}

// Create singleton Neon connection pool
export const db = new Pool({
  connectionString,
  max: Number(process.env.DB_POOL_MAX || 20),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Attach error listener to prevent process crashes on idle client drops / network disconnects
db.on('error', (err: any) => {
  console.warn('⚡ Neon Pool idle client connection notice (auto-recovering):', err.message || err);
});

export const query = async (text: string, params?: any[]) => {
  try {
    const start = Date.now();
    const res = await db.query(text, params);
    return res;
  } catch (err: any) {
    // If pool connection was terminated, retry query once
    if (err?.message?.includes('Connection terminated') || err?.message?.includes('connection timeout')) {
      console.warn('Retrying database query after connection reset...');
      return await db.query(text, params);
    }
    throw err;
  }
};

export default db;
