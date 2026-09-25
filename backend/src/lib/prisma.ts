import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { db } from './db';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg(db);
export const prisma = new PrismaClient({ adapter });
export default prisma;
