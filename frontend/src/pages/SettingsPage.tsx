import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { Download, Copy, QrCode, CheckCircle, ExternalLink, Printer } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

export const SettingsPage = () => {
  const { user } = useAuthStore();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string>('');

  const qrCanvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.user?.restaurant) {
          setRestaurant(res.data.user.restaurant);
        }
      } catch {
        /* empty */
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, []);

  const slug = restaurant?.slug || 'royal-palace';
  const baseUrl = `${window.location.origin}/menu/${slug}`;
  const menuUrl = selectedTable ? `${baseUrl}?table=${selectedTable}` : baseUrl;

  const handleCopy = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const canvas = qrCanvasRef.current?.querySelector('canvas');
    if (canvas) {
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      const tableSuffix = selectedTable ? `-table-${selectedTable}` : '';
      link.download = `${restaurant?.name || 'orderkare'}-qr${tableSuffix}.png`;
      link.click();
    }
  };

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const canvas = qrCanvasRef.current?.querySelector('canvas');
    const qrDataUrl = canvas ? canvas.toDataURL('image/png') : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code - ${restaurant?.name || 'OrderKare'}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fff; text-align: center; }
            .card { border: 2px solid #0f172a; padding: 40px; border-radius: 24px; max-width: 320px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
            h1 { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; }
            p { font-size: 13px; color: #64748b; margin: 0 0 20px 0; }
            img { width: 220px; height: 220px; margin-bottom: 16px; }
            .table-badge { background: #0f172a; color: #fff; display: inline-block; padding: 6px 16px; border-radius: 100px; font-weight: 800; font-size: 14px; margin-bottom: 12px; }
            .footer { font-size: 11px; color: #94a3b8; margin-top: 16px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${restaurant?.name || 'OrderKare Restaurant'}</h1>
            <p>Scan with phone camera to view menu & order food</p>
            ${selectedTable ? `<div class="table-badge">TABLE #${selectedTable}</div>` : ''}
            <div><img src="${qrDataUrl}" alt="QR Code" /></div>
            <div class="footer">Powered by OrderKare</div>
          </div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Settings & QR Codes</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your digital menu QR code and restaurant details</p>
      </div>

      {/* Restaurant Info */}
      <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
        <h2 className="font-bold text-slate-900 mb-4">Restaurant Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide">Restaurant Name</label>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{restaurant?.name || 'Royal Palace Dining'}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide">Menu Slug (URL)</label>
            <p className="text-sm font-bold text-primary mt-0.5 font-mono">{slug}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide">Address</label>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{restaurant?.address || 'Sector 62, Noida'}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide">Phone</label>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{restaurant?.phone || '+91 98765 43210'}</p>
          </div>
        </div>
      </div>

      {/* Instant QR Code Generator */}
      <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900 flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-primary" />
            <span>Digital Menu QR Code</span>
          </h2>
          <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold">
            ✓ Client-side Rendered
          </span>
        </div>

        <p className="text-sm text-slate-500 mb-5">
          Customers scan this QR code with their mobile phone camera to open your menu instantly without installing any app.
        </p>

        {/* Table Selector */}
        <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Generate Table Specific QR (Optional)
            </label>
            <p className="text-xs text-slate-500">Attach table number automatically when scanned</p>
          </div>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">General Menu (No Table Lock)</option>
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

        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          {/* QR Canvas Container */}
          <div ref={qrCanvasRef} className="bg-white border-4 border-slate-900 rounded-3xl p-5 shadow-xl flex flex-col items-center justify-center shrink-0">
            <QRCodeCanvas
              value={menuUrl}
              size={220}
              bgColor="#ffffff"
              fgColor="#0f172a"
              level="H"
              includeMargin={true}
            />
            <div className="mt-3 text-center">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">SCAN TO ORDER</span>
              <span className="text-xs font-black text-slate-900">
                {selectedTable ? `TABLE #${selectedTable}` : restaurant?.name || 'OrderKare'}
              </span>
            </div>
          </div>

          {/* QR Actions */}
          <div className="flex-1 space-y-4 w-full">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide font-bold">Target QR URL</label>
              <div className="flex items-center mt-1.5 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <input
                  type="text"
                  value={menuUrl}
                  readOnly
                  className="flex-1 px-4 py-2.5 bg-transparent text-xs text-slate-700 outline-none font-mono"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2.5 text-primary hover:bg-primary/10 transition-colors border-l border-slate-200 flex items-center gap-1 font-bold text-xs"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleDownloadQR}
                className="flex items-center space-x-2 bg-primary text-white px-5 py-3 rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </button>

              <button
                onClick={handlePrintQR}
                className="flex items-center space-x-2 bg-slate-900 text-white px-5 py-3 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Table Tag</span>
              </button>

              <button
                onClick={() => { window.open(menuUrl, '_blank'); }}
                className="flex items-center space-x-2 bg-slate-100 text-slate-700 px-5 py-3 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Test Open Menu</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
        <h2 className="font-bold text-slate-900 mb-4">Account Details</h2>
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
            <p className="text-sm font-medium text-slate-800 mt-0.5">{user?.role || 'RESTAURANT_ADMIN'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
