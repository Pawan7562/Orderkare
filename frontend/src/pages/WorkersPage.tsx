import { useState, useEffect } from 'react';
import { Shield, Plus, Users, Trash2, Phone, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Worker {
  id: string;
  name: string;
  role: 'CHEF' | 'WAITER' | 'ADMIN';
  status: 'ACTIVE' | 'BREAK' | 'OFFLINE';
  phone: string;
}

export const WorkersPage = () => {
  const { user } = useAuthStore();
  const restaurantId = user?.restaurantId || (user as any)?.restaurant?.id || 'default';
  const storageKey = `orderkare_staff_${restaurantId}`;

  const [workers, setWorkers] = useState<Worker[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'CHEF' | 'WAITER'>('WAITER');
  const [phone, setPhone] = useState('');

  // Save workers when changed
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(workers));
    } catch {}
  }, [workers, storageKey]);

  const handleAddWorker = () => {
    if (!name.trim() || !phone.trim()) return;
    const newWorker: Worker = {
      id: `w-${Math.random().toString(36).substring(2, 8)}`,
      name: name.trim(),
      role,
      status: 'ACTIVE',
      phone: phone.trim(),
    };
    setWorkers(prev => [...prev, newWorker]);
    setName('');
    setPhone('');
    setShowAddForm(false);
  };

  const handleDeleteWorker = (id: string) => {
    setWorkers(prev => prev.filter(w => w.id !== id));
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workers & Staff</h1>
          <p className="text-slate-500 text-sm">Manage restaurant roles, contact numbers, and duty states</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Register Staff Member</h3>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Full Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Sunil Kumar"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 9999999999"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-sm px-4 py-2 outline-none font-medium"
              >
                <option value="WAITER">Waiter / Steward</option>
                <option value="CHEF">Kitchen Chef</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleAddWorker}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl shadow-sm shadow-orange-200"
              >
                Save Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Table or Empty State */}
      {workers.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center flex flex-col items-center justify-center max-w-xl mx-auto shadow-xs">
          <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No staff members added</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            Add your kitchen chefs and dining stewards to coordinate orders and staff shifts.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-5 flex items-center space-x-2 bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors shadow-md shadow-orange-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Staff Member</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Phone</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workers.map(worker => (
                  <tr key={worker.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-orange-100 text-orange-700 rounded-xl flex items-center justify-center font-bold">
                          {worker.name[0]?.toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900">{worker.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Shield className="w-3.5 h-3.5 text-slate-400" />
                        <span>{worker.role}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{worker.phone}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(worker.id)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider transition-opacity hover:opacity-80 ${statusThemes[worker.status]}`}
                      >
                        {worker.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => toggleStatus(worker.id)}
                          className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                        >
                          Change Status
                        </button>
                        <button
                          onClick={() => handleDeleteWorker(worker.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Delete staff member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
