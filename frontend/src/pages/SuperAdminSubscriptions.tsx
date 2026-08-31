import { useState } from 'react';
import { CreditCard, CheckCircle2, AlertTriangle, Clock, RefreshCcw, Search, ArrowUpRight } from 'lucide-react';

interface Subscription {
  id: string;
  restaurantName: string;
  plan: string;
  amount: string;
  billingCycle: 'Monthly' | 'Yearly';
  status: 'ACTIVE' | 'TRIAL' | 'OVERDUE' | 'CANCELLED';
  nextBilling: string;
}

export const SuperAdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    { id: 'sub-1', restaurantName: 'Royal Palace Fine Dining', plan: 'Professional Plan', amount: '₹1,999/mo', billingCycle: 'Monthly', status: 'ACTIVE', nextBilling: 'Sep 24, 2026' },
    { id: 'sub-2', restaurantName: 'Grand Sapphire Hotel', plan: 'Enterprise Plan', amount: '₹4,999/mo', billingCycle: 'Yearly', status: 'ACTIVE', nextBilling: 'Jan 15, 2027' },
    { id: 'sub-3', restaurantName: 'Oceanic Heights Resort', plan: 'Professional Plan', amount: '₹1,999/mo', billingCycle: 'Monthly', status: 'ACTIVE', nextBilling: 'Sep 30, 2026' },
    { id: 'sub-4', restaurantName: 'The Courtyard Bistro', plan: 'Basic Plan', amount: '₹999/mo', billingCycle: 'Monthly', status: 'TRIAL', nextBilling: 'Sep 10, 2026' },
    { id: 'sub-5', restaurantName: 'Urban Grill Lounge', plan: 'Basic Plan', amount: '₹999/mo', billingCycle: 'Monthly', status: 'OVERDUE', nextBilling: 'Aug 20, 2026' },
  ]);

  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filtered = subscriptions.filter((s) => {
    const matchesSearch = !search || s.restaurantName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleRenew = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'ACTIVE', nextBilling: 'Oct 30, 2026' } : s))
    );
  };

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">SaaS Subscriptions</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage recurring SaaS revenue, plan renewals, and overdue invoices</p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active MRR</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+14% MoM</span>
          </div>
          <p className="text-3xl font-black text-slate-900 font-mono">₹2,40,000</p>
          <p className="text-xs text-slate-400 mt-1">112 Active Subscriptions</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Trials</span>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">14-Day Free</span>
          </div>
          <p className="text-3xl font-black text-slate-900 font-mono">16 Venues</p>
          <p className="text-xs text-slate-400 mt-1">85% Trial Conversion Rate</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Overdue Invoices</span>
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Action Needed</span>
          </div>
          <p className="text-3xl font-black text-red-600 font-mono">₹999</p>
          <p className="text-xs text-slate-400 mt-1">1 Overdue Account</p>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search restaurant..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            {['ALL', 'ACTIVE', 'TRIAL', 'OVERDUE'].map((st) => (
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
                <th className="pb-3 text-left font-semibold">Subscription Plan</th>
                <th className="pb-3 text-right font-semibold">Rate</th>
                <th className="pb-3 text-center font-semibold">Next Invoice</th>
                <th className="pb-3 text-center font-semibold">Status</th>
                <th className="pb-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 font-bold text-slate-900 text-xs">{sub.restaurantName}</td>
                  <td className="py-4 text-xs font-semibold text-slate-600">{sub.plan} ({sub.billingCycle})</td>
                  <td className="py-4 text-right font-mono font-bold text-slate-900 text-xs">{sub.amount}</td>
                  <td className="py-4 text-center font-mono text-slate-500 text-xs">{sub.nextBilling}</td>
                  <td className="py-4 text-center">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                        sub.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : sub.status === 'TRIAL'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    {sub.status === 'OVERDUE' ? (
                      <button
                        onClick={() => handleRenew(sub.id)}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors"
                      >
                        Force Renew
                      </button>
                    ) : (
                      <button className="text-primary text-xs font-bold hover:underline">Manage</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
