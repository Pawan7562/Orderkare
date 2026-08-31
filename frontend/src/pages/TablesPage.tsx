import { useState, useRef, useEffect } from 'react';
import { LayoutGrid, Grid2X2, AlertCircle, CheckCircle, RefreshCcw, QrCode, Download, Printer, ExternalLink, X } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../lib/api';

interface Table {
  id: string;
  number: string;
  capacity: number;
  status: 'FREE' | 'OCCUPIED' | 'DIRTY';
  currentOrderId?: string;
  customerName?: string;
}

export const TablesPage = () => {
  const [tables, setTables] = useState<Table[]>([
    { id: 't1', number: '01', capacity: 2, status: 'FREE' },
    { id: 't2', number: '02', capacity: 2, status: 'FREE' },
    { id: 't3', number: '03', capacity: 4, status: 'OCCUPIED', currentOrderId: '#ORD-892', customerName: 'Aarav Sharma' },
    { id: 't4', number: '04', capacity: 4, status: 'FREE' },
    { id: 't5', number: '05', capacity: 6, status: 'DIRTY' },
    { id: 't6', number: '06', capacity: 2, status: 'FREE' },
    { id: 't7', number: '07', capacity: 4, status: 'OCCUPIED', currentOrderId: '#ORD-889', customerName: 'Meera Patel' },
    { id: 't8', number: '08', capacity: 8, status: 'FREE' },
  ]);

  const [restaurantSlug, setRestaurantSlug] = useState<string>('royal-palace');
  const [restaurantName, setRestaurantName] = useState<string>('Royal Palace Dining');
  const [qrModalTable, setQrModalTable] = useState<Table | null>(null);

  const qrCanvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.user?.restaurant) {
          if (res.data.user.restaurant.slug) setRestaurantSlug(res.data.user.restaurant.slug);
          if (res.data.user.restaurant.name) setRestaurantName(res.data.user.restaurant.name);
        }
      } catch {
        /* empty */
      }
    };
    fetchInfo();
  }, []);

  const toggleTableStatus = (id: string) => {
    setTables(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const nextStatusMap: Record<Table['status'], Table['status']> = {
          FREE: 'OCCUPIED',
          OCCUPIED: 'DIRTY',
          DIRTY: 'FREE',
        };
        const nextStatus = nextStatusMap[t.status];
        return {
          ...t,
          status: nextStatus,
          customerName: nextStatus === 'OCCUPIED' ? 'Walk-in Customer' : undefined,
          currentOrderId: nextStatus === 'OCCUPIED' ? `#ORD-WK-${Math.floor(100 + Math.random() * 900)}` : undefined,
        };
      })
    );
  };

  const getTableQrUrl = (tableNum: string) => {
    return `${window.location.origin}/menu/${restaurantSlug}?table=${tableNum}`;
  };

  const handleDownloadTableQr = (tableNum: string) => {
    const canvas = qrCanvasRef.current?.querySelector('canvas');
    if (canvas) {
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${restaurantSlug}-table-${tableNum}-qr.png`;
      link.click();
    }
  };

  const handlePrintTableQr = (tableNum: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const canvas = qrCanvasRef.current?.querySelector('canvas');
    const qrDataUrl = canvas ? canvas.toDataURL('image/png') : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Table #${tableNum} QR Tag - ${restaurantName}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fff; text-align: center; }
            .card { border: 3px solid #0f172a; padding: 40px; border-radius: 28px; max-width: 320px; box-shadow: 0 10px 30px rgba(0,0,0,0.12); }
            h1 { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
            p { font-size: 13px; color: #64748b; margin: 0 0 20px 0; }
            .badge { background: #0f172a; color: #fff; display: inline-block; padding: 6px 18px; border-radius: 100px; font-weight: 900; font-size: 16px; margin-bottom: 16px; }
            img { width: 220px; height: 220px; margin-bottom: 12px; }
            .footer { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${restaurantName}</h1>
            <p>Scan QR code with camera to order</p>
            <div class="badge">TABLE #${tableNum}</div>
            <div><img src="${qrDataUrl}" alt="QR" /></div>
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

  const statusThemes: Record<Table['status'], { card: string; badge: string; icon: any }> = {
    FREE: { card: 'border-emerald-100 hover:border-emerald-300 bg-emerald-50/20', badge: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    OCCUPIED: { card: 'border-primary/10 hover:border-primary/30 bg-primary/5', badge: 'bg-primary/10 text-primary', icon: Grid2X2 },
    DIRTY: { card: 'border-amber-100 hover:border-amber-300 bg-amber-50/20', badge: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Table Management & QR Codes</h1>
          <p className="text-slate-500 text-sm mt-0.5">Monitor seating status & generate table-specific QR tags</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setQrModalTable(tables[0])}
            className="flex items-center space-x-2 bg-primary text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            <QrCode className="w-4 h-4" />
            <span>Generate Table QRs</span>
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        {tables.map(table => {
          const theme = statusThemes[table.status];
          return (
            <div
              key={table.id}
              className={`border-2 rounded-3xl p-5 transition-all duration-300 flex flex-col justify-between h-48 ${theme.card} group relative`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-slate-950 font-mono">T-{table.number}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Capacity: {table.capacity} seats</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${theme.badge}`}>
                  {table.status}
                </span>
              </div>

              <div className="space-y-1 z-10">
                {table.status === 'OCCUPIED' ? (
                  <>
                    <p className="text-xs font-semibold text-slate-800 truncate">{table.customerName}</p>
                    <p className="text-[10px] font-mono text-primary font-medium">{table.currentOrderId}</p>
                  </>
                ) : table.status === 'DIRTY' ? (
                  <p className="text-xs font-medium text-amber-700 flex items-center gap-1">
                    <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> Requires Cleaning
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">Available for seating</p>
                )}
              </div>

              {/* Action Buttons inside Card */}
              <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between z-10">
                <button
                  onClick={() => toggleTableStatus(table.id)}
                  className="text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Toggle Status
                </button>
                <button
                  onClick={() => setQrModalTable(table)}
                  className="text-[11px] font-bold text-primary flex items-center gap-1 hover:underline"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Table QR</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Code Modal for Table */}
      {qrModalTable && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setQrModalTable(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Table #{qrModalTable.number} QR Tag</h3>
                <p className="text-xs text-slate-400">{restaurantName}</p>
              </div>
              <button
                onClick={() => setQrModalTable(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Canvas */}
            <div className="flex flex-col items-center justify-center my-6">
              <div ref={qrCanvasRef} className="bg-white border-4 border-slate-900 rounded-3xl p-5 shadow-xl text-center">
                <QRCodeCanvas
                  value={getTableQrUrl(qrModalTable.number)}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  level="H"
                  includeMargin={true}
                />
                <div className="mt-3">
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">SCAN TO ORDER</span>
                  <span className="text-xs font-black text-slate-900">TABLE #{qrModalTable.number}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 font-mono mt-4 break-all bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center w-full">
                {getTableQrUrl(qrModalTable.number)}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => handleDownloadTableQr(qrModalTable.number)}
                className="flex items-center justify-center space-x-1.5 bg-primary text-white py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>

              <button
                onClick={() => handlePrintTableQr(qrModalTable.number)}
                className="flex items-center justify-center space-x-1.5 bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                onClick={() => window.open(getTableQrUrl(qrModalTable.number), '_blank')}
                className="flex items-center justify-center space-x-1.5 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
