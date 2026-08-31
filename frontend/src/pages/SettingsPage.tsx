import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { Download, Copy, QrCode, CheckCircle } from 'lucide-react';

export const SettingsPage = () => {
  const { user } = useAuthStore();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const res = await api.get('/auth/me');
        setRestaurant(res.data.user?.restaurant);
      } catch { /* empty */ }
      finally { setLoading(false); }
    };
    fetchRestaurant();
  }, []);

  const [selectedTable, setSelectedTable] = useState<string>('ALL');

  const menuUrl = (() => {
    if (!restaurant?.slug) return '';

    const baseOrigin = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;
    const normalizedOrigin = baseOrigin.replace(/\/$/, '');
    const url = new URL(`/menu/${restaurant.slug}`, normalizedOrigin);

    if (selectedTable !== 'ALL') {
      url.searchParams.set('table', selectedTable);
    }

    return url.toString();
  })();

  const handleCopy = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(menuUrl)}`;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `${restaurant?.name || 'restaurant'}${selectedTable !== 'ALL' ? `-table-${selectedTable}` : ''}-qr.png`;
    link.click();
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your restaurant settings and QR code</p>
      </div>

      {/* Restaurant Info */}
      <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
        <h2 className="font-bold text-slate-900 mb-4">Restaurant Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide">Name</label>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{restaurant?.name || '—'}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide">Slug</label>
            <p className="text-sm font-medium text-slate-800 mt-0.5 font-mono">{restaurant?.slug || '—'}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide">Address</label>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{restaurant?.address || '—'}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide">Phone</label>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{restaurant?.phone || '—'}</p>
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-primary" />
            <span>Table QR Code Generator</span>
          </h2>
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-500">Target Table:</label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">General (No Table)</option>
              <option value="01">Table 01</option>
              <option value="02">Table 02</option>
              <option value="03">Table 03</option>
              <option value="04">Table 04</option>
              <option value="05">Table 05</option>
              <option value="06">Table 06</option>
              <option value="07">Table 07</option>
              <option value="08">Table 08</option>
            </select>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-5">
          Print this QR code and attach it to your restaurant table. When a customer scans it with their phone camera, your menu opens directly with Table #{selectedTable === 'ALL' ? '01' : selectedTable} automatically pre-selected.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          {/* QR Image */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm text-center">
            {menuUrl && (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(menuUrl)}`}
                alt="Restaurant QR Code"
                className="w-48 h-48 mx-auto"
              />
            )}
            <span className="inline-block mt-3 text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
              {selectedTable === 'ALL' ? 'General Menu QR' : `Table #${selectedTable} QR`}
            </span>
          </div>

          {/* QR Details */}
          <div className="flex-1 space-y-4 w-full">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Direct Scan URL</label>
              <div className="flex items-center mt-1.5 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <input
                  type="text"
                  value={menuUrl}
                  readOnly
                  className="flex-1 px-4 py-2.5 bg-transparent text-sm text-slate-700 outline-none font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2.5 text-primary hover:bg-primary/10 transition-colors border-l border-slate-200"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDownloadQR}
                className="flex items-center space-x-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/15"
              >
                <Download className="w-4 h-4" />
                <span>Download High-Res QR</span>
              </button>
              <button
                onClick={() => { window.open(menuUrl, '_blank'); }}
                className="flex items-center space-x-2 bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                <span>Test Scan Experience ↗</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
        <h2 className="font-bold text-slate-900 mb-4">Account</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide">Name</label>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{user?.name || '—'}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide">Email</label>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{user?.email || '—'}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide">Role</label>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{user?.role || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
