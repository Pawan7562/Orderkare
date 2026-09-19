import { useEffect, useState, useMemo } from 'react';
import api from '../lib/api';
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  Building2,
  ShoppingBag,
  ArrowUpRight,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  ShieldCheck,
  Calendar,
  Sparkles,
  ExternalLink,
  DollarSign,
  Layers,
  Activity,
  AlertTriangle,
  Download,
  Filter,
  Search,
  PieChart,
  ArrowDownRight,
  TrendingDown,
  Percent,
  CheckCheck,
  Server,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlanStat {
  count: number;
  revenue: number;
}

interface AnalyticsPayload {
  revenue: {
    totalSubscriptionRevenue: number;
    totalOrderGMV: number;
    grossPlatformRevenue: number;
    avgTicketSize: number;
  };
  transactions: {
    totalTransactions: number;
    successfulPayments: number;
    failedPayments: number;
    pendingPayments: number;
    successfulSubCount: number;
    successfulOrderCount: number;
  };
  subscriptions: {
    activeCount: number;
    trialCount: number;
    expiredCount: number;
    pendingCount: number;
    plans: {
      firstTime: PlanStat;
      monthly: PlanStat;
      sixMonths: PlanStat;
      annual: PlanStat;
      other: PlanStat;
    };
  };
  qrStats: {
    totalHotels: number;
    activeQrCount: number;
    inactiveQrCount: number;
    activationRate: number;
    newThisMonth: number;
    newThisWeek: number;
    newToday: number;
  };
  monthlyTrends: {
    month: string;
    monthLabel: string;
    subRevenue: number;
    orderGmv: number;
    orders: number;
    registrations: number;
  }[];
  topVenues: {
    id: string;
    name: string;
    slug: string;
    city: string;
    plan: string;
    subStatus: string;
    isActive: boolean;
    orders: number;
    revenue: number;
  }[];
  recentTransactions: {
    id: string;
    restaurantName: string;
    restaurantSlug: string;
    planName: string;
    amount: number;
    paymentReference: string;
    status: string;
    createdAt: string;
  }[];
}

export const SuperAdminAnalytics = () => {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter & tab controls
  const [activeTab, setActiveTab] = useState<'all' | 'financials' | 'subscriptions' | 'network' | 'audit'>('all');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders' | 'hotels'>('revenue');
  const [chartType, setChartType] = useState<'bar' | 'area'>('area');
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);
  const [searchAudit, setSearchAudit] = useState('');

  const fetchAnalytics = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await api.get('/admin/analytics');
      if (res.data?.analytics) {
        setData(res.data.analytics);
      }
    } catch (err: any) {
      console.error('Failed to load analytics:', err);
      setError(err?.response?.data?.message || 'Failed to fetch platform metrics from database.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const revenue = data?.revenue || {
    totalSubscriptionRevenue: 0,
    totalOrderGMV: 0,
    grossPlatformRevenue: 0,
    avgTicketSize: 0,
  };

  const tx = data?.transactions || {
    totalTransactions: 0,
    successfulPayments: 0,
    failedPayments: 0,
    pendingPayments: 0,
    successfulSubCount: 0,
    successfulOrderCount: 0,
  };

  const subs = data?.subscriptions || {
    activeCount: 0,
    trialCount: 0,
    expiredCount: 0,
    pendingCount: 0,
    plans: {
      firstTime: { count: 0, revenue: 0 },
      monthly: { count: 0, revenue: 0 },
      sixMonths: { count: 0, revenue: 0 },
      annual: { count: 0, revenue: 0 },
      other: { count: 0, revenue: 0 },
    },
  };

  const qr = data?.qrStats || {
    totalHotels: 0,
    activeQrCount: 0,
    inactiveQrCount: 0,
    activationRate: 0,
    newThisMonth: 0,
    newThisWeek: 0,
    newToday: 0,
  };

  const trends = data?.monthlyTrends || [];
  const topVenues = data?.topVenues || [];
  const recentTransactions = data?.recentTransactions || [];

  const totalPlansCount =
    subs.plans.firstTime.count +
    subs.plans.monthly.count +
    subs.plans.sixMonths.count +
    subs.plans.annual.count +
    subs.plans.other.count;

  const successRate =
    tx.totalTransactions > 0
      ? Math.round((tx.successfulPayments / tx.totalTransactions) * 100)
      : 100;

  // Max value for chart scaling
  const maxChartValue = useMemo(() => {
    return Math.max(
      ...trends.map((t) =>
        chartMetric === 'revenue'
          ? t.subRevenue + t.orderGmv
          : chartMetric === 'orders'
          ? t.orders
          : t.registrations
      ),
      1
    );
  }, [trends, chartMetric]);

  // Export CSV summary
  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ['Metric', 'Value'],
      ['SaaS Subscription Revenue (INR)', revenue.totalSubscriptionRevenue],
      ['Order GMV (INR)', revenue.totalOrderGMV],
      ['Gross Platform Volume (INR)', revenue.grossPlatformRevenue],
      ['Average Order Ticket (INR)', revenue.avgTicketSize],
      ['Total Transactions', tx.totalTransactions],
      ['Successful Payments', tx.successfulPayments],
      ['Failed / Rejected Transactions', tx.failedPayments],
      ['Pending Transactions', tx.pendingPayments],
      ['Registered Hotels', qr.totalHotels],
      ['Active QR Licenses', qr.activeQrCount],
      ['Inactive QR Licenses', qr.inactiveQrCount],
      ['QR Activation Rate (%)', `${qr.activationRate}%`],
      ['Active Subscriptions', subs.activeCount],
      ['First-time Trial Subscriptions', subs.trialCount],
      ['Expired Subscriptions', subs.expiredCount],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orderkare_analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAudit = recentTransactions.filter(
    (t) =>
      !searchAudit ||
      t.restaurantName.toLowerCase().includes(searchAudit.toLowerCase()) ||
      t.paymentReference.toLowerCase().includes(searchAudit.toLowerCase()) ||
      t.planName.toLowerCase().includes(searchAudit.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse font-sans">
        <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="space-y-2">
            <div className="h-7 w-64 bg-slate-200 rounded-lg" />
            <div className="h-4 w-96 bg-slate-100 rounded-md" />
          </div>
          <div className="h-10 w-36 bg-slate-200 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs" />
          ))}
        </div>
        <div className="h-96 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs" />
      </div>
    );
  }

  // Generate SVG curve points for Area Chart
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;
  const chartInnerWidth = svgWidth - paddingX * 2;
  const chartInnerHeight = svgHeight - paddingY * 2;

  const points = trends.map((t, idx) => {
    const val =
      chartMetric === 'revenue'
        ? t.subRevenue + t.orderGmv
        : chartMetric === 'orders'
        ? t.orders
        : t.registrations;
    const x =
      trends.length > 1
        ? paddingX + (idx / (trends.length - 1)) * chartInnerWidth
        : svgWidth / 2;
    const y = svgHeight - paddingY - (val / maxChartValue) * chartInnerHeight;
    return { x, y, val, month: t.month, monthLabel: t.monthLabel, data: t };
  });

  const pathD =
    points.length > 0
      ? `M ${points[0].x} ${points[0].y} ` +
        points
          .slice(1)
          .map((p, i) => {
            const prev = points[i];
            const cp1x = prev.x + (p.x - prev.x) / 2;
            const cp1y = prev.y;
            const cp2x = prev.x + (p.x - prev.x) / 2;
            const cp2y = p.y;
            return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
          })
          .join(' ')
      : '';

  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
      : '';

  return (
    <div className="space-y-8 pb-16 font-sans antialiased text-slate-800">
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.03)] relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Telemetry
              </span>
              <span className="text-slate-400 text-xs font-semibold">• PostgreSQL Production Stream</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Platform Financial & Operational Intelligence
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">
              Enterprise revenue analytics, QR license telemetry, and multi-tenant dining volume.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-98"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={fetchAnalytics}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm shadow-primary/25 disabled:opacity-50 active:scale-98"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Live'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Section Pills */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'Complete Overview', icon: Layers },
            { id: 'financials', label: 'Revenue & GMV', icon: DollarSign },
            { id: 'subscriptions', label: 'Subscription Tiers', icon: CreditCard },
            { id: 'network', label: 'QR License Health', icon: QrCode },
            { id: 'audit', label: 'Audit Trail', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-primary' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50/90 border border-red-200 rounded-2xl text-xs font-semibold text-red-700 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchAnalytics} className="underline font-bold hover:text-red-900">
            Retry Sync
          </button>
        </div>
      )}

      {/* 4 Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Gross Invoiced Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all relative overflow-hidden group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Invoiced
            </span>
          </div>
          <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">
            ₹{revenue.totalSubscriptionRevenue.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 font-bold mt-1">SaaS Subscription Revenue</p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-400 font-medium">
            <span>Customer Order GMV:</span>
            <span className="font-bold text-slate-700 font-mono">
              ₹{revenue.totalOrderGMV.toLocaleString('en-IN')}
            </span>
          </div>
        </motion.div>

        {/* Total Platform Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              {successRate}% Success
            </span>
          </div>
          <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">
            {tx.totalTransactions.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 font-bold mt-1">Total Verified Transactions</p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-400 font-medium">
            <span>Successful Payments:</span>
            <span className="font-bold text-emerald-600 font-mono">
              {tx.successfulPayments} ({tx.successfulSubCount} Subs + {tx.successfulOrderCount} Orders)
            </span>
          </div>
        </motion.div>

        {/* QR License Health */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/25">
              {qr.activationRate}% Activated
            </span>
          </div>
          <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">
            {qr.activeQrCount} <span className="text-base text-slate-400 font-normal">/ {qr.totalHotels}</span>
          </p>
          <p className="text-xs text-slate-500 font-bold mt-1">Active QR Licenses</p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-400 font-medium">
            <span>Expired / Inactive:</span>
            <span className="font-bold text-amber-600 font-mono">{qr.inactiveQrCount} Venues</span>
          </div>
        </motion.div>

        {/* Average Order Ticket */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-100">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Avg Ticket
            </span>
          </div>
          <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">
            ₹{revenue.avgTicketSize.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 font-bold mt-1">Average Order Ticket Size</p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-[11px] text-slate-400 font-medium">
            <span>New Signups (Month):</span>
            <span className="font-bold text-primary font-mono">+{qr.newThisMonth} venues</span>
          </div>
        </motion.div>
      </div>

      {/* Interactive Visual Timeline Charts */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="font-extrabold text-slate-900 text-lg tracking-tight">
              Historical Timeline Performance
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              12-month rolling data aggregates query directly from PostgreSQL tables
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Chart Type Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  chartType === 'area'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Curve Area
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  chartType === 'bar'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Columns
              </button>
            </div>

            {/* Metric Selector */}
            <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
              <button
                onClick={() => setChartMetric('revenue')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  chartMetric === 'revenue'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Revenue (₹)
              </button>
              <button
                onClick={() => setChartMetric('orders')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  chartMetric === 'orders'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setChartMetric('hotels')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  chartMetric === 'hotels'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Registrations
              </button>
            </div>
          </div>
        </div>

        {trends.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs font-medium">
            No historical records present in database yet.
          </div>
        ) : chartType === 'area' ? (
          <div className="relative pt-4 pb-2">
            {/* SVG Area Chart */}
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-64 overflow-visible">
              <defs>
                <linearGradient id="areaGradientEmerald" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="areaGradientPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="areaGradientBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = paddingY + ratio * chartInnerHeight;
                return (
                  <line
                    key={i}
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Shaded Area */}
              <path
                d={areaD}
                fill={
                  chartMetric === 'revenue'
                    ? 'url(#areaGradientEmerald)'
                    : chartMetric === 'orders'
                    ? 'url(#areaGradientPrimary)'
                    : 'url(#areaGradientBlue)'
                }
              />

              {/* Stroke Line */}
              <path
                d={pathD}
                fill="none"
                stroke={
                  chartMetric === 'revenue'
                    ? '#10b981'
                    : chartMetric === 'orders'
                    ? '#f97316'
                    : '#2563eb'
                }
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              {points.map((p, idx) => (
                <g key={idx} className="cursor-pointer">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredTrendIndex === idx ? '6' : '4'}
                    fill="#ffffff"
                    stroke={
                      chartMetric === 'revenue'
                        ? '#10b981'
                        : chartMetric === 'orders'
                        ? '#f97316'
                        : '#2563eb'
                    }
                    strokeWidth="3"
                    className="transition-all duration-200"
                    onMouseEnter={() => setHoveredTrendIndex(idx)}
                    onMouseLeave={() => setHoveredTrendIndex(null)}
                  />
                  {/* Month Text Label */}
                  <text
                    x={p.x}
                    y={svgHeight - 6}
                    textAnchor="middle"
                    className="text-[11px] font-bold fill-slate-400"
                  >
                    {p.month}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredTrendIndex !== null && points[hoveredTrendIndex] && (
              <div
                className="absolute -top-4 bg-slate-900 text-white px-4 py-2.5 rounded-2xl text-xs shadow-xl pointer-events-none transform -translate-x-1/2 border border-slate-700 font-mono z-20"
                style={{ left: `${(points[hoveredTrendIndex].x / svgWidth) * 100}%` }}
              >
                <p className="font-extrabold text-[11px] text-slate-300 font-sans">
                  {points[hoveredTrendIndex].monthLabel}
                </p>
                <p className="text-sm font-black mt-0.5 text-emerald-400">
                  {chartMetric === 'revenue'
                    ? `₹${points[hoveredTrendIndex].val.toLocaleString('en-IN')}`
                    : `${points[hoveredTrendIndex].val.toLocaleString('en-IN')} ${chartMetric}`}
                </p>
                {chartMetric === 'revenue' && (
                  <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                    Subs: ₹{points[hoveredTrendIndex].data.subRevenue} | Orders: ₹{points[hoveredTrendIndex].data.orderGmv}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Column Bar Mode */
          <div className="flex items-end space-x-3 h-64 pt-6 pb-2">
            {trends.map((t, idx) => {
              const val =
                chartMetric === 'revenue'
                  ? t.subRevenue + t.orderGmv
                  : chartMetric === 'orders'
                  ? t.orders
                  : t.registrations;

              const heightPct = Math.max(10, Math.round((val / maxChartValue) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end">
                  <div className="text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity mb-1.5 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                    {chartMetric === 'revenue' ? `₹${val.toLocaleString('en-IN')}` : val}
                  </div>
                  <div
                    className={`w-full rounded-2xl transition-all duration-300 ${
                      chartMetric === 'revenue'
                        ? 'bg-emerald-500 group-hover:bg-emerald-600'
                        : chartMetric === 'orders'
                        ? 'bg-primary group-hover:bg-primary/90'
                        : 'bg-blue-600 group-hover:bg-blue-700'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[11px] text-slate-500 mt-3 font-bold">
                    {t.month}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subscription Breakdown & Financial Health Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment & Transaction Health Widget */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">Payment & Transaction Health</h2>
              <p className="text-xs text-slate-400 mt-0.5">Real status telemetry across all database transactions</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Successful Transactions */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">Successful Transactions</p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Verified Razorpay & completed dining orders
                  </p>
                </div>
              </div>
              <p className="text-xl font-black text-emerald-700 font-mono">
                {tx.successfulPayments}
              </p>
            </div>

            {/* Pending Transactions */}
            <div className="p-4 bg-amber-50/70 border border-amber-200/60 rounded-2xl flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">Pending Orders / Activations</p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Awaiting customer checkout or fulfillment
                  </p>
                </div>
              </div>
              <p className="text-xl font-black text-amber-700 font-mono">
                {tx.pendingPayments}
              </p>
            </div>

            {/* Failed / Rejected Orders */}
            <div className="p-4 bg-rose-50/70 border border-rose-200/60 rounded-2xl flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">Rejected / Failed Transactions</p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Cancelled or declined payments/orders
                  </p>
                </div>
              </div>
              <p className="text-xl font-black text-rose-700 font-mono">
                {tx.failedPayments}
              </p>
            </div>
          </div>
        </div>

        {/* SaaS Subscription Plans Distribution */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">SaaS Subscription Plan Breakdown</h2>
              <p className="text-xs text-slate-400 mt-0.5">Real distribution of active subscription tiers & revenue</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {subs.activeCount} Active
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {subs.trialCount} ₹1 Trials
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {subs.expiredCount} Expired
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First-Time ₹1 Activation */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">₹1 Activation (30-Day Free)</span>
                <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  ₹{subs.plans.firstTime.revenue.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${totalPlansCount > 0 ? (subs.plans.firstTime.count / totalPlansCount) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                {subs.plans.firstTime.count} hotel activations
              </p>
            </div>

            {/* Monthly Plan (₹249) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Monthly Plan (₹249/mo)</span>
                <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  ₹{subs.plans.monthly.revenue.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${totalPlansCount > 0 ? (subs.plans.monthly.count / totalPlansCount) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                {subs.plans.monthly.count} subscriptions
              </p>
            </div>

            {/* 6 Months Plan (₹1,199) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">6 Months Plan (₹1,199)</span>
                <span className="text-[10px] font-mono font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  ₹{subs.plans.sixMonths.revenue.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${totalPlansCount > 0 ? (subs.plans.sixMonths.count / totalPlansCount) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                {subs.plans.sixMonths.count} subscriptions
              </p>
            </div>

            {/* Annual Plan (₹1,999) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Annual Plan (₹1,999)</span>
                <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  ₹{subs.plans.annual.revenue.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${totalPlansCount > 0 ? (subs.plans.annual.count / totalPlansCount) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                {subs.plans.annual.count} subscriptions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Table: Recent Verified Subscription Payments */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-extrabold text-slate-900 text-base">
              Verified Subscription Transactions Audit ({filteredAudit.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Real payment reference IDs, amounts paid, and transaction timestamps
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchAudit}
              onChange={(e) => setSearchAudit(e.target.value)}
              placeholder="Search payment ref or hotel..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="pb-3 text-left font-semibold">Restaurant Venue</th>
                <th className="pb-3 text-left font-semibold">Plan Tier</th>
                <th className="pb-3 text-left font-semibold">Amount Paid</th>
                <th className="pb-3 text-left font-semibold">Payment Reference</th>
                <th className="pb-3 text-center font-semibold">Status</th>
                <th className="pb-3 text-right font-semibold">Transaction Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAudit.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium">
                    {searchAudit ? 'No transactions match search criteria.' : 'No verified subscription payments in database yet.'}
                  </td>
                </tr>
              ) : (
                filteredAudit.map((txItem) => (
                  <tr key={txItem.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4">
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{txItem.restaurantName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Slug: {txItem.restaurantSlug}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        {txItem.planName}
                      </span>
                    </td>
                    <td className="py-4 font-mono font-bold text-emerald-600 text-xs">
                      ₹{txItem.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 font-mono text-xs">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 font-bold text-[10px]">
                        {txItem.paymentReference}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                      </span>
                    </td>
                    <td className="py-4 text-right text-xs text-slate-500 font-mono">
                      {new Date(txItem.createdAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performing Venues Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-extrabold text-slate-900 text-base">Top Performing Venue Workspaces</h2>
            <p className="text-xs text-slate-400 mt-0.5">Ranked by real customer order volume and turnover in database</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="pb-3 text-left font-semibold">Venue Name</th>
                <th className="pb-3 text-left font-semibold">Location</th>
                <th className="pb-3 text-center font-semibold">SaaS Plan</th>
                <th className="pb-3 text-center font-semibold">Orders</th>
                <th className="pb-3 text-right font-semibold">Turnover</th>
                <th className="pb-3 text-right font-semibold">Public Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topVenues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs font-medium">
                    No orders recorded yet in database.
                  </td>
                </tr>
              ) : (
                topVenues.map((v, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 font-bold text-slate-900 text-xs">{v.name}</td>
                    <td className="py-4 text-xs text-slate-500">{v.city}</td>
                    <td className="py-4 text-center">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {v.plan}
                      </span>
                    </td>
                    <td className="py-4 text-center font-mono font-bold text-slate-800 text-xs">
                      {v.orders.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 text-right font-mono font-bold text-slate-900 text-xs">
                      ₹{v.revenue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 text-right">
                      <a
                        href={`/menu/${v.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex text-slate-600 text-xs transition-colors"
                        title="View Menu"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
