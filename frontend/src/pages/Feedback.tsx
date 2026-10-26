import { useEffect, useState, useCallback } from 'react';
import api from '../lib/api';
import {
  Star, RefreshCw, Search, MessageSquareHeart, Heart, CalendarClock, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedbackItem {
  id: string;
  orderId?: string | null;
  customerName: string;
  tableNumber?: string | null;
  foodName?: string | null;
  rating: number;
  tags: string[];
  favoriteDishes: string[];
  comment?: string | null;
  createdAt: string;
}

const RETENTION_DAYS = 90;
const PAGE_SIZE = 20;
const PERIODS = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
];

// Customer page comment me [Tags: ...] aur [Loved: ...] jod deta hai, unhe alag se dikhate hain
const cleanComment = (c?: string | null) =>
  (c || '').replace(/\[(Tags|Loved):[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();

const ratingLabel = (r: number) =>
  ['', 'Poor', 'Fair', 'Average', 'Good', 'Outstanding'][r] || '';

const ratingTone = (r: number) =>
  r >= 4
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : r === 3
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-rose-50 text-rose-700 border-rose-200';

const Stars = ({ value, size = 'w-4 h-4' }: { value: number; size?: string }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <Star
        key={s}
        className={`${size} ${s <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'}`}
      />
    ))}
  </div>
);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const timeAgo = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

export const FeedbackPage = () => {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [days, setDays] = useState(90);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [average, setAverage] = useState('0.0');
  const [totalRatings, setTotalRatings] = useState(0);
  const [distribution, setDistribution] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

  const fetchFeedback = useCallback(
    async (opts: { pageToLoad?: number; append?: boolean; showLoader?: boolean } = {}) => {
      const { pageToLoad = 1, append = false, showLoader = false } = opts;
      if (showLoader) setRefreshing(true);
      if (append) setLoadingMore(true);
      try {
        const params = new URLSearchParams({
          days: String(days),
          limit: String(PAGE_SIZE),
          page: String(pageToLoad),
        });
        if (ratingFilter) params.set('rating', String(ratingFilter));

        const res = await api.get(`/orders/feedback?${params.toString()}`);
        const data = res.data || {};
        const list: FeedbackItem[] = Array.isArray(data.feedback) ? data.feedback : [];

        setItems(prev => (append ? [...prev, ...list.filter(n => !prev.some(p => p.id === n.id))] : list));
        setPage(data.page || pageToLoad);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
        setAverage(data.averageRating || '0.0');
        setTotalRatings(data.totalRatings || 0);
        if (data.distribution) setDistribution(data.distribution);
      } catch (err) {
        console.error('Feedback fetch error:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [days, ratingFilter]
  );

  // Filter badalne par pehla page dobara
  useEffect(() => {
    setLoading(true);
    fetchFeedback({ pageToLoad: 1 });
  }, [fetchFeedback]);

  // Har 30 second me naya feedback check karo (sirf pehla page)
  useEffect(() => {
    const t = setInterval(() => fetchFeedback({ pageToLoad: 1 }), 30000);
    return () => clearInterval(t);
  }, [fetchFeedback]);

  const q = search.toLowerCase().trim();
  const visible = items.filter(f => {
    if (!q) return true;
    return (
      (f.customerName || '').toLowerCase().includes(q) ||
      String(f.tableNumber || '').toLowerCase().includes(q) ||
      (f.foodName || '').toLowerCase().includes(q) ||
      cleanComment(f.comment).toLowerCase().includes(q) ||
      (f.tags || []).some(t => t.toLowerCase().includes(q))
    );
  });

  const maxCount = Math.max(1, ...Object.values(distribution));

  return (
    <div className="space-y-6">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquareHeart className="w-6 h-6 text-orange-500" />
            Customer Feedback
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Customers ke saare ratings aur reviews. Feedback {RETENTION_DAYS} din tak store rehta hai.
          </p>
        </div>

        <button
          onClick={() => fetchFeedback({ pageToLoad: 1, showLoader: true })}
          disabled={refreshing}
          className="self-start sm:self-auto px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-500' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ─── SUMMARY ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Average */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
            <span className="text-2xl font-black font-mono">{average}</span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Average Rating</p>
            <Stars value={Number(average)} size="w-5 h-5" />
            <p className="text-xs text-slate-500 font-medium mt-1">
              {totalRatings} {totalRatings === 1 ? 'review' : 'reviews'} (last {RETENTION_DAYS} days)
            </p>
          </div>
        </div>

        {/* Distribution (click karke rating filter) */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-1.5">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
            Rating Breakdown <span className="normal-case font-semibold">(click karke filter karein)</span>
          </p>
          {[5, 4, 3, 2, 1].map(r => {
            const count = distribution[r] || 0;
            const active = ratingFilter === r;
            return (
              <button
                key={r}
                onClick={() => setRatingFilter(active ? null : r)}
                className={`w-full flex items-center gap-3 px-2 py-1 rounded-lg transition-colors ${
                  active ? 'bg-orange-50' : 'hover:bg-slate-50'
                }`}
              >
                <span className="w-8 text-xs font-bold text-slate-600 flex items-center gap-0.5">
                  {r}
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${r >= 4 ? 'bg-emerald-500' : r === 3 ? 'bg-amber-400' : 'bg-rose-400'}`}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs font-mono font-bold text-slate-700">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── FILTERS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer, table, dish, comment..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-orange-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setDays(p.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                days === p.value
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {p.label}
            </button>
          ))}
          {ratingFilter && (
            <button
              onClick={() => setRatingFilter(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-white flex items-center gap-1"
            >
              {ratingFilter}★ only ✕
            </button>
          )}
        </div>
      </div>

      {/* ─── LIST ─── */}
      <div className="space-y-3">
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-xs">
            <MessageSquareHeart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">Koi feedback nahi mila</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              {search || ratingFilter
                ? 'Filter ya search badal kar dekhein'
                : 'Jab customers review denge, wo yahan dikhega'}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {visible.map(f => {
              const text = cleanComment(f.comment);
              return (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-4 sm:p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center font-black uppercase">
                        {(f.customerName || 'G').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{f.customerName || 'Guest'}</p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {f.tableNumber ? `Table #${f.tableNumber} • ` : ''}
                          {timeAgo(f.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Stars value={f.rating} />
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${ratingTone(f.rating)}`}>
                        {ratingLabel(f.rating)}
                      </span>
                    </div>
                  </div>

                  {f.foodName && (
                    <p className="text-xs text-slate-500">
                      <span className="font-bold text-slate-700">Ordered:</span> {f.foodName}
                    </p>
                  )}

                  {f.favoriteDishes?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-500">Loved:</span>
                      {f.favoriteDishes.map(d => (
                        <span
                          key={d}
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200"
                        >
                          <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                          {d}
                        </span>
                      ))}
                    </div>
                  )}

                  {f.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {f.tags.map(t => (
                        <span
                          key={t}
                          className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-200"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {text && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 leading-relaxed">
                      “{text}”
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <CalendarClock className="w-3 h-3" />
                    {formatDate(f.createdAt)}
                  </p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {/* Load more */}
        {!loading && page < totalPages && (
          <div className="text-center pt-1">
            <button
              onClick={() => fetchFeedback({ pageToLoad: page + 1, append: true })}
              disabled={loadingMore}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all disabled:opacity-60"
            >
              {loadingMore ? 'Loading...' : `Load more (${items.length} of ${total})`}
            </button>
          </div>
        )}

        <p className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1.5 pt-2">
          <Info className="w-3.5 h-3.5" />
          {RETENTION_DAYS} din se purana feedback apne aap delete ho jata hai.
        </p>
      </div>
    </div>
  );
};