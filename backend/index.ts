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
import adRoutes from './src/routes/ad.routes';
import planRoutes from './src/routes/plan.routes';
import settingsRoutes from './src/routes/settings.routes';
import { initSocket } from './src/utils/socket';


dotenv.config();

const app = express();
const server = createServer(app);
export const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const envOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const defaultAllowedOrigins = [
  'https://www.orderkare.co.in',
  'https://orderkare.co.in',
  'https://orderkare-3.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000'
];

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    // Allow localhost and local network origins for development
    if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    // Allow Vercel preview deployments
    if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Fallback in dev or allow with warning
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));
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
app.use('/categories', categoryRoutes);

app.use('/api/v1/foods', foodRoutes);
app.use('/api/foods', foodRoutes);
app.use('/foods', foodRoutes);

app.use('/api/v1/orders', orderRoutes);
app.use('/api/orders', orderRoutes);
app.use('/orders', orderRoutes);

app.use('/api/v1/menu', menuRoutes);
app.use('/api/menu', menuRoutes);
app.use('/menu', menuRoutes);

app.use('/api/v1/restaurants', restaurantRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/restaurants', restaurantRoutes);

app.use('/api/v1/ads', adRoutes);
app.use('/api/ads', adRoutes);
app.use('/ads', adRoutes);
app.use('/api/v1/super-admin/ads', adRoutes);
app.use('/api/super-admin/ads', adRoutes);
app.use('/super-admin/ads', adRoutes);

app.use('/api/v1/plans', planRoutes);
app.use('/api/plans', planRoutes);
app.use('/plans', planRoutes);
app.use('/api/v1/super-admin/plans', planRoutes);
app.use('/api/super-admin/plans', planRoutes);
app.use('/super-admin/plans', planRoutes);

app.use('/api/v1/settings', settingsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/settings', settingsRoutes);
app.use('/api/v1/super-admin/settings', settingsRoutes);
app.use('/api/super-admin/settings', settingsRoutes);
app.use('/super-admin/settings', settingsRoutes);

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

process.on('unhandledRejection', (reason, promise) => {
  console.warn('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.warn('Uncaught Exception thrown:', err);
});

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
