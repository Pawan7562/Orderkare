import { useEffect, useState } from 'react';
import api from '../lib/api';
import { CreditCard, CheckCircle2, AlertTriangle, Clock, RefreshCcw, Search, ExternalLink } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);

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

  const filtered = subscriptions.filter((s) => {
    const matchesSearch =
      !search ||
      s.restaurantName.toLowerCase().includes(search.toLowerCase()) ||
      s.paymentReference.toLowerCase().includes(search.toLowerCase()) ||
      s.plan.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === 'ALL' ||
      (filter === 'ACTIVE' && s.status === 'ACTIVE') ||
      (filter === 'TRIAL' && s.status === 'TRIAL') ||
      (filter === 'EXPIRED' && s.status === 'EXPIRED');

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-3xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">SaaS Subscriptions</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Monitor real recurring SaaS revenue, plan purchases, activations, and payment references
          </p>
        </div>
        <button
          onClick={fetchSubscriptions}
          disabled={isRefreshing}
          className="flex items-center space-x-2 bg-white text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all disabled:opacity-50 shadow-xs"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Sync Subscriptions'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchSubscriptions} className="underline font-bold">Retry</button>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Revenue Paid</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Database Real</span>
          </div>
          <p className="text-3xl font-black text-slate-900 font-mono">₹{summary.totalMrr.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-400 mt-1">{summary.activeCount} Active Paid Subscriptions</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">₹1 First-Time Activations</span>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">30-Day Free Access</span>
          </div>
          <p className="text-3xl font-black text-slate-900 font-mono">{summary.trialCount} Venues</p>
          <p className="text-xs text-slate-400 mt-1">Currently enjoying initial 30 days trial</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Expired Subscriptions</span>
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Needs Renewal</span>
          </div>
          <p className="text-3xl font-black text-red-600 font-mono">{summary.expiredCount}</p>
          <p className="text-xs text-slate-400 mt-1">Venues requiring renewal to re-enable QR</p>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search venue or payment ref..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            {['ALL', 'ACTIVE', 'TRIAL', 'EXPIRED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  filter === st ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="pb-3 text-left font-semibold">Restaurant Venue</th>
                <th className="pb-3 text-left font-semibold">Plan</th>
                <th className="pb-3 text-left font-semibold">Amount Paid</th>
                <th className="pb-3 text-left font-semibold">Payment Reference</th>
                <th className="pb-3 text-left font-semibold">Status</th>
                <th className="pb-3 text-left font-semibold">Valid Until</th>
                <th className="pb-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    {search ? 'No subscriptions match your search.' : 'No subscriptions found in database.'}
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4">
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{sub.restaurantName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Slug: {sub.restaurantSlug}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {sub.plan}
                      </span>
                    </td>
                    <td className="py-4 font-mono font-bold text-slate-900 text-xs">
                      ₹{sub.amount}
                    </td>
                    <td className="py-4 font-mono text-[10px] text-slate-500">
                      {sub.paymentReference ? (
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-700">
                          {sub.paymentReference}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="py-4">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          sub.status === 'ACTIVE' || sub.status === 'TRIAL'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-4 text-xs text-slate-600 font-mono">
                      {sub.validUntil ? (
                        new Date(sub.validUntil).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <a
                        href={`/menu/${sub.restaurantSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex text-slate-600 text-xs"
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
