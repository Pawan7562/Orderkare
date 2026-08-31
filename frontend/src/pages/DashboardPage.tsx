import { useEffect, useState } from 'react';
import api from '../lib/api';
import { ShoppingBag, IndianRupee, Clock, Grid2X2, ArrowUpRight, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStats {
  todayOrders: number;
  todaySales: number;
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
  createdAt: string;
  items: { foodItem: { name: string }; quantity: number }[];
}

export const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0, todaySales: 0, pendingOrders: 0, activeTables: 0, totalTables: 20
  });
  const [pendingOrders, setPendingOrders] = useState<RecentOrder[]>([]);
  const [preparingOrders, setPreparingOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        api.get('/restaurants/dashboard/stats'),
        api.get('/orders?status=PENDING,ACCEPTED,PREPARING'),
      ]);
      setStats(statsRes.data);
      const orders = ordersRes.data.orders || [];
      setPendingOrders(orders.filter((o: RecentOrder) => o.status === 'PENDING'));
      setPreparingOrders(orders.filter((o: RecentOrder) => o.status === 'PREPARING' || o.status === 'ACCEPTED'));
    } catch (err) {
      // Silently fail — server may not have data yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Re-fetch every 30 seconds to stay in sync
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
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
    { label: "Today's Orders", value: stats.todayOrders, icon: ShoppingBag, color: 'bg-primary/10 text-primary', trend: '+8.2%' },
    { label: "Today's Sales", value: `₹${stats.todaySales.toLocaleString()}`, icon: IndianRupee, color: 'bg-blue-50 text-blue-600', trend: '+12.4%' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'bg-amber-50 text-amber-600', highlight: true, trend: '' },
    { label: 'Active Tables', value: `${stats.activeTables}/${stats.totalTables}`, icon: Grid2X2, color: 'bg-emerald-50 text-emerald-600', trend: '' },
  ];

  const stagger = {
    container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
    item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } },
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-80 bg-slate-200 rounded-3xl" />
          <div className="h-80 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div className="space-y-7" variants={stagger.container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Operations Live View</h1>
          <p className="text-slate-500 text-sm mt-0.5">Restaurant Management Dashboard</p>
        </div>
        <button onClick={fetchData} className="flex items-center space-x-2 bg-white text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all">
          <RefreshCcw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
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
                {stat.trend && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3" /> {stat.trend}
                  </span>
                )}
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
                <p className="text-[11px] text-slate-500 mb-3 line-clamp-1">
                  {order.items.map(i => `${i.quantity}× ${i.foodItem.name}`).join(' • ')}
                </p>
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
                <p className="text-[11px] text-slate-500 mb-3 line-clamp-1">
                  {order.items.map(i => `${i.quantity}× ${i.foodItem.name}`).join(' • ')}
                </p>
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
    </motion.div>
  );
};
