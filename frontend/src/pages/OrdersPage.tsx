import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../lib/api';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import {
  Filter, ChevronDown, Clock, Package, Truck, CheckCircle,
  XCircle, Printer, Volume2, VolumeX, Search, RefreshCw,
  UtensilsCrossed, AlertCircle, ChefHat, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderItem {
  foodItem?: { name: string; price?: number };
  name?: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  tableNumber: string;
  totalAmount: number;
  status: string;
  notes?: string | null;
  createdAt: string;
  phoneNumber: string | null;
  items: OrderItem[];
}

const statusConfig: Record<string, { label: string; bg: string; badge: string; icon: any; next: string | null; actionLabel: string; btnColor: string }> = {
  PENDING:   { label: 'Pending',   bg: 'bg-amber-50 text-amber-700 border-amber-200', badge: 'bg-amber-500 text-white', icon: Clock, next: 'ACCEPTED', actionLabel: 'Accept Order', btnColor: 'bg-amber-500 hover:bg-amber-600' },
  ACCEPTED:  { label: 'Accepted',  bg: 'bg-blue-50 text-blue-700 border-blue-200', badge: 'bg-blue-500 text-white', icon: Package, next: 'PREPARING', actionLabel: 'Start Cooking', btnColor: 'bg-blue-600 hover:bg-blue-700' },
  PREPARING: { label: 'Cooking',   bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', badge: 'bg-indigo-500 text-white', icon: ChefHat, next: 'READY', actionLabel: 'Mark Ready', btnColor: 'bg-indigo-600 hover:bg-indigo-700' },
  READY:     { label: 'Ready',     bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', badge: 'bg-emerald-500 text-white', icon: Truck, next: 'SERVED', actionLabel: 'Mark Served', btnColor: 'bg-emerald-600 hover:bg-emerald-700' },
  SERVED:    { label: 'Served',    bg: 'bg-teal-50 text-teal-700 border-teal-200', badge: 'bg-teal-500 text-white', icon: CheckCircle, next: 'COMPLETED', actionLabel: 'Complete & Settle', btnColor: 'bg-teal-600 hover:bg-teal-700' },
  COMPLETED: { label: 'Completed', bg: 'bg-slate-100 text-slate-700 border-slate-200', badge: 'bg-slate-600 text-white', icon: CheckCircle, next: null, actionLabel: '', btnColor: '' },
  REJECTED:  { label: 'Rejected',  bg: 'bg-rose-50 text-rose-700 border-rose-200', badge: 'bg-rose-500 text-white', icon: XCircle, next: null, actionLabel: '', btnColor: '' },
};

export const OrdersPage = () => {
  const { user, token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const seenOrderIds = useRef<Set<string>>(new Set());

  const restaurantId = user?.restaurantId || (user as any)?.restaurant?.id;

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-120.wav');
      audio.play().catch(() => {});
    } catch {}
  };

  const fetchOrders = useCallback(async (showLoader = false) => {
    if (showLoader) setIsRefreshing(true);
    try {
      const statusQuery = activeFilter === 'ALL' ? '' : `?status=${activeFilter}`;
      const res = await api.get(`/orders${statusQuery}`);
      const list = res.data.orders || res.data || [];
      if (Array.isArray(list)) {
        setOrders(list);
        list.forEach(o => {
          if (o.id) seenOrderIds.current.add(o.id);
        });
      }
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchOrders(true);
  }, [fetchOrders]);

  // Real-time WebSocket synchronization
  useEffect(() => {
    if (!token) return;

    const socketUrl =
      import.meta.env.VITE_WS_URL ||
      (import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '')
        : 'https://orderkare-3.onrender.com');

    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
    });

    const join = () => {
      if (restaurantId) {
        socket.emit('join_restaurant', restaurantId);
      }
    };

    socket.on('connect', join);
    if (socket.connected) join();

    const handleNewOrder = (newOrder: any) => {
      if (!newOrder) return;
      const id = newOrder.id || newOrder._id;
      if (id && !seenOrderIds.current.has(id)) {
        seenOrderIds.current.add(id);
        playChime();
      }
      setOrders(prev => {
        if (prev.some(o => o.id === id)) return prev;
        return [newOrder, ...prev];
      });
    };

    const handleOrderUpdated = (update: { orderId: string; status: string }) => {
      if (!update?.orderId) return;
      setOrders(prev =>
        prev.map(o => (o.id === update.orderId ? { ...o, status: update.status } : o))
      );
    };

    socket.on('new_order', handleNewOrder);
    socket.on('global_new_order', (bOrder: any) => {
      if (!restaurantId || bOrder?.restaurantId === restaurantId) {
        handleNewOrder(bOrder);
      }
    });
    socket.on('order_updated', handleOrderUpdated);

    // Resilient Polling Fallback (every 4s)
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 4000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [token, restaurantId, fetchOrders, soundEnabled]);

  const updateStatus = async (id: string, status: string) => {
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, status } : o)));
    try {
      await api.patch(`/orders/${id}/status`, { status });
      fetchOrders(false);
    } catch (err) {
      console.error(err);
      fetchOrders(false);
    }
  };

  const handlePrint = (order: Order) => {
    setPrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const filteredOrders = orders.filter(o => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (o.customerName || '').toLowerCase().includes(q) ||
      String(o.tableNumber || '').includes(q) ||
      (o.phoneNumber || '').includes(q) ||
      (o.id || '').toLowerCase().includes(q)
    );
  });

  const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const preparingCount = orders.filter(o => o.status === 'ACCEPTED' || o.status === 'PREPARING').length;
  const readyCount = orders.filter(o => o.status === 'READY').length;
  const completedCount = orders.filter(o => o.status === 'SERVED' || o.status === 'COMPLETED').length;
  const totalRev = orders
    .filter(o => o.status !== 'REJECTED')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const filters = ['ALL', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'REJECTED'];

  return (
    <div className="space-y-6">
      {/* ─── 1. TOP HEADER & CONTROLS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Live Order Pipeline</h1>
            <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              Live Connected
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Real-time kitchen dispatch, status progression, and KOT receipt printing
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              soundEnabled
                ? 'bg-orange-50 border-orange-200 text-orange-600'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
            title={soundEnabled ? 'Audio alerts active' : 'Audio muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => fetchOrders(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all shadow-xs"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── 2. LIVE METRICS SUMMARY RIBBON ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setActiveFilter('PENDING')}
          className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
            activeFilter === 'PENDING'
              ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
              : 'bg-white border-slate-200 text-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-black uppercase tracking-wider ${activeFilter === 'PENDING' ? 'text-amber-100' : 'text-amber-600'}`}>
              Pending
            </span>
            <Clock className="w-4 h-4 opacity-80" />
          </div>
          <p className="text-xl font-black mt-1 font-mono">{pendingCount}</p>
        </div>

        <div
          onClick={() => setActiveFilter('PREPARING')}
          className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
            activeFilter === 'PREPARING'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
              : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-black uppercase tracking-wider ${activeFilter === 'PREPARING' ? 'text-indigo-100' : 'text-indigo-600'}`}>
              In Kitchen
            </span>
            <ChefHat className="w-4 h-4 opacity-80" />
          </div>
          <p className="text-xl font-black mt-1 font-mono">{preparingCount}</p>
        </div>

        <div
          onClick={() => setActiveFilter('READY')}
          className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
            activeFilter === 'READY'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
              : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-black uppercase tracking-wider ${activeFilter === 'READY' ? 'text-emerald-100' : 'text-emerald-600'}`}>
              Ready
            </span>
            <Truck className="w-4 h-4 opacity-80" />
          </div>
          <p className="text-xl font-black mt-1 font-mono">{readyCount}</p>
        </div>

        <div
          onClick={() => setActiveFilter('COMPLETED')}
          className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
            activeFilter === 'COMPLETED'
              ? 'bg-slate-800 text-white border-slate-800 shadow-md shadow-slate-800/20'
              : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-black uppercase tracking-wider ${activeFilter === 'COMPLETED' ? 'text-slate-300' : 'text-slate-500'}`}>
              Completed
            </span>
            <CheckCircle className="w-4 h-4 opacity-80" />
          </div>
          <p className="text-xl font-black mt-1 font-mono">{completedCount}</p>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl border bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-md shadow-orange-500/15">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-100">
              Total Revenue
            </span>
            <Sparkles className="w-4 h-4 opacity-80" />
          </div>
          <p className="text-xl font-black mt-1 font-mono">₹{totalRev.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* ─── 3. SEARCH & STATUS FILTER PILLS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by customer, Table #, phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-orange-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap gap-1.5 overflow-x-auto no-scrollbar">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize whitespace-nowrap ${
                activeFilter === f
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f === 'ALL' ? 'All Orders' : f.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 4. ORDERS PIPELINE LIST ─── */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-xs">
            <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">No Orders Found</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              {searchQuery ? 'No orders match your search query' : 'No active orders in this filter category'}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredOrders.map((order, idx) => {
              const config = statusConfig[order.status] || statusConfig.PENDING;
              const Icon = config.icon;
              const isExpanded = expandedOrder === order.id;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ delay: idx * 0.02 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Order Header Row */}
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-3 cursor-pointer"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${config.bg}`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 font-mono text-sm">
                            Table #{order.tableNumber}
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${config.bg}`}>
                            {config.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {order.customerName || 'Guest'} • Order #{order.id.slice(-6).toUpperCase()} • {timeAgo(order.createdAt)}
                        </p>
                        {order.notes && (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-300/80 rounded-lg text-xs font-bold shadow-2xs">
                            <span>🌶️</span>
                            <span>Kitchen Note: <strong className="text-amber-950 font-black">{order.notes}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className="text-base font-black text-slate-900 font-mono">
                        ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrint(order);
                          }}
                          className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl transition-colors"
                          title="Print KOT / Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Itemized Breakdown & POS Actions */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5 space-y-4"
                      >
                        {order.notes && (
                          <div className="bg-amber-50 border border-amber-300/90 rounded-xl p-3 flex items-start gap-2.5">
                            <span className="text-base">👨‍🍳</span>
                            <div>
                              <h5 className="text-[11px] font-black text-amber-950 uppercase tracking-wider">Kitchen & Cooking Instructions:</h5>
                              <p className="text-xs text-amber-900 font-bold mt-0.5 leading-relaxed">{order.notes}</p>
                            </div>
                          </div>
                        )}
                        {/* Items Table */}
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                              <tr>
                                <th className="p-3">Dish / Item</th>
                                <th className="p-3 text-center">Qty</th>
                                <th className="p-3 text-right">Price</th>
                                <th className="p-3 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(order.items || []).map((item, i) => {
                                const dishName = item.foodItem?.name || item.name || 'Menu Dish';
                                const itemPrice = item.price || item.foodItem?.price || 0;
                                return (
                                  <tr key={i} className="text-slate-700">
                                    <td className="p-3 font-semibold">{dishName}</td>
                                    <td className="p-3 text-center font-bold font-mono">{item.quantity}×</td>
                                    <td className="p-3 text-right font-mono text-slate-500">₹{itemPrice}</td>
                                    <td className="p-3 text-right font-bold font-mono text-slate-900">₹{itemPrice * item.quantity}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Footer Info & Action Progression */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                          <div className="text-xs text-slate-500">
                            {order.phoneNumber ? <span>📞 Contact: {order.phoneNumber}</span> : <span>Dine-In Customer</span>}
                          </div>

                          <div className="flex items-center gap-2">
                            {order.status === 'PENDING' && (
                              <button
                                onClick={() => updateStatus(order.id, 'REJECTED')}
                                className="px-3.5 py-2 bg-rose-50 text-rose-600 border border-rose-200 text-xs rounded-xl font-bold hover:bg-rose-100 transition-colors"
                              >
                                Reject
                              </button>
                            )}

                            <button
                              onClick={() => handlePrint(order)}
                              className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Print KOT</span>
                            </button>

                            {config.next && (
                              <button
                                onClick={() => updateStatus(order.id, config.next!)}
                                className={`px-4 py-2 text-white text-xs rounded-xl font-bold transition-all shadow-sm ${config.btnColor}`}
                              >
                                {config.actionLabel}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* ─── 5. PRINTABLE KOT RECEIPT MODAL / DIALOG ─── */}
      {printOrder && (
        <div className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4 print:p-0 print:static print:bg-transparent">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full border shadow-2xl text-slate-900 print:shadow-none print:border-none print:w-full print:p-0">
            {/* Printable Content */}
            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <h2 className="text-base font-black uppercase tracking-wider">
                {user?.restaurant?.name || 'OrderKare Kitchen'}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Kitchen Order Ticket (KOT)</p>
              <div className="mt-2 text-xs font-bold font-mono">
                TABLE #{printOrder.tableNumber} • ORDER #{printOrder.id.slice(-6).toUpperCase()}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {new Date(printOrder.createdAt).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="py-3 space-y-1.5 border-b border-dashed border-slate-300">
              {(printOrder.items || []).map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span>
                    <strong>{item.quantity}×</strong> {item.foodItem?.name || item.name}
                  </span>
                  <span className="font-mono font-bold">₹{(item.price || 0) * item.quantity}</span>
                </div>
              ))}
            </div>

            {printOrder.notes && (
              <div className="py-2.5 px-3 my-2.5 bg-amber-50 rounded-xl border border-amber-200 text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                  👨‍🍳 Chef Instructions / Note:
                </span>
                <span className="text-xs font-black text-amber-950 mt-0.5 block">
                  {printOrder.notes}
                </span>
              </div>
            )}

            <div className="pt-3 flex justify-between items-center text-sm font-black">
              <span>Total Bill:</span>
              <span className="font-mono">₹{printOrder.totalAmount}</span>
            </div>

            <div className="mt-4 flex gap-2 print:hidden">
              <button
                onClick={() => setPrintOrder(null)}
                className="flex-1 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 text-xs font-bold bg-orange-500 text-white rounded-xl hover:bg-orange-600 shadow-sm"
              >
                Print Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

