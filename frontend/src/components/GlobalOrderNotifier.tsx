import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ShoppingBag, X, CheckCircle2 } from 'lucide-react';

interface IncomingOrder {
  id?: string;
  _id?: string;
  orderNumber?: number | string;
  tableNumber: string | number;
  customerName?: string;
  totalAmount: number;
  items?: any[];
  status?: string;
}

export const GlobalOrderNotifier: React.FC = () => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [activeOrder, setActiveOrder] = useState<IncomingOrder | null>(null);
  const seenOrderIds = useRef<Set<string>>(new Set());
  const hasInitializedPolling = useRef(false);

  const restaurantId = user?.restaurantId || (user as any)?.restaurant?.id;

  const triggerOrderAlert = (order: IncomingOrder) => {
    const orderId = order.id || order._id || '';
    if (orderId && seenOrderIds.current.has(orderId)) return;
    if (orderId) seenOrderIds.current.add(orderId);

    // 1. Play kitchen bell chime sound
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-120.wav');
      audio.play().catch(() => {});
    } catch {}

    // 2. Trigger native browser push notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('🚨 NEW ORDER RECEIVED!', {
          body: `Table #${order.tableNumber} • ₹${order.totalAmount} (${order.customerName || 'Guest'})`,
          tag: `order-${orderId || Date.now()}`,
        });
      } catch {}
    }

    // 3. Display interactive banner
    setActiveOrder(order);
  };

  useEffect(() => {
    if (!token || !restaurantId) return;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }

    const socketUrl =
      import.meta.env.VITE_WS_URL ||
      (import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '')
        : 'https://orderkare-3.onrender.com');

    const socket: Socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    const join = () => {
      if (restaurantId) {
        socket.emit('join_restaurant', restaurantId);
        console.log('[GlobalOrderNotifier Web] Joined restaurant:', restaurantId);
      }
    };

    socket.on('connect', join);
    if (socket.connected) join();

    socket.on('new_order', (newOrder: IncomingOrder) => {
      console.log('[GlobalOrderNotifier Web] WebSocket new_order received:', newOrder);
      triggerOrderAlert(newOrder);
    });

    socket.on('global_new_order', (broadcastOrder: any) => {
      if (!broadcastOrder) return;
      if (!restaurantId || broadcastOrder.restaurantId === restaurantId) {
        console.log('[GlobalOrderNotifier Web] WebSocket global_new_order received:', broadcastOrder);
        triggerOrderAlert(broadcastOrder);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, restaurantId]);

  // Resilient Polling Fallback (every 4 seconds)
  useEffect(() => {
    if (!token || !restaurantId) return;
    let isMounted = true;

    const pollPending = async () => {
      try {
        const res = await api.get('/orders?status=PENDING');
        const list: IncomingOrder[] = res.data.orders || res.data || [];
        if (Array.isArray(list) && isMounted) {
          if (!hasInitializedPolling.current) {
            list.forEach(ord => {
              const id = ord.id || ord._id || '';
              if (id) seenOrderIds.current.add(id);
            });
            hasInitializedPolling.current = true;
            return;
          }

          for (const ord of list) {
            const id = ord.id || ord._id || '';
            if (id && !seenOrderIds.current.has(id)) {
              console.log('[GlobalOrderNotifier Web] Polling detected new pending order:', id);
              triggerOrderAlert(ord);
              break;
            }
          }
        }
      } catch (err) {
        // silent polling error
      }
    };

    pollPending();
    const interval = setInterval(pollPending, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token, restaurantId]);

  const handleAcceptOrder = async () => {
    if (!activeOrder) return;
    const orderId = activeOrder.id || activeOrder._id;
    if (orderId) {
      try {
        await api.patch(`/orders/${orderId}/status`, { status: 'ACCEPTED' });
      } catch (e) {
        console.error(e);
      }
    }
    setActiveOrder(null);
    navigate('/dashboard/orders');
  };

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
            onClick={() => {
              setActiveOrder(null);
              navigate('/dashboard/orders');
            }}
            className="flex-1 flex items-center justify-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 py-2 rounded-xl transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>View</span>
          </button>
          <button
            onClick={handleAcceptOrder}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 py-2 rounded-xl transition-colors shadow-sm shadow-orange-200"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Accept Order</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

