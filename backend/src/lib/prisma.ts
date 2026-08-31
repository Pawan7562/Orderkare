import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import dotenv from 'dotenv';

dotenv.config();

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_6qwSBRlnKui4@ep-silent-darkness-aeuf1dek-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";

let prisma: PrismaClient;

try {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  prisma = new PrismaClient({ adapter: adapter as any });
} catch (error) {
  prisma = new PrismaClient();
}

export { prisma };
export default prisma;
