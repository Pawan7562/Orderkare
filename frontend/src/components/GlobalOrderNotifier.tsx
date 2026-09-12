import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ShoppingBag, X, ArrowRight } from 'lucide-react';

interface IncomingOrder {
  id?: string;
  _id?: string;
  orderNumber?: number | string;
  tableNumber: string | number;
  customerName?: string;
  totalAmount: number;
}

export const GlobalOrderNotifier: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeOrder, setActiveOrder] = useState<IncomingOrder | null>(null);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }

    const socketUrl =
      import.meta.env.VITE_WS_URL ||
      (import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '')
        : 'https://orderkare-3.onrender.com');

    const socket: Socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
    });

    const restaurantId = user?.restaurantId || (user as any)?.restaurant?.id;

    const join = () => {
      if (restaurantId) {
        socket.emit('join_restaurant', restaurantId);
        console.log('[GlobalOrderNotifier Web] Joined restaurant:', restaurantId);
      }
    };

    socket.on('connect', join);
    if (socket.connected) join();

    socket.on('new_order', (newOrder: IncomingOrder) => {
      console.log('[GlobalOrderNotifier Web] Received new order:', newOrder);

      // 1. Play kitchen bell audio
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-120.wav');
        audio.play().catch(() => {});
      } catch {}

      // 2. Trigger native browser push notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 NEW ORDER RECEIVED!', {
          body: `Table #${newOrder.tableNumber} • ₹${newOrder.totalAmount} (${newOrder.customerName || 'Guest'})`,
          tag: `order-${newOrder.id || newOrder._id || Date.now()}`,
        });
      }

      // 3. Show global popup banner
      setActiveOrder(newOrder);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.restaurantId, (user as any)?.restaurant?.id]);

  if (!activeOrder) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -24, scale: 0.95 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="fixed top-5 right-5 z-[9999] max-w-sm w-full bg-white border-2 border-orange-500 rounded-2xl shadow-2xl p-4 overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-orange-200">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                New Order Received
              </span>
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 mt-1">
              Table #{activeOrder.tableNumber} • ₹{Number(activeOrder.totalAmount || 0).toLocaleString('en-IN')}
            </h4>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {activeOrder.customerName || 'Guest Customer'}
            </p>
          </div>

          <button
            onClick={() => setActiveOrder(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => setActiveOrder(null)}
            className="flex-1 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 py-2 rounded-xl transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              setActiveOrder(null);
              navigate('/dashboard/orders');
            }}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 py-2 rounded-xl transition-colors shadow-sm shadow-orange-200"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>View Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
