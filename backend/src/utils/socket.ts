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
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');
      if (token && typeof token === 'string') {
        try {
          socket.data.user = verifyToken(token);
        } catch {
          console.warn(`[Socket] Token verification failed for client ${socket.id}, proceeding as guest`);
        }
      }
      // Allow connection to proceed (both authenticated admins and guest customers)
      next();
    } catch (err) {
      console.warn(`[Socket] Auth middleware error:`, err);
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id} (user: ${socket.data?.user?.email || 'guest'})`);

    // Auto-join room based on token restaurant ID
    if (socket.data.user?.restaurantId) {
      socket.join(socket.data.user.restaurantId);
      console.log(`🔌 Client ${socket.id} auto-joined restaurant room: ${socket.data.user.restaurantId}`);
    }

    // Join room based on restaurant ID to receive scoped updates
    socket.on('join_restaurant', (restaurantId: string) => {
      if (restaurantId && typeof restaurantId === 'string') {
        socket.join(restaurantId);
        console.log(`🔌 Client ${socket.id} joined restaurant room: ${restaurantId}`);
      }
    });

    // Join room based on order ID for customer live order tracking
    socket.on('join_order', (orderId: string) => {
      if (orderId && typeof orderId === 'string') {
        socket.join(`order:${orderId}`);
        console.log(`🔌 Client ${socket.id} joined order room: order:${orderId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
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

export const notifyOrderStatusUpdate = (orderId: string, status: string, restaurantId?: string) => {
  if (io) {
    // 1. Emit legacy individual event for direct listeners
    io.emit(`order_status_${orderId}`, { orderId, status });
    // 2. Emit to scoped order room
    io.to(`order:${orderId}`).emit('order_status_update', { orderId, status });
    // 3. Emit order_updated to restaurant room & globally so admin views refresh live
    if (restaurantId) {
      io.to(restaurantId).emit('order_updated', { orderId, status, restaurantId });
    }
    io.emit('order_updated', { orderId, status, restaurantId });
    console.log(`🔌 Emitted order status update: order=${orderId}, status=${status}`);
  }
};

export const notifyNewFeedback = (restaurantId: string, feedback: any) => {
  if (io) {
    io.to(restaurantId).emit('new_feedback', feedback);
    io.emit('global_new_feedback', { ...feedback, restaurantId });
    console.log(`⭐ Emitted new_feedback for restaurant: ${restaurantId}`);
  }
};


