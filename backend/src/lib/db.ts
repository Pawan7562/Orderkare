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

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await db.query(text, params);
  const duration = Date.now() - start;
  // console.log('Executed Neon query', { text: text.substring(0, 40), duration, rows: res.rowCount });
  return res;
};

export default db;
