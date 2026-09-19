import { useState, useEffect } from 'react';
import { 
  LayoutGrid, AlertCircle, CheckCircle, RefreshCcw, QrCode, Download, 
  X, Copy, CheckCircle2, Plus, ExternalLink, Trash2, Layers, Sparkles, Lock, ArrowRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

interface Table {
  id: string;
  number: string;
  capacity: number;
  status: 'FREE' | 'OCCUPIED' | 'DIRTY';
  currentOrderId?: string;
  customerName?: string;
}

// ─── QR Code Modal ────────────────────────────────────────────────────────────
interface QrModalProps {
  table: Table;
  menuUrl: string;
  restaurantName: string;
  onClose: () => void;
}

const QrModal = ({ table, menuUrl, restaurantName, onClose }: QrModalProps) => {
  const [copied, setCopied] = useState(false);
  const qrSize = 260;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize * 2}x${qrSize * 2}&data=${encodeURIComponent(menuUrl)}&color=0f172a&bgcolor=ffffff&margin=2`;

  const handleCopy = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const hiResUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(menuUrl)}&color=0f172a&bgcolor=ffffff&margin=4`;
    const link = document.createElement('a');
    link.href = hiResUrl;
    link.download = `${restaurantName.replace(/\s+/g, '-').toLowerCase()}-table-${table.number}-qr.png`;
    link.target = '_blank';
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Table ${table.number} QR Code — ${restaurantName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; background: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
            .card { border: 3px solid #f97316; border-radius: 20px; padding: 32px 28px; text-align: center; max-width: 320px; width: 100%; }
            .logo { font-size: 22px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }
            .logo span { color: #f97316; }
            .table-badge { display: inline-block; background: #fff7ed; border: 2px solid #fed7aa; color: #c2410c; font-size: 13px; font-weight: 800; padding: 4px 16px; border-radius: 100px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; }
            .qr-wrap { background: #fff; border: 2px solid #e2e8f0; border-radius: 16px; padding: 12px; display: inline-block; margin: 8px 0 16px; }
            .qr-wrap img { display: block; width: 200px; height: 200px; }
            .instruction { font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 8px; }
            .instruction strong { color: #0f172a; }
            .url { font-size: 9px; color: #94a3b8; margin-top: 12px; word-break: break-all; font-family: monospace; }
            @media print { @page { margin: 0; } body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">Order<span>Kare</span></div>
            <p style="font-size:11px;color:#94a3b8;margin-bottom:12px">${restaurantName}</p>
            <div class="table-badge">Table #${table.number}</div>
            <div class="qr-wrap">
              <img src="${qrUrl}" alt="Menu QR Code" />
            </div>
            <p class="instruction">
              <strong>Scan to Order</strong><br/>
              Point your phone camera at this QR code to open the digital menu instantly — no app needed.
            </p>
            <p class="url">${menuUrl}</p>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden z-10"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Permanent Table QR</p>
              <h3 className="text-xl font-black">Table #{table.number}</h3>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">{restaurantName}</p>
        </div>

        <div className="p-6 space-y-5">
          {/* QR Preview */}
          <div className="text-center">
            <div className="inline-block bg-white border-2 border-slate-100 rounded-2xl p-4 shadow-sm">
              <img
                src={qrUrl}
                alt={`Table ${table.number} QR Code`}
                className="w-52 h-52 mx-auto block"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2.5 font-medium">
              Permanent QR standee for <strong>Table #{table.number}</strong>
            </p>
          </div>

          {/* URL field */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Direct Menu Link</label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
              <span className="flex-1 px-3 py-2.5 text-xs font-mono text-slate-600 truncate">{menuUrl}</span>
              <button
                onClick={handleCopy}
                className="px-3 py-2.5 border-l border-slate-200 text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold text-sm rounded-2xl transition-all active:scale-95 shadow-md shadow-orange-500/20"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-2xl transition-all active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              Print Stand
            </button>
          </div>

          <a
            href={menuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs rounded-2xl transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Preview Customer Menu
          </a>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main Tables Page ─────────────────────────────────────────────────────────
export const TablesPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [qrTable, setQrTable] = useState<Table | null>(null);

  // Add Table Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('4');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Activation Required Modal
  const [showActivationModal, setShowActivationModal] = useState(false);

  const fetchTables = async () => {
    try {
      const [resTables, resMe, resSub] = await Promise.all([
        api.get('/tables'),
        api.get('/auth/me'),
        api.get('/subscriptions/status').catch(() => ({ data: { isSubscribed: false } })),
      ]);
      setTables(resTables.data?.tables || []);
      setRestaurant(resMe.data?.user?.restaurant);
      setSubscription(resSub.data);
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const isSubscribed = subscription?.isSubscribed ?? false;
  const isFirstTime = subscription?.isFirstTime ?? true;

  const getMenuUrl = (tableNumber: string) => {
    const slug = restaurant?.slug || user?.restaurantId || 'my-restaurant';
    const baseOrigin = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;
    return `${baseOrigin.replace(/\/$/, '')}/menu/${slug}?table=${tableNumber}`;
  };

  const handleOpenQR = (table: Table) => {
    if (!isSubscribed) {
      setShowActivationModal(true);
      return;
    }
    setQrTable(table);
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post('/tables', {
        tableNumber: newTableNum.trim(),
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

  const handleBatchCreate = async (count: number) => {
    try {
      setLoading(true);
      await api.post('/tables/batch', { count });
      fetchTables();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to batch generate tables');
      setLoading(false);
    }
  };

  const handleDeleteTable = async (id: string, num: string) => {
    if (!confirm(`Are you sure you want to delete Table #${num}?`)) return;
    try {
      await api.delete(`/tables/${id}`);
      setTables(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete table');
    }
  };

  const toggleTableStatus = async (id: string, currentStatus: Table['status']) => {
    const nextStatusMap: Record<Table['status'], Table['status']> = {
      FREE: 'OCCUPIED',
      OCCUPIED: 'DIRTY',
      DIRTY: 'FREE',
    };
    const nextStatus = nextStatusMap[currentStatus];

    setTables(prev =>
      prev.map(t => (t.id === id ? { ...t, status: nextStatus } : t))
    );

    try {
      await api.patch(`/tables/${id}/status`, { status: nextStatus });
    } catch (err) {
      fetchTables();
    }
  };

  const statusThemes: Record<Table['status'], { card: string; badge: string; icon: any }> = {
    FREE: { card: 'border-emerald-100 hover:border-emerald-300 bg-emerald-50/20', badge: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    OCCUPIED: { card: 'border-orange-200 hover:border-orange-300 bg-orange-50/30', badge: 'bg-orange-100 text-orange-700', icon: LayoutGrid },
    DIRTY: { card: 'border-amber-100 hover:border-amber-300 bg-amber-50/20', badge: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  };

  const freeCount = tables.filter(t => t.status === 'FREE').length;
  const occupiedCount = tables.filter(t => t.status === 'OCCUPIED').length;
  const dirtyCount = tables.filter(t => t.status === 'DIRTY').length;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Table Management & QR Codes</h1>
            <p className="text-slate-500 text-sm">Add dining tables, monitor live seating, and print table QR standees</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200"
            >
              <Plus className="w-4 h-4" />
              <span>Add Table</span>
            </button>
          </div>
        </div>

        {/* Subscription Alert Banner if inactive */}
        {!isSubscribed && (
          <div className="bg-gradient-to-r from-orange-500 to-rose-500 rounded-3xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-orange-500/15">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm">
                  {isFirstTime ? '₹1 Activation Required to Unlock QR Codes (1 Month Free)' : 'Subscription Renewal Required'}
                </p>
                <p className="text-xs text-orange-100 mt-0.5">
                  {isFirstTime ? 'Complete the one-time ₹1 introductory payment to unlock and view all permanent table QR codes.' : 'Your subscription has expired. Renew your plan to re-activate table ordering.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard/subscription')}
              className="px-5 py-2.5 bg-white text-orange-600 hover:bg-orange-50 font-black text-xs rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center gap-1.5 self-start sm:self-auto"
            >
              <span>{isFirstTime ? 'Activate for ₹1' : 'Renew Plan'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Stats Bar */}
        {tables.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Available', count: freeCount, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
              { label: 'Occupied', count: occupiedCount, color: 'bg-orange-50 border-orange-200 text-orange-700' },
              { label: 'Needs Cleaning', count: dirtyCount, color: 'bg-amber-50 border-amber-200 text-amber-700' },
            ].map(({ label, count, color }) => (
              <div key={label} className={`border rounded-2xl px-5 py-4 text-center ${color}`}>
                <p className="text-2xl font-black">{count}</p>
                <p className="text-xs font-bold uppercase tracking-wider opacity-80 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Empty State when newly created account has 0 tables */}
        {tables.length === 0 && !loading ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center flex flex-col items-center justify-center max-w-xl mx-auto shadow-xs">
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-4">
              <QrCode className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">No tables created yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md">
              Create your dining tables to generate unique QR codes for each table. Customers can scan the QR code to order directly.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors shadow-md shadow-orange-200"
              >
                <Plus className="w-4 h-4" />
                <span>Add Single Table</span>
              </button>
              <button
                onClick={() => handleBatchCreate(5)}
                className="flex items-center space-x-2 bg-slate-100 text-slate-700 hover:bg-slate-200 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
              >
                <Layers className="w-4 h-4" />
                <span>Quick Setup (Tables 01–05)</span>
              </button>
            </div>
          </div>
        ) : (
          /* Tables Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {tables.map(table => {
              const theme = statusThemes[table.status] || statusThemes.FREE;
              return (
                <motion.div
                  key={table.id}
                  layout
                  whileHover={{ y: -3, transition: { duration: 0.15 } }}
                  className={`border-2 rounded-3xl p-5 transition-all duration-300 flex flex-col justify-between h-56 ${theme.card} group relative`}
                >
                  {/* Table header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-black text-slate-950 font-mono">Table #{table.number}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Capacity: {table.capacity} seats</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${theme.badge}`}>
                        {table.status}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.id, table.number); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                        title="Delete table"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Status info */}
                  <div className="space-y-1.5">
                    {table.status === 'OCCUPIED' ? (
                      <p className="text-xs font-semibold text-slate-800 truncate">Dining in progress</p>
                    ) : table.status === 'DIRTY' ? (
                      <p className="text-xs font-medium text-amber-700 flex items-center gap-1">
                        <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> Requires Cleaning
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">Available for customer seating</p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    {/* QR Code button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenQR(table); }}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all ${
                        isSubscribed
                          ? 'text-slate-700 bg-white border border-slate-200 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50'
                          : 'text-orange-700 bg-orange-100 border border-orange-300 hover:bg-orange-200'
                      }`}
                    >
                      {isSubscribed ? <QrCode className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>{isSubscribed ? 'QR Code' : 'Unlock QR'}</span>
                    </button>
                    {/* Status toggle */}
                    <button
                      onClick={() => toggleTableStatus(table.id, table.status)}
                      className="flex-1 text-xs font-bold text-slate-600 bg-white/80 border border-slate-200 hover:bg-slate-100 transition-all px-2 py-2 rounded-xl text-center"
                    >
                      Toggle Status
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Permanent QR Tip */}
        {tables.length > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">Permanent Table QR Codes</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Each table QR is generated permanently for your restaurant. When your plan is renewed, the same QR codes immediately reactivate without needing new prints.
              </p>
            </div>
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
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 z-10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Add New Dining Table</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTable} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Table Number / Label</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 01, 02, T-1, Patio-1"
                    value={newTableNum}
                    onChange={e => setNewTableNum(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Seating Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newTableCapacity}
                    onChange={e => setNewTableCapacity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors shadow-sm shadow-orange-200 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Table'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Activation Required Modal */}
      <AnimatePresence>
        {showActivationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActivationModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 z-10 space-y-4 text-center"
            >
              <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {isFirstTime ? '₹1 Activation Required (1 Month Free)' : 'Subscription Renewal Required'}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {isFirstTime
                    ? 'To generate and view your permanent Table QR codes, please complete the one-time ₹1 first-time activation payment to receive 30 days free access.'
                    : 'Your restaurant subscription has expired. Please choose a renewal plan to re-activate your permanent table QR code standees.'}
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setShowActivationModal(false);
                    navigate('/dashboard/subscription');
                  }}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-extrabold text-sm rounded-2xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isFirstTime ? 'Go to Activation (₹1)' : 'View Renewal Plans'}</span>
                </button>
                <button
                  onClick={() => setShowActivationModal(false)}
                  className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Modal (Available when active) */}
      <AnimatePresence>
        {qrTable && (
          <QrModal
            table={qrTable}
            menuUrl={getMenuUrl(qrTable.number)}
            restaurantName={restaurant?.name || user?.name || 'My Restaurant'}
            onClose={() => setQrTable(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
