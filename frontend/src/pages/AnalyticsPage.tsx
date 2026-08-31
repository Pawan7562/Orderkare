import { useState } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, Award, ArrowUpRight } from 'lucide-react';

export const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  const stats = {
    today: { sales: '₹12,450', orders: 42, avgTicket: '₹296', active: 12 },
    week: { sales: '₹98,760', orders: 340, avgTicket: '₹290', active: 15 },
    month: { sales: '₹4,12,500', orders: 1420, avgTicket: '₹290', active: 18 },
  }[timeRange];

  const popularItems = [
    { name: 'Paneer Tikka', orders: 124, revenue: '₹27,280', percentage: '38%' },
    { name: 'Butter Chicken', orders: 98, revenue: '₹33,320', percentage: '30%' },
    { name: 'Dal Makhani', orders: 84, revenue: '₹21,840', percentage: '21%' },
    { name: 'Crispy Spring Rolls', orders: 42, revenue: '₹7,560', percentage: '11%' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 text-sm">Review revenue trends, dish performance, and order volume metrics</p>
        </div>
        
        {/* Time Selector */}
        <div className="bg-white border border-slate-200 p-1 rounded-xl flex">
          {['today', 'week', 'month'].map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                timeRange === r ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Revenue', value: stats.sales, icon: DollarSign, color: 'bg-primary/10 text-primary' },
          { label: 'Orders Completed', value: stats.orders, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
          { label: 'Average Ticket Size', value: stats.avgTicket, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Top Performing Category', value: 'Starters', icon: Award, color: 'bg-amber-50 text-amber-600' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-xs font-semibold text-slate-500">{card.label}</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{card.value}</p>
              <span className="text-[10px] text-slate-400 mt-1 block flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3 text-emerald-500" /> +12.3% from previous period
              </span>
            </div>
          );
        })}
      </div>

      {/* Charts Section Mockup */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Revenue Analysis</h3>
            <span className="text-[10px] text-slate-400">Values in INR (₹)</span>
          </div>
          {/* Simple Chart SVG Rendering */}
          <div className="relative h-60 flex items-end space-x-3.5 pt-8">
            {[40, 55, 48, 65, 80, 75, 95].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center group cursor-pointer">
                <div className="relative w-full">
                  <div
                    className="w-full bg-primary/20 hover:bg-primary/95 group-hover:scale-y-105 rounded-t-xl transition-all duration-300"
                    style={{ height: `${val * 2}px` }}
                  />
                  {/* Tooltip on hover */}
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[9px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ₹{(val * 200).toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-2 font-mono">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Items */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide mb-6">Popular Food Items</h3>
          <div className="space-y-4.5 flex-1 flex flex-col justify-between">
            {popularItems.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800">{item.name}</span>
                  <span className="text-slate-400">{item.orders} orders</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: item.percentage }} />
                  </div>
                  <span className="text-[10px] text-slate-900 font-bold w-9 text-right">{item.revenue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
