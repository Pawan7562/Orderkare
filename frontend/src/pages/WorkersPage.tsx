import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Users,
  Trash2,
  Phone,
  X,
  ChefHat,
  Utensils,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  Check,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'CHEF' | 'WAITER'>('WAITER');
  const [phone, setPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CHEF' | 'WAITER' | 'BREAK'>('ALL');

  // Persist workers to local storage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(workers));
    } catch {}
  }, [workers, storageKey]);

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    const newWorker: Worker = {
      id: `w-${Math.random().toString(36).substring(2, 8)}`,
      name: name.trim(),
      role,
      status: 'ACTIVE',
      phone: phone.trim(),
    };
    setWorkers((prev) => [...prev, newWorker]);
    setName('');
    setPhone('');
    setRole('WAITER');
    setShowAddModal(false);
  };

  const handleDeleteWorker = (id: string, workerName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${workerName} from staff?`)) return;
    setWorkers((prev) => prev.filter((w) => w.id !== id));
  };

  const updateWorkerStatus = (id: string, nextStatus: Worker['status']) => {
    setWorkers((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: nextStatus } : w))
    );
  };

  // Metrics
  const totalStaff = workers.length;
  const activeStaff = workers.filter((w) => w.status === 'ACTIVE').length;
  const totalChefs = workers.filter((w) => w.role === 'CHEF').length;
  const totalWaiters = workers.filter((w) => w.role === 'WAITER').length;
  const onBreakStaff = workers.filter((w) => w.status === 'BREAK').length;

  // Filtered workers
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      if (statusFilter === 'ACTIVE' && w.status !== 'ACTIVE') return false;
      if (statusFilter === 'BREAK' && w.status !== 'BREAK') return false;
      if (statusFilter === 'CHEF' && w.role !== 'CHEF') return false;
      if (statusFilter === 'WAITER' && w.role !== 'WAITER') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = w.name.toLowerCase().includes(q);
        const matchesPhone = w.phone.includes(q);
        return matchesName || matchesPhone;
      }
      return true;
    });
  }, [workers, statusFilter, searchQuery]);

  return (
    <div className="space-y-7 pb-12 max-w-7xl mx-auto">
      {/* ─── 1. TOP HEADER & PRIMARY ACTIONS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Workers & Staff
            </h1>
            <span className="inline-flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 text-xs px-3 py-1 rounded-full font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Shift Operations</span>
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage restaurant kitchen chefs, dining stewards, contact details, and duty status
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs shadow-orange-500/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* ─── 2. KPI METRICS SUMMARY RIBBON ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 select-none ${
            statusFilter === 'ALL'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md'
              : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              Total Staff
            </span>
            <Users className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-black mt-2 font-mono">{totalStaff}</p>
          <p className="text-[11px] opacity-70 mt-1 font-medium">Registered members</p>
        </div>

        <div
          onClick={() => setStatusFilter('ACTIVE')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 select-none ${
            statusFilter === 'ACTIVE'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-emerald-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              Active on Duty
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black mt-2 text-emerald-600 dark:text-emerald-400 font-mono">
            {activeStaff}
          </p>
          <p className="text-[11px] opacity-70 mt-1 font-medium">Currently handling orders</p>
        </div>

        <div
          onClick={() => setStatusFilter('CHEF')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 select-none ${
            statusFilter === 'CHEF'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-indigo-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              Kitchen Chefs
            </span>
            <ChefHat className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black mt-2 text-indigo-600 dark:text-indigo-400 font-mono">
            {totalChefs}
          </p>
          <p className="text-[11px] opacity-70 mt-1 font-medium">Food preparation staff</p>
        </div>

        <div
          onClick={() => setStatusFilter('WAITER')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 select-none ${
            statusFilter === 'WAITER'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md'
              : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-amber-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              Floor Stewards
            </span>
            <Utensils className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black mt-2 text-amber-600 dark:text-amber-400 font-mono">
            {totalWaiters}
          </p>
          <p className="text-[11px] opacity-70 mt-1 font-medium">Table service & dining</p>
        </div>
      </div>

      {/* ─── 3. SEARCH & STATUS FILTERS TOOLBAR ─── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name or phone..."
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

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Staff ({totalStaff})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Active ({activeStaff})</span>
          </button>
          <button
            onClick={() => setStatusFilter('CHEF')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'CHEF'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <ChefHat className="w-3 h-3" />
            <span>Chefs ({totalChefs})</span>
          </button>
          <button
            onClick={() => setStatusFilter('WAITER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'WAITER'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Utensils className="w-3 h-3" />
            <span>Waiters ({totalWaiters})</span>
          </button>
          {onBreakStaff > 0 && (
            <button
              onClick={() => setStatusFilter('BREAK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === 'BREAK'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              On Break ({onBreakStaff})
            </button>
          )}
        </div>
      </div>

      {/* ─── 4. STAFF ROSTER TABLE ─── */}
      {filteredWorkers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3 shadow-2xs">
          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {searchQuery || statusFilter !== 'ALL'
                ? 'No matching staff members found'
                : 'No staff members registered yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search terms or clearing the role filter.'
                : 'Add your kitchen chefs and floor stewards to coordinate orders, shift duties, and table service.'}
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
              Add First Staff Member
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/60 dark:bg-slate-800/50">
                  <th className="px-6 py-3.5 font-bold">Staff Member</th>
                  <th className="px-6 py-3.5 font-bold">Role & Duties</th>
                  <th className="px-6 py-3.5 font-bold">Contact Number</th>
                  <th className="px-6 py-3.5 font-bold">Duty Status</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredWorkers.map((worker) => {
                  const isChef = worker.role === 'CHEF';
                  const isActive = worker.status === 'ACTIVE';
                  const isOnBreak = worker.status === 'BREAK';

                  return (
                    <tr
                      key={worker.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Initial Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black uppercase text-sm shrink-0">
                            {worker.name[0]?.toUpperCase() || 'S'}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white block">
                              {worker.name}
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                              ID: {worker.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Pill */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${
                            isChef
                              ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {isChef ? (
                            <ChefHat className="w-3.5 h-3.5" />
                          ) : (
                            <Utensils className="w-3.5 h-3.5" />
                          )}
                          <span>{isChef ? 'Kitchen Chef' : 'Floor Steward'}</span>
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="px-6 py-4">
                        <a
                          href={`tel:${worker.phone}`}
                          className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-orange-600 font-mono text-xs font-medium transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{worker.phone}</span>
                        </a>
                      </td>

                      {/* Status Badges & Quick Switch */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateWorkerStatus(worker.id, 'ACTIVE')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              isActive
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            Active
                          </button>
                          <button
                            onClick={() => updateWorkerStatus(worker.id, 'BREAK')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              isOnBreak
                                ? 'bg-amber-500 text-white shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            Break
                          </button>
                          <button
                            onClick={() => updateWorkerStatus(worker.id, 'OFFLINE')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              worker.status === 'OFFLINE'
                                ? 'bg-slate-600 text-white shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            Off Duty
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteWorker(worker.id, worker.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Remove staff member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── 5. ADD STAFF MEMBER MODAL ─── */}
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
              className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Register Staff Member
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Assign role and contact details for staff coordination
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddWorker} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sunil Kumar"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all placeholder:text-slate-400"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-orange-500 transition-all placeholder:text-slate-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Assigned Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('WAITER')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        role === 'WAITER'
                          ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-700 dark:text-amber-300 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span>Floor Waiter</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('CHEF')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        role === 'CHEF'
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      <ChefHat className="w-3.5 h-3.5" />
                      <span>Kitchen Chef</span>
                    </button>
                  </div>
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
                    disabled={!name.trim() || !phone.trim()}
                    className="flex-1 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 rounded-xl shadow-xs transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Register Staff</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
