import { useEffect, useState } from 'react';
import api from '../lib/api';
import {
  Building2,
  CreditCard,
  BarChart3,
  ShoppingBag,
  ArrowUpRight,
  Search,
  RefreshCcw,
  ExternalLink,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  Clock,
  XCircle,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PlatformStats {
  totalHotels: number;
  activeHotels: number;
  inactiveHotels: number;
  pendingHotels: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalOrders: number;
  newThisMonth: number;
  expiredSubscriptions: number;
}

interface HotelRecord {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  adminName: string;
  adminEmail: string;
  isActive: boolean;
  qrAllowed: boolean;
  plan: string;
  ordersCount: number;
  revenue: number;
  status: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'PENDING';
  amountPaid: number;
  validUntil: string | null;
  paymentReference: string;
  joinedDate: string;
}

export const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<PlatformStats>({
    totalHotels: 0,
    activeHotels: 0,
    inactiveHotels: 0,
    pendingHotels: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    totalOrders: 0,
    newThisMonth: 0,
    expiredSubscriptions: 0,
  });
  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlatformData = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const [statsRes, hotelsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/hotels'),
      ]);

      if (statsRes.data?.stats) {
        setStats((prev) => ({
          ...prev,
          ...statsRes.data.stats,
          activeHotels: statsRes.data.stats.activeHotels ?? statsRes.data.stats.activeSubscriptions ?? 0,
          inactiveHotels: statsRes.data.stats.inactiveHotels ?? statsRes.data.stats.expiredSubscriptions ?? 0,
          pendingHotels: statsRes.data.stats.pendingHotels ?? Math.max(0, (statsRes.data.stats.totalHotels || 0) - (statsRes.data.stats.activeSubscriptions || 0)),
        }));
      }
      if (hotelsRes.data?.hotels) {
        setHotels(hotelsRes.data.hotels);
      }
    } catch (err: any) {
      console.error('Failed to load Super Admin dashboard data:', err);
      setError(err?.response?.data?.message || 'Failed to fetch platform data from server.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const handleToggleHotelStatus = async (id: string) => {
    try {
      const res = await api.put(`/admin/hotels/${id}/toggle`);
      if (res.data?.restaurant) {
        setHotels((prev) =>
          prev.map((h) =>
            h.id === id ? { ...h, isActive: res.data.restaurant.isActive } : h
          )
        );
        fetchPlatformData();
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to toggle hotel status');
    }
  };

  const filteredHotels = hotels.filter((h) => {
    const matchesSearch =
      !search ||
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.adminEmail.toLowerCase().includes(search.toLowerCase()) ||
      h.adminName.toLowerCase().includes(search.toLowerCase()) ||
      h.slug.toLowerCase().includes(search.toLowerCase()) ||
      h.address.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'ACTIVE' && h.status === 'ACTIVE') ||
      (filterStatus === 'TRIAL' && h.status === 'TRIAL') ||
      (filterStatus === 'EXPIRED' && h.status === 'EXPIRED') ||
      (filterStatus === 'PENDING' && h.status === 'PENDING') ||
      (filterStatus === 'SUSPENDED' && !h.isActive);

    return matchesSearch && matchesStatus;
  });

  const statCards = [
    {
      label: 'Total Registered Venues',
      value: String(stats?.totalHotels ?? 0),
      subtext: `${stats?.newThisMonth ?? 0} registered this month`,
      icon: Building2,
      color: 'bg-primary/10 text-primary border border-primary/20',
    },
    {
      label: 'Active Accounts (Licensed)',
      value: String(stats?.activeHotels ?? stats?.activeSubscriptions ?? 0),
      subtext: 'Valid paid QR licenses',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    },
    {
      label: 'Pending ₹1 Activation',
      value: String(stats?.pendingHotels ?? 0),
      subtext: 'Registered, awaiting unlock',
      icon: Clock,
      color: 'bg-amber-50 text-amber-700 border border-amber-200',
    },
    {
      label: 'Inactive / Expired',
      value: String(stats?.inactiveHotels ?? stats?.expiredSubscriptions ?? 0),
      subtext: 'Expired subscription or paused',
      icon: XCircle,
      color: 'bg-rose-50 text-rose-700 border border-rose-200',
    },
    {
      label: 'Total Invoiced Revenue',
      value: `₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`,
      subtext: 'Real verified subscription receipts',
      icon: BarChart3,
      color: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    },
    {
      label: 'Customer Orders Processed',
      value: (stats?.totalOrders ?? 0).toLocaleString('en-IN'),
      subtext: 'Across all restaurant menus',
      icon: ShoppingBag,
      color: 'bg-blue-50 text-blue-700 border border-blue-200',
    },
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 font-sans">
        <div className="h-8 w-64 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs" />
          ))}
        </div>
        <div className="h-96 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs" />
      </div>
    );
  }

  return (
    <div className="space-y-7 font-sans antialiased text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Production Database
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Platform Control Center</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
            Live multi-tenant restaurant directory and real-time subscription management
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchPlatformData}
            disabled={isRefreshing}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all disabled:opacity-50 shadow-xs active:scale-98"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Live'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-700 flex items-center justify-between shadow-2xs">
          <span>{error}</span>
          <button onClick={fetchPlatformData} className="underline font-bold hover:text-red-900">Retry</button>
        </div>
      )}

      {/* 6 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight font-mono">{stat.value}</p>
              <p className="text-[11px] text-slate-600 font-bold mt-1 leading-tight">{stat.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-tight">{stat.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Hotel Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-slate-900 text-base">Registered Venues & Admin Directory ({hotels.length})</h2>
            <p className="text-xs text-slate-400 font-medium">Genuine registered accounts from PostgreSQL database</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search hotel, admin or email..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              {['ALL', 'ACTIVE', 'TRIAL', 'PENDING', 'EXPIRED', 'SUSPENDED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    filterStatus === st ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
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
                <th className="pb-3 text-left font-semibold">Venue / Restaurant</th>
                <th className="pb-3 text-left font-semibold">Registered Admin</th>
                <th className="pb-3 text-left font-semibold">Plan & Amount</th>
                <th className="pb-3 text-center font-semibold">Orders</th>
                <th className="pb-3 text-right font-semibold">Turnover</th>
                <th className="pb-3 text-center font-semibold">Subscription</th>
                <th className="pb-3 text-center font-semibold">QR Access</th>
                <th className="pb-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHotels.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs font-medium">
                    {search ? 'No venues match your search query.' : 'No registered restaurants found in database.'}
                  </td>
                </tr>
              ) : (
                filteredHotels.map((hotel) => (
                  <tr key={hotel.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Hotel Name & Slug */}
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm border border-primary/20 shrink-0">
                          {hotel.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{hotel.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {hotel.slug}
                          </p>
                          {hotel.address && (
                            <p className="text-[10px] text-slate-500 truncate max-w-xs">{hotel.address}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Admin Details */}
                    <td className="py-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800">{hotel.adminName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{hotel.adminEmail}</p>
                        {hotel.phone && (
                          <p className="text-[9px] text-slate-400 font-mono">📞 {hotel.phone}</p>
                        )}
                      </div>
                    </td>

                    {/* Plan & Amount */}
                    <td className="py-4">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 inline-block">
                          {hotel.plan}
                        </span>
                        {hotel.amountPaid > 0 && (
                          <p className="text-[10px] font-mono font-bold text-emerald-600">
                            Paid: ₹{hotel.amountPaid}
                          </p>
                        )}
                        {hotel.validUntil && (
                          <p className="text-[9px] text-slate-400 font-mono">
                            Exp: {new Date(hotel.validUntil).toLocaleDateString('en-IN')}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Orders Count */}
                    <td className="py-4 text-center font-mono font-bold text-slate-800 text-xs">
                      {hotel.ordersCount.toLocaleString()}
                    </td>

                    {/* Turnover */}
                    <td className="py-4 text-right font-mono font-bold text-slate-900 text-xs">
                      ₹{hotel.revenue.toLocaleString('en-IN')}
                    </td>

                    {/* Subscription Status */}
                    <td className="py-4 text-center">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          hotel.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : hotel.status === 'TRIAL'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : hotel.status === 'EXPIRED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {hotel.status}
                      </span>
                    </td>

                    {/* QR Access Status */}
                    <td className="py-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          hotel.qrAllowed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <QrCode className="w-3 h-3" />
                        {hotel.qrAllowed ? 'Active' : 'Locked'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 text-right space-x-2">
                      <a
                        href={`/menu/${hotel.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex text-slate-600 text-xs transition-colors"
                        title="Preview Public QR Menu"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleToggleHotelStatus(hotel.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          hotel.isActive
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {hotel.isActive ? 'Suspend' : 'Activate'}
                      </button>
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
