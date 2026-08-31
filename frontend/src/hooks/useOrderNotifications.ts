import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useNotificationSound } from './useNotificationSound';

interface OrderNotification {
  id: string;
  customerName: string;
  tableNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: { foodItem: { name: string }; quantity: number }[];
}

interface UseOrderNotificationsReturn {
  /** Currently pending (unacknowledged) notifications */
  notifications: OrderNotification[];
  /** Dismiss a specific notification by order ID */
  dismiss: (orderId: string) => void;
  /** Dismiss all pending notifications */
  dismissAll: () => void;
  /** Whether the socket is connected */
  isConnected: boolean;
}

/**
 * Global hook to listen for new orders via WebSocket and manage notifications.
 * Should be used once in the AdminLayout so it works across all dashboard pages.
 */
export function useOrderNotifications(): UseOrderNotificationsReturn {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const { startRing, stopRing, playBellOnce } = useNotificationSound();

  const dismiss = useCallback((orderId: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== orderId);
      if (updated.length === 0) {
        stopRing();
      }
      return updated;
    });
  }, [stopRing]);

  const dismissAll = useCallback(() => {
    setNotifications([]);
    stopRing();
  }, [stopRing]);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '').replace('/api', '') 
      || import.meta.env.VITE_WS_URL 
      || 'http://localhost:5000';
    
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      const user = useAuthStore.getState().user;
      if (user?.restaurantId) {
        socket.emit('join_restaurant', user.restaurantId);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('new_order', (order: OrderNotification) => {
      setNotifications(prev => {
        // Avoid duplicates
        if (prev.some(n => n.id === order.id)) return prev;

        const updated = [order, ...prev];
        // Start ringing (repeating bell) — only if not already ringing
        startRing(3000);
        return updated;
      });

      // Also try browser Notification API if permission was granted
      if (Notification.permission === 'granted') {
        try {
          new Notification('🔔 New Order Received!', {
            body: `${order.customerName} — Table ${order.tableNumber} — ₹${order.totalAmount}`,
            icon: '/logo.jpg',
            tag: `order-${order.id}`,
          });
        } catch (_) { /* Notification API not available in some contexts */ }
      }
    });

    // Request browser notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socket.disconnect();
      stopRing();
    };
  }, [startRing, stopRing]);

  return { notifications, dismiss, dismissAll, isConnected };
}
