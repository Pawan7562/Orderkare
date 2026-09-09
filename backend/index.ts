import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import authRoutes from './src/routes/auth.routes';
import categoryRoutes from './src/routes/category.routes';
import foodRoutes from './src/routes/food.routes';
import orderRoutes from './src/routes/order.routes';
import menuRoutes from './src/routes/menu.routes';
import restaurantRoutes from './src/routes/restaurant.routes';
import { initSocket } from './src/utils/socket';

dotenv.config();

const app = express();
const server = createServer(app);
export const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CORS_ORIGIN || 'https://www.orderkare.co.in,https://orderkare.co.in')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Origin not allowed'));
  },
}));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
}));

// API Routes (supporting both /api/v1 and /api)
app.use('/api/v1/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/v1/categories', categoryRoutes);
app.use('/api/categories', categoryRoutes);

app.use('/api/v1/foods', foodRoutes);
app.use('/api/foods', foodRoutes);

app.use('/api/v1/orders', orderRoutes);
app.use('/api/orders', orderRoutes);

app.use('/api/v1/menu', menuRoutes);
app.use('/api/menu', menuRoutes);

app.use('/api/v1/restaurants', restaurantRoutes);
app.use('/api/restaurants', restaurantRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'OrderKare API is running' });
});

// Initialize real-time WebSockets
const start = async () => {
  await initSocket(server);
  server.listen(PORT, () => {
    console.log(`🚀 OrderKare API and WebSockets running on port ${PORT}`);
  });
};

void start().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

const shutdown = async (signal: string) => {
  console.log(`${signal} received. Shutting down gracefully.`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
