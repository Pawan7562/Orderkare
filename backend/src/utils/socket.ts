import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server | null = null;

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join room based on restaurant ID to receive scoped updates
    socket.on('join_restaurant', (restaurantId: string) => {
      socket.join(restaurantId);
      console.log(`🔌 Client ${socket.id} joined restaurant room: ${restaurantId}`);
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

export const notifyNewOrder = (restaurantId: string, order: any) => {
  if (io) {
    io.to(restaurantId).emit('new_order', order);
  }
};

export const notifyOrderStatusUpdate = (orderId: string, status: string) => {
  if (io) {
    io.emit(`order_status_${orderId}`, { status });
  }
};
