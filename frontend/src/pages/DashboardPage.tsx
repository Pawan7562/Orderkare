import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import {
  ShoppingBag, IndianRupee, RefreshCcw, QrCode, Sparkles, Lock, ArrowRight,
  ChevronLeft, ChevronRight, CalendarDays, Star, TrendingUp, Grid2X2, XCircle, Flame
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { io } from 'socket.io-client';
import { getSocketUrl } from '../lib/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { PaymentModal } from '../components/PaymentModal';

// ─────────────────────────── types ───────────────────────────
type Mode = 'day' | 'range';

interface DailyPoint { day: string; orders: number; revenue: number }

interface RangeStats {
  from: string;
  to: string;
  summary: { orders: number; revenue: number; rejected: number; tablesServed: number; avgOrderValue: number };
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

// ─────────────────────────── date helpers (sab kuch IST, "YYYY-MM-DD" strings) ───────────────────────────
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
const daysBetween = (a: string, b: string) => Math.round((toUTC(b).getTime() - toUTC(a).getTime()) / 86400000);
const pad = (n: number) => String(n).padStart(2, '0');
const monthStart = (y: number, m: number) => `${y}-${pad(m + 1)}-01`;
const monthEnd = (y: number, m: number) => fromUTC(new Date(Date.UTC(y, m + 1, 0)));
const fmtDate = (s: string, opts: Intl.DateTimeFormatOptions) =>
  toUTC(s).toLocaleDateString('en-IN', { timeZone: 'UTC', ...opts });
const inr = (n: number | string) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { timeZone: IST, hour: '2-digit', minute: '2-digit', hour12: true });

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// revenue ke hisaab se "heat" (0 se 4)
const HEAT_BG = ['bg-white', 'bg-orange-50', 'bg-orange-100', 'bg-orange-200', 'bg-orange-300'];
const BAND = '#ffedd5'; // orange-100

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  ACCEPTED: 'bg-blue-50 text-blue-700 border-blue-200',
  PREPARING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  READY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SERVED: 'bg-teal-50 text-teal-700 border-teal-200',
  COMPLETED: 'bg-slate-100 text-slate-700 border-slate-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
};

// ─────────────────────────── Creative calendar ───────────────────────────
interface CalendarProps {
  mode: Mode;
  setMode: (m: Mode) => void;
  start: string;
  end: string | null;
  today: string;
  viewYear: number;
  viewMonth: number;
  setView: (y: number, m: number) => void;
  monthDaily: Record<string, { orders: number; revenue: number }>;
  onPick: (d: string) => void;
  onPreset: (key: string) => void;
  activePreset: string;
}

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 days' },
  { key: 'last30', label: 'Last 30 days' },
  { key: 'month', label: 'This month' },
];

const RangeCalendar = ({
  mode, setMode, start, end, today, viewYear, viewMonth, setView, monthDaily, onPick, onPreset, activePreset,
}: CalendarProps) => {
  const [hover, setHover] = useState<string | null>(null);

  const first = toUTC(monthStart(viewYear, viewMonth));
  const firstDow = first.getUTCDay();
  const dim = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(`${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`);

  const values = Object.values(monthDaily);
  const maxRev = Math.max(1, ...values.map(v => v.revenue));
  const bestDay = useMemo(() => {
    let best: string | null = null;
    let bestRev = 0;
    Object.entries(monthDaily).forEach(([d, v]) => {
      if (v.revenue > bestRev) { bestRev = v.revenue; best = d; }
    });
    return best;
  }, [monthDaily]);

  const monthRevenue = values.reduce((s, v) => s + v.revenue, 0);
  const monthOrders = values.reduce((s, v) => s + v.orders, 0);

  // range ka a..b (hover preview ke saath)
  let a: string = start;
  let b: string = mode === 'range' ? (end ?? (hover && hover <= today ? hover : start)) : start;
  if (a > b) [a, b] = [b, a];

  const isCurrentMonth = viewYear === Number(today.slice(0, 4)) && viewMonth === Number(today.slice(5, 7)) - 1;

  const goMonth = (delta: number) => {
    const d = new Date(Date.UTC(viewYear, viewMonth + delta, 1));
    setView(d.getUTCFullYear(), d.getUTCMonth());
  };

  const selectionLabel =
    a === b
      ? fmtDate(a, { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })
      : `${fmtDate(a, { day: '2-digit', month: 'short' })} → ${fmtDate(b, { day: '2-digit', month: 'short', year: 'numeric' })}`;
  const spanDays = daysBetween(a, b) + 1;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm overflow-hidden">
      {/* Header strip */}
      <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-orange-500 via-orange-500 to-rose-500 text-white relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute right-10 -bottom-10 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-orange-100">
          <CalendarDays className="w-3.5 h-3.5" />
          Business Calendar
        </div>
        <p className="relative mt-1.5 text-lg font-black leading-tight">{selectionLabel}</p>
        <p className="relative text-xs font-semibold text-orange-100 mt-0.5">
          {spanDays === 1 ? 'Single day view' : `${spanDays} days selected`}
          {mode === 'range' && !end && ' • Select an end date'}
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Mode switch */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl">
          {([
            { key: 'day', label: 'Single Day' },
            { key: 'range', label: 'Custom Range' },
          ] as { key: Mode; label: string }[]).map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                mode === m.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => onPreset(p.key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                activePreset === p.key
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => goMonth(-1)}
            className="w-8 h-8 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 flex items-center justify-center transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <p className="text-sm font-black text-slate-900">
              {fmtDate(monthStart(viewYear, viewMonth), { month: 'long', year: 'numeric' })}
            </p>
            {!isCurrentMonth && (
              <button
                onClick={() => setView(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1)}
                className="text-[10px] font-bold text-orange-600 hover:underline"
              >
                 Today
              </button>
            )}
          </div>
          <button
            onClick={() => goMonth(1)}
            disabled={isCurrentMonth}
            className="w-8 h-8 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Grid */}
        <div>
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((w, i) => (
              <div key={i} className="text-center text-[10px] font-black uppercase tracking-wider text-slate-400 py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1" onMouseLeave={() => setHover(null)}>
            {cells.map((d, idx) => {
              if (!d) return <div key={`e-${idx}`} className="h-11" />;

              const future = d > today;
              const isEdge = d === a || d === b;
              const inBetween = a !== b && d > a && d < b;
              const info = monthDaily[d];
              const level = info && info.revenue > 0 ? Math.max(1, Math.ceil((info.revenue / maxRev) * 4)) : 0;
              const isToday = d === today;

              // range ka "band" peeche
              let bandStyle: CSSProperties | undefined;
              if (a !== b) {
                if (d === a) bandStyle = { background: `linear-gradient(to right, transparent 50%, ${BAND} 50%)` };
                else if (d === b) bandStyle = { background: `linear-gradient(to right, ${BAND} 50%, transparent 50%)` };
                else if (inBetween) bandStyle = { background: BAND };
              }

              const btnClass = future
                ? 'text-slate-300 cursor-not-allowed'
                : isEdge
                ? 'bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/30 scale-105'
                : inBetween
                ? 'text-orange-900 font-extrabold hover:bg-orange-200'
                : `${HEAT_BG[level]} text-slate-700 hover:ring-2 hover:ring-orange-300`;

              return (
                <div key={d} className="relative h-11 flex items-center justify-center" style={bandStyle}>
                  <button
                    disabled={future}
                    onClick={() => onPick(d)}
                    onMouseEnter={() => !future && setHover(d)}
                    title={
                      future
                        ? undefined
                        : info && info.orders > 0
                        ? `${fmtDate(d, { day: '2-digit', month: 'short' })} • ${inr(info.revenue)} • ${info.orders} orders`
                        : `${fmtDate(d, { day: '2-digit', month: 'short' })} • koi order nahi`
                    }
                    className={`relative w-9 h-9 rounded-xl text-xs font-bold transition-all ${btnClass} ${
                      isToday && !isEdge ? 'ring-2 ring-orange-400 ring-offset-1' : ''
                    }`}
                  >
                    {Number(d.slice(8))}
                    {d === bestDay && !future && (
                      <span className="absolute -top-1.5 -right-1 text-[10px] leading-none" title="Best day of the month">
                        👑
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend + month summary */}
        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
            <span>Low sales</span>
            <div className="flex items-center gap-1">
              {HEAT_BG.map((c, i) => (
                <span key={i} className={`w-4 h-4 rounded-md border border-slate-200 ${c}`} />
              ))}
            </div>
            <span>High sales</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-100 px-3.5 py-2.5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">This month</p>
              <p className="text-sm font-black text-slate-900 font-mono">{inr(monthRevenue)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Orders</p>
              <p className="text-sm font-black text-slate-900 font-mono">{monthOrders}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────── Page ───────────────────────────
export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const today = todayStr();

  // calendar state
  const [mode, setModeState] = useState<Mode>('day');
  const [start, setStart] = useState<string>(today);
  const [end, setEnd] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState<number>(Number(today.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState<number>(Number(today.slice(5, 7)) - 1);

  // data state
  const [data, setData] = useState<RangeStats | null>(null);
  const [monthDaily, setMonthDaily] = useState<Record<string, { orders: number; revenue: number }>>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  // subscription / payment
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
  const [plans, setPlans] = useState<any[]>([]); // Superadmin ke plans

  const [notification, setNotification] = useState<{ id: string; title: string; message: string } | null>(null);

  // selected range
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

  // ── subscription ──
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

  // ── fetch plans for renewal ──
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

  // ── selected range ka dashboard ──
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
        setError('Data load nahi ho paya. Refresh karke dekhein.');
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

  // ── calendar heatmap (visible month) ──
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
  }, [fetchMonth]);

  // ── live updates (socket + polling), reconnect ke bina ──
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
        title: o.merged ? 'Items Added to Order' : 'New Order Received',
        message: `${o.customerName || 'Guest'} from Table #${o.tableNumber} (₹${o.totalAmount})`,
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

  // ── chart data ──
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
  const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'am' : 'pm'}`;

  const s = data?.summary;
  const statCards = [
    { label: 'Orders', value: s ? String(s.orders) : '–', icon: ShoppingBag, color: 'bg-orange-50 text-orange-600' },
    { label: 'Sales', value: s ? inr(s.revenue) : '–', icon: IndianRupee, color: 'bg-blue-50 text-blue-600' },
    { label: 'Avg. Order Value', value: s ? inr(s.avgOrderValue) : '–', icon: TrendingUp, color: 'bg-violet-50 text-violet-600' },
    { label: 'Tables Served', value: s ? String(s.tablesServed) : '–', icon: Grid2X2, color: 'bg-emerald-50 text-emerald-600' },
  ];

  const rangeTitle =
    from === to
      ? from === today
        ? 'Dashboard'
        : `${fmtDate(from, { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}`
      : `${fmtDate(from, { day: '2-digit', month: 'short' })} – ${fmtDate(to, { day: '2-digit', month: 'short', year: 'numeric' })}`;

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
                // Superadmin ka pehla plan select karein (renewal ke liye)
                if (!subscription?.isFirstTime && plans.length > 0) {
                  setSelectedPlan(plans[0]);
                }
                setShowPaymentModal(true);
              }
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-primary to-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-primary/20 hover:opacity-95 transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>
              {subscription?.isSubscribed 
                ? 'Master QR Standee & Tables' 
                : subscription?.isFirstTime 
                  ? 'Unlock Master QR (₹1)' 
                  : `Renew Master QR (₹${plans[0]?.priceMonthly || 249})`
              }
            </span>
          </button>
          <button
            onClick={() => {
              fetchStats(true);
              fetchMonth();
            }}
            className="flex items-center space-x-2 bg-white text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all cursor-pointer"
          >
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
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
          subscription?.isSubscribed
            ? 'bg-emerald-500 text-white shadow-emerald-200'
            : 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-orange-200'
        }`}
      >
        {subscription?.isSubscribed ? <QrCode className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
      </div>
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-extrabold text-slate-900">
            {subscription?.isSubscribed ? 'Master Restaurant QR Standee: Live & Active' : 'Master Restaurant QR Standee'}
          </h2>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              subscription?.isSubscribed
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-orange-100 text-orange-800 border border-orange-200'
            }`}
          >
            {subscription?.isSubscribed
              ? subscription?.daysRemaining !== undefined
                ? `${subscription.daysRemaining} Days Left`
                : 'Active'
              : subscription?.isFirstTime
              ? '₹11 Activation Needed'
              : 'Subscription Expired'}
          </span>
        </div>
        <p className="text-slate-600 text-sm mt-1 max-w-2xl">
          {subscription?.isSubscribed
            ? `Your restaurant's single master QR standee is active. Guests scanning the QR from any table can view your live menu and place orders straight to this live dashboard.`
            : subscription?.isFirstTime
            ? 'New account special: Complete the one-time ₹11 activation to generate your permanent Master QR standee and receive 14 days completely free!'
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
          <span>
            {subscription?.isFirstTime 
              ? 'Pay ₹11 & Unlock QR (14 Days Free)' 
              : `Renew & Unlock Master QR (₹${plans[0]?.priceMonthly || 249})`}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
</motion.div>

      {/* Calendar + Dashboard of selected day / range */}
      <motion.div variants={stagger.item} className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6 items-start">
        <div className="xl:sticky xl:top-4">
          <RangeCalendar
            mode={mode}
            setMode={setMode}
            start={start}
            end={end}
            today={today}
            viewYear={viewYear}
            viewMonth={viewMonth}
            setView={setView}
            monthDaily={monthDaily}
            onPick={handlePick}
            onPreset={handlePreset}
            activePreset={activePreset}
          />
        </div>

        <div className="space-y-5 min-w-0">
          {/* Title row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{rangeTitle}</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {spanDays === 1 ? 'Calculation of the day ' : `${spanDays} Financial Statement of the day`} • {includesToday ? 'Live & Updating' : 'Historical Data'}
              </p>
            </div>
            {includesToday && (
              <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3 py-1 rounded-full font-bold">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                Live
              </span>
            )}
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold px-4 py-3">{error}</div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {statCards.map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md transition-all">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={`${stat.label}-${stat.value}-${loading}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-2xl font-extrabold tracking-tight text-slate-900 ${loading ? 'opacity-40' : ''}`}
                    >
                      {stat.value}
                    </motion.p>
                  </AnimatePresence>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {!loading && s && s.orders === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
              <span className="text-4xl block mb-2">🍽️</span>
              <h3 className="font-bold text-slate-800 text-sm">Is {spanDays === 1 ? 'din' : 'period'} me koi order nahi mila</h3>
              <p className="text-slate-400 text-xs mt-1">Calendar me doosri date chuno</p>
            </div>
          ) : (
            <>
              {/* Chart: single day = peak hours, range = daily sales */}
              <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {spanDays === 1 ? 'Peak Hours' : 'Daily Sales'}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {spanDays === 1
                        ? peakHour.hour >= 0
                          ? `Peak hours: ${hourLabel(peakHour.hour)} (${peakHour.orders} orders)`
                          : 'Hour-wise orders'
                        : 'Daily order volume'}
                    </p>
                  </div>
                  <Flame className="w-5 h-5 text-orange-400" />
                </div>

                {spanDays === 1 ? (
                  <div>
                    <div className="flex items-end gap-1 h-36">
                      {hourlyFilled.map(h => (
                        <div key={h.hour} className="flex-1 flex flex-col items-center justify-end h-full" title={`${hourLabel(h.hour)} • ${h.orders} orders`}>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${(h.orders / maxHourly) * 100}%` }}
                            transition={{ duration: 0.5 }}
                            className={`w-full rounded-t-md min-h-[3px] ${
                              h.hour === peakHour.hour && h.orders > 0
                                ? 'bg-gradient-to-t from-orange-500 to-rose-500'
                                : h.orders > 0
                                ? 'bg-orange-300'
                                : 'bg-slate-100'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1.5 px-0.5">
                      {[0, 6, 12, 18, 23].map(h => (
                        <span key={h}>{hourLabel(h)}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="flex items-end gap-1.5 h-40" style={{ minWidth: Math.min(dailyFilled.length * 22, 1400) }}>
                      {dailyFilled.map(d => (
                        <div
                          key={d.day}
                          className="flex-1 flex flex-col items-center justify-end h-full"
                          title={`${fmtDate(d.day, { day: '2-digit', month: 'short' })} • ${inr(d.revenue)} • ${d.orders} orders`}
                        >
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${(d.revenue / maxDaily) * 100}%` }}
                            transition={{ duration: 0.5 }}
                            className={`w-full rounded-t-md min-h-[3px] ${
                              d.revenue === maxDaily && d.revenue > 0
                                ? 'bg-gradient-to-t from-orange-500 to-rose-500'
                                : d.revenue > 0
                                ? 'bg-orange-300'
                                : 'bg-slate-100'
                            }`}
                          />
                          {dailyFilled.length <= 16 && (
                            <span className="text-[9px] font-bold text-slate-400 mt-1">{Number(d.day.slice(8))}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {dailyFilled.length > 16 && (
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1.5">
                        <span>{fmtDate(dailyFilled[0].day, { day: '2-digit', month: 'short' })}</span>
                        <span>{fmtDate(dailyFilled[dailyFilled.length - 1].day, { day: '2-digit', month: 'short' })}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Top dishes */}
                <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm">
                  <h3 className="font-bold text-slate-900 text-sm mb-4">🍛 Top Selling Dishes</h3>
                  {(data?.topDishes || []).length === 0 ? (
                    <p className="text-slate-400 text-xs text-center py-6">Abhi koi data nahi</p>
                  ) : (
                    <div className="space-y-3">
                      {data!.topDishes.map((dish, i) => (
                        <div key={dish.name}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-slate-800 truncate pr-2">
                              <span className="text-slate-400 font-mono mr-1.5">{i + 1}.</span>
                              {dish.name}
                            </span>
                            <span className="font-mono font-bold text-slate-600 shrink-0">
                              {dish.qty}× • {inr(dish.revenue)}
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(dish.qty / maxDish) * 100}%` }}
                              transition={{ duration: 0.5, delay: i * 0.05 }}
                              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status + feedback */}
                <div className="space-y-5">
                  <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-900 text-sm mb-3">📋 Order Status</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(data?.statusBreakdown || {}).map(([status, count]) => (
                        <span
                          key={status}
                          className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${STATUS_STYLE[status] || STATUS_STYLE.COMPLETED}`}
                        >
                          {status.toLowerCase()} • {count}
                        </span>
                      ))}
                      {Object.keys(data?.statusBreakdown || {}).length === 0 && (
                        <p className="text-slate-400 text-xs">Koi data nahi</p>
                      )}
                    </div>
                    {s && s.rejected > 0 && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-3 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        {s.rejected} order reject hue (sales me nahi gine gaye)
                      </p>
                    )}
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                      <Star className="w-6 h-6 fill-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Customer Rating</p>
                      <p className="text-2xl font-black text-slate-900 font-mono leading-tight">
                        {data && data.feedback.count > 0 ? data.feedback.average.toFixed(1) : '–'}
                        <span className="text-xs text-slate-400 font-bold"> / 5</span>
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {data?.feedback.count || 0} {data?.feedback.count === 1 ? 'review' : 'reviews'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent orders */}
              <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-sm">🧾 Recent Orders</h3>
                  <button
                    onClick={() => navigate('/dashboard/orders')}
                    className="text-[11px] font-bold text-orange-600 hover:underline flex items-center gap-1"
                  >
                    see all <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                {(data?.recent || []).length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-6">No recent orders</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {data!.recent.map(o => (
                      <div key={o.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {o.billNo ? `#${String(o.billNo).padStart(4, '0')} • ` : ''}Table {o.tableNumber} • {o.customerName || 'Guest'}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {spanDays > 1 ? `${fmtDate(new Date(o.createdAt).toLocaleDateString('en-CA', { timeZone: IST }), { day: '2-digit', month: 'short' })}, ` : ''}
                            {fmtTime(o.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLE[o.status] || STATUS_STYLE.COMPLETED}`}>
                            {o.status.toLowerCase()}
                          </span>
                          <span className="text-sm font-black text-slate-900 font-mono w-16 text-right">{inr(o.totalAmount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Payment Modal */}
      <AnimatePresence>
         {showPaymentModal && (
          <PaymentModal
            planName={
              subscription?.isFirstTime 
                ? 'First-Time Activation (1 Month Free)' 
                : (selectedPlan?.name || 'Monthly Plan Renewal')
            }
            planId={
              subscription?.isFirstTime 
                ? 'FIRST_TIME_ACTIVATION' 
                : (selectedPlan?.id || 'MONTHLY')
            }
            amount={
              subscription?.isFirstTime 
                ? 1 
                : (selectedPlan?.priceMonthly || 249)
            }
            durationDays={
              subscription?.isFirstTime 
                ? 30 
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
    </motion.div>
  );
};