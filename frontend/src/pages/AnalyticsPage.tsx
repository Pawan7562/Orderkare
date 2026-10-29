import { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import {
  TrendingUp,
  ShoppingBag,
  Award,
  RefreshCw,
  BarChart2,
  Calendar,
  Flame,
  ArrowUpRight,
  Layers,
  Sparkles,
  UtensilsCrossed,
  DollarSign,
  PieChart,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnalyticsData {
  timeRange?: string;
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
  const [metricView, setMetricView] = useState<'revenue' | 'orders'>('revenue');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/restaurants/analytics?range=${timeRange}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      // Fallback clean zero state on error
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

  // Chart max calculation
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 100);
  const maxOrders = Math.max(...chartData.map((d) => d.orders), 5);
  const hasChartData = chartData.some((d) => d.revenue > 0 || d.orders > 0);

  // Peak day calculation
  const peakDay = useMemo(() => {
    if (!hasChartData) return null;
    return [...chartData].sort((a, b) => b.revenue - a.revenue)[0];
  }, [chartData, hasChartData]);

  // Average daily revenue
  const avgDailyRevenue = useMemo(() => {
    if (chartData.length === 0) return 0;
    const total = chartData.reduce((sum, d) => sum + d.revenue, 0);
    return Math.round(total / chartData.length);
  }, [chartData]);

  return (
    <div className="space-y-7 pb-12 max-w-7xl mx-auto">
      {/* ─── 1. TOP HEADER & TIME RANGE SELECTOR ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Analytics & Insights
            </h1>
            <span className="inline-flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 text-xs px-3 py-1 rounded-full font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Real-Time Metrics</span>
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Revenue trends, order ticket averages, and popular culinary items
          </p>
        </div>

        {/* Time Selector & Refresh */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-1 rounded-xl flex shadow-2xs">
            {(['today', 'week', 'month'] as const).map((r) => {
              const label =
                r === 'today' ? 'Today' : r === 'week' ? 'Past 7 Days' : 'Past 30 Days';
              const isSelected = timeRange === r;
              return (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all shadow-2xs"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── 2. EXECUTIVE KPI SUMMARY CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Gross Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 text-slate-900 dark:text-white font-mono">
            {stats.sales}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
            Active billings for selected period
          </p>
        </motion.div>

        {/* Orders Placed */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Orders Volume
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 text-slate-900 dark:text-white font-mono">
            {stats.orders}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
            Customer dine-in orders placed
          </p>
        </motion.div>

        {/* Average Order Value (AOV) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Avg. Ticket Size
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 text-slate-900 dark:text-white font-mono">
            {stats.avgTicket}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
            Average spend per dining table
          </p>
        </motion.div>

        {/* Top Performing Category */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Top Category
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 text-slate-900 dark:text-white truncate">
            {stats.topCategory}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
            Highest ordering volume category
          </p>
        </motion.div>
      </div>

      {/* ─── 3. CHARTS & POPULAR DISHES ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Performance Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Daily Performance Trend
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Past 7-day breakdown of revenue and orders
              </p>
            </div>

            {/* Toggle Revenue vs Orders */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setMetricView('revenue')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  metricView === 'revenue'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Revenue (₹)
              </button>
              <button
                onClick={() => setMetricView('orders')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  metricView === 'orders'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Orders Count
              </button>
            </div>
          </div>

          {!hasChartData ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-orange-500 flex items-center justify-center mb-3">
                <BarChart2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No revenue recorded in this period
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mt-1">
                As guests scan your QR code and place orders, daily sales trends will automatically plot here.
              </p>
            </div>
          ) : (
            <div>
              <div className="relative h-60 flex items-end space-x-3 sm:space-x-4 pt-8">
                {chartData.map((item, idx) => {
                  const isRevenue = metricView === 'revenue';
                  const value = isRevenue ? item.revenue : item.orders;
                  const maxVal = isRevenue ? maxRevenue : maxOrders;
                  const heightPercent = maxVal > 0 ? Math.max((value / maxVal) * 100, 8) : 8;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center group cursor-pointer"
                    >
                      <div className="relative w-full flex items-end justify-center h-48">
                        <div
                          className={`w-full max-w-[44px] rounded-t-xl transition-all duration-300 ${
                            isRevenue
                              ? 'bg-gradient-to-t from-orange-500 to-rose-500 group-hover:from-orange-600 group-hover:to-rose-600 shadow-xs'
                              : 'bg-gradient-to-t from-blue-600 to-indigo-500 group-hover:from-blue-700 group-hover:to-indigo-600 shadow-xs'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />

                        {/* Interactive Tooltip */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none z-20">
                          {isRevenue ? `₹${item.revenue.toLocaleString('en-IN')}` : `${item.orders} Orders`}
                          <span className="block text-[9px] opacity-75 font-normal">
                            {item.day} • {item.orders} orders
                          </span>
                        </div>
                      </div>

                      <span className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-mono font-medium">
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chart Footnote Summary */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Daily Average:
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₹{avgDailyRevenue.toLocaleString('en-IN')}
                  </span>
                </div>
                {peakDay && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Peak Sales Day:
                    </span>
                    <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                      {peakDay.day} (₹{peakDay.revenue.toLocaleString('en-IN')})
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Top-Selling Dishes Leaderboard */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Popular Dishes
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Ranked by sales volume & revenue
                </p>
              </div>
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-2.5 py-1 rounded-lg">
                Top 5
              </span>
            </div>

            {popularItems.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-2 text-slate-400">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No dish sales recorded yet
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 max-w-xs mx-auto">
                  Your best-performing menu items will appear here as guests order.
                </p>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                {popularItems.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                              : idx === 2
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {item.orders} sold
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-rose-500 h-full rounded-full transition-all duration-500"
                          style={{ width: item.percentage }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono w-16 text-right">
                        {item.revenue}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between font-medium">
            <span>Calculated from live orders</span>
            <span className="text-orange-600 dark:text-orange-400 font-bold">Auto-updated</span>
          </div>
        </div>
      </div>
    </div>
  );
};
