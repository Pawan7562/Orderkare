import { useState } from 'react';
import { Shield, Plus, UserCheck, UserX, Clock } from 'lucide-react';

interface Worker {
  id: string;
  name: string;
  role: 'CHEF' | 'WAITER' | 'ADMIN';
  status: 'ACTIVE' | 'BREAK' | 'OFFLINE';
  phone: string;
}

export const WorkersPage = () => {
  const [workers, setWorkers] = useState<Worker[]>([
    { id: 'w1', name: 'Rajesh Kumar', role: 'ADMIN', status: 'ACTIVE', phone: '+91 120 4567 890' },
    { id: 'w2', name: 'Vikram Singh', role: 'CHEF', status: 'ACTIVE', phone: '+91 9988776655' },
    { id: 'w3', name: 'Sunita Sharma', role: 'WAITER', status: 'BREAK', phone: '+91 9876543210' },
    { id: 'w4', name: 'Amit Patel', role: 'WAITER', status: 'ACTIVE', phone: '+91 8877665544' },
    { id: 'w5', name: 'Priya Verma', role: 'CHEF', status: 'OFFLINE', phone: '+91 7766554433' },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'CHEF' | 'WAITER'>('WAITER');
  const [phone, setPhone] = useState('');

  const handleAddWorker = () => {
    if (!name.trim() || !phone.trim()) return;
    const newWorker: Worker = {
      id: `w-${Math.random().toString(36).substring(2, 8)}`,
      name,
      role,
      status: 'ACTIVE',
      phone,
    };
    setWorkers([...workers, newWorker]);
    setName(''); setPhone(''); setShowAddForm(false);
  };

  const toggleStatus = (id: string) => {
    setWorkers(prev =>
      prev.map(w => {
        if (w.id !== id) return w;
        const nextStatusMap: Record<Worker['status'], Worker['status']> = {
          ACTIVE: 'BREAK',
          BREAK: 'OFFLINE',
          OFFLINE: 'ACTIVE',
        };
        return { ...w, status: nextStatusMap[w.status] };
      })
    );
  };

  const statusThemes: Record<Worker['status'], string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    BREAK: 'bg-amber-100 text-amber-700',
    OFFLINE: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workers & Staff</h1>
          <p className="text-slate-500 text-sm">Manage roles, contact details, and live kitchen availability</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/95 transition-colors shadow-md shadow-primary/10"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-xl shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Register Staff Member</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sunil Kumar" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9999999999" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Role Selection</label>
              <select value={role} onChange={e => setRole(e.target.value as any)} className="bg-slate-50 border border-slate-200 rounded-xl text-sm px-4 py-2 outline-none">
                <option value="WAITER">Waiter / Steward</option>
                <option value="CHEF">Kitchen Chef</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={handleAddWorker} className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl">Register</button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Phone</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workers.map(worker => (
                <tr key={worker.id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-700">
                        {worker.name[0]}
                      </div>
                      <span className="font-semibold text-slate-900">{worker.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                      <Shield className="w-3 h-3 text-slate-400" />
                      <span>{worker.role}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-mono text-xs">{worker.phone}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStatus(worker.id)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${statusThemes[worker.status]}`}
                    >
                      {worker.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    <button onClick={() => toggleStatus(worker.id)} className="text-primary font-medium hover:underline">Toggle State</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
