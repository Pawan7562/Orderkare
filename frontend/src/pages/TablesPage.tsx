import React, { useState, useEffect, useMemo } from 'react';
import {
  QrCode,
  Download,
  X,
  Copy,
  CheckCircle2,
  Plus,
  ExternalLink,
  Trash2,
  Layers,
  Sparkles,
  Lock,
  ArrowRight,
  Printer,
  UtensilsCrossed,
  ShieldCheck,
  RefreshCw,
  Users,
  Search,
  Check,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { PaymentModal } from '../components/PaymentModal';

interface Table {
  id: string;
  number: string;
  capacity: number;
  status: 'FREE' | 'OCCUPIED' | 'DIRTY';
  currentOrderId?: string;
  customerName?: string;
}

export const TablesPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [tables, setTables] = useState<Table[]>(() => {
    try {
      const cached = localStorage.getItem('orderkare_tables_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [restaurant, setRestaurant] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('orderkare_restaurant');
      return cached ? JSON.parse(cached) : (user as any)?.restaurant || null;
    } catch {
      return (user as any)?.restaurant || null;
    }
  });

  const [subscription, setSubscription] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('orderkare_dash_sub');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FREE' | 'OCCUPIED' | 'DIRTY'>('ALL');

  // Add Table Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('4');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Activation Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchTables = async () => {
    setIsRefreshing(true);
    try {
      const [resTables, resMe, resSub] = await Promise.all([
        api.get('/tables'),
        api.get('/auth/me'),
        api.get('/subscriptions/status').catch(() => ({
          data: { isSubscribed: false, isFirstTime: true },
        })),
      ]);
      const fetchedTables = resTables.data?.tables || [];
      const fetchedRest = resMe.data?.user?.restaurant;
      const fetchedSub = resSub.data;

      setTables(fetchedTables);
      if (fetchedRest) setRestaurant(fetchedRest);
      if (fetchedSub) setSubscription(fetchedSub);

      try {
        localStorage.setItem('orderkare_tables_cache', JSON.stringify(fetchedTables));
        if (fetchedRest) localStorage.setItem('orderkare_restaurant', JSON.stringify(fetchedRest));
        if (fetchedSub) localStorage.setItem('orderkare_dash_sub', JSON.stringify(fetchedSub));
      } catch {}
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const isSubscribed = subscription?.isSubscribed ?? false;
  const isFirstTime = subscription?.isFirstTime ?? true;
  const restaurantName = restaurant?.name || user?.name || 'Restaurant';
  const slug = restaurant?.slug || user?.restaurantId || 'my-restaurant';

  const baseOrigin = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;
  const masterMenuUrl = `${baseOrigin.replace(/\/$/, '')}/menu/${slug}`;
  const masterQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(
    masterMenuUrl
  )}&color=0f172a&bgcolor=ffffff&margin=2`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(masterMenuUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQR = () => {
    const hiResUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&data=${encodeURIComponent(
      masterMenuUrl
    )}&color=0f172a&bgcolor=ffffff&margin=4`;
    const link = document.createElement('a');
    link.href = hiResUrl;
    link.download = `${restaurantName.replace(/\s+/g, '-').toLowerCase()}-official-master-qr.png`;
    link.target = '_blank';
    link.click();
  };

  const handlePrintStandee = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${restaurantName} — Master Dining QR Standee</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
            .standee { border: 4px solid #f97316; border-radius: 28px; padding: 40px 32px; text-align: center; max-width: 360px; width: 100%; background: #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.08); }
            .header-tag { display: inline-block; background: #fff7ed; border: 1.5px solid #fdba74; color: #c2410c; font-size: 11px; font-weight: 800; padding: 4px 14px; border-radius: 100px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
            .brand { font-size: 26px; font-weight: 900; color: #0f172a; margin-bottom: 2px; }
            .brand span { color: #f97316; }
            .rest-name { font-size: 14px; font-weight: 700; color: #475569; margin-bottom: 18px; }
            .qr-box { background: #ffffff; border: 2.5px solid #e2e8f0; border-radius: 20px; padding: 14px; display: inline-block; margin: 4px 0 18px; }
            .qr-box img { display: block; width: 220px; height: 220px; }
            .steps { text-align: left; background: #f8fafc; border-radius: 16px; padding: 14px 16px; margin: 12px 0; font-size: 12px; color: #334155; line-height: 1.6; }
            .steps strong { color: #0f172a; }
            .step-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
            .step-num { width: 18px; height: 18px; background: #f97316; color: white; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; }
            .footer-note { font-size: 10px; color: #94a3b8; margin-top: 14px; font-family: monospace; word-break: break-all; }
            @media print { body { background: #fff; padding: 0; } .standee { box-shadow: none; border-color: #f97316; } }
          </style>
        </head>
        <body>
          <div class="standee">
            <div class="header-tag">Digital QR Menu</div>
            <div class="brand">Order<span>Kare</span></div>
            <div class="rest-name">${restaurantName}</div>
            <div class="qr-box">
              <img src="${masterQrCodeUrl}" alt="Restaurant QR Code" />
            </div>
            <div class="steps">
              <div class="step-row"><span class="step-num">1</span> <strong>Scan QR with phone camera</strong></div>
              <div class="step-row"><span class="step-num">2</span> <strong>Select food & enter your Table #</strong></div>
              <div class="step-row"><span class="step-num">3</span> <strong>Place order straight to kitchen</strong></div>
            </div>
            <div class="footer-note">${masterMenuUrl}</div>
          </div>
          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post('/tables', {
        number: newTableNum.trim(),
        capacity: Number(newTableCapacity) || 4,
      });
      setNewTableNum('');
      setShowAddModal(false);
      fetchTables();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add table');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTable = async (tableId: string, tableNumber: string) => {
    if (!window.confirm(`Are you sure you want to remove Table #${tableNumber}?`)) return;
    try {
      await api.delete(`/tables/${tableId}`);
      fetchTables();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete table');
    }
  };

  const handleUpdateStatus = async (tableId: string, status: 'FREE' | 'OCCUPIED' | 'DIRTY') => {
    // Optimistic UI update
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, status } : t))
    );
    try {
      await api.patch(`/tables/${tableId}/status`, { status });
      fetchTables();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update table status');
      fetchTables();
    }
  };

  // Metrics
  const totalTables = tables.length;
  const freeTables = tables.filter((t) => t.status === 'FREE').length;
  const occupiedTables = tables.filter((t) => t.status === 'OCCUPIED').length;
  const dirtyTables = tables.filter((t) => t.status === 'DIRTY').length;
  const totalCapacity = tables.reduce((sum, t) => sum + (t.capacity || 0), 0);

  // Filtered Tables
  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      if (statusFilter !== 'ALL' && table.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNum = String(table.number).toLowerCase().includes(q);
        const matchesGuest = (table.customerName || '').toLowerCase().includes(q);
        return matchesNum || matchesGuest;
      }
      return true;
    });
  }, [tables, statusFilter, searchQuery]);

  return (
    <div className="space-y-7 pb-12 max-w-7xl mx-auto">
      {/* ─── 1. TOP HEADER & PRIMARY ACTIONS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Tables & Floor Management
            </h1>
            <span className="inline-flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 text-xs px-3 py-1 rounded-full font-bold shadow-2xs">
              <QrCode className="w-3.5 h-3.5 text-orange-500" />
              <span>Universal Standee Active</span>
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Universal QR standee, dining tables, and real-time floor occupancy
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTables}
            disabled={isRefreshing}
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all shadow-2xs"
            title="Refresh Table Data"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`}
            />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs shadow-orange-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* ─── 2. FLOOR METRICS RIBBON ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 select-none ${
            statusFilter === 'ALL'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              Total Tables
            </span>
            <Layers className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-black mt-2 font-mono">{totalTables}</p>
          <p className="text-[11px] opacity-70 mt-1 font-medium">Configured stations</p>
        </div>

        <div
          onClick={() => setStatusFilter('FREE')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 select-none ${
            statusFilter === 'FREE'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-emerald-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              Free Tables
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl font-black mt-2 text-emerald-600 dark:text-emerald-400 font-mono">
            {freeTables}
          </p>
          <p className="text-[11px] opacity-70 mt-1 font-medium">Ready for guests</p>
        </div>

        <div
          onClick={() => setStatusFilter('OCCUPIED')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 select-none ${
            statusFilter === 'OCCUPIED'
              ? 'bg-rose-600 text-white border-rose-600 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-rose-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              Occupied
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
          <p className="text-2xl font-black mt-2 text-rose-600 dark:text-rose-400 font-mono">
            {occupiedTables}
          </p>
          <p className="text-[11px] opacity-70 mt-1 font-medium">Dining in progress</p>
        </div>

        <div
          onClick={() => setStatusFilter('DIRTY')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 select-none ${
            statusFilter === 'DIRTY'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-amber-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              Needs Cleaning
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <p className="text-2xl font-black mt-2 text-amber-600 dark:text-amber-400 font-mono">
            {dirtyTables}
          </p>
          <p className="text-[11px] opacity-70 mt-1 font-medium">Awaiting busser</p>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Seats</span>
            <Users className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-black mt-2 font-mono text-slate-900 dark:text-white">
            {totalCapacity}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
            Seating capacity
          </p>
        </div>
      </div>

      {/* ─── 3. UNIVERSAL RESTAURANT QR STANDEE CARD ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-2xs overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* QR Standee Visual Box */}
          <div className="relative shrink-0 w-full sm:w-72 bg-gradient-to-br from-slate-50 to-orange-50/30 dark:from-slate-800/80 dark:to-slate-800/40 border border-orange-200/80 dark:border-slate-700 rounded-3xl p-5 text-center shadow-xs">
            {!isSubscribed ? (
              <div className="relative">
                <div className="w-52 h-52 mx-auto bg-slate-200 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center p-4 filter blur-xs select-none">
                  <QrCode className="w-28 h-28 text-slate-400" />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-xs rounded-2xl p-4 text-white space-y-2">
                  <div className="w-11 h-11 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Lock className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-orange-300">
                    Master QR Locked
                  </span>
                  <p className="text-[11px] text-slate-200 leading-tight text-center">
                    Activate your subscription to unlock your master QR standee
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs inline-block">
                  <img
                    src={masterQrCodeUrl}
                    alt={`${restaurantName} Master QR Code`}
                    className="w-48 h-48 mx-auto block"
                  />
                </div>
                <div className="mt-3 space-y-0.5">
                  <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-3 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Live Master Standee
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {restaurantName}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Standee Info & Actions */}
          <div className="flex-1 space-y-4 w-full">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>One Master QR Code for All Tables</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Official Universal Dining Standee
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Print and place this standee on your tables or counter. When guests scan with their camera, your digital menu opens instantly without downloading any app. Guests select their dishes, specify their table number, and orders dispatch straight to your kitchen pipeline.
              </p>
            </div>

            {/* Direct Digital Menu Link */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Official Customer Menu URL
              </label>
              <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-w-xl">
                <input
                  type="text"
                  readOnly
                  value={masterMenuUrl}
                  className="flex-1 px-3.5 py-2.5 bg-transparent text-xs font-mono text-slate-800 dark:text-slate-200 outline-none select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 border-l border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  {copiedLink ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            {!isSubscribed ? (
              <div className="pt-1">
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-6 py-3.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-xs shadow-orange-500/25 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isFirstTime
                      ? 'Activate Master QR (30 Days Free Access)'
                      : 'Renew Subscription to Reactivate QR'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  onClick={handleDownloadQR}
                  className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold text-xs rounded-xl transition-all shadow-xs shadow-orange-500/20 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download QR PNG</span>
                </button>

                <button
                  onClick={handlePrintStandee}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Standee Preset</span>
                </button>

                <a
                  href={masterMenuUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview Menu</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 4. DINING TABLES & FLOOR OCCUPANCY GRID ─── */}
      <div className="space-y-4">
        {/* Toolbar: Search & Status Filters */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table number or active guest..."
              className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Tables ({totalTables})
            </button>
            <button
              onClick={() => setStatusFilter('FREE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'FREE'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Free ({freeTables})</span>
            </button>
            <button
              onClick={() => setStatusFilter('OCCUPIED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'OCCUPIED'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Occupied ({occupiedTables})</span>
            </button>
            <button
              onClick={() => setStatusFilter('DIRTY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'DIRTY'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Needs Cleaning ({dirtyTables})</span>
            </button>
          </div>
        </div>

        {/* Tables Card Grid */}
        {filteredTables.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3 shadow-2xs">
            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <UtensilsCrossed className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'No matching tables found'
                  : 'No dining tables configured yet'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Try clearing your search query or status filter.'
                  : 'Add your dining tables (e.g. Table 01, Table 02...) so your staff can track live customer orders per station.'}
              </p>
            </div>
            {searchQuery || statusFilter !== 'ALL' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="mt-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-3 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
              >
                Add First Table
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredTables.map((table) => {
                const isOccupied = table.status === 'OCCUPIED';
                const isDirty = table.status === 'DIRTY';

                return (
                  <motion.div
                    key={table.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between ${
                      isOccupied
                        ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20'
                        : isDirty
                        ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20'
                        : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Table Badge & Remove Action */}
                      <div className="flex items-center justify-between">
                        <span className="text-base font-black text-slate-900 dark:text-white font-mono tracking-tight">
                          Table #{table.number}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isOccupied
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                : isDirty
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {table.status}
                          </span>

                          <button
                            onClick={() => handleDeleteTable(table.id, table.number)}
                            className="text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1 rounded-md"
                            title="Remove Table"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Capacity Info */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Seating: {table.capacity} Persons</span>
                      </div>

                      {/* Active Guest Info Box */}
                      {isOccupied && (
                        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-300">
                          <span className="font-bold block text-[11px] uppercase tracking-wider text-rose-700 dark:text-rose-400">
                            Active Customer:
                          </span>
                          <span className="font-semibold truncate block mt-0.5">
                            {table.customerName || 'Dine-In Guest'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Quick 1-Click Status Segmented Control */}
                    <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex gap-1.5">
                      <button
                        onClick={() => handleUpdateStatus(table.id, 'FREE')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          table.status === 'FREE'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        Free
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(table.id, 'OCCUPIED')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          table.status === 'OCCUPIED'
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        Occupied
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(table.id, 'DIRTY')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          table.status === 'DIRTY'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        Dirty
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ─── 5. ADD TABLE MODAL ─── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Add Dining Table
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Assign a table number and seating capacity
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTable} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Table Number / Label *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01, 02, T-5, Rooftop 3"
                    value={newTableNum}
                    onChange={(e) => setNewTableNum(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all placeholder:text-slate-400 font-mono"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Seating Capacity (Persons)
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {['2', '4', '6', '8'].map((cap) => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => setNewTableCapacity(cap)}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          newTableCapacity === cap
                            ? 'bg-orange-50 dark:bg-orange-950/50 border-orange-500 text-orange-600 dark:text-orange-400'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {cap} Seats
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(e.target.value)}
                    placeholder="Custom capacity"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newTableNum.trim()}
                    className="flex-1 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 rounded-xl shadow-xs transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Saving...' : 'Save Table'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── 6. ACTIVATION PAYMENT MODAL ─── */}
      <AnimatePresence>
        {showPaymentModal && (
          <PaymentModal
            planName={
              isFirstTime
                ? 'First-Time Activation (1 Month Free)'
                : 'Monthly Plan Renewal'
            }
            planId={isFirstTime ? 'FIRST_TIME_ACTIVATION' : 'MONTHLY'}
            amount={isFirstTime ? 1 : 249}
            durationDays={30}
            upiId={subscription?.payment?.upiId || ''}
            restaurantName={restaurantName}
            razorpayEnabled={subscription?.payment?.razorpayEnabled ?? true}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={() => {
              fetchTables();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
