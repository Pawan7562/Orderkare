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

    // Auto-join super admin room if role is SUPER_ADMIN
    if (socket.data.user?.role === 'SUPER_ADMIN') {
      socket.join('super_admin');
      console.log(`👑 Client ${socket.id} auto-joined super_admin room`);
    }

    // Join super admin room explicitly (strictly for SUPER_ADMIN role)
    socket.on('join_super_admin', () => {
      if (socket.data.user?.role === 'SUPER_ADMIN') {
        socket.join('super_admin');
        console.log(`👑 Client ${socket.id} explicitly joined super_admin room`);
      } else {
        console.warn(`🚨 Unauthorized attempt by socket ${socket.id} to join super_admin room`);
      }
    });

    // Join room based on restaurant ID (strictly for matching restaurant or super admin)
    socket.on('join_restaurant', (restaurantId: string) => {
      if (restaurantId && typeof restaurantId === 'string') {
        const user = socket.data.user;
        const isAuthorized = user && (
          user.role === 'SUPER_ADMIN' ||
          user.role === 'ADMIN' ||
          user.restaurantId === restaurantId
        );
        if (isAuthorized) {
          socket.join(restaurantId);
          console.log(`🔌 Client ${socket.id} joined restaurant room: ${restaurantId}`);
        } else {
          console.warn(`🚨 Unauthorized attempt by socket ${socket.id} to join restaurant room: ${restaurantId}`);
        }
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
    // Emit strictly to the owning restaurant room
    io.to(restaurantId).emit('new_order', order);
    console.log(`🔌 Emitted new_order strictly to restaurant room: ${restaurantId}`);
  }
  sendOrderPushNotification(restaurantId, order).catch(() => {});
};

export const notifyOrderStatusUpdate = (orderId: string, status: string, restaurantId?: string) => {
  if (io) {
    // 1. Emit to scoped order room (for customer tracking)
    io.to(`order:${orderId}`).emit('order_status_update', { orderId, status });
    io.emit(`order_status_${orderId}`, { orderId, status });

    // 2. Emit order_updated strictly to restaurant room for admin dashboard
    if (restaurantId) {
      io.to(restaurantId).emit('order_updated', { orderId, status, restaurantId });
    }
    console.log(`🔌 Emitted order status update: order=${orderId}, status=${status}, restaurant=${restaurantId}`);
  }
};

export const notifyNewFeedback = (restaurantId: string, feedback: any) => {
  if (io) {
    // Emit strictly to the owning restaurant room
    io.to(restaurantId).emit('new_feedback', feedback);
    console.log(`⭐ Emitted new_feedback strictly to restaurant room: ${restaurantId}`);
  }
};

export const notifySuperAdmin = (notification: any) => {
  if (io) {
    io.to('super_admin').emit('admin_notification', notification);
    io.emit('super_admin_notification', notification); // Also broadcast as fallback
    console.log(`👑 Emitted admin_notification to super_admin room:`, notification.title);
  }
};

export const notifySubscriptionUpdated = (restaurantId: string, subscription: any) => {
  if (io) {
    io.to(restaurantId).emit('subscription_updated', subscription);
    io.emit(`subscription_updated_${restaurantId}`, subscription);
    console.log(`💳 Emitted subscription_updated to restaurant ${restaurantId}`);
  }
};




