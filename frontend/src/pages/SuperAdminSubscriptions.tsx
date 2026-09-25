import { useEffect, useState, useMemo } from 'react';
import api from '../lib/api';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCcw,
  Search,
  ExternalLink,
  Download,
  ShieldCheck,
  Building2,
  QrCode,
  Sparkles,
  Calendar,
  X,
  Eye,
  Filter,
  ArrowUpDown,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubscriptionRecord {
  id: string;
  restaurantName: string;
  restaurantSlug: string;
  restaurantId: string;
  plan: string;
  amount: number;
  status: string;
  paymentReference: string;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionSummary {
  activeCount: number;
  trialCount: number;
  expiredCount: number;
  totalMrr: number;
}

export const SuperAdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [summary, setSummary] = useState<SubscriptionSummary>({
    activeCount: 0,
    trialCount: 0,
    expiredCount: 0,
    totalMrr: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'amount' | 'expiry' | 'name'>('newest');
  const [error, setError] = useState<string | null>(null);
  const [inspectSub, setInspectSub] = useState<SubscriptionRecord | null>(null);

  const fetchSubscriptions = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await api.get('/admin/subscriptions');
      if (res.data?.subscriptions) {
        setSubscriptions(res.data.subscriptions);
      }
      if (res.data?.summary) {
        setSummary(res.data.summary);
      }
    } catch (err: any) {
      console.error('Failed to load subscriptions:', err);
      setError(err?.response?.data?.message || 'Failed to fetch subscriptions.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const exportCSV = () => {
    if (!subscriptions.length) return;
    const headers = [
      'Subscription ID',
      'Restaurant Name',
      'Slug',
      'Plan Name',
      'Amount Paid (INR)',
      'Payment Reference (UTR)',
      'Status',
      'Valid Until',
      'Purchased At',
    ];

    const rows = subscriptions.map((s) => [
      `"${s.id}"`,
      `"${s.restaurantName.replace(/"/g, '""')}"`,
      `"${s.restaurantSlug}"`,
      `"${s.plan}"`,
      s.amount,
      `"${s.paymentReference || ''}"`,
      `"${s.status}"`,
      `"${s.validUntil ? new Date(s.validUntil).toISOString() : ''}"`,
      `"${new Date(s.createdAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `OrderKare_Subscriptions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = useMemo(() => {
    return subscriptions
      .filter((s) => {
        const query = search.toLowerCase();
        const matchesSearch =
          !search ||
          s.restaurantName.toLowerCase().includes(query) ||
          s.paymentReference.toLowerCase().includes(query) ||
          s.restaurantSlug.toLowerCase().includes(query) ||
          s.plan.toLowerCase().includes(query);

        const matchesFilter =
          filter === 'ALL' ||
          (filter === 'ACTIVE' && s.status === 'ACTIVE') ||
          (filter === 'TRIAL' && s.status === 'TRIAL') ||
          (filter === 'EXPIRED' && s.status === 'EXPIRED');

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'amount') return b.amount - a.amount;
        if (sortBy === 'name') return a.restaurantName.localeCompare(b.restaurantName);
        if (sortBy === 'expiry') {
          if (!a.validUntil) return 1;
          if (!b.validUntil) return -1;
          return new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime();
        }
        return 0;
      });
  }, [subscriptions, search, filter, sortBy]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 max-w-7xl mx-auto pb-12 font-sans antialiased">
        <div className="h-24 bg-white rounded-3xl border border-slate-200/80 p-6" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs" />
          ))}
        </div>
        <div className="h-96 bg-white rounded-3xl border border-slate-200/80" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-14 font-sans antialiased text-slate-800">
      {/* ── Executive Top Header ── */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Payment Gateway Stream
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10">
                Razorpay Automated Audits
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>SaaS Subscription & License Audit</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Track recurring SaaS subscription income, monitor introductory ₹1 promotions, verify payment reference numbers, and review restaurant license expiration cycles.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer backdrop-blur-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={fetchSubscriptions}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl text-xs font-extrabold transition-all shadow-lg shadow-orange-500/25 active:scale-95 cursor-pointer disabled:opacity-60"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Subscriptions'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchSubscriptions} className="underline font-bold hover:text-rose-900 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* ── Summary KPI Overview Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Revenue Invoiced</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Verified
            </span>
          </div>
          <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">
            ₹{summary.totalMrr.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">100% verified Razorpay collections</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Commercial Plans</span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Active Paid
            </span>
          </div>
          <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">
            {summary.activeCount}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">Monthly, 6-Month & Annual tiers</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">₹1 First-Time Trial</span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              30-Day Free
            </span>
          </div>
          <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">
            {summary.trialCount}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">Venues in introductory trial</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Expired / Lapsed</span>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              Renewal Needed
            </span>
          </div>
          <p className="text-3xl font-black text-rose-600 font-mono tracking-tight">
            {summary.expiredCount}
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium">Venues needing subscription renewal</p>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by restaurant name, slug, payment reference ID or plan tier..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-2xl">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="newest">Newest Purchased</option>
              <option value="amount">Amount (High to Low)</option>
              <option value="expiry">Expiring Soonest</option>
              <option value="name">Restaurant Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {[
            { id: 'ALL', label: 'All Subscriptions', count: subscriptions.length },
            { id: 'ACTIVE', label: 'Active Commercial', count: summary.activeCount, color: 'text-emerald-700 bg-emerald-50' },
            { id: 'TRIAL', label: '₹1 Trial', count: summary.trialCount, color: 'text-amber-700 bg-amber-50' },
            { id: 'EXPIRED', label: 'Expired', count: summary.expiredCount, color: 'text-rose-700 bg-rose-50' },
          ].map((tab) => {
            const isSelected = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                    isSelected ? 'bg-white/20 text-white' : tab.color || 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Subscriptions Audit Table ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-3.5 px-5">Restaurant Venue</th>
                <th className="py-3.5 px-5">Plan Tier</th>
                <th className="py-3.5 px-5">Amount Paid</th>
                <th className="py-3.5 px-5">Payment Reference (UTR)</th>
                <th className="py-3.5 px-5 text-center">Status</th>
                <th className="py-3.5 px-5 text-center">Valid Until</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 font-medium">
                    <CreditCard className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600">No subscriptions match your query</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try resetting search keywords or filter tab.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => {
                  const isTrial = sub.status === 'TRIAL' || sub.amount === 1;
                  const isActive = sub.status === 'ACTIVE' || sub.status === 'TRIAL';
                  const initial = sub.restaurantName ? sub.restaurantName.charAt(0).toUpperCase() : 'R';

                  return (
                    <tr
                      key={sub.id}
                      onClick={() => setInspectSub(sub)}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    >
                      {/* 1. Restaurant Details */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 font-black text-sm flex items-center justify-center border border-orange-500/20 shrink-0">
                            {initial}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs group-hover:text-orange-600 transition-colors">
                              {sub.restaurantName}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">/{sub.restaurantSlug}</p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Plan Tier */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border ${
                            isTrial
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : sub.plan === 'ANNUAL'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : sub.plan === 'SIX_MONTHS'
                              ? 'bg-orange-50 text-orange-800 border-orange-200'
                              : sub.plan === 'MONTHLY'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {sub.plan}
                        </span>
                      </td>

                      {/* 3. Amount Paid */}
                      <td className="py-4 px-5 font-mono font-black text-slate-900 text-xs">
                        ₹{sub.amount.toLocaleString('en-IN')}
                      </td>

                      {/* 4. Payment Reference */}
                      <td className="py-4 px-5 font-mono text-[11px]">
                        {sub.paymentReference ? (
                          <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-slate-700 inline-block truncate max-w-[180px]">
                            {sub.paymentReference}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>

                      {/* 5. Status Pill */}
                      <td className="py-4 px-5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            sub.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : sub.status === 'TRIAL'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                            }`}
                          />
                          {sub.status}
                        </span>
                      </td>

                      {/* 6. Valid Until */}
                      <td className="py-4 px-5 text-center font-mono text-[11px] text-slate-600">
                        {sub.validUntil ? (
                          new Date(sub.validUntil).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* 7. Actions */}
                      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectSub(sub)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all"
                            title="Inspect Audit"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={`/menu/${sub.restaurantSlug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all"
                            title="Preview Public QR Menu"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── INSPECT SUBSCRIPTION MODAL ── */}
      <AnimatePresence>
        {inspectSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectSub(null)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden z-10 border border-slate-100 p-6 space-y-5"
            >
              <button
                onClick={() => setInspectSub(null)}
                className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 pt-1">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 font-black text-lg flex items-center justify-center border border-orange-500/20">
                  {inspectSub.restaurantName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{inspectSub.restaurantName}</h3>
                  <p className="text-xs text-slate-400 font-mono">/{inspectSub.restaurantSlug}</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Plan Tier:</span>
                  <span className="font-extrabold text-slate-900 uppercase">{inspectSub.plan}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-mono font-black text-emerald-600 text-sm">₹{inspectSub.amount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Payment Reference:</span>
                  <span className="font-mono font-bold text-slate-900">{inspectSub.paymentReference || 'None'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-extrabold uppercase text-slate-900">{inspectSub.status}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Valid Until:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {inspectSub.validUntil ? new Date(inspectSub.validUntil).toLocaleString('en-IN') : 'None'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Purchased Date:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {new Date(inspectSub.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <a
                  href={`/menu/${inspectSub.restaurantSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all inline-flex items-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Public Menu</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
