import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { verifyToken } from './jwt';

let io: Server | null = null;

export const initSocket = async (server: HttpServer): Promise<Server> => {
  const allowedOrigins = (process.env.CORS_ORIGIN || 'https://www.orderkare.co.in,https://orderkare.co.in')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
    },
  });

  if (process.env.REDIS_URL) {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
  }

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token || typeof token !== 'string') return next(new Error('Authentication required'));
      socket.data.user = verifyToken(token);
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Auto-join room based on token restaurant ID
    if (socket.data.user?.restaurantId) {
      socket.join(socket.data.user.restaurantId);
      console.log(`🔌 Client ${socket.id} auto-joined restaurant room: ${socket.data.user.restaurantId}`);
    }

    // Join room based on restaurant ID to receive scoped updates
    socket.on('join_restaurant', (restaurantId: string) => {
      if (restaurantId) {
        socket.join(restaurantId);
        console.log(`🔌 Client ${socket.id} joined restaurant room: ${restaurantId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

import { sendOrderPushNotification } from './push';

export const notifyNewOrder = (restaurantId: string, order: any) => {
  if (io) {
    // 1. Emit to restaurant room
    io.to(restaurantId).emit('new_order', order);
    // 2. Also emit global event with restaurantId attached for fallback
    io.emit('global_new_order', { ...order, restaurantId });
    console.log(`🔌 Emitted new_order & global_new_order for restaurant: ${restaurantId}`);
  }
  sendOrderPushNotification(restaurantId, order).catch(() => {});
};

export const notifyOrderStatusUpdate = (orderId: string, status: string) => {
  if (io) {
    io.emit(`order_status_${orderId}`, { status });
  }
};
