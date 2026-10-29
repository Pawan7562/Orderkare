import { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../lib/api';
import {
  Star,
  RefreshCw,
  Search,
  MessageSquareHeart,
  Heart,
  CalendarClock,
  Info,
  X,
  CheckCircle2,
  Sparkles,
  Utensils,
  Award,
  ThumbsUp,
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
  { label: 'Past 7 Days', value: 7 },
  { label: 'Past 30 Days', value: 30 },
  { label: 'Past 90 Days', value: 90 },
];

const cleanComment = (c?: string | null) =>
  (c || '')
    .replace(/\[(Tags|Loved):[^\]]*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const ratingLabel = (r: number) =>
  ['', 'Poor', 'Fair', 'Average', 'Good', 'Outstanding'][r] || '';

const ratingTone = (r: number) =>
  r >= 4
    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    : r === 3
    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';

const Stars = ({ value, size = 'w-4 h-4' }: { value: number; size?: string }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`${size} ${
          s <= Math.round(value)
            ? 'fill-amber-400 text-amber-400'
            : 'text-slate-200 dark:text-slate-700 fill-slate-100 dark:fill-slate-800'
        }`}
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
  const [distribution, setDistribution] = useState<Record<number, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });

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

        setItems((prev) =>
          append ? [...prev, ...list.filter((n) => !prev.some((p) => p.id === n.id))] : list
        );
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

  useEffect(() => {
    setLoading(true);
    fetchFeedback({ pageToLoad: 1 });
  }, [fetchFeedback]);

  // Periodic background check every 30s
  useEffect(() => {
    const t = setInterval(() => fetchFeedback({ pageToLoad: 1 }), 30000);
    return () => clearInterval(t);
  }, [fetchFeedback]);

  const q = search.toLowerCase().trim();
  const visible = items.filter((f) => {
    if (!q) return true;
    return (
      (f.customerName || '').toLowerCase().includes(q) ||
      String(f.tableNumber || '').toLowerCase().includes(q) ||
      (f.foodName || '').toLowerCase().includes(q) ||
      cleanComment(f.comment).toLowerCase().includes(q) ||
      (f.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  });

  const maxCount = Math.max(1, ...Object.values(distribution));

  // Positive Rating Percentage (4★ and 5★)
  const positivePercentage = useMemo(() => {
    if (totalRatings === 0) return 0;
    const positiveCount = (distribution[4] || 0) + (distribution[5] || 0);
    return Math.round((positiveCount / totalRatings) * 100);
  }, [distribution, totalRatings]);

  return (
    <div className="space-y-7 pb-12 max-w-7xl mx-auto">
      {/* ─── 1. TOP HEADER & PRIMARY ACTIONS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Customer Feedback & Reviews
            </h1>
            <span className="inline-flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 text-xs px-3 py-1 rounded-full font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Guest Satisfaction</span>
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Real customer dining ratings, dish reviews, and guest experience insights
          </p>
        </div>

        <button
          onClick={() => fetchFeedback({ pageToLoad: 1, showLoader: true })}
          disabled={refreshing}
          className="self-start sm:self-auto px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-500' : ''}`} />
          <span>{refreshing ? 'Syncing...' : 'Refresh Reviews'}</span>
        </button>
      </div>

      {/* ─── 2. SUMMARY KPI OVERVIEW & DISTRIBUTION ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Average Rating Score Card */}
        <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Overall Rating
            </span>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">
                {average}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">
                / 5.0
              </span>
            </div>
            <div className="mt-2">
              <Stars value={Number(average)} size="w-5 h-5" />
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              {totalRatings} {totalRatings === 1 ? 'total review' : 'total reviews'}
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{positivePercentage}% Positive</span>
            </span>
          </div>
        </div>

        {/* Rating Breakdown Interactive Distribution */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Rating Breakdown
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Click a star rating bar to filter reviews
            </span>
          </div>

          {[5, 4, 3, 2, 1].map((r) => {
            const count = distribution[r] || 0;
            const active = ratingFilter === r;
            const percentage = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;

            return (
              <button
                key={r}
                onClick={() => setRatingFilter(active ? null : r)}
                className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all ${
                  active
                    ? 'bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="w-10 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>{r}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </span>

                <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      r >= 4
                        ? 'bg-emerald-500'
                        : r === 3
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>

                <div className="w-16 text-right text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center justify-end gap-1">
                  <span>{count}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({percentage}%)
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 3. SEARCH & TIME FILTERS ─── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, table, dish, comment..."
            className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Period & Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setDays(p.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                days === p.value
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}

          {ratingFilter && (
            <button
              onClick={() => setRatingFilter(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-800 text-white flex items-center gap-1.5 shadow-xs"
            >
              <span>{ratingFilter}★ Only</span>
              <X className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* ─── 4. FEEDBACK REVIEWS LIST ─── */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <MessageSquareHeart className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-base">
              {search || ratingFilter
                ? 'No matching reviews found'
                : 'No customer feedback recorded yet'}
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 max-w-sm mx-auto">
              {search || ratingFilter
                ? 'Try adjusting your search terms or clearing the star filter.'
                : 'When customers complete their dining experience and leave a rating, their feedback will display here.'}
            </p>
            {(search || ratingFilter) && (
              <button
                onClick={() => {
                  setSearch('');
                  setRatingFilter(null);
                }}
                className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {visible.map((f) => {
              const text = cleanComment(f.comment);

              return (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all p-5 space-y-3.5"
                >
                  {/* Top Review Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black uppercase text-sm">
                        {(f.customerName || 'G').charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {f.customerName || 'Walk-in Guest'}
                        </h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                          {f.tableNumber ? `Table #${f.tableNumber} • ` : ''}
                          {timeAgo(f.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Stars value={f.rating} size="w-4 h-4" />
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${ratingTone(
                          f.rating
                        )}`}
                      >
                        {ratingLabel(f.rating)}
                      </span>
                    </div>
                  </div>

                  {/* Food / Order Mention */}
                  {f.foodName && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <Utensils className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Ordered:{' '}
                        <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                          {f.foodName}
                        </strong>
                      </span>
                    </div>
                  )}

                  {/* Loved Dishes Tags */}
                  {f.favoriteDishes && f.favoriteDishes.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Favorite Dishes:
                      </span>
                      {f.favoriteDishes.map((dish) => (
                        <span
                          key={dish}
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                        >
                          <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                          <span>{dish}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Tags */}
                  {f.tags && f.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {f.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Comment Text Box */}
                  {text && (
                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium italic">
                      "{text}"
                    </div>
                  )}

                  {/* Timestamp Footer */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(f.createdAt)}</span>
                    </span>

                    {f.orderId && (
                      <span className="font-mono text-[10px] text-slate-400">
                        Order #{f.orderId.slice(-6).toUpperCase()}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {/* Load More Pagination */}
        {!loading && page < totalPages && (
          <div className="text-center pt-2">
            <button
              onClick={() => fetchFeedback({ pageToLoad: page + 1, append: true })}
              disabled={loadingMore}
              className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all disabled:opacity-60 shadow-2xs"
            >
              {loadingMore ? 'Loading Reviews...' : `Load More Reviews (${items.length} of ${total})`}
            </button>
          </div>
        )}

        {/* Data Retention Notice */}
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center justify-center gap-1.5 pt-3">
          <Info className="w-3.5 h-3.5" />
          <span>Customer reviews older than {RETENTION_DAYS} days are automatically archived.</span>
        </p>
      </div>
    </div>
  );
};