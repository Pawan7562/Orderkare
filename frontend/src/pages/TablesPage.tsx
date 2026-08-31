import { useState } from 'react';
import { LayoutGrid, Grid2X2, AlertCircle, CheckCircle, RefreshCcw } from 'lucide-react';

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

  const statusThemes: Record<Table['status'], { card: string; badge: string; icon: any }> = {
    FREE: { card: 'border-emerald-100 hover:border-emerald-300 bg-emerald-50/20', badge: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    OCCUPIED: { card: 'border-primary/10 hover:border-primary/30 bg-primary/5', badge: 'bg-primary/10 text-primary', icon: Grid2X2 },
    DIRTY: { card: 'border-amber-100 hover:border-amber-300 bg-amber-50/20', badge: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Table Management</h1>
          <p className="text-slate-500 text-sm">Monitor table states, seating layout, and billing routing</p>
        </div>
        <button className="flex items-center space-x-2 bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50">
          <LayoutGrid className="w-4 h-4" />
          <span>Edit Floorplan</span>
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        {tables.map(table => {
          const theme = statusThemes[table.status];
          const Icon = theme.icon;
          return (
            <div
              key={table.id}
              onClick={() => toggleTableStatus(table.id)}
              className={`border-2 rounded-3xl p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between h-44 ${theme.card} group relative`}
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

              <div className="space-y-1.5 z-10">
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

              {/* Hover quick tip */}
              <div className="absolute inset-0 bg-slate-950/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
