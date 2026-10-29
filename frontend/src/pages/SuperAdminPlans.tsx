import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import {
  Diamond,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Star,
  Power,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  RefreshCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxItems: string;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  ctaText: string;
  ctaLink: string;
  orderIndex: number;
  createdAt?: string;
  updatedAt?: string;
}

const FEATURE_SUGGESTIONS = [
  'Custom QR Table Generator',
  'Customer Digital Menu & Ordering',
  'Real-Time Kitchen Order Pipeline',
  'Continuous Audio Ringtone Alerts',
  'Live Customer Review & Feedback',
  'Staff & Waiter Operations Console',
  'Unlimited Food Items & Categories',
  'Daily Revenue & Sales Analytics',
  'Promotional Banner Ad Campaigns',
  'Multi-Branch Consolidated Hub',
  'Direct UPI Zero Fee Payments',
  'Priority 24/7 WhatsApp & Phone Support',
  '99.99% Uptime SLA',
];

export const SuperAdminPlans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [featureInput, setFeatureInput] = useState('');

  // Form State
  const [form, setForm] = useState<{
    name: string;
    description: string;
    priceMonthly: number | string;
    priceYearly: number | string;
    maxItems: string;
    features: string[];
    isPopular: boolean;
    isActive: boolean;
    ctaText: string;
    ctaLink: string;
    orderIndex: number;
  }>({
    name: '',
    description: '',
    priceMonthly: '',
    priceYearly: '',
    maxItems: 'Unlimited Items',
    features: [],
    isPopular: false,
    isActive: true,
    ctaText: 'Start 14-Day Free Trial',
    ctaLink: '/register',
    orderIndex: 1,
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/plans/admin/all');
      if (res.data?.plans) {
        setPlans(res.data.plans);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load pricing plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFeatureInput('');
    setForm({
      name: '',
      description: '',
      priceMonthly: 1999,
      priceYearly: 19190,
      maxItems: 'Unlimited Items',
      features: [
        'Instant Table QR Generator',
        'Customer Digital Menu & Ordering',
        'Real-Time Kitchen Display System',
        'Continuous Incoming Order Ringtone',
        'Live Customer Feedback & Ratings',
        '24/7 WhatsApp Support',
      ],
      isPopular: false,
      isActive: true,
      ctaText: 'Start 14-Day Free Trial',
      ctaLink: '/register',
      orderIndex: plans.length + 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setFeatureInput('');
    setForm({
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      maxItems: plan.maxItems || 'Unlimited Items',
      features: [...(plan.features || [])],
      isPopular: Boolean(plan.isPopular),
      isActive: Boolean(plan.isActive),
      ctaText: plan.ctaText || 'Start 14-Day Free Trial',
      ctaLink: plan.ctaLink || '/register',
      orderIndex: plan.orderIndex || 1,
    });
    setModalOpen(true);
  };

  const handleToggleActive = async (plan: Plan) => {
    try {
      const updatedStatus = !plan.isActive;
      await api.put(`/plans/admin/${plan.id}`, { isActive: updatedStatus });
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, isActive: updatedStatus } : p)));
      setSuccessMsg(`Plan "${plan.name}" ${updatedStatus ? 'activated' : 'deactivated'}.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update plan status.');
    }
  };

  const handleTogglePopular = async (plan: Plan) => {
    try {
      const updatedPopular = !plan.isPopular;
      await api.put(`/plans/admin/${plan.id}`, { isPopular: updatedPopular });
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, isPopular: updatedPopular } : p)));
      setSuccessMsg(`Plan "${plan.name}" marked as ${updatedPopular ? 'Most Popular' : 'Standard'}.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update popular badge.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    try {
      await api.delete(`/plans/admin/${id}`);
      setPlans((prev) => prev.filter((p) => p.id !== id));
      setSuccessMsg(`Plan "${name}" has been deleted.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete plan.');
    }
  };

  const handleAddFeature = (featToAdd?: string) => {
    const text = (featToAdd || featureInput).trim();
    if (!text) return;
    if (!form.features.includes(text)) {
      setForm((prev) => ({ ...prev, features: [...prev.features, text] }));
    }
    setFeatureInput('');
  };

  const handleRemoveFeature = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        ...form,
        priceMonthly: parseFloat(String(form.priceMonthly)),
        priceYearly: form.priceYearly
          ? parseFloat(String(form.priceYearly))
          : Math.round(Number(form.priceMonthly) * 12 * 0.8),
        orderIndex: Number(form.orderIndex) || 0,
      };

      if (editingPlan) {
        const res = await api.put(`/plans/admin/${editingPlan.id}`, payload);
        setPlans((prev) => prev.map((p) => (p.id === editingPlan.id ? res.data.plan : p)));
        setSuccessMsg(`Plan "${form.name}" updated successfully!`);
      } else {
        const res = await api.post('/plans/admin', payload);
        setPlans((prev) => [...prev, res.data.plan]);
        setSuccessMsg(`New SaaS tier "${form.name}" created successfully!`);
      }

      setModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save plan. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const activePlansCount = plans.filter((p) => p.isActive).length;
  const avgMonthly =
    plans.length > 0
      ? Math.round(plans.reduce((acc, p) => acc + (p.priceMonthly || 0), 0) / plans.length)
      : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-14 font-sans antialiased text-slate-800 dark:text-slate-200 transition-colors duration-300">
      
      {/* ── Executive Top Header Banner (Matches Landing Page Aesthetics) ── */}
      <div className="relative bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-orange-500/10 dark:bg-orange-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-rose-500/10 dark:bg-rose-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/40 text-orange-600 dark:text-orange-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SaaS Plan Architecture</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Multi-Tier Pricing</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              SaaS Pricing & Packages
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Configure subscription tiers, set monthly and annual billing rates, manage dish limits, and define feature lists shown to restaurant partners.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-orange-500/25 active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create SaaS Tier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-4 py-3 rounded-2xl flex items-center space-x-2 shadow-xs"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs font-medium px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="p-1 hover:text-rose-900 dark:hover:text-rose-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Metrics Overview Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Tiers</span>
            <div className="h-1.5 w-7 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
          </div>
          <div>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight block">
              {activePlansCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 block">
              Published on live website
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total SaaS Plans</span>
            <div className="h-1.5 w-7 rounded-full bg-gradient-to-r from-orange-500 to-rose-500" />
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight block">
              {plans.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 block">
              Configured in platform database
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Average Monthly</span>
            <div className="h-1.5 w-7 rounded-full bg-gradient-to-r from-violet-500 to-purple-500" />
          </div>
          <div>
            <span className="text-3xl font-black text-orange-600 dark:text-orange-400 font-mono tracking-tight block">
              ₹{avgMonthly.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 block">
              Standard tier monthly base
            </span>
          </div>
        </div>
      </div>

      {/* ── Plans List Grid ── */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold">Loading SaaS pricing tiers...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
          <Diamond className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">No SaaS pricing plans found</h3>
          <p className="text-slate-400 dark:text-slate-500 text-xs max-w-sm mx-auto">
            Create pricing packages for restaurant owners with custom dish limits, table counts, and feature sets.
          </p>
          <button
            onClick={openCreateModal}
            className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            Create First Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white dark:bg-slate-900 rounded-3xl border p-6 shadow-xs flex flex-col justify-between relative transition-all ${
                plan.isPopular
                  ? 'border-orange-500 dark:border-orange-500 ring-2 ring-orange-500/20 shadow-md shadow-orange-500/5'
                  : plan.isActive
                  ? 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  : 'border-slate-200/60 dark:border-slate-800/60 opacity-70 bg-slate-50/50 dark:bg-slate-800/20'
              }`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-md shadow-orange-500/30 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-white" />
                  <span>Most Popular Tier</span>
                </span>
              )}

              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                        plan.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${plan.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      {plan.isActive ? 'Live' : 'Draft'}
                    </span>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 font-mono">#{plan.orderIndex}</span>
                  </div>

                  {/* Quick Toggle Controls */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleTogglePopular(plan)}
                      className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                        plan.isPopular
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40 hover:bg-amber-100'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200/80 dark:border-slate-700 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                      title={plan.isPopular ? 'Remove Popular Badge' : 'Set as Most Popular'}
                    >
                      <Star className={`w-3.5 h-3.5 ${plan.isPopular ? 'fill-amber-500 text-amber-500' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(plan)}
                      className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                        plan.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-100'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200/80 dark:border-slate-700 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                      title={plan.isActive ? 'Deactivate Plan' : 'Activate Plan'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Plan Title & Description */}
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight mt-1">{plan.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed min-h-[36px]">{plan.description}</p>

                {/* Pricing Block */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 mb-5">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-black text-slate-950 dark:text-white font-mono tracking-tight">₹{plan.priceMonthly}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-bold ml-1">/ mo</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 px-2 py-0.5 rounded-md font-mono block">
                        ₹{Math.round(plan.priceYearly / 12)}/mo
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 block">
                        Billed ₹{plan.priceYearly} yearly
                      </span>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    <span>Menu Dish Limit:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{plan.maxItems}</span>
                  </div>
                </div>

                {/* Included Features List */}
                <div className="space-y-2 mb-6">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Included Features
                  </span>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {(plan.features || []).map((feat, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(plan)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span>Edit Plan</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(plan.id, plan.name)}
                  className="p-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 rounded-xl transition-colors cursor-pointer"
                  title="Delete Tier"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── CREATE / EDIT PLAN MODAL ─── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80 dark:border-slate-800 text-left relative transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1 mb-6">
                <h3 className="text-xl font-black text-slate-950 dark:text-white">
                  {editingPlan ? `Edit "${editingPlan.name}"` : 'Create New SaaS Pricing Tier'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure pricing rates, feature lists, and promotional settings for this subscription plan.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Plan Name & Order Index */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Plan Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Professional Plan"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={form.orderIndex}
                      onChange={(e) => setForm({ ...form, orderIndex: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Target Audience / Description *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Designed for high-turnover restaurants requiring continuous kitchen alerts and multi-device ordering."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none placeholder:text-slate-400"
                  />
                </div>

                {/* Pricing & Limits */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Monthly Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={form.priceMonthly}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          priceMonthly: val,
                          priceYearly: !editingPlan && val ? Math.round(Number(val) * 12 * 0.8) : prev.priceYearly,
                        }));
                      }}
                      placeholder="1999"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black font-mono outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Yearly Price (₹/year) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={form.priceYearly}
                      onChange={(e) => setForm({ ...form, priceYearly: e.target.value })}
                      placeholder="19190"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black font-mono outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-emerald-600 dark:text-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Max Menu Items
                    </label>
                    <input
                      type="text"
                      value={form.maxItems}
                      onChange={(e) => setForm({ ...form, maxItems: e.target.value })}
                      placeholder="Unlimited Items"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Features Builder */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Plan Feature Bullets ({form.features.length})
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                      placeholder="Type a feature bullet (e.g. Multi-outlet sync)..."
                      className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddFeature()}
                      className="px-4 py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Suggestions Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold self-center mr-1">Quick Add:</span>
                    {FEATURE_SUGGESTIONS.slice(0, 5).map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAddFeature(sug)}
                        className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-600 dark:hover:text-orange-400 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>{sug}</span>
                      </button>
                    ))}
                  </div>

                  {/* Active Features List */}
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 pt-2">
                    {form.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                          title="Remove Feature"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Call-To-Action Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Button CTA Text
                    </label>
                    <input
                      type="text"
                      value={form.ctaText}
                      onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                      placeholder="Start 14-Day Free Trial"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Button Link
                    </label>
                    <input
                      type="text"
                      value={form.ctaLink}
                      onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                      placeholder="/register"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Publication Flags */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.isPopular}
                      onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 accent-orange-600 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>Highlight as "Most Popular"</span>
                    </span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 accent-orange-600 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Active (Publish to Public Pricing Page)
                    </span>
                  </label>
                </div>

                {/* Modal Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold py-3 rounded-xl text-xs shadow-md shadow-orange-500/25 transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {submitting ? (
                      <span>Saving Plan...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>{editingPlan ? 'Save Changes' : 'Publish Plan'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
