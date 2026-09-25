import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { ShoppingBag, IndianRupee, Clock, Grid2X2, RefreshCcw, QrCode, Sparkles, Lock, ArrowRight, Crown } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { io } from 'socket.io-client';
import { getSocketUrl } from '../lib/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { PaymentModal } from '../components/PaymentModal';

interface DashboardStats {
  todayOrders: number;
  todaySales: number;
  todayRevenue?: number;
  pendingOrders: number;
  activeTables: number;
  totalTables: number;
}

interface RecentOrder {
  id: string;
  customerName: string;
  tableNumber: string;
  totalAmount: number;
  status: string;
  notes?: string | null;
  createdAt: string;
  items: { foodItem: { name: string }; quantity: number }[];
}

interface FeedbackItem {
  id: string;
  customerName: string;
  tableNumber?: string;
  foodName: string;
  rating: number;
  tags?: string[];
  favoriteDishes?: string[];
  comment: string;
  createdAt: string;
}

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>(() => {
    try {
      const cached = localStorage.getItem('orderkare_dash_stats');
      return cached ? JSON.parse(cached) : { todayOrders: 0, todaySales: 0, pendingOrders: 0, activeTables: 0, totalTables: 20 };
    } catch {
      return { todayOrders: 0, todaySales: 0, pendingOrders: 0, activeTables: 0, totalTables: 20 };
    }
  });
  const [pendingOrders, setPendingOrders] = useState<RecentOrder[]>(() => {
    try {
      const cached = localStorage.getItem('orderkare_dash_pending_orders');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [preparingOrders, setPreparingOrders] = useState<RecentOrder[]>(() => {
    try {
      const cached = localStorage.getItem('orderkare_dash_prep_orders');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [recentFeedback, setRecentFeedback] = useState<FeedbackItem[]>(() => {
    try {
      const cached = localStorage.getItem('orderkare_dash_feedback');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [subscription, setSubscription] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('orderkare_dash_sub');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [notification, setNotification] = useState<{ id: string; title: string; message: string } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (showSyncIndicator = false) => {
    if (showSyncIndicator) setIsRefreshing(true);
    try {
      // 1. Try single fast overview endpoint
      const res = await api.get('/restaurants/dashboard/overview');
      const data = res.data;
      if (data && data.stats) {
        const newStats: DashboardStats = {
          todayOrders: data.stats.todayOrders || 0,
          todaySales: data.stats.todaySales ?? data.stats.todayRevenue ?? 0,
          pendingOrders: data.stats.pendingOrders ?? data.stats.activeOrders ?? 0,
          activeTables: data.stats.activeTables || 0,
          totalTables: data.stats.totalTables || 20,
        };
        setStats(newStats);
        try { localStorage.setItem('orderkare_dash_stats', JSON.stringify(newStats)); } catch {}

        const rawOrders = data.orders || [];
        const pending = rawOrders.filter((o: RecentOrder) => o.status === 'PENDING');
        const preparing = rawOrders.filter((o: RecentOrder) => o.status === 'PREPARING' || o.status === 'ACCEPTED');
        setPendingOrders(pending);
        setPreparingOrders(preparing);
        try {
          localStorage.setItem('orderkare_dash_pending_orders', JSON.stringify(pending));
          localStorage.setItem('orderkare_dash_prep_orders', JSON.stringify(preparing));
        } catch {}

        if (data.subscription) {
          setSubscription(data.subscription);
          try { localStorage.setItem('orderkare_dash_sub', JSON.stringify(data.subscription)); } catch {}
        }

        if (data.feedback) {
          setRecentFeedback(data.feedback);
          try { localStorage.setItem('orderkare_dash_feedback', JSON.stringify(data.feedback)); } catch {}
        }
        return;
      }
    } catch (overviewErr) {
      // Graceful fallback to separate endpoints
      try {
        const [statsRes, ordersRes, fbRes, subRes] = await Promise.allSettled([
          api.get('/restaurants/dashboard/stats'),
          api.get('/orders?status=PENDING,ACCEPTED,PREPARING'),
          api.get('/orders/feedback'),
          api.get('/subscriptions/status')
        ]);

        if (statsRes.status === 'fulfilled') {
          const d = statsRes.value.data || {};
          const newStats: DashboardStats = {
            todayOrders: d.todayOrders || 0,
            todaySales: d.todaySales ?? d.todayRevenue ?? 0,
            pendingOrders: d.pendingOrders ?? d.activeOrders ?? 0,
            activeTables: d.activeTables || 0,
            totalTables: d.totalTables || 20,
          };
          setStats(newStats);
          try { localStorage.setItem('orderkare_dash_stats', JSON.stringify(newStats)); } catch {}
        }

        if (ordersRes.status === 'fulfilled') {
          const orders = ordersRes.value.data?.orders || [];
          const pending = orders.filter((o: RecentOrder) => o.status === 'PENDING');
          const preparing = orders.filter((o: RecentOrder) => o.status === 'PREPARING' || o.status === 'ACCEPTED');
          setPendingOrders(pending);
          setPreparingOrders(preparing);
          try {
            localStorage.setItem('orderkare_dash_pending_orders', JSON.stringify(pending));
            localStorage.setItem('orderkare_dash_prep_orders', JSON.stringify(preparing));
          } catch {}
        }

        if (fbRes.status === 'fulfilled') {
          setRecentFeedback(fbRes.value.data?.feedback || []);
        }

        if (subRes.status === 'fulfilled') {
          setSubscription(subRes.value.data);
          try { localStorage.setItem('orderkare_dash_sub', JSON.stringify(subRes.value.data)); } catch {}
        }
      } catch {}
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }

    const { token, user } = useAuthStore.getState();
    const socketUrl = getSocketUrl();
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
    });

    const restaurantId = user?.restaurantId || (user as any)?.restaurant?.id;

    const join = () => {
      if (restaurantId) {
        socket.emit('join_restaurant', restaurantId);
      }
    };

    socket.on('connect', join);
    if (socket.connected) join();

    const handleNewOrder = (newOrder: RecentOrder) => {
      if (!newOrder) return;
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-120.wav');
        audio.play().catch(() => {});
      } catch (e) { /* empty */ }

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('🚨 New Order Received!', {
            body: `${newOrder.customerName || 'Guest'} • Table ${newOrder.tableNumber} • ₹${newOrder.totalAmount}`,
            tag: `order-${newOrder.id}`,
          });
        } catch {}
      }

      setNotification({
        id: newOrder.id,
        title: 'New Order Received',
        message: `${newOrder.customerName || 'Guest'} from Table #${newOrder.tableNumber} (₹${newOrder.totalAmount})`,
      });

      setTimeout(() => setNotification(null), 5000);

      setPendingOrders((prev) => {
        if (prev.some(o => o.id === newOrder.id)) return prev;
        return [newOrder, ...prev];
      });

      setStats((prev) => ({
        ...prev,
        todayOrders: prev.todayOrders + 1,
        pendingOrders: prev.pendingOrders + 1,
        todaySales: prev.todaySales + (Number(newOrder.totalAmount) || 0),
        todayRevenue: (prev.todayRevenue || prev.todaySales || 0) + (Number(newOrder.totalAmount) || 0),
      }));
    };

    socket.on('new_order', handleNewOrder);

    const handleNewFeedback = (fb: any) => {
      if (!fb) return;
      setRecentFeedback((prev) => [fb, ...prev.filter(f => f.id !== fb.id)].slice(0, 20));
      setNotification({
        id: fb.id,
        title: `⭐ ${fb.rating}★ Review from ${fb.customerName || 'Customer'}${fb.tableNumber ? ` (Table #${fb.tableNumber})` : ''}`,
        message: fb.comment || fb.foodName || 'Customer submitted dining feedback.',
      });
      setTimeout(() => setNotification(null), 6000);
    };

    socket.on('new_feedback', handleNewFeedback);
    socket.on('global_new_feedback', (bFeedback: any) => {
      if (!restaurantId || bFeedback?.restaurantId === restaurantId) {
        handleNewFeedback(bFeedback);
      }
    });

    socket.on('order_updated', () => {
      fetchData();
    });

    // Resilient Polling Fallback (every 15s, paused when tab is in background)
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchData();
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const statCards = [
    { label: "Today's Orders", value: stats.todayOrders, icon: ShoppingBag, color: 'bg-primary/10 text-primary' },
    { label: "Today's Sales", value: `₹${(stats.todaySales || 0).toLocaleString()}`, icon: IndianRupee, color: 'bg-blue-50 text-blue-600' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'bg-amber-50 text-amber-600', highlight: true },
    { label: 'Active Tables', value: `${stats.activeTables}/${stats.totalTables}`, icon: Grid2X2, color: 'bg-emerald-50 text-emerald-600' },
  ];

  const stagger = {
    container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
    item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } },
  };

  return (
    <motion.div className="space-y-7" variants={stagger.container} initial="hidden" animate="show">
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          className="fixed top-4 right-4 z-50 max-w-sm w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-lg shadow-emerald-100"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-bold">✓</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-emerald-800">{notification.title}</p>
              <p className="text-xs text-emerald-700 mt-1">{notification.message}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <motion.div variants={stagger.item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Operations Live View</h1>
          <p className="text-slate-500 text-sm mt-0.5">Restaurant Management & Master QR Ordering Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (subscription?.isSubscribed) {
                navigate('/dashboard/tables');
              } else {
                setShowPaymentModal(true);
              }
            }} 
            className="flex items-center space-x-2 bg-gradient-to-r from-primary to-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-primary/20 hover:opacity-95 transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>{subscription?.isSubscribed ? 'Master QR Standee & Tables' : 'Unlock Master QR (₹1)'}</span>
          </button>
          <button onClick={() => fetchData(true)} className="flex items-center space-x-2 bg-white text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all cursor-pointer">
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </motion.div>

      {/* QR Code & Subscription Status Hero Banner */}
      <motion.div 
        variants={stagger.item}
        className={`rounded-3xl border-2 p-6 shadow-sm transition-all ${
          subscription?.isSubscribed 
            ? 'bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 border-emerald-300' 
            : 'bg-gradient-to-br from-orange-50 via-white to-amber-50/50 border-orange-300'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              subscription?.isSubscribed 
                ? 'bg-emerald-500 text-white shadow-emerald-200' 
                : 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-orange-200'
            }`}>
              {subscription?.isSubscribed ? <QrCode className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-extrabold text-slate-900">
                  {subscription?.isSubscribed ? 'Master Restaurant QR Standee: Live & Active' : 'Master Restaurant QR Standee'}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  subscription?.isSubscribed 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                    : 'bg-orange-100 text-orange-800 border border-orange-200'
                }`}>
                  {subscription?.isSubscribed ? (subscription?.daysRemaining !== undefined ? `${subscription.daysRemaining} Days Left` : 'Active') : (subscription?.isFirstTime ? '₹1 Activation Needed' : 'Subscription Expired')}
                </span>
              </div>
              <p className="text-slate-600 text-sm mt-1 max-w-2xl">
                {subscription?.isSubscribed 
                  ? `Your restaurant's single master QR standee is active. Guests scanning the QR from any table can view your live menu and place orders straight to this live dashboard.`
                  : subscription?.isFirstTime 
                    ? 'New account special: Complete the one-time ₹1 activation to generate your permanent Master QR standee and receive 30 days completely free!'
                    : 'Renew your subscription to reactivate your permanent master QR code standee for live customer ordering.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
            {subscription?.isSubscribed ? (
              <button
                onClick={() => navigate('/dashboard/tables')}
                className="w-full lg:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 rounded-2xl shadow-md shadow-emerald-200 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>View & Print Master Standee</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full lg:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black px-6 py-3.5 rounded-2xl shadow-lg shadow-orange-500/25 transition-all cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>{subscription?.isFirstTime ? 'Pay ₹1 & Unlock QR (30 Days Free)' : 'Renew & Unlock Master QR'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={stagger.item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className={`text-3xl font-extrabold tracking-tight ${stat.highlight ? 'text-amber-600' : 'text-slate-900'}`}>
                {stat.value}
              </p>
              <p className="text-xs text-slate-500 mt-1 font-medium">{stat.label}</p>
            </div>
          );
        })}
      </motion.div>

      {/* Real-time Order Kanban */}
      <motion.div variants={stagger.item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Column */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
              <h3 className="font-bold text-slate-900 text-sm">Pending</h3>
            </div>
            <span className="bg-amber-50 text-amber-600 text-xs font-bold px-3 py-1 rounded-full">{pendingOrders.length}</span>
          </div>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-3xl block mb-2">🎉</span>
                <p className="text-slate-400 text-sm font-medium">All caught up!</p>
                <p className="text-slate-400 text-xs">No pending orders right now</p>
              </div>
            ) : pendingOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-amber-200 transition-colors"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-bold text-slate-900 text-sm font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                  <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md font-semibold">{timeAgo(order.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-600 font-medium">{order.customerName}</p>
                  <p className="text-xs text-slate-400">Table {order.tableNumber}</p>
                </div>
                <p className="text-[11px] text-slate-500 mb-2 line-clamp-1">
                  {order.items.map(i => `${i.quantity}× ${i.foodItem.name}`).join(' • ')}
                </p>
                {order.notes && (
                  <div className="mb-3 px-2 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-[11px] font-bold flex items-center gap-1">
                    <span>🌶️</span>
                    <span className="truncate">Note: {order.notes}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">₹{order.totalAmount}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateOrderStatus(order.id, 'REJECTED')}
                      className="px-3 py-2 bg-slate-100 text-slate-500 text-xs rounded-xl font-semibold hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ACCEPTED')}
                      className="px-4 py-2 bg-primary text-white text-xs rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/10"
                    >
                      Accept ✓
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Preparing Column */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
              <h3 className="font-bold text-slate-900 text-sm">In Kitchen</h3>
            </div>
            <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full">{preparingOrders.length}</span>
          </div>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {preparingOrders.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-3xl block mb-2">👨‍🍳</span>
                <p className="text-slate-400 text-sm font-medium">Kitchen is clear</p>
                <p className="text-slate-400 text-xs">No orders being prepared</p>
              </div>
            ) : preparingOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-bold text-slate-900 text-sm font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-semibold">{timeAgo(order.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-600 font-medium">{order.customerName}</p>
                  <p className="text-xs text-slate-400">Table {order.tableNumber}</p>
                </div>
                <p className="text-[11px] text-slate-500 mb-2 line-clamp-1">
                  {order.items.map(i => `${i.quantity}× ${i.foodItem.name}`).join(' • ')}
                </p>
                {order.notes && (
                  <div className="mb-3 px-2 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-[11px] font-bold flex items-center gap-1">
                    <span>🌶️</span>
                    <span className="truncate">Note: {order.notes}</span>
                  </div>
                )}
                <button
                  onClick={() => updateOrderStatus(order.id, 'READY')}
                  className="w-full bg-emerald-500 text-white text-xs py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-500/10"
                >
                  🔔 Mark Ready for Serving
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Kitchen Status & Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Live Kitchen Status</h3>
            <div className="space-y-3">
              {[
                { emoji: '🔥', label: 'Grill Station', status: pendingOrders.length > 0 ? 'Busy' : 'Idle', color: pendingOrders.length > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500' },
                { emoji: '🥘', label: 'Pantry', status: preparingOrders.length > 0 ? 'Active' : 'Standby', color: preparingOrders.length > 0 ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500' },
                { emoji: '🥤', label: 'Beverage', status: 'Idle', color: 'bg-slate-100 text-slate-500' },
              ].map((station, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{station.emoji}</span>
                    <span className="text-sm font-semibold text-slate-700">{station.label}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${station.color}`}>
                    {station.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Food Feedback</h3>
              <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-1 rounded-full">{recentFeedback.length}</span>
            </div>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {recentFeedback.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-sm font-medium">No customer feedback yet</p>
                </div>
              ) : recentFeedback.map((feedback) => (
                <div key={feedback.id} className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-left space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-slate-800 truncate">{feedback.customerName}</span>
                      {feedback.tableNumber && (
                        <span className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-mono font-bold">
                          T#{feedback.tableNumber}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-amber-500 font-bold shrink-0">
                      {'★'.repeat(feedback.rating)}{feedback.rating < 5 ? '☆'.repeat(5 - feedback.rating) : ''}
                    </span>
                  </div>
                  {feedback.foodName && (
                    <p className="text-[11px] text-slate-500 line-clamp-1">{feedback.foodName}</p>
                  )}
                  {feedback.tags && feedback.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 py-0.5">
                      {feedback.tags.slice(0, 3).map((t, idx) => (
                        <span key={idx} className="text-[9px] bg-orange-50 text-orange-700 font-bold px-1.5 py-0.5 rounded border border-orange-100">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-600 leading-relaxed">{feedback.comment || 'No comment provided.'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(feedback.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { emoji: '⊕', label: 'New Order' },
                { emoji: '🪑', label: 'Assign Table' },
                { emoji: '📊', label: 'View Reports' },
                { emoji: '⚙️', label: 'Settings' },
              ].map((action, idx) => (
                <button key={idx} className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all group">
                  <span className="text-xl mb-1.5 group-hover:scale-110 transition-transform">{action.emoji}</span>
                  <span className="text-[11px] text-slate-600 font-semibold">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <PaymentModal
            planName={subscription?.isFirstTime ? 'First-Time Activation (1 Month Free)' : 'Monthly Plan Renewal'}
            planId={subscription?.isFirstTime ? 'FIRST_TIME_ACTIVATION' : 'MONTHLY'}
            amount={subscription?.isFirstTime ? 1 : 249}
            durationDays={30}
            upiId={subscription?.payment?.upiId || ''}
            restaurantName={user?.name || 'Restaurant'}
            razorpayEnabled={subscription?.payment?.razorpayEnabled ?? true}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={() => {
              fetchData();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
