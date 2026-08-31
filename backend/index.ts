import express from 'express';
import cors from 'cors';
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

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes (supporting both /api/v1 and /api)
app.use('/api/v1/auth', authRoutes);
app.use('/api/auth', authRoutes);

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
initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 OrderKare API and WebSockets running on port ${PORT}`);
});
