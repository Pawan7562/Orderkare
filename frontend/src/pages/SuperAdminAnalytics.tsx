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
  Percent,
  Receipt,
  Copy,
  Check,
  FileSpreadsheet,
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
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);
  const [searchAudit, setSearchAudit] = useState('');
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

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

  const copyRef = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTxId(id);
    setTimeout(() => setCopiedTxId(null), 2000);
  };

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
    link.setAttribute('download', `OrderKare_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`);
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
      <div className="space-y-6 max-w-7xl mx-auto pb-14 animate-pulse font-sans">
        <div className="h-28 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs" />
          ))}
        </div>
        <div className="h-96 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800" />
      </div>
    );
  }

  // SVG dimensions for Area Chart
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
    <div className="space-y-6 max-w-7xl mx-auto pb-14 font-sans antialiased text-slate-800 dark:text-slate-200 transition-colors duration-300">
      
      {/* ── Executive Top Header Banner (Matches Landing Page Theme) ── */}
      <div className="relative bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-orange-500/10 dark:bg-orange-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-rose-500/10 dark:bg-rose-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/40 text-orange-600 dark:text-orange-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Executive Telemetry</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>PostgreSQL Live Metrics</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Platform Analytics & Telemetry
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Enterprise financial overview, multi-tenant QR dining activity, subscription breakdown, and real-time transaction verification audits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={fetchAnalytics}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-orange-500/25 active:scale-95 cursor-pointer disabled:opacity-60"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Telemetry'}</span>
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
          {[
            { id: 'all' as const, label: 'Complete Overview', icon: Layers },
            { id: 'financials' as const, label: 'Revenue & GMV', icon: DollarSign },
            { id: 'subscriptions' as const, label: 'Subscription Tiers', icon: CreditCard },
            { id: 'network' as const, label: 'QR License Health', icon: QrCode },
            { id: 'audit' as const, label: 'Transaction Audit', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm shadow-orange-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs font-medium text-rose-700 dark:text-rose-400 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchAnalytics} className="underline font-bold hover:text-rose-900 dark:hover:text-rose-300 cursor-pointer">
            Retry Sync
          </button>
        </div>
      )}

      {/* ── 4 Hero KPI Cards ── */}
      {(activeTab === 'all' || activeTab === 'financials') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Gross Subscription Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:shadow-md transition-all relative overflow-hidden group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-200/80 dark:border-emerald-900/40">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> Invoiced MRR
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                ₹{revenue.totalSubscriptionRevenue.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">SaaS Subscription Revenue</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              <span>Customer Order GMV:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                ₹{revenue.totalOrderGMV.toLocaleString('en-IN')}
              </span>
            </div>
          </motion.div>

          {/* Total Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold border border-blue-200/80 dark:border-blue-900/40">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-900/40">
                  {successRate}% Success
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {tx.totalTransactions.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">Verified Transactions</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              <span>Completed Volume:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {tx.successfulPayments} payments
              </span>
            </div>
          </motion.div>

          {/* QR License Health */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold border border-orange-200/80 dark:border-orange-900/40">
                  <QrCode className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-full border border-orange-200 dark:border-orange-900/40">
                  {qr.activationRate}% Activated
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {qr.activeQrCount} <span className="text-base text-slate-400 dark:text-slate-500 font-normal">/ {qr.totalHotels}</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">Active QR Licenses</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              <span>Lapsed / Inactive:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{qr.inactiveQrCount} venues</span>
            </div>
          </motion.div>

          {/* Average Order Ticket */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold border border-amber-200/80 dark:border-amber-900/40">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900/40">
                  Avg Ticket
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                ₹{revenue.avgTicketSize.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">Average Order Size</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              <span>New Signups (Month):</span>
              <span className="font-bold text-orange-600 dark:text-orange-400 font-mono">+{qr.newThisMonth} venues</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Visual Timeline Charts ── */}
      {(activeTab === 'all' || activeTab === 'financials') && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">
                Historical Performance Timeline
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                12-month rolling data queried directly from multi-tenant tables
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Chart Type Toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1 border border-slate-200/60 dark:border-slate-700">
                <button
                  onClick={() => setChartType('area')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    chartType === 'area'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Curve Area
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    chartType === 'bar'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  Columns
                </button>
              </div>

              {/* Metric Selector */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1 border border-slate-200/60 dark:border-slate-700">
                <button
                  onClick={() => setChartMetric('revenue')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    chartMetric === 'revenue'
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Revenue (₹)
                </button>
                <button
                  onClick={() => setChartMetric('orders')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    chartMetric === 'orders'
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Orders
                </button>
                <button
                  onClick={() => setChartMetric('hotels')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    chartMetric === 'hotels'
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Signups
                </button>
              </div>
            </div>
          </div>

          {trends.length === 0 ? (
            <div className="py-20 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
              No historical records present in database yet.
            </div>
          ) : chartType === 'area' ? (
            <div className="relative pt-4 pb-2">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-64 overflow-visible">
                <defs>
                  <linearGradient id="areaGradientOrange" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="areaGradientRose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
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
                      stroke="currentColor"
                      className="text-slate-200 dark:text-slate-800"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* Shaded Area */}
                <path d={areaD} fill="url(#areaGradientOrange)" />

                {/* Stroke Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#f97316"
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
                      stroke="#f97316"
                      strokeWidth="3"
                      className="transition-all duration-200"
                      onMouseEnter={() => setHoveredTrendIndex(idx)}
                      onMouseLeave={() => setHoveredTrendIndex(null)}
                    />
                    <text
                      x={p.x}
                      y={svgHeight - 6}
                      textAnchor="middle"
                      className="text-[11px] font-bold fill-slate-400 dark:fill-slate-500"
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
                  <p className="text-sm font-black mt-0.5 text-orange-400">
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
            /* Column Bars Mode */
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
                    <div className="text-[10px] font-bold text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity mb-1.5 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {chartMetric === 'revenue' ? `₹${val.toLocaleString('en-IN')}` : val}
                    </div>
                    <div
                      className="w-full rounded-2xl bg-gradient-to-t from-orange-500 to-rose-500 transition-all duration-300 group-hover:brightness-110"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 font-bold">
                      {t.month}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Transaction Health & Subscription Breakdown ── */}
      {(activeTab === 'all' || activeTab === 'subscriptions' || activeTab === 'financials') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment & Transaction Health Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Payment & Transaction Health</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Real-time status across all platform transactions</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Successful Transactions */}
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">Successful Transactions</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      Verified Razorpay & completed dining orders
                    </p>
                  </div>
                </div>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                  {tx.successfulPayments}
                </p>
              </div>

              {/* Pending Transactions */}
              <div className="p-4 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">Pending Orders / Activations</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      Awaiting customer checkout or fulfillment
                    </p>
                  </div>
                </div>
                <p className="text-xl font-black text-amber-700 dark:text-amber-400 font-mono">
                  {tx.pendingPayments}
                </p>
              </div>

              {/* Failed / Rejected Orders */}
              <div className="p-4 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 flex items-center justify-center font-bold">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">Rejected / Cancelled Orders</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      Cancelled or declined payments/orders
                    </p>
                  </div>
                </div>
                <p className="text-xl font-black text-rose-700 dark:text-rose-400 font-mono">
                  {tx.failedPayments}
                </p>
              </div>
            </div>
          </div>

          {/* SaaS Subscription Plans Distribution */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="font-extrabold text-slate-900 dark:text-white text-base">SaaS Subscription Plan Breakdown</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Distribution of active subscription tiers and revenue contributions</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                  {subs.activeCount} Active
                </span>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                  {subs.trialCount} ₹1 Trials
                </span>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                  {subs.expiredCount} Expired
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First-Time ₹1 Activation */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">₹1 Activation (30-Day Trial)</span>
                  <span className="text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full">
                    ₹{subs.plans.firstTime.revenue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${totalPlansCount > 0 ? (subs.plans.firstTime.count / totalPlansCount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {subs.plans.firstTime.count} hotel activations
                </p>
              </div>

              {/* Monthly Plan */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Monthly Plan Tier</span>
                  <span className="text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full">
                    ₹{subs.plans.monthly.revenue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${totalPlansCount > 0 ? (subs.plans.monthly.count / totalPlansCount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {subs.plans.monthly.count} subscriptions
                </p>
              </div>

              {/* 6 Months Plan */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">6 Months Plan Tier</span>
                  <span className="text-[10px] font-mono font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 px-2 py-0.5 rounded-full">
                    ₹{subs.plans.sixMonths.revenue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${totalPlansCount > 0 ? (subs.plans.sixMonths.count / totalPlansCount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {subs.plans.sixMonths.count} subscriptions
                </p>
              </div>

              {/* Annual Plan */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Annual Plan Tier</span>
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                    ₹{subs.plans.annual.revenue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${totalPlansCount > 0 ? (subs.plans.annual.count / totalPlansCount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {subs.plans.annual.count} subscriptions
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Verified Subscription Payments Audit Log Table ── */}
      {(activeTab === 'all' || activeTab === 'audit') && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base">
                Verified Subscription Transactions Audit ({filteredAudit.length})
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                Payment references, amounts paid, and automated gateway verification timestamps
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchAudit}
                onChange={(e) => setSearchAudit(e.target.value)}
                placeholder="Search payment ref or venue..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                  <th className="py-3.5 px-4">Restaurant Venue</th>
                  <th className="py-3.5 px-4">Plan Tier</th>
                  <th className="py-3.5 px-4">Amount Paid</th>
                  <th className="py-3.5 px-4">Payment Reference</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Transaction Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {filteredAudit.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                      {searchAudit ? 'No transactions match search criteria.' : 'No verified subscription payments recorded yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredAudit.map((txItem) => (
                    <tr key={txItem.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs">{txItem.restaurantName}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">/{txItem.restaurantSlug}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {txItem.planName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        ₹{txItem.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 text-[10px]">
                          <span>{txItem.paymentReference}</span>
                          <button
                            type="button"
                            onClick={() => copyRef(txItem.paymentReference, txItem.id)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            title="Copy Reference"
                          >
                            {copiedTxId === txItem.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Verified
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-slate-500 dark:text-slate-400 font-mono">
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
      )}

      {/* ── Top Performing Venues Table ── */}
      {(activeTab === 'all' || activeTab === 'network') && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Top Performing Venue Workspaces</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Ranked by real customer order volume and turnover in database</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                  <th className="py-3 px-4 font-semibold">Venue Name</th>
                  <th className="py-3 px-4 font-semibold">Location</th>
                  <th className="py-3 px-4 text-center font-semibold">SaaS Plan</th>
                  <th className="py-3 px-4 text-center font-semibold">Orders</th>
                  <th className="py-3 px-4 text-right font-semibold">Turnover</th>
                  <th className="py-3 px-4 text-right font-semibold">Live Menu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {topVenues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                      No venue orders recorded in database yet.
                    </td>
                  </tr>
                ) : (
                  topVenues.map((v, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white text-xs">{v.name}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">{v.city || 'Standard Area'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {v.plan}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {v.orders.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white text-xs">
                        ₹{v.revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={`/menu/${v.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg inline-flex text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs transition-colors cursor-pointer"
                          title="Open Live Menu"
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
      )}
    </div>
  );
};
