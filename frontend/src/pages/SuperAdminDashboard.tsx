import { useEffect, useState, useMemo } from 'react';
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
  MapPin,
  Download,
  Copy,
  Check,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  Eye,
  AlertTriangle,
  X,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpDown,
  Lock,
  Unlock,
  Filter,
  Trash2,
  ChevronRight,
  Receipt,
  FileSpreadsheet,
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
  const [sortBy, setSortBy] = useState<'newest' | 'orders' | 'revenue' | 'name' | 'expiry'>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inspector & QR Modals state
  const [inspectHotel, setInspectHotel] = useState<HotelRecord | null>(null);
  const [qrModalHotel, setQrModalHotel] = useState<HotelRecord | null>(null);
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [confirmToggleHotel, setConfirmToggleHotel] = useState<HotelRecord | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [confirmDeleteHotel, setConfirmDeleteHotel] = useState<HotelRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
          pendingHotels:
            statsRes.data.stats.pendingHotels ??
            Math.max(0, (statsRes.data.stats.totalHotels || 0) - (statsRes.data.stats.activeSubscriptions || 0)),
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

  const handleToggleHotelStatus = async () => {
    if (!confirmToggleHotel) return;
    setIsToggling(true);
    try {
      const res = await api.put(`/admin/hotels/${confirmToggleHotel.id}/toggle`);
      if (res.data?.restaurant) {
        setHotels((prev) =>
          prev.map((h) =>
            h.id === confirmToggleHotel.id ? { ...h, isActive: res.data.restaurant.isActive } : h
          )
        );
        if (inspectHotel && inspectHotel.id === confirmToggleHotel.id) {
          setInspectHotel((prev) => prev ? { ...prev, isActive: res.data.restaurant.isActive } : null);
        }
        await fetchPlatformData();
        setConfirmToggleHotel(null);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to toggle hotel status');
    } finally {
      setIsToggling(false);
    }
  };

  const handleDeleteHotel = async () => {
    if (!confirmDeleteHotel) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/hotels/${confirmDeleteHotel.id}`);
      setHotels((prev) => prev.filter((h) => h.id !== confirmDeleteHotel.id));
      if (inspectHotel && inspectHotel.id === confirmDeleteHotel.id) {
        setInspectHotel(null);
      }
      await fetchPlatformData();
      setConfirmDeleteHotel(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete hotel');
    } finally {
      setIsDeleting(false);
    }
  };

  const copyMenuLink = (slug: string) => {
    const url = `${window.location.origin}/menu/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
  };

  const exportCSV = () => {
    if (!hotels.length) return;
    const headers = [
      'ID',
      'Venue Name',
      'Slug',
      'Admin Name',
      'Admin Email',
      'Phone',
      'Address',
      'License Status',
      'Plan',
      'Amount Paid (INR)',
      'Payment Reference',
      'Valid Until',
      'Orders Processed',
      'Total GMV (INR)',
      'Account Active',
      'Joined Date',
    ];

    const rows = hotels.map((h) => [
      `"${h.id}"`,
      `"${h.name.replace(/"/g, '""')}"`,
      `"${h.slug}"`,
      `"${h.adminName.replace(/"/g, '""')}"`,
      `"${h.adminEmail}"`,
      `"${h.phone || ''}"`,
      `"${(h.address || '').replace(/"/g, '""')}"`,
      `"${h.status}"`,
      `"${h.plan}"`,
      h.amountPaid,
      `"${h.paymentReference || ''}"`,
      `"${h.validUntil ? new Date(h.validUntil).toISOString() : ''}"`,
      h.ordersCount,
      h.revenue,
      h.isActive ? 'Active' : 'Suspended',
      `"${new Date(h.joinedDate).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `OrderKare_Venues_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Sort Logic
  const filteredHotels = useMemo(() => {
    return hotels
      .filter((h) => {
        const query = search.toLowerCase();
        const matchesSearch =
          !search ||
          h.name.toLowerCase().includes(query) ||
          h.adminEmail.toLowerCase().includes(query) ||
          h.adminName.toLowerCase().includes(query) ||
          h.slug.toLowerCase().includes(query) ||
          h.phone.toLowerCase().includes(query) ||
          h.address.toLowerCase().includes(query);

        const matchesStatus =
          filterStatus === 'ALL' ||
          (filterStatus === 'ACTIVE' && (h.status === 'ACTIVE' || h.status === 'TRIAL')) ||
          (filterStatus === 'PENDING' && h.status === 'PENDING') ||
          (filterStatus === 'EXPIRED' && h.status === 'EXPIRED') ||
          (filterStatus === 'SUSPENDED' && !h.isActive);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
        if (sortBy === 'orders') return b.ordersCount - a.ordersCount;
        if (sortBy === 'revenue') return b.revenue - a.revenue;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'expiry') {
          if (!a.validUntil) return 1;
          if (!b.validUntil) return -1;
          return new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime();
        }
        return 0;
      });
  }, [hotels, search, filterStatus, sortBy]);

  const activeCount = useMemo(() => hotels.filter((h) => h.status === 'ACTIVE' || h.status === 'TRIAL').length, [hotels]);
  const pendingCount = useMemo(() => hotels.filter((h) => h.status === 'PENDING').length, [hotels]);
  const expiredCount = useMemo(() => hotels.filter((h) => h.status === 'EXPIRED').length, [hotels]);
  const suspendedCount = useMemo(() => hotels.filter((h) => !h.isActive).length, [hotels]);

  const statCards = [
    {
      label: 'Registered Venues',
      value: String(stats?.totalHotels ?? 0),
      subtext: `+${stats?.newThisMonth ?? 0} new this month`,
      icon: Building2,
      color: 'text-orange-600 dark:text-orange-400',
      badgeBg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200/80 dark:border-orange-900/40',
      barColor: 'from-orange-500 to-rose-500',
    },
    {
      label: 'Active Licenses',
      value: String(activeCount),
      subtext: 'Paid & verified active venues',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-900/40',
      barColor: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'Pending Activations',
      value: String(pendingCount),
      subtext: 'Awaiting initial plan unlock',
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-900/40',
      barColor: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Expired Subscriptions',
      value: String(expiredCount),
      subtext: 'Licenses ended or lapsed',
      icon: XCircle,
      color: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/40',
      barColor: 'from-rose-500 to-pink-500',
    },
    {
      label: 'Platform Revenue',
      value: `₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`,
      subtext: 'Total verified subscription MRR',
      icon: BarChart3,
      color: 'text-violet-600 dark:text-violet-400',
      badgeBg: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200/80 dark:border-violet-900/40',
      barColor: 'from-violet-500 to-purple-500',
    },
    {
      label: 'Platform Orders',
      value: (stats?.totalOrders ?? 0).toLocaleString('en-IN'),
      subtext: 'Total orders placed via QR menus',
      icon: ShoppingBag,
      color: 'text-blue-600 dark:text-blue-400',
      badgeBg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-900/40',
      barColor: 'from-blue-500 to-cyan-500',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 font-sans antialiased animate-pulse max-w-7xl mx-auto pb-12">
        <div className="h-28 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs" />
          ))}
        </div>
        <div className="h-[450px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans antialiased text-slate-800 dark:text-slate-200 max-w-7xl mx-auto pb-12 transition-colors duration-300">
      
      {/* ── Executive Top Header Banner (Matches Landing Page Aesthetics) ── */}
      <div className="relative bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-orange-500/10 dark:bg-orange-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-rose-500/10 dark:bg-rose-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/40 text-orange-600 dark:text-orange-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Super Admin Directory</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Platform Control</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Restaurant Partner Directory
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Monitor active restaurant licenses, inspect venue turnover, configure customer QR ordering access, and manage accounts.
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
              onClick={fetchPlatformData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-orange-500/25 active:scale-95 cursor-pointer disabled:opacity-60"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
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
          <button onClick={fetchPlatformData} className="underline font-bold hover:text-rose-900 dark:hover:text-rose-300 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* ── 6 KPI Metric Overview Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${stat.badgeBg} ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className={`h-1.5 w-7 rounded-full bg-gradient-to-r ${stat.barColor}`} />
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">{stat.value}</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 leading-tight">{stat.label}</p>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium leading-tight">{stat.subtext}</p>
            </motion.div>
          );
        })}
      </div>

      {/* ── Search, Filters, Sorter & View Switcher Toolbar ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by venue name, slug, email, phone or address..."
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

          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 px-3 py-1.5 rounded-2xl">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="newest" className="dark:bg-slate-900">Newest Joined</option>
                <option value="orders" className="dark:bg-slate-900">Orders (High to Low)</option>
                <option value="revenue" className="dark:bg-slate-900">Turnover (GMV)</option>
                <option value="name" className="dark:bg-slate-900">Name (A-Z)</option>
                <option value="expiry" className="dark:bg-slate-900">Expiring Soonest</option>
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1 border border-slate-200/60 dark:border-slate-700">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {[
            { id: 'ALL', label: 'All Venues', count: hotels.length },
            { id: 'ACTIVE', label: 'Active & Licensed', count: activeCount, color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' },
            { id: 'PENDING', label: 'Pending Activation', count: pendingCount, color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' },
            { id: 'EXPIRED', label: 'Expired', count: expiredCount, color: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40' },
            { id: 'SUSPENDED', label: 'Suspended', count: suspendedCount, color: 'text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-800' },
          ].map((tab) => {
            const isSelected = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
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
            Showing <strong className="text-slate-700 dark:text-slate-200">{filteredHotels.length}</strong> of {hotels.length} venues
          </div>
        </div>
      </div>

      {/* ── VIEW 1: HIGH-DENSITY PROFESSIONAL DATA TABLE ── */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                  <th className="py-3.5 px-5">Venue & Slug</th>
                  <th className="py-3.5 px-5">Admin Contact</th>
                  <th className="py-3.5 px-5">Subscription Tier</th>
                  <th className="py-3.5 px-5 text-center">Orders</th>
                  <th className="py-3.5 px-5 text-right">Turnover (GMV)</th>
                  <th className="py-3.5 px-5 text-center">License Status</th>
                  <th className="py-3.5 px-5 text-center">QR Ordering</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {filteredHotels.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-slate-400 dark:text-slate-500 font-medium">
                      <Building2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="font-bold text-slate-600 dark:text-slate-300">No venues match your current filters</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Try clearing your search query or switching filter tabs.</p>
                      <button
                        onClick={() => {
                          setSearch('');
                          setFilterStatus('ALL');
                        }}
                        className="mt-3 px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredHotels.map((hotel) => {
                    const isTrial = hotel.status === 'TRIAL' || hotel.amountPaid === 1;
                    const isActive = hotel.status === 'ACTIVE' || hotel.status === 'TRIAL';
                    const initial = hotel.name ? hotel.name.charAt(0).toUpperCase() : 'V';

                    return (
                      <tr
                        key={hotel.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        onClick={() => setInspectHotel(hotel)}
                      >
                        {/* 1. Venue Brand & Slug */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500/10 to-rose-500/15 text-orange-600 dark:text-orange-400 font-black text-sm flex items-center justify-center border border-orange-500/20 shrink-0 shadow-2xs">
                              {initial}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <p className="font-extrabold text-slate-900 dark:text-white text-xs group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate max-w-[200px]">
                                {hotel.name}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                <span>/{hotel.slug}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyMenuLink(hotel.slug);
                                  }}
                                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                  title="Copy menu URL"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                </button>
                              </div>
                              {hotel.address && (
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[220px] flex items-center gap-1">
                                  <MapPin className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                                  <span>{hotel.address}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 2. Admin Details */}
                        <td className="py-4 px-5">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{hotel.adminName}</span>
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                              <Mail className="w-2.5 h-2.5 text-slate-400" />
                              <span>{hotel.adminEmail}</span>
                            </p>
                            {hotel.phone && (
                              <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5 text-slate-400" />
                                <span>{hotel.phone}</span>
                              </p>
                            )}
                          </div>
                        </td>

                        {/* 3. Subscription & Plan */}
                        <td className="py-4 px-5">
                          <div className="space-y-1">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border ${
                                isTrial
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/40'
                                  : hotel.plan === 'ANNUAL'
                                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900/40'
                                  : hotel.plan === 'SIX_MONTHS'
                                  ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-900/40'
                                  : hotel.plan === 'MONTHLY'
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900/40'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {hotel.plan}
                            </span>
                            {hotel.amountPaid > 0 && (
                              <p className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                Paid: ₹{hotel.amountPaid.toLocaleString('en-IN')}
                              </p>
                            )}
                            {hotel.validUntil && (
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                                Valid: {new Date(hotel.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* 4. Orders Count */}
                        <td className="py-4 px-5 text-center">
                          <span className="font-mono font-black text-slate-800 dark:text-slate-200 text-xs bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700">
                            {hotel.ordersCount.toLocaleString()}
                          </span>
                        </td>

                        {/* 5. Turnover GMV */}
                        <td className="py-4 px-5 text-right font-mono font-bold text-slate-900 dark:text-white text-xs">
                          ₹{hotel.revenue.toLocaleString('en-IN')}
                        </td>

                        {/* 6. License Status Pill */}
                        <td className="py-4 px-5 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                              hotel.status === 'ACTIVE'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40'
                                : hotel.status === 'TRIAL'
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'
                                : hotel.status === 'EXPIRED'
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                              }`}
                            />
                            {hotel.status}
                          </span>
                        </td>

                        {/* 7. QR Ordering Access */}
                        <td className="py-4 px-5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                              hotel.qrAllowed
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <QrCode className="w-3 h-3" />
                            <span>{hotel.qrAllowed ? 'Unlocked' : 'Locked'}</span>
                          </span>
                        </td>

                        {/* 8. Actions Toolbar */}
                        <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Standee QR Modal */}
                            <button
                              type="button"
                              onClick={() => setQrModalHotel(hotel)}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 rounded-xl transition-all cursor-pointer border border-transparent hover:border-orange-200 dark:hover:border-orange-900/40"
                              title="Show Master QR Standee"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>

                            {/* Public Digital Menu Link */}
                            <a
                              href={`/menu/${hotel.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all cursor-pointer"
                              title="Preview Customer Menu"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>

                            {/* View Full Telemetry Drawer */}
                            <button
                              type="button"
                              onClick={() => setInspectHotel(hotel)}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all cursor-pointer"
                              title="Inspect Venue Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Suspend / Activate Toggle */}
                            <button
                              type="button"
                              onClick={() => setConfirmToggleHotel(hotel)}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer ${
                                hotel.isActive
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-900/40'
                                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-900/40'
                              }`}
                            >
                              {hotel.isActive ? 'Suspend' : 'Activate'}
                            </button>

                            {/* Delete Hotel Button */}
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteHotel(hotel)}
                              className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 rounded-xl transition-all cursor-pointer"
                              title="Delete Venue"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
      )}

      {/* ── VIEW 2: VISUAL ENTERPRISE CARDS GRID ── */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHotels.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
              <Building2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="font-bold text-slate-600 dark:text-slate-300">No venues found</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Try modifying your search query or switching filters.</p>
            </div>
          ) : (
            filteredHotels.map((hotel) => {
              const isTrial = hotel.status === 'TRIAL' || hotel.amountPaid === 1;
              const isActive = hotel.status === 'ACTIVE' || hotel.status === 'TRIAL';
              const initial = hotel.name ? hotel.name.charAt(0).toUpperCase() : 'V';

              return (
                <motion.div
                  key={hotel.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden group"
                >
                  {/* Card Header */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/10 to-rose-500/15 text-orange-600 dark:text-orange-400 font-black text-base flex items-center justify-center border border-orange-500/20 shrink-0 shadow-2xs">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                            {hotel.name}
                          </h3>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                            <span>/{hotel.slug}</span>
                            <button
                              type="button"
                              onClick={() => copyMenuLink(hotel.slug)}
                              className="hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                              title="Copy menu URL"
                            >
                              <Copy className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 border ${
                          hotel.status === 'ACTIVE'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40'
                            : hotel.status === 'TRIAL'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'
                            : hotel.status === 'EXPIRED'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        {hotel.status}
                      </span>
                    </div>

                    {/* Admin snippet */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 rounded-2xl p-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {hotel.adminName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          Joined {new Date(hotel.joinedDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate flex items-center gap-1">
                        <Mail className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        <span>{hotel.adminEmail}</span>
                      </p>
                      {hotel.phone && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span>{hotel.phone}</span>
                        </p>
                      )}
                    </div>

                    {/* Stats Pill */}
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2 border border-slate-100 dark:border-slate-700/60">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Plan</p>
                        <p className="text-xs font-black text-slate-900 dark:text-white font-mono truncate">{hotel.plan}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2 border border-slate-100 dark:border-slate-700/60">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Orders</p>
                        <p className="text-xs font-black text-slate-900 dark:text-white font-mono">{hotel.ordersCount}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2 border border-slate-100 dark:border-slate-700/60">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Turnover</p>
                        <p className="text-xs font-black text-slate-900 dark:text-white font-mono truncate">₹{hotel.revenue.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setQrModalHotel(hotel)}
                        className="p-2 bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 border border-slate-200/80 dark:border-slate-700 rounded-xl transition-all shadow-2xs cursor-pointer"
                        title="Show Master QR Standee"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={`/menu/${hotel.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-700 rounded-xl transition-all shadow-2xs cursor-pointer"
                        title="Open Customer Menu"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => setInspectHotel(hotel)}
                        className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-700 rounded-xl transition-all shadow-2xs cursor-pointer"
                        title="Inspect Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setConfirmToggleHotel(hotel)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          hotel.isActive
                            ? 'bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40'
                            : 'bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40'
                        }`}
                      >
                        {hotel.isActive ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteHotel(hotel)}
                        className="p-1.5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 rounded-xl transition-all cursor-pointer"
                        title="Delete Venue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* ── MODAL 1: VENUE INSPECTION TELEMETRY DRAWER ── */}
      <AnimatePresence>
        {inspectHotel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectHotel(null)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden z-10 my-8 border border-slate-200/80 dark:border-slate-800 transition-colors"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white relative">
                <button
                  onClick={() => setInspectHotel(null)}
                  className="absolute right-5 top-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-orange-500/20">
                    {inspectHotel.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">{inspectHotel.name}</h3>
                    <p className="text-xs text-slate-300 font-mono">
                      Slug: /{inspectHotel.slug} • Account ID: {inspectHotel.id.slice(0, 12)}...
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* 1. Account Status Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 p-3 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">License</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5">{inspectHotel.status}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 p-3 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Plan Tier</p>
                    <p className="text-xs font-black text-orange-600 dark:text-orange-400 mt-0.5">{inspectHotel.plan}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 p-3 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Amount Paid</p>
                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">₹{inspectHotel.amountPaid}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 p-3 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">QR Lock</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
                      {inspectHotel.qrAllowed ? 'Unlocked' : 'Locked'}
                    </p>
                  </div>
                </div>

                {/* 2. Registered Administrator Contact */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    Registered Restaurant Admin
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Admin Name:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{inspectHotel.adminName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Email Address:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{inspectHotel.adminEmail}</span>
                    </div>
                    {inspectHotel.phone && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Phone Number:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{inspectHotel.phone}</span>
                      </div>
                    )}
                    {inspectHotel.address && (
                      <div className="flex justify-between items-start">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Physical Address:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 text-right max-w-xs">{inspectHotel.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Subscription & Payment Audit */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    Subscription & Payment Audit
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl p-4 space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">Payment Reference / UTR:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{inspectHotel.paymentReference || 'None (Unpaid)'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">Valid Until:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {inspectHotel.validUntil
                          ? new Date(inspectHotel.validUntil).toLocaleString('en-IN')
                          : 'No active validity date'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 font-sans">Registered Date:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {new Date(inspectHotel.joinedDate).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Dining Activity */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    Customer Dining Activity
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-4 bg-orange-50/60 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/40 rounded-2xl">
                      <p className="text-xs text-orange-800 dark:text-orange-300 font-bold">Total Customer Orders</p>
                      <p className="text-2xl font-black text-orange-950 dark:text-orange-200 font-mono mt-1">
                        {inspectHotel.ordersCount.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl">
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">Total GMV Turnover</p>
                      <p className="text-2xl font-black text-emerald-950 dark:text-emerald-200 font-mono mt-1">
                        ₹{inspectHotel.revenue.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <a
                  href={`/menu/${inspectHotel.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Live Menu</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const target = inspectHotel;
                      setInspectHotel(null);
                      setQrModalHotel(target);
                    }}
                    className="px-4 py-2.5 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900/40 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    View Standee QR
                  </button>
                  <button
                    onClick={() => {
                      const target = inspectHotel;
                      setInspectHotel(null);
                      setConfirmToggleHotel(target);
                    }}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      inspectHotel.isActive
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {inspectHotel.isActive ? 'Suspend Venue' : 'Activate Venue'}
                  </button>
                  <button
                    onClick={() => {
                      const target = inspectHotel;
                      setInspectHotel(null);
                      setConfirmDeleteHotel(target);
                    }}
                    className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    title="Permanently Delete Venue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 2: STANDEE QR CODE PREVIEW MODAL ── */}
      <AnimatePresence>
        {qrModalHotel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQrModalHotel(null)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden z-10 border border-slate-200/80 dark:border-slate-800 text-center p-6 space-y-5 transition-colors"
            >
              <button
                onClick={() => setQrModalHotel(null)}
                className="absolute right-4 top-4 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="space-y-1 pt-2">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-orange-900/40 inline-block">
                  Universal Master Standee QR
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{qrModalHotel.name}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">/{qrModalHotel.slug}</p>
              </div>

              {/* QR Code Container (Keep high-contrast white background so phones can scan reliably) */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 dark:border-slate-700 inline-block shadow-inner mx-auto">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                    `${window.location.origin}/menu/${qrModalHotel.slug}`
                  )}`}
                  alt={`${qrModalHotel.name} QR Code`}
                  className="w-48 h-48 rounded-xl object-contain mx-auto"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700 font-mono text-[11px] truncate">
                  <span className="truncate">{`${window.location.origin}/menu/${qrModalHotel.slug}`}</span>
                  <button
                    onClick={() => copyMenuLink(qrModalHotel.slug)}
                    className="text-orange-600 dark:text-orange-400 font-bold hover:underline shrink-0 cursor-pointer"
                  >
                    {copiedSlug ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(
                    `${window.location.origin}/menu/${qrModalHotel.slug}`
                  )}`}
                  download={`${qrModalHotel.slug}-master-qr.png`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download High-Res Standee QR</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 3: CONFIRM SUSPEND / ACTIVATE ── */}
      <AnimatePresence>
        {confirmToggleHotel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isToggling && setConfirmToggleHotel(null)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden z-10 border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 text-center transition-colors"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                  confirmToggleHotel.isActive
                    ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                    : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {confirmToggleHotel.isActive ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {confirmToggleHotel.isActive ? 'Suspend Venue Account?' : 'Reactivate Venue Account?'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  {confirmToggleHotel.isActive
                    ? `Suspending "${confirmToggleHotel.name}" will temporarily pause customer QR ordering and disable venue staff access.`
                    : `Reactivating "${confirmToggleHotel.name}" will immediately restore menu ordering and staff portal access.`}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isToggling}
                  onClick={() => setConfirmToggleHotel(null)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isToggling}
                  onClick={handleToggleHotelStatus}
                  className={`flex-1 py-3 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer ${
                    confirmToggleHotel.isActive
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  }`}
                >
                  {isToggling ? 'Updating...' : confirmToggleHotel.isActive ? 'Yes, Suspend' : 'Yes, Reactivate'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 4: CONFIRM PERMANENT DELETE ── */}
      <AnimatePresence>
        {confirmDeleteHotel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setConfirmDeleteHotel(null)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden z-10 border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 text-center transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Delete "{confirmDeleteHotel.name}"?
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold max-w-xs mx-auto">
                  This action is permanent and cannot be undone.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  This will permanently remove the restaurant, associated admin accounts, categories, dishes, orders, tables, and subscription records.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setConfirmDeleteHotel(null)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteHotel}
                  className="flex-1 py-3 text-white font-black text-xs rounded-xl transition-all shadow-md bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 cursor-pointer"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
