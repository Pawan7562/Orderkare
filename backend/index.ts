import dns from 'dns';
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
    return origLookup.call(dns, hostname, options, callback);
  };
  patchedLookup.__promisify__ = (origLookup as any).__promisify__;
  (dns as any).lookup = patchedLookup;
} catch {}

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
import tableRoutes from './src/routes/table.routes';
import subscriptionRoutes from './src/routes/subscription.routes';
import { handleRazorpayWebhook } from './src/controllers/subscription.controller';
import adRoutes from './src/routes/ad.routes';
import planRoutes from './src/routes/plan.routes';
import settingsRoutes from './src/routes/settings.routes';
import adminRoutes from './src/routes/admin.routes';
import devopsRoutes from './src/routes/devops.routes';
import { initSocket } from './src/utils/socket';
import { db, query } from './src/lib/db';

dotenv.config();

const app = express();
const server = createServer(app);
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
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
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

    // In development allow local networks, in production reject untrusted origins
    if (process.env.NODE_ENV === 'production') {
      return callback(new Error('Blocked by CORS policy: Origin not allowed'));
    }
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.post('/api/webhooks/razorpay', express.raw({ type: 'application/json', limit: '2mb' }), handleRazorpayWebhook);
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

app.use('/api/v1/tables', tableRoutes);
app.use('/api/tables', tableRoutes);
app.use('/tables', tableRoutes);

app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/subscriptions', subscriptionRoutes);

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

app.use('/api/v1/admin', adminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);
app.use('/api/v1/super-admin', adminRoutes);
app.use('/api/super-admin', adminRoutes);

app.use('/api/v1/devops', devopsRoutes);
app.use('/api/devops', devopsRoutes);
app.use('/devops', devopsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'OrderKare API is running',
    payments: {
      provider: 'razorpay',
      configured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      mode: process.env.RAZORPAY_MODE || 'live',
    },
  });
});

// 404 Not Found Handler for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ message: 'Requested API endpoint not found' });
});

// Global Production-Safe Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Application Error:', err);
  const status = Number(err.status || err.statusCode || 500);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(status).json({
    message: isProd && status === 500 ? 'Internal server error. Please try again later.' : (err.message || 'Internal server error')
  });
});

// Initialize real-time WebSockets
const start = async () => {
  // Warm up the DB pool on startup so the first user request is instant
  query('SELECT 1').then(() => {
    console.log('✅ Database pool warmed up and ready');
  }).catch(() => {});

  await initSocket(server);
  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 OrderKare API and WebSockets running on http://localhost:${PORT}`);
  });
};

void start().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

const shutdown = async (signal: string) => {
  console.log(`${signal} received. Shutting down gracefully.`);
  server.close(async () => {
    try {
      await db.end();
    } catch {}
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
