import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Building2, CreditCard, BarChart3, ShoppingBag, ArrowUpRight, Plus, Search, Filter, CheckCircle2, AlertTriangle, MoreVertical, ExternalLink, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlatformStats {
  totalHotels: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  totalOrders: number;
}

interface HotelRecord {
  id: string;
  name: string;
  slug: string;
  city: string;
  plan: string;
  ordersCount: number;
  revenue: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  joinedDate: string;
}

export const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<PlatformStats>({
    totalHotels: 128, activeSubscriptions: 112, monthlyRevenue: 240000, totalOrders: 15420
  });
  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHotelName, setNewHotelName] = useState('');
  const [newHotelCity, setNewHotelCity] = useState('');
  const [newHotelPlan, setNewHotelPlan] = useState('PRO');

  const fetchPlatformData = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data?.stats) setStats(res.data.stats);
    } catch {
      // Fallback mock stats for offline testing
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformData();
    // Pre-populate realistic multi-tenant hotel directory
    setHotels([
      { id: '1', name: 'Royal Palace Fine Dining', slug: 'royal-palace', city: 'Noida', plan: 'PRO', ordersCount: 1420, revenue: '₹4,12,500', status: 'ACTIVE', joinedDate: 'Aug 12, 2026' },
      { id: '2', name: 'Grand Sapphire Hotel', slug: 'grand-sapphire', city: 'Mumbai', plan: 'ENTERPRISE', ordersCount: 3890, revenue: '₹12,40,000', status: 'ACTIVE', joinedDate: 'Jul 04, 2026' },
      { id: '3', name: 'Oceanic Heights Resort', slug: 'oceanic-heights', city: 'Goa', plan: 'PRO', ordersCount: 890, revenue: '₹2,80,000', status: 'ACTIVE', joinedDate: 'Sep 01, 2026' },
      { id: '4', name: 'The Courtyard Bistro', slug: 'courtyard-bistro', city: 'Delhi', plan: 'BASIC', ordersCount: 320, revenue: '₹95,000', status: 'PENDING', joinedDate: 'Aug 28, 2026' },
      { id: '5', name: 'Spice Route Express', slug: 'spice-route', city: 'Bengaluru', plan: 'PRO', ordersCount: 2100, revenue: '₹6,75,000', status: 'ACTIVE', joinedDate: 'Jun 19, 2026' },
      { id: '6', name: 'Urban Grill Lounge', slug: 'urban-grill', city: 'Pune', plan: 'BASIC', ordersCount: 0, revenue: '₹0', status: 'SUSPENDED', joinedDate: 'Aug 15, 2026' },
    ]);
  }, []);

  const handleToggleHotelStatus = (id: string) => {
    setHotels((prev) =>
      prev.map((h) =>
        h.id === id
          ? { ...h, status: h.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }
          : h
      )
    );
  };

  const handleAddHotel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHotelName.trim()) return;
    const newRecord: HotelRecord = {
      id: `h-${Date.now()}`,
      name: newHotelName,
      slug: newHotelName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      city: newHotelCity || 'Delhi NCR',
      plan: newHotelPlan,
      ordersCount: 0,
      revenue: '₹0',
      status: 'ACTIVE',
      joinedDate: 'Just Now',
    };
    setHotels([newRecord, ...hotels]);
    setNewHotelName('');
    setNewHotelCity('');
    setShowAddModal(false);
  };

  const filteredHotels = hotels.filter((h) => {
    const matchesSearch = !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.city.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || h.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statCards = [
    { label: 'Total Venues / Hotels', value: stats.totalHotels, icon: Building2, color: 'bg-primary/10 text-primary', trend: '+12%' },
    { label: 'Active SaaS Subscriptions', value: stats.activeSubscriptions, icon: CreditCard, color: 'bg-blue-50 text-blue-600', trend: '+8%' },
    { label: 'Monthly SaaS MRR', value: `₹${(stats.monthlyRevenue / 100000).toFixed(1)}L`, icon: BarChart3, color: 'bg-emerald-50 text-emerald-600', trend: '+18%' },
    { label: 'Platform Total Orders', value: stats.totalOrders.toLocaleString(), icon: ShoppingBag, color: 'bg-amber-50 text-amber-600', trend: '+24%' },
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Platform Control Center</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage global venue subscriptions, multi-tenant schemas, and system status</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchPlatformData}
            className="flex items-center space-x-2 bg-white text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Sync Stats</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-primary text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard New Venue</span>
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> {stat.trend}
                </span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{stat.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts & Registration Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Global Order Volume & Revenue</h2>
              <p className="text-xs text-slate-400">Monthly breakdown across all active tenant schemas</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-xl font-semibold">2026 YTD</span>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end space-x-3 h-52 pt-4">
            {[35, 45, 52, 60, 58, 68, 75, 82, 90, 95, 88, 100].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group">
                <div className="text-[9px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-mono">
                  {height}%
                </div>
                <div
                  className={`w-full rounded-t-xl transition-all duration-300 ${
                    i === 11 ? 'bg-primary' : 'bg-primary/25 hover:bg-primary/40'
                  }`}
                  style={{ height: `${height}%` }}
                />
                <span className="text-[10px] text-slate-400 mt-2 font-semibold">
                  {['J','F','M','A','M','J','J','A','S','O','N','D'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Server Health Status Widget */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 text-base">System Cluster Health</h2>
          <div className="space-y-3">
            {[
              { name: 'Multi-Tenant Database Engine', status: 'Operational', latency: '12ms', color: 'text-emerald-600 bg-emerald-50' },
              { name: 'WebSocket Real-Time Relay', status: 'Operational', latency: '4ms', color: 'text-emerald-600 bg-emerald-50' },
              { name: 'QR Code Resolution Gateway', status: 'Operational', latency: '18ms', color: 'text-emerald-600 bg-emerald-50' },
              { name: 'SaaS Invoicing API Engine', status: 'Operational', latency: '24ms', color: 'text-emerald-600 bg-emerald-50' },
            ].map((node, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-800">{node.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Latency: {node.latency}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${node.color}`}>
                  {node.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hotel Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Registered Venues Directory</h2>
            <p className="text-xs text-slate-400">Filter, inspect, and toggle venue subscription statuses</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search venue or city..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              {['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    filterStatus === st ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="pb-3 text-left font-semibold">Venue / Hotel</th>
                <th className="pb-3 text-left font-semibold">SaaS Plan</th>
                <th className="pb-3 text-center font-semibold">Orders</th>
                <th className="pb-3 text-right font-semibold">Revenue</th>
                <th className="pb-3 text-center font-semibold">Status</th>
                <th className="pb-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHotels.map((hotel) => (
                <tr key={hotel.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm border border-primary/20">
                        {hotel.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{hotel.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{hotel.city} • Joined {hotel.joinedDate}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                      {hotel.plan}
                    </span>
                  </td>
                  <td className="py-4 text-center font-mono font-bold text-slate-800 text-xs">
                    {hotel.ordersCount.toLocaleString()}
                  </td>
                  <td className="py-4 text-right font-mono font-bold text-slate-900 text-xs">
                    {hotel.revenue}
                  </td>
                  <td className="py-4 text-center">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                        hotel.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : hotel.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {hotel.status}
                    </span>
                  </td>
                  <td className="py-4 text-right space-x-2">
                    <a
                      href={`/menu/${hotel.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex text-slate-600 text-xs"
                      title="Preview QR Menu"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleToggleHotelStatus(hotel.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        hotel.status === 'ACTIVE'
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {hotel.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Hotel Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-extrabold text-slate-900 mb-1">Onboard New Restaurant Venue</h2>
              <p className="text-xs text-slate-400 mb-5">Manually provision a multi-tenant workspace schema</p>

              <form onSubmit={handleAddHotel} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Venue Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newHotelName}
                    onChange={(e) => setNewHotelName(e.target.value)}
                    placeholder="e.g. Saffron Grill & Lounge"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      City / Location
                    </label>
                    <input
                      type="text"
                      value={newHotelCity}
                      onChange={(e) => setNewHotelCity(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      SaaS Plan Tier
                    </label>
                    <select
                      value={newHotelPlan}
                      onChange={(e) => setNewHotelPlan(e.target.value)}
                      className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none"
                    >
                      <option value="BASIC">BASIC (₹999)</option>
                      <option value="PRO">PRO (₹1999)</option>
                      <option value="ENTERPRISE">ENTERPRISE (Custom)</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-white py-3 rounded-2xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                  >
                    Provision Venue Workspace
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
