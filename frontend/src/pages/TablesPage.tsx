import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  AlertCircle,
  CheckCircle,
  RefreshCcw,
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
  Smartphone
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

  // Add Table Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('4');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // ₹1 Activation Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchTables = async () => {
    try {
      const [resTables, resMe, resSub] = await Promise.all([
        api.get('/tables'),
        api.get('/auth/me'),
        api.get('/subscriptions/status').catch(() => ({ data: { isSubscribed: false, isFirstTime: true } })),
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

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to remove this table?')) return;
    try {
      await api.delete(`/tables/${tableId}`);
      fetchTables();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete table');
    }
  };

  const handleUpdateStatus = async (tableId: string, status: 'FREE' | 'OCCUPIED' | 'DIRTY') => {
    try {
      await api.patch(`/tables/${tableId}/status`, { status });
      fetchTables();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update table status');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-orange-100 text-orange-700 mb-2">
            <QrCode className="w-3.5 h-3.5" />
            <span>Universal QR Standee & Floor Management</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">QR Standee & Table Operations</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            One single master QR code for your entire restaurant. Customers scan from any table to order directly.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Table</span>
          </button>
          <button
            onClick={fetchTables}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── SECTION 1: OFFICIAL UNIVERSAL RESTAURANT QR STANDEE ─── */}
      <div className="bg-white rounded-3xl border-2 border-slate-200/80 p-6 sm:p-8 shadow-sm overflow-hidden relative">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* QR Preview Card */}
          <div className="relative shrink-0 w-full sm:w-72 bg-gradient-to-br from-slate-50 to-orange-50/40 border-2 border-orange-200/70 rounded-3xl p-5 text-center shadow-md">
            {!isSubscribed ? (
              <div className="relative">
                <div className="w-56 h-56 mx-auto bg-slate-200/70 rounded-2xl flex flex-col items-center justify-center p-4 filter blur-xs select-none">
                  <QrCode className="w-32 h-32 text-slate-400" />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-xs rounded-2xl p-4 text-white space-y-2">
                  <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Lock className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-orange-300">
                    Master QR Locked
                  </span>
                  <p className="text-[11px] text-slate-200 leading-tight text-center">
                    Pay ₹1 to generate and activate your permanent QR code
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm inline-block">
                  <img
                    src={masterQrCodeUrl}
                    alt={`${restaurantName} Master QR Code`}
                    className="w-52 h-52 mx-auto block"
                  />
                </div>
                <div className="mt-3 space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-3 py-0.5 rounded-full border border-emerald-200">
                    Active Master QR
                  </span>
                  <p className="text-xs font-bold text-slate-800 mt-1">{restaurantName}</p>
                </div>
              </div>
            )}
          </div>

          {/* QR Info & Actions */}
          <div className="flex-1 space-y-5 w-full">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Single QR for All Tables • Never Needs Reprinting</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                Official Master Dining Standee
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Print and place this single standee across all your dining tables. When guests scan with their smartphone camera, your digital menu opens instantly. During checkout, guests enter their table number (e.g. Table 4), and their order is dispatched live to your kitchen display.
              </p>
            </div>

            {/* Direct URL Input */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Official Digital Menu Link
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden max-w-xl">
                <input
                  type="text"
                  readOnly
                  value={masterMenuUrl}
                  className="flex-1 px-3.5 py-2.5 bg-transparent text-xs font-mono text-slate-800 outline-none select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 border-l border-slate-200 text-slate-600 hover:text-orange-600 hover:bg-orange-50 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
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

            {/* Main Action Buttons */}
            {!isSubscribed ? (
              <div className="pt-2">
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-7 py-4 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-orange-500/25 active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-orange-200" />
                  <span>
                    {isFirstTime ? '⚡ Pay ₹1 & Unlock Master QR (30 Days Free)' : '🔄 Renew Subscription to Reactivate QR'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleDownloadQR}
                  className="px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-orange-500/20 active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download High-Res PNG</span>
                </button>

                <button
                  onClick={handlePrintStandee}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Official Standee Preset</span>
                </button>

                <a
                  href={masterMenuUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview Customer Menu</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: LIVE DINING TABLES & FLOOR OCCUPANCY ─── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Dining Tables & Live Occupancy</h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage your restaurant tables. Orders placed via your master QR standee will show up on their corresponding table in real time.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {tables.filter((t) => t.status === 'FREE').length} Free
            </span>
            <span className="flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-1 rounded-lg border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {tables.filter((t) => t.status === 'OCCUPIED').length} Occupied
            </span>
          </div>
        </div>

        {tables.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">No tables configured yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add your dining tables (e.g. Table 01, Table 02...) so your kitchen and staff can track live customer orders per table.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md hover:bg-slate-800 transition-all cursor-pointer"
            >
              Add Your First Table
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map((table) => {
              const isOccupied = table.status === 'OCCUPIED';
              const isDirty = table.status === 'DIRTY';

              return (
                <div
                  key={table.id}
                  className={`bg-white rounded-2xl border-2 p-4 transition-all shadow-xs flex flex-col justify-between ${
                    isOccupied
                      ? 'border-rose-300 bg-rose-50/30'
                      : isDirty
                      ? 'border-amber-300 bg-amber-50/30'
                      : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-slate-900 font-mono">
                        Table #{table.number}
                      </span>
                      <button
                        onClick={() => handleDeleteTable(table.id)}
                        className="text-slate-300 hover:text-rose-600 transition-colors p-1 rounded-md"
                        title="Remove Table"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Capacity: {table.capacity} Persons</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isOccupied
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : isDirty
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {table.status}
                      </span>
                    </div>

                    {isOccupied && table.customerName && (
                      <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800">
                        <span className="font-bold block">Active Customer:</span>
                        <span>{table.customerName}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Status Toggle */}
                  <div className="pt-4 mt-3 border-t border-slate-100 flex gap-1.5">
                    <button
                      onClick={() => handleUpdateStatus(table.id, 'FREE')}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        table.status === 'FREE'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Free
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(table.id, 'OCCUPIED')}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        table.status === 'OCCUPIED'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Occupied
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(table.id, 'DIRTY')}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        table.status === 'DIRTY'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Dirty
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Table Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5 z-10 border border-slate-100"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">Add Dining Table</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddTable} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Table Number / Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01, 02, T-5"
                    value={newTableNum}
                    onChange={(e) => setNewTableNum(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Seating Capacity (Persons)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !newTableNum.trim()}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving Table...' : 'Save Table'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ₹1 Activation Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <PaymentModal
            planName={isFirstTime ? 'First-Time Activation (1 Month Free)' : 'Monthly Plan Renewal'}
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
