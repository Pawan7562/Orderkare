import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';

dotenv.config();

// Configure WebSocket constructor for Node.js environment
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_6qwSBRlnKui4@ep-silent-darkness-aeuf1dek-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";

// Create singleton Neon connection pool
export const db = new Pool({ connectionString });

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await db.query(text, params);
  const duration = Date.now() - start;
  // console.log('Executed Neon query', { text: text.substring(0, 40), duration, rows: res.rowCount });
  return res;
};

export default db;
