import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Filter, ChevronDown, Clock, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Order {
  id: string;
  customerName: string;
  tableNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  phoneNumber: string | null;
  items: { foodItem: { name: string; price: number }; quantity: number; price: number }[];
}

const statusConfig: Record<string, { label: string; bg: string; icon: any }> = {
  PENDING:   { label: 'Pending',   bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  ACCEPTED:  { label: 'Accepted',  bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: Package },
  PREPARING: { label: 'Preparing', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Package },
  READY:     { label: 'Ready',     bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Truck },
  SERVED:    { label: 'Served',    bg: 'bg-teal-50 text-teal-700 border-teal-200', icon: CheckCircle },
  COMPLETED: { label: 'Completed', bg: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  REJECTED:  { label: 'Rejected',  bg: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
};

const statusFlow: Record<string, string> = {
  PENDING: 'ACCEPTED',
  ACCEPTED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'SERVED',
  SERVED: 'COMPLETED',
};

export const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const statusQuery = activeFilter === 'ALL' ? '' : `?status=${activeFilter}`;
      const res = await api.get(`/orders${statusQuery}`);
      setOrders(res.data.orders || []);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [activeFilter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      fetchOrders();
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

  const filters = ['ALL', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'REJECTED'];

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="flex gap-3">{[1,2,3,4].map(i => <div key={i} className="h-9 w-24 bg-slate-200 rounded-xl" />)}</div>
        {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-200 rounded-3xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Order Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Filter, inspect, and advance orders through the pipeline</p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-2 rounded-xl">
          <Filter className="w-3.5 h-3.5" />
          <span className="font-semibold">{orders.length} orders</span>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize ${
              activeFilter === f
                ? 'bg-primary text-white shadow-md shadow-primary/15'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            {f === 'ALL' ? 'All Orders' : f.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/60">
            <span className="text-4xl block mb-3">📋</span>
            <p className="text-slate-500 font-medium text-sm">No orders match this filter</p>
          </div>
        ) : (
          <AnimatePresence>
            {orders.map((order, idx) => {
              const config = statusConfig[order.status] || statusConfig.PENDING;
              const Icon = config.icon;
              const nextStatus = statusFlow[order.status];
              const isExpanded = expandedOrder === order.id;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Order Header Row */}
                  <div
                    className="flex items-center justify-between p-5 cursor-pointer"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${config.bg}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2.5">
                          <span className="font-bold text-slate-900 font-mono text-sm">#{order.id.slice(-6).toUpperCase()}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${config.bg}`}>
                            {config.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {order.customerName} • Table {order.tableNumber} • {timeAgo(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-extrabold text-slate-900">₹{order.totalAmount}</span>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="border-t border-slate-100"
                      >
                        <div className="p-5 space-y-4">
                          {/* Items Table */}
                          <div className="bg-slate-50 rounded-2xl overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-200/50">
                                  <th className="text-left p-3 font-semibold">Item</th>
                                  <th className="text-center p-3 font-semibold">Qty</th>
                                  <th className="text-right p-3 font-semibold">Price</th>
                                  <th className="text-right p-3 font-semibold">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {order.items.map((item, i) => (
                                  <tr key={i} className="text-slate-700">
                                    <td className="p-3 font-medium">{item.foodItem.name}</td>
                                    <td className="p-3 text-center text-slate-500">{item.quantity}</td>
                                    <td className="p-3 text-right text-slate-500 font-mono">₹{item.price}</td>
                                    <td className="p-3 text-right font-bold font-mono">₹{item.price * item.quantity}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-slate-400">
                              {order.phoneNumber && <span>📞 {order.phoneNumber}</span>}
                            </div>
                            <div className="flex space-x-2">
                              {order.status === 'PENDING' && (
                                <button
                                  onClick={() => updateStatus(order.id, 'REJECTED')}
                                  className="px-4 py-2 bg-red-50 text-red-600 text-xs rounded-xl font-bold hover:bg-red-100 transition-colors"
                                >
                                  Reject Order
                                </button>
                              )}
                              {nextStatus && (
                                <button
                                  onClick={() => updateStatus(order.id, nextStatus)}
                                  className="px-5 py-2 bg-primary text-white text-xs rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/10"
                                >
                                  Move to {statusConfig[nextStatus]?.label || nextStatus}
                                </button>
                              )}
                            </div>
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
    </div>
  );
};
