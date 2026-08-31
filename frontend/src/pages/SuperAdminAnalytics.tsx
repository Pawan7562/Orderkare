import { useState } from 'react';
import { BarChart3, TrendingUp, Globe, Building2, ShoppingBag, ArrowUpRight } from 'lucide-react';

export const SuperAdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('month');

  const topVenues = [
    { name: 'Grand Sapphire Hotel', city: 'Mumbai', orders: 3890, mrr: '₹4,999', share: '32%' },
    { name: 'Spice Route Express', city: 'Bengaluru', orders: 2100, mrr: '₹1,999', share: '24%' },
    { name: 'Royal Palace Fine Dining', city: 'Noida', orders: 1420, mrr: '₹1,999', share: '18%' },
    { name: 'Oceanic Heights Resort', city: 'Goa', orders: 890, mrr: '₹1,999', share: '14%' },
  ];

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Platform Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">Cross-tenant platform metrics, order volumes, and MRR growth</p>
        </div>
        <div className="flex bg-white border border-slate-200 p-1 rounded-2xl shadow-xs">
          {(['today', 'week', 'month'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                timeRange === t ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Gross Platform Revenue</p>
          <p className="text-3xl font-black text-slate-900 font-mono mt-2">₹14.8L</p>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-2">
            +24% vs last period
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Orders Processed</p>
          <p className="text-3xl font-black text-slate-900 font-mono mt-2">15,420</p>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-2">
            +18% order volume
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Avg Ticket Size</p>
          <p className="text-3xl font-black text-slate-900 font-mono mt-2">₹296</p>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-2">
            +22% digital QR boost
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Schema Nodes</p>
          <p className="text-3xl font-black text-slate-900 font-mono mt-2">128</p>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-2">
            100% Schema Health
          </span>
        </div>
      </div>

      {/* Top Venues Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <h2 className="font-extrabold text-slate-900 text-base">Top Performing Venue Workspaces</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="pb-3 text-left font-semibold">Venue Name</th>
                <th className="pb-3 text-left font-semibold">City</th>
                <th className="pb-3 text-center font-semibold">Orders Processed</th>
                <th className="pb-3 text-right font-semibold">SaaS MRR</th>
                <th className="pb-3 text-right font-semibold">Platform Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topVenues.map((v, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 font-bold text-slate-900 text-xs">{v.name}</td>
                  <td className="py-4 text-xs text-slate-500">{v.city}</td>
                  <td className="py-4 text-center font-mono font-bold text-slate-800 text-xs">{v.orders.toLocaleString()}</td>
                  <td className="py-4 text-right font-mono font-bold text-slate-900 text-xs">{v.mrr}</td>
                  <td className="py-4 text-right">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full font-mono">
                      {v.share}
                    </span>
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
