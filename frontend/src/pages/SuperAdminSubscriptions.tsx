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
  Building2,
  Sparkles,
  Calendar,
  X,
  Eye,
  Filter,
  ArrowUpDown,
  FileSpreadsheet,
  Copy,
  Receipt,
  XCircle,
  ShieldCheck,
  Check,
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
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(id);
    setTimeout(() => setCopiedRef(null), 2000);
  };

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

  const summaryCards = [
    {
      title: 'Total Revenue Invoiced',
      value: `₹${(summary.totalMrr || 0).toLocaleString('en-IN')}`,
      desc: 'Verified platform collections',
      icon: Receipt,
      color: 'text-violet-600 dark:text-violet-400',
      badgeBg: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200/80 dark:border-violet-900/40',
      barColor: 'from-violet-500 to-purple-500',
    },
    {
      title: 'Active Commercial Plans',
      value: String(summary.activeCount || 0),
      desc: 'Active paid subscription accounts',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/40',
      barColor: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'Introductory Trials',
      value: String(summary.trialCount || 0),
      desc: 'Venues on trial license',
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/40',
      barColor: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Expired Subscriptions',
      value: String(summary.expiredCount || 0),
      desc: 'Venues pending license renewal',
      icon: XCircle,
      color: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/40',
      barColor: 'from-rose-500 to-pink-500',
    },
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 max-w-7xl mx-auto pb-12 font-sans antialiased">
        <div className="h-28 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs" />
          ))}
        </div>
        <div className="h-96 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800" />
      </div>
    );
  }

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
                <span>SaaS Billing & License Audit</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Verified Transactions</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Subscription & License Directory
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Track recurring SaaS subscriptions, verify payment reference numbers, inspect plan tiers, and manage hotel license expiration cycles.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={fetchSubscriptions}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-orange-500/25 active:scale-95 cursor-pointer disabled:opacity-60"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Records'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs font-medium text-rose-700 dark:text-rose-400 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchSubscriptions} className="underline font-bold hover:text-rose-900 dark:hover:text-rose-300 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* ── Summary KPI Overview Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${card.badgeBg} ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className={`h-1.5 w-7 rounded-full bg-gradient-to-r ${card.barColor}`} />
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {card.value}
                </p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 leading-tight">
                  {card.title}
                </p>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium leading-tight">
                {card.desc}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by restaurant name, slug, payment reference ID or plan..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 px-3 py-1.5 rounded-2xl">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="newest" className="dark:bg-slate-900">Newest Purchased</option>
              <option value="amount" className="dark:bg-slate-900">Amount (High to Low)</option>
              <option value="expiry" className="dark:bg-slate-900">Expiring Soonest</option>
              <option value="name" className="dark:bg-slate-900">Restaurant Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {[
            { id: 'ALL', label: 'All Subscriptions', count: subscriptions.length },
            { id: 'ACTIVE', label: 'Active Commercial', count: summary.activeCount, color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' },
            { id: 'TRIAL', label: 'Introductory Trials', count: summary.trialCount, color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' },
            { id: 'EXPIRED', label: 'Expired', count: summary.expiredCount, color: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40' },
          ].map((tab) => {
            const isSelected = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm shadow-orange-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    isSelected ? 'bg-white/20 text-white' : tab.color || 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}

          <div className="ml-auto text-[11px] text-slate-400 font-medium">
            Showing <strong className="text-slate-700 dark:text-slate-200">{filtered.length}</strong> of {subscriptions.length} records
          </div>
        </div>
      </div>

      {/* ── Subscriptions High-Density Audit Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                <th className="py-3.5 px-5">Restaurant Venue</th>
                <th className="py-3.5 px-5">Plan Tier</th>
                <th className="py-3.5 px-5">Amount Paid</th>
                <th className="py-3.5 px-5">Payment Reference (UTR)</th>
                <th className="py-3.5 px-5 text-center">License Status</th>
                <th className="py-3.5 px-5 text-center">Valid Until</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 dark:text-slate-500 font-medium">
                    <CreditCard className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-bold text-slate-600 dark:text-slate-300">No subscriptions match your query</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Try clearing search terms or selecting another filter tab.</p>
                    <button
                      onClick={() => {
                        setSearch('');
                        setFilter('ALL');
                      }}
                      className="mt-3 px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Reset All Filters
                    </button>
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
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    >
                      {/* 1. Restaurant Venue Details */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500/10 to-rose-500/15 text-orange-600 dark:text-orange-400 font-black text-sm flex items-center justify-center border border-orange-500/20 shrink-0 shadow-2xs">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 dark:text-white text-xs group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate max-w-[200px]">
                              {sub.restaurantName}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">/{sub.restaurantSlug}</p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Plan Tier */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border ${
                            isTrial
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/40'
                              : sub.plan === 'ANNUAL'
                              ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900/40'
                              : sub.plan === 'SIX_MONTHS'
                              ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-900/40'
                              : sub.plan === 'MONTHLY'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900/40'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {sub.plan}
                        </span>
                      </td>

                      {/* 3. Amount Paid */}
                      <td className="py-4 px-5 font-mono font-black text-slate-900 dark:text-white text-xs">
                        ₹{sub.amount.toLocaleString('en-IN')}
                      </td>

                      {/* 4. Payment Reference */}
                      <td className="py-4 px-5 font-mono text-[11px]" onClick={(e) => e.stopPropagation()}>
                        {sub.paymentReference ? (
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200/70 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
                            <span className="truncate max-w-[160px]">{sub.paymentReference}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(sub.paymentReference, sub.id)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              title="Copy Reference"
                            >
                              {copiedRef === sub.id ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">None</span>
                        )}
                      </td>

                      {/* 5. Status Pill */}
                      <td className="py-4 px-5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            sub.status === 'ACTIVE'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40'
                              : sub.status === 'TRIAL'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40'
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
                      <td className="py-4 px-5 text-center font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {sub.validUntil ? (
                          new Date(sub.validUntil).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>

                      {/* 7. Actions */}
                      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectSub(sub)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all cursor-pointer"
                            title="Inspect Subscription Audit"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={`/menu/${sub.restaurantSlug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all cursor-pointer"
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
              className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden z-10 border border-slate-200/80 dark:border-slate-800 p-6 space-y-5 transition-colors"
            >
              <button
                onClick={() => setInspectSub(null)}
                className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3.5 pt-1">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-white font-black text-lg flex items-center justify-center shadow-md shadow-orange-500/20">
                  {inspectSub.restaurantName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{inspectSub.restaurantName}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">/{inspectSub.restaurantSlug}</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 rounded-2xl p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Plan Tier:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white uppercase">{inspectSub.plan}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Amount Paid:</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">₹{inspectSub.amount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Payment Reference (UTR):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{inspectSub.paymentReference || 'None'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">License Status:</span>
                  <span className="font-extrabold uppercase text-slate-900 dark:text-white">{inspectSub.status}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Valid Until:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {inspectSub.validUntil ? new Date(inspectSub.validUntil).toLocaleString('en-IN') : 'None'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Purchased Date:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {new Date(inspectSub.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <a
                  href={`/menu/${inspectSub.restaurantSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-extrabold text-xs rounded-xl transition-all inline-flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
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
