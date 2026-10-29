import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import {
  ShoppingBag, IndianRupee, RefreshCcw, QrCode, Sparkles, Lock, ArrowRight,
  ChevronLeft, ChevronRight, CalendarDays, Star, TrendingUp, Grid2X2, XCircle,
  Flame, Clock, ArrowUpRight, CheckCircle2, UtensilsCrossed, ClipboardList,
  Calendar, Activity, AlertCircle, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { io } from 'socket.io-client';
import { getSocketUrl } from '../lib/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { PaymentModal } from '../components/PaymentModal';

// ─────────────────────────── Types ───────────────────────────
type Mode = 'day' | 'range';

interface DailyPoint {
  day: string;
  orders: number;
  revenue: number;
}

interface RangeStats {
  from: string;
  to: string;
  summary: {
    orders: number;
    revenue: number;
    rejected: number;
    tablesServed: number;
    avgOrderValue: number;
  };
  daily: DailyPoint[];
  hourly: { hour: number; orders: number }[];
  topDishes: { name: string; qty: number; revenue: number }[];
  statusBreakdown: Record<string, number>;
  feedback: { average: number; count: number };
  recent: {
    id: string;
    billNo?: number | null;
    tableNumber: string;
    customerName: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }[];
}

// ─────────────────────────── Date Helpers (IST Timezone) ───────────────────────────
const IST = 'Asia/Kolkata';
const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: IST });

const toUTC = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const fromUTC = (d: Date) => d.toISOString().slice(0, 10);

const addDays = (s: string, n: number) => {
  const d = toUTC(s);
  d.setUTCDate(d.getUTCDate() + n);
  return fromUTC(d);
};

const daysBetween = (a: string, b: string) =>
  Math.round((toUTC(b).getTime() - toUTC(a).getTime()) / 86400000);

const pad = (n: number) => String(n).padStart(2, '0');
const monthStart = (y: number, m: number) => `${y}-${pad(m + 1)}-01`;
const monthEnd = (y: number, m: number) => fromUTC(new Date(Date.UTC(y, m + 1, 0)));

const fmtDate = (s: string, opts: Intl.DateTimeFormatOptions) =>
  toUTC(s).toLocaleDateString('en-IN', { timeZone: 'UTC', ...opts });

const inr = (n: number | string) =>
  `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', {
    timeZone: IST,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const HEAT_BG = [
  'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300',
  'bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-300 font-semibold',
  'bg-orange-100 dark:bg-orange-900/40 text-orange-900 dark:text-orange-200 font-bold',
  'bg-orange-200 dark:bg-orange-800/50 text-orange-950 dark:text-orange-100 font-extrabold',
  'bg-orange-300 dark:bg-orange-700/60 text-orange-950 dark:text-white font-black',
];
const BAND = '#ffedd5';

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
  ACCEPTED: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60',
  PREPARING: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60',
  READY: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
  SERVED: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800/60',
  COMPLETED: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  REJECTED: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
};

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 Days' },
  { key: 'last30', label: 'Last 30 Days' },
  { key: 'month', label: 'This Month' },
];

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const today = todayStr();

  // Calendar & Range State
  const [mode, setModeState] = useState<Mode>('day');
  const [start, setStart] = useState<string>(today);
  const [end, setEnd] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState<number>(Number(today.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState<number>(Number(today.slice(5, 7)) - 1);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Data State
  const [data, setData] = useState<RangeStats | null>(null);
  const [monthDaily, setMonthDaily] = useState<Record<string, { orders: number; revenue: number }>>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Subscription / Payment State
  const [subscription, setSubscription] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('orderkare_dash_sub');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);

  const [notification, setNotification] = useState<{ id: string; title: string; message: string } | null>(null);

  // Computed Date Range
  const from = start;
  const to = mode === 'range' && end ? end : start;
  const spanDays = daysBetween(from, to) + 1;
  const includesToday = from <= today && today <= to;

  const setView = (y: number, m: number) => {
    setViewYear(y);
    setViewMonth(m);
  };

  const setMode = (m: Mode) => {
    setModeState(m);
    if (m === 'day') setEnd(null);
  };

  const handlePick = (d: string) => {
    if (d > today) return;
    if (mode === 'day') {
      setStart(d);
      setEnd(null);
      setCalendarOpen(false);
      return;
    }
    if (!start || end) {
      setStart(d);
      setEnd(null);
      return;
    }
    if (d < start) {
      setEnd(start);
      setStart(d);
    } else {
      setEnd(d);
    }
  };

  const handlePreset = (key: string) => {
    let s = today;
    let e: string | null = null;
    let m: Mode = 'day';
    if (key === 'yesterday') s = addDays(today, -1);
    if (key === 'last7') { s = addDays(today, -6); e = today; m = 'range'; }
    if (key === 'last30') { s = addDays(today, -29); e = today; m = 'range'; }
    if (key === 'month') { s = monthStart(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1); e = today; m = 'range'; }
    setModeState(m);
    setStart(s);
    setEnd(e);
    setView(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1);
  };

  const activePreset = useMemo(() => {
    if (from === today && to === today) return 'today';
    if (from === addDays(today, -1) && to === from) return 'yesterday';
    if (to === today && from === addDays(today, -6)) return 'last7';
    if (to === today && from === addDays(today, -29)) return 'last30';
    if (to === today && from === monthStart(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1)) return 'month';
    return '';
  }, [from, to, today]);

  // Fetch Subscription
  const fetchSubscription = useCallback(async () => {
    try {
      const res = await api.get('/restaurants/dashboard/overview');
      if (res.data?.subscription) {
        setSubscription(res.data.subscription);
        try { localStorage.setItem('orderkare_dash_sub', JSON.stringify(res.data.subscription)); } catch {}
        return;
      }
    } catch {}
    try {
      const res = await api.get('/subscriptions/status');
      setSubscription(res.data);
      try { localStorage.setItem('orderkare_dash_sub', JSON.stringify(res.data)); } catch {}
    } catch {}
  }, []);

  // Fetch Plans for Renewal
  const fetchPlans = useCallback(async () => {
    try {
      const res = await api.get('/plans/active');
      if (res.data?.plans) {
        setPlans(res.data.plans);
      }
    } catch (err) {
      console.error('Failed to load plans', err);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
    fetchPlans();
  }, [fetchSubscription, fetchPlans]);

  // Fetch Range Stats
  const statsReq = useRef(0);
  const fetchStats = useCallback(
    async (showSpinner = false) => {
      const id = ++statsReq.current;
      if (showSpinner) setIsRefreshing(true);
      try {
        const res = await api.get('/orders/range-stats', { params: { from, to } });
        if (id !== statsReq.current) return;
        setData(res.data);
        setError('');
      } catch (err) {
        if (id !== statsReq.current) return;
        console.error('range-stats error:', err);
        setError('Failed to load operational statistics. Please refresh.');
      } finally {
        if (id === statsReq.current) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [from, to]
  );

  useEffect(() => {
    setLoading(true);
    fetchStats();
  }, [fetchStats]);

  // Calendar Heatmap (Visible Month)
  const monthReq = useRef(0);
  const fetchMonth = useCallback(async () => {
    const id = ++monthReq.current;
    try {
      const res = await api.get('/orders/range-stats', {
        params: { from: monthStart(viewYear, viewMonth), to: monthEnd(viewYear, viewMonth) },
      });
      if (id !== monthReq.current) return;
      const map: Record<string, { orders: number; revenue: number }> = {};
      (res.data?.daily || []).forEach((d: DailyPoint) => {
        map[d.day] = { orders: d.orders, revenue: d.revenue };
      });
      setMonthDaily(map);
    } catch {
      if (id === monthReq.current) setMonthDaily({});
    }
  }, [viewYear, viewMonth]);

  useEffect(() => {
    fetchMonth();
  }, [viewYear, viewMonth]);

  // Real-Time Socket Updates
  const refreshRef = useRef<() => void>(() => {});
  refreshRef.current = () => {
    if (includesToday) fetchStats();
    fetchMonth();
  };

  useEffect(() => {
    const { token, user: authUser } = useAuthStore.getState();
    const socket = io(getSocketUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
    });

    const restaurantId = authUser?.restaurantId || (authUser as any)?.restaurant?.id;
    const join = () => {
      if (restaurantId) socket.emit('join_restaurant', restaurantId);
    };
    socket.on('connect', join);
    if (socket.connected) join();

    const handleNewOrder = (o: any) => {
      if (!o) return;
      try {
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-120.wav').play().catch(() => {});
      } catch {}
      setNotification({
        id: o.id,
        title: o.merged ? 'Items Added to Table' : 'New Order Received',
        message: `${o.customerName || 'Guest'} at Table #${o.tableNumber} (${inr(o.totalAmount)})`,
      });
      setTimeout(() => setNotification(null), 5000);
      refreshRef.current();
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_updated', () => refreshRef.current());

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') refreshRef.current();
    }, 30000);

    return () => {
      clearInterval(interval);
      socket.off('connect', join);
      socket.off('new_order', handleNewOrder);
      socket.disconnect();
    };
  }, []);

  // Chart Data Processing
  const dailyFilled = useMemo(() => {
    if (!data) return [];
    const map = new Map(data.daily.map(d => [d.day, d]));
    const list: DailyPoint[] = [];
    for (let i = 0; i < daysBetween(data.from, data.to) + 1; i++) {
      const day = addDays(data.from, i);
      list.push(map.get(day) || { day, orders: 0, revenue: 0 });
    }
    return list;
  }, [data]);

  const hourlyFilled = useMemo(() => {
    const map = new Map((data?.hourly || []).map(h => [h.hour, h.orders]));
    return Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: map.get(h) || 0 }));
  }, [data]);

  const maxDaily = Math.max(1, ...dailyFilled.map(d => d.revenue));
  const maxHourly = Math.max(1, ...hourlyFilled.map(h => h.orders));
  const peakHour = hourlyFilled.reduce((best, h) => (h.orders > best.orders ? h : best), { hour: -1, orders: 0 });
  const maxDish = Math.max(1, ...(data?.topDishes || []).map(d => d.qty));
  const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? ' AM' : ' PM'}`;

  const s = data?.summary;
  const statCards = [
    {
      label: 'Gross Sales',
      value: s ? inr(s.revenue) : '–',
      subtitle: spanDays === 1 ? "Today's gross turnover" : `${spanDays}-day turnover`,
      icon: IndianRupee,
    },
    {
      label: 'Total Orders',
      value: s ? String(s.orders) : '–',
      subtitle: s ? `${s.orders - s.rejected} completed successfully` : 'Kitchen orders',
      icon: ShoppingBag,
    },
    {
      label: 'Average Order Value',
      value: s ? inr(s.avgOrderValue) : '–',
      subtitle: 'Average spend per table',
      icon: TrendingUp,
    },
    {
      label: 'Tables Served',
      value: s ? String(s.tablesServed) : '–',
      subtitle: 'Unique active dining tables',
      icon: Grid2X2,
    },
  ];

  // Calendar Calculation
  const first = toUTC(monthStart(viewYear, viewMonth));
  const firstDow = first.getUTCDay();
  const dim = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(`${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`);

  const values = Object.values(monthDaily);
  const maxRev = Math.max(1, ...values.map(v => v.revenue));
  let calA: string = start;
  let calB: string = mode === 'range' ? (end ?? (hoverDate && hoverDate <= today ? hoverDate : start)) : start;
  if (calA > calB) [calA, calB] = [calB, calA];

  const isCurrentMonth =
    viewYear === Number(today.slice(0, 4)) &&
    viewMonth === Number(today.slice(5, 7)) - 1;

  const rangeTitle =
    from === to
      ? from === today
        ? "Today's Operations"
        : `${fmtDate(from, { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}`
      : `${fmtDate(from, { day: '2-digit', month: 'short' })} – ${fmtDate(to, { day: '2-digit', month: 'short', year: 'numeric' })}`;

  return (
    <div className="space-y-7 sm:space-y-8 text-left">
      {/* Real-Time Order Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 max-w-sm w-full rounded-2xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 p-4 shadow-xl shadow-emerald-500/10 flex items-start gap-3.5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                {notification.title}
              </p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5 truncate">
                {notification.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Top Header & Date Range Filter Bar ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Operations Dashboard
              </h1>
              <span className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs px-3 py-1 rounded-full font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Feed
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-medium mt-1">
              Welcome back, <span className="font-bold text-slate-800 dark:text-slate-200">{user?.name || 'Restaurant'}</span> • Viewing {rangeTitle}
            </p>
          </div>

          {/* Date Range Navigation Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              {PRESETS.map(p => (
                <button
                  key={p.key}
                  onClick={() => handlePreset(p.key)}
                  className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activePreset === p.key
                      ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCalendarOpen(!calendarOpen)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer shadow-xs ${
                calendarOpen
                  ? 'bg-orange-50 dark:bg-orange-950/50 border-orange-300 dark:border-orange-800 text-orange-600 dark:text-orange-400'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-orange-500" />
              <span>Custom Range</span>
              {calendarOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                fetchStats(true);
                fetchMonth();
              }}
              title="Refresh live data"
              className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
            >
              <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>

        {/* ─── Collapsible Interactive Calendar Dropdown ─── */}
        <AnimatePresence>
          {calendarOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800"
            >
              <div className="max-w-xl mx-auto bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Date Range Selector
                    </span>
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/60 px-2.5 py-0.5 rounded-full">
                      {mode === 'day' ? 'Single Day' : 'Custom Range'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMode('day')}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                        mode === 'day'
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      Day
                    </button>
                    <button
                      onClick={() => setMode('range')}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                        mode === 'range'
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      Range
                    </button>
                    <button
                      onClick={() => setCalendarOpen(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <button
                    onClick={() => {
                      const d = new Date(Date.UTC(viewYear, viewMonth - 1, 1));
                      setView(d.getUTCFullYear(), d.getUTCMonth());
                    }}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {fmtDate(monthStart(viewYear, viewMonth), { month: 'long', year: 'numeric' })}
                  </p>
                  <button
                    onClick={() => {
                      const d = new Date(Date.UTC(viewYear, viewMonth + 1, 1));
                      setView(d.getUTCFullYear(), d.getUTCMonth());
                    }}
                    disabled={isCurrentMonth}
                    className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 mb-1.5">
                  {WEEKDAYS.map((w, i) => (
                    <div key={i} className="text-center text-xs font-bold text-slate-400 py-1">
                      {w}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-y-1.5" onMouseLeave={() => setHoverDate(null)}>
                  {cells.map((d, idx) => {
                    if (!d) return <div key={`e-${idx}`} className="h-9" />;

                    const future = d > today;
                    const isEdge = d === calA || d === calB;
                    const inBetween = calA !== calB && d > calA && d < calB;
                    const info = monthDaily[d];
                    const level = info && info.revenue > 0 ? Math.max(1, Math.ceil((info.revenue / maxRev) * 4)) : 0;
                    const isToday = d === today;

                    let bandStyle: CSSProperties | undefined;
                    if (calA !== calB) {
                      if (d === calA) bandStyle = { background: `linear-gradient(to right, transparent 50%, ${BAND} 50%)` };
                      else if (d === calB) bandStyle = { background: `linear-gradient(to right, ${BAND} 50%, transparent 50%)` };
                      else if (inBetween) bandStyle = { background: BAND };
                    }

                    const btnClass = future
                      ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                      : isEdge
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold shadow-xs scale-105'
                      : inBetween
                      ? 'text-orange-950 font-bold hover:bg-orange-200 dark:hover:bg-orange-900/60'
                      : `${HEAT_BG[level]} hover:ring-2 hover:ring-orange-400/50`;

                    return (
                      <div key={d} className="relative h-9 flex items-center justify-center" style={bandStyle}>
                        <button
                          disabled={future}
                          onClick={() => handlePick(d)}
                          onMouseEnter={() => !future && setHoverDate(d)}
                          className={`relative w-8 h-8 rounded-lg text-xs font-semibold transition-all ${btnClass} ${
                            isToday && !isEdge ? 'ring-2 ring-orange-500 font-bold' : ''
                          }`}
                        >
                          {Number(d.slice(8))}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Master QR Standee Status Card ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Master Dining QR Standee
                </h3>
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-3 py-0.5 rounded-full ${
                    subscription?.isSubscribed
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800'
                  }`}
                >
                  {subscription?.isSubscribed
                    ? subscription?.daysRemaining !== undefined
                      ? `Active • ${subscription.daysRemaining} Days Left`
                      : 'Active'
                    : subscription?.isFirstTime
                    ? 'Activation Required'
                    : 'Expired'}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium mt-1">
                Guests scan your master QR standee to view the live digital menu and place instant table orders.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {subscription?.isSubscribed ? (
              <button
                onClick={() => navigate('/dashboard/tables')}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <span>View & Print Standee</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {subscription?.isFirstTime
                    ? 'Activate QR (15 Days Free)'
                    : `Renew Subscription (₹${plans[0]?.priceMonthly || 249})`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── 4 Key Performance Metrics (KPI Cards) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map(stat => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  {stat.label}
                </span>
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className={`text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tight ${loading ? 'opacity-40' : ''}`}>
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1.5 truncate">
                {stat.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-sm font-semibold p-4 flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Main Two-Column Analytics Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7 items-start">
        {/* Left Column: Visual Dining Chart & Recent Orders */}
        <div className="space-y-6 sm:space-y-7 min-w-0">
          {/* Activity / Dining Volume Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs transition-colors">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                  {spanDays === 1 ? 'Hourly Dining Activity' : 'Daily Sales Trend'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {spanDays === 1
                    ? peakHour.hour >= 0
                      ? `Peak dining time: ${hourLabel(peakHour.hour)} (${peakHour.orders} orders)`
                      : 'Hourly order volume'
                    : 'Revenue trends over selected range'}
                </p>
              </div>

              <div className="flex items-center gap-2.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-gradient-to-r from-orange-500 to-rose-500" />
                  Peak
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-orange-300 dark:bg-orange-700/60" />
                  Regular
                </span>
              </div>
            </div>

            {/* Zero Orders Empty State */}
            {!loading && s && s.orders === 0 ? (
              <div className="py-14 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-2.5">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No orders recorded for this time range
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Select another date above to view past transaction history.
                </p>
              </div>
            ) : spanDays === 1 ? (
              /* Single Day Hourly Bars */
              <div>
                <div className="flex items-end gap-1.5 h-48 sm:h-52 pt-4">
                  {hourlyFilled.map(h => (
                    <div
                      key={h.hour}
                      className="flex-1 flex flex-col items-center justify-end h-full group"
                      title={`${hourLabel(h.hour)}: ${h.orders} orders`}
                    >
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(h.orders / maxHourly) * 100}%` }}
                        transition={{ duration: 0.35 }}
                        className={`w-full rounded-t-sm min-h-[4px] transition-all ${
                          h.hour === peakHour.hour && h.orders > 0
                            ? 'bg-gradient-to-t from-orange-500 to-rose-500 shadow-xs'
                            : h.orders > 0
                            ? 'bg-orange-300 dark:bg-orange-600/50 hover:bg-orange-400'
                            : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-400 mt-3 px-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                  {[0, 6, 12, 18, 23].map(h => (
                    <span key={h}>{hourLabel(h)}</span>
                  ))}
                </div>
              </div>
            ) : (
              /* Range Multi-Day Bars */
              <div className="overflow-x-auto">
                <div
                  className="flex items-end gap-2 h-48 sm:h-52 pt-4"
                  style={{ minWidth: Math.min(dailyFilled.length * 26, 1100) }}
                >
                  {dailyFilled.map(d => (
                    <div
                      key={d.day}
                      className="flex-1 flex flex-col items-center justify-end h-full group"
                      title={`${fmtDate(d.day, { day: '2-digit', month: 'short' })}: ${inr(d.revenue)} (${d.orders} orders)`}
                    >
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.revenue / maxDaily) * 100}%` }}
                        transition={{ duration: 0.35 }}
                        className={`w-full rounded-t-sm min-h-[4px] transition-all ${
                          d.revenue === maxDaily && d.revenue > 0
                            ? 'bg-gradient-to-t from-orange-500 to-rose-500 shadow-xs'
                            : d.revenue > 0
                            ? 'bg-orange-300 dark:bg-orange-600/50 hover:bg-orange-400'
                            : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                      />
                      {dailyFilled.length <= 16 && (
                        <span className="text-xs font-bold text-slate-400 mt-2">
                          {Number(d.day.slice(8))}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {dailyFilled.length > 16 && (
                  <div className="flex justify-between text-xs font-bold text-slate-400 mt-3 border-t border-slate-100 dark:border-slate-800 pt-2">
                    <span>{fmtDate(dailyFilled[0].day, { day: '2-digit', month: 'short' })}</span>
                    <span>{fmtDate(dailyFilled[dailyFilled.length - 1].day, { day: '2-digit', month: 'short' })}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Orders List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs transition-colors">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                  Recent Orders Stream
                </h3>
              </div>
              <button
                onClick={() => navigate('/dashboard/orders')}
                className="text-xs sm:text-sm font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <span>View All Orders</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {(data?.recent || []).length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">
                No recent transactions in this selection.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data!.recent.slice(0, 6).map(o => (
                  <div key={o.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {o.billNo ? `#${String(o.billNo).padStart(4, '0')} • ` : ''}
                        Table {o.tableNumber} • {o.customerName || 'Guest'}
                      </p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {spanDays > 1
                          ? `${fmtDate(new Date(o.createdAt).toLocaleDateString('en-CA', { timeZone: IST }), { day: '2-digit', month: 'short' })}, `
                          : ''}
                        {fmtTime(o.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg border ${STATUS_STYLE[o.status] || STATUS_STYLE.COMPLETED}`}>
                        {o.status.toLowerCase()}
                      </span>
                      <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono w-20 text-right">
                        {inr(o.totalAmount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Top Dishes & Status Pipeline */}
        <div className="space-y-6 sm:space-y-7 min-w-0">
          {/* Top Dishes */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs transition-colors">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <Flame className="w-5 h-5 text-orange-500" />
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                  Top Selling Dishes
                </h3>
              </div>
              <button
                onClick={() => navigate('/dashboard/menu')}
                className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-orange-600 transition-colors"
              >
                Menu Details →
              </button>
            </div>

            {(data?.topDishes || []).length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">
                No dish sales recorded in this period.
              </div>
            ) : (
              <div className="space-y-4">
                {data!.topDishes.slice(0, 6).map((dish, i) => (
                  <div key={dish.name}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-bold text-slate-900 dark:text-slate-100 truncate pr-3">
                        <span className="text-slate-400 font-mono mr-2">{i + 1}.</span>
                        {dish.name}
                      </span>
                      <span className="font-mono font-extrabold text-slate-700 dark:text-slate-300 shrink-0">
                        {dish.qty} orders • {inr(dish.revenue)}
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(dish.qty / maxDish) * 100}%` }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-rose-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Status Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <ClipboardList className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                  Order Status Pipeline
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-400">Current Volume</span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {Object.entries(data?.statusBreakdown || {}).map(([status, count]) => (
                <span
                  key={status}
                  className={`text-xs font-extrabold uppercase tracking-wider px-3.5 py-1.5 rounded-xl border ${STATUS_STYLE[status] || STATUS_STYLE.COMPLETED}`}
                >
                  {status.toLowerCase()} • {count}
                </span>
              ))}
              {Object.keys(data?.statusBreakdown || {}).length === 0 && (
                <p className="text-slate-400 text-sm py-2">No active order status data.</p>
              )}
            </div>

            {s && s.rejected > 0 && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-4 flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{s.rejected} orders rejected (excluded from gross turnover)</span>
              </p>
            )}
          </div>

          {/* Customer Satisfaction Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex items-center gap-5 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Star className="w-7 h-7 fill-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Customer Satisfaction
              </p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono leading-tight mt-0.5">
                {data && data.feedback.count > 0 ? data.feedback.average.toFixed(1) : '–'}
                <span className="text-sm text-slate-400 font-bold"> / 5.0</span>
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                Based on {data?.feedback.count || 0} guest reviews
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment / Subscription Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <PaymentModal
            planName={
              subscription?.isFirstTime
                ? 'First-Time Activation (15 Days Free Access)'
                : (selectedPlan?.name || 'Monthly Subscription Renewal')
            }
            planId={
              subscription?.isFirstTime
                ? 'FIRST_TIME_ACTIVATION'
                : (selectedPlan?.id || 'MONTHLY')
            }
            amount={
              subscription?.isFirstTime
                ? 11
                : (selectedPlan?.priceMonthly || 249)
            }
            durationDays={
              subscription?.isFirstTime
                ? 15
                : (selectedPlan?.days || 30)
            }
            upiId={subscription?.payment?.upiId || ''}
            restaurantName={user?.name || 'Restaurant'}
            razorpayEnabled={subscription?.payment?.razorpayEnabled ?? true}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={() => {
              fetchSubscription();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};