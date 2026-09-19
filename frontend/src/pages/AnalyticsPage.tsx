import { useState, useEffect } from 'react';
import api from '../lib/api';
import { TrendingUp, ShoppingBag, DollarSign, Award, RefreshCw, BarChart2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface AnalyticsData {
  stats: {
    sales: string;
    salesRaw: number;
    orders: number;
    avgTicket: string;
    active: number;
    topCategory: string;
  };
  popularItems: {
    name: string;
    orders: number;
    revenue: string;
    percentage: string;
  }[];
  chartData: {
    day: string;
    revenue: number;
    orders: number;
  }[];
}

export const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/restaurants/analytics?range=${timeRange}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      // Fallback clean zero state if error
      setData({
        stats: {
          sales: '₹0',
          salesRaw: 0,
          orders: 0,
          avgTicket: '₹0',
          active: 0,
          topCategory: 'None yet',
        },
        popularItems: [],
        chartData: [
          { day: 'Mon', revenue: 0, orders: 0 },
          { day: 'Tue', revenue: 0, orders: 0 },
          { day: 'Wed', revenue: 0, orders: 0 },
          { day: 'Thu', revenue: 0, orders: 0 },
          { day: 'Fri', revenue: 0, orders: 0 },
          { day: 'Sat', revenue: 0, orders: 0 },
          { day: 'Sun', revenue: 0, orders: 0 },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const stats = data?.stats || {
    sales: '₹0',
    salesRaw: 0,
    orders: 0,
    avgTicket: '₹0',
    active: 0,
    topCategory: 'None yet',
  };

  const popularItems = data?.popularItems || [];
  const chartData = data?.chartData || [];

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics & Insights</h1>
          <p className="text-slate-500 text-sm">Real-time revenue, order volume, and top-selling dishes</p>
        </div>

        {/* Time Selector */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 p-1 rounded-xl flex shadow-xs">
            {(['today', 'week', 'month'] as const).map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  timeRange === r ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {r === 'today' ? 'Today' : r === 'week' ? 'Past 7 Days' : 'Past 30 Days'}
              </button>
            ))}
          </div>
          <button
            onClick={fetchAnalytics}
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-orange-600 rounded-xl hover:bg-orange-50 transition-colors"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Revenue', value: stats.sales, icon: DollarSign, color: 'bg-orange-50 text-orange-600' },
          { label: 'Orders Placed', value: stats.orders, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
          { label: 'Avg. Order Ticket', value: stats.avgTicket, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Top Category', value: stats.topCategory, icon: Award, color: 'bg-amber-50 text-amber-600' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-xs"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-semibold text-slate-500">{card.label}</span>
              </div>
              <p className="text-2xl font-black text-slate-900">{card.value}</p>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Calculated strictly from live customer orders
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Charts & Popular Items Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200/60 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Daily Revenue Trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">Past 7 days performance</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">Values in INR (₹)</span>
          </div>

          {stats.orders === 0 && chartData.every(d => d.revenue === 0) ? (
            <div className="h-56 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-3">
                <BarChart2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No revenue data yet</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                When customers scan your QR code and place orders, live daily sales metrics will appear here.
              </p>
            </div>
          ) : (
            <div className="relative h-56 flex items-end space-x-3.5 pt-8">
              {chartData.map((item, idx) => {
                const heightPercent = maxRevenue > 0 ? Math.max((item.revenue / maxRevenue) * 100, 8) : 8;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group cursor-pointer">
                    <div className="relative w-full flex items-end justify-center h-44">
                      <div
                        className="w-full max-w-[42px] bg-gradient-to-t from-orange-500 to-amber-400 group-hover:from-orange-600 group-hover:to-amber-500 rounded-t-xl transition-all duration-300"
                        style={{ height: `${heightPercent}%` }}
                      />
                      {/* Tooltip */}
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none z-10">
                        ₹{item.revenue.toLocaleString('en-IN')} ({item.orders} orders)
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-2 font-mono font-medium">
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Performing Items */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Popular Food Items</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ranked by total revenue</p>
            </div>
          </div>

          {popularItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 rounded-2xl min-h-[220px]">
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mb-2">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700">No dish sales recorded yet</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                Popular items will be automatically listed as orders are processed.
              </p>
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col justify-start mt-2">
              {popularItems.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800 truncate max-w-[160px]">{item.name}</span>
                    <span className="text-slate-400">{item.orders} sold</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-orange-500 h-full rounded-full transition-all duration-500"
                        style={{ width: item.percentage }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-900 font-bold w-12 text-right">{item.revenue}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
