import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import {
  Diamond,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Check,
  X,
  Star,
  Power,
  Layers,
  TrendingUp,
  Percent,
  ArrowRight,
  ShieldCheck,
  AlertCircle
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
    orderIndex: 1
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/plans/all');
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
      priceYearly: 1599,
      maxItems: 'Unlimited Items',
      features: [
        'Instant Table QR Generator',
        'Customer Digital Menu & Ordering',
        'Real-Time Kitchen Display System',
        'Continuous Incoming Order Ringtone',
        'Live Customer Feedback & Ratings',
        '24/7 WhatsApp Support'
      ],
      isPopular: false,
      isActive: true,
      ctaText: 'Start 14-Day Free Trial',
      ctaLink: '/register',
      orderIndex: plans.length + 1
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
      orderIndex: plan.orderIndex || 1
    });
    setModalOpen(true);
  };

  const handleToggleActive = async (plan: Plan) => {
    try {
      const updatedStatus = !plan.isActive;
      await api.put(`/plans/${plan.id}`, { isActive: updatedStatus });
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, isActive: updatedStatus } : p));
      setSuccessMsg(`Plan "${plan.name}" ${updatedStatus ? 'activated' : 'deactivated'}.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update plan status.');
    }
  };

  const handleTogglePopular = async (plan: Plan) => {
    try {
      const updatedPopular = !plan.isPopular;
      await api.put(`/plans/${plan.id}`, { isPopular: updatedPopular });
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, isPopular: updatedPopular } : p));
      setSuccessMsg(`Plan "${plan.name}" marked as ${updatedPopular ? 'Most Popular' : 'Standard'}.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update popular badge.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    try {
      await api.delete(`/plans/${id}`);
      setPlans(prev => prev.filter(p => p.id !== id));
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
      setForm(prev => ({ ...prev, features: [...prev.features, text] }));
    }
    setFeatureInput('');
  };

  const handleRemoveFeature = (idx: number) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx)
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
        priceYearly: parseFloat(String(form.priceYearly || Math.round(Number(form.priceMonthly) * 0.8))),
        orderIndex: Number(form.orderIndex) || 0,
      };

      if (editingPlan) {
        const res = await api.put(`/plans/${editingPlan.id}`, payload);
        setPlans(prev => prev.map(p => p.id === editingPlan.id ? res.data.plan : p));
        setSuccessMsg(`Plan "${form.name}" updated successfully!`);
      } else {
        const res = await api.post('/plans', payload);
        setPlans(prev => [...prev, res.data.plan]);
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

  const activePlansCount = plans.filter(p => p.isActive).length;
  const avgMonthly = plans.length > 0 
    ? Math.round(plans.reduce((acc, p) => acc + (p.priceMonthly || 0), 0) / plans.length)
    : 0;

  return (
    <div className="space-y-7 pb-16 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shadow-2xs">
              <Diamond className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">SaaS Pricing Plans</h1>
          </div>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Configure live subscription tiers, billing pricing, limits, and feature lists displayed to hotel owners.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-md shadow-rose-600/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create New SaaS Tier</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-3 rounded-2xl flex items-center space-x-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold px-4 py-3 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Tiers</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 font-mono">{activePlansCount}</span>
            <span className="text-xs text-slate-500 font-medium">Published on public website</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total SaaS Plans</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">{plans.length}</span>
            <span className="text-xs text-slate-500 font-medium">Configured in database</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Average Monthly</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-rose-600 font-mono">₹{avgMonthly}</span>
            <span className="text-xs text-slate-500 font-medium">Per restaurant subscriber</span>
          </div>
        </div>
      </div>

      {/* Plans List Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold">Loading SaaS pricing tiers...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Diamond className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">No SaaS pricing plans currently found</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            Create custom pricing packages for restaurant owners with tailored dish limits, table counts, and features.
          </p>
          <button
            onClick={openCreateModal}
            className="bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs hover:bg-rose-700 transition-colors"
          >
            Create First Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-3xl border p-6 shadow-xs flex flex-col justify-between relative transition-all ${
                plan.isPopular 
                  ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-md shadow-rose-500/5' 
                  : plan.isActive 
                  ? 'border-slate-200 hover:border-slate-300' 
                  : 'border-slate-200/60 opacity-70 bg-slate-50/50'
              }`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-600 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-md shadow-rose-600/30 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-white" />
                  <span>Most Popular Tier</span>
                </span>
              )}

              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        plan.isActive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${plan.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      {plan.isActive ? 'Live' : 'Draft'}
                    </span>
                    <span className="text-xs font-bold text-slate-400 font-mono">#{plan.orderIndex}</span>
                  </div>

                  {/* Quick Toggle Controls */}
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleTogglePopular(plan)}
                      className={`p-1.5 rounded-lg border text-xs transition-colors ${
                        plan.isPopular 
                          ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' 
                          : 'bg-slate-100 text-slate-400 border-slate-200 hover:text-slate-600'
                      }`}
                      title={plan.isPopular ? 'Remove Popular Badge' : 'Set as Most Popular'}
                    >
                      <Star className={`w-3.5 h-3.5 ${plan.isPopular ? 'fill-amber-500 text-amber-500' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(plan)}
                      className={`p-1.5 rounded-lg border text-xs transition-colors ${
                        plan.isActive 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-slate-100 text-slate-400 border-slate-200 hover:text-slate-600'
                      }`}
                      title={plan.isActive ? 'Deactivate Plan' : 'Activate Plan'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Plan Title & Tagline */}
                <h3 className="font-black text-slate-900 text-lg tracking-tight mt-1">{plan.name}</h3>
                <p className="text-xs text-slate-500 mb-5 leading-relaxed min-h-[36px]">{plan.description}</p>
                
                {/* Pricing Block */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-5">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-black text-slate-950 font-mono tracking-tight">₹{plan.priceMonthly}</span>
                      <span className="text-xs text-slate-500 font-bold ml-1">/ mo</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-mono">
                        ₹{plan.priceYearly}/mo (annual)
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span>Dish Limit:</span>
                    <span className="font-mono text-slate-900">{plan.maxItems}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2 mb-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Included Features</span>
                  <ul className="space-y-2.5 text-xs text-slate-700">
                    {(plan.features || []).map((feat, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => openEditModal(plan)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Edit Plan</span>
                </button>

                <button
                  onClick={() => handleDelete(plan.id, plan.name)}
                  className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                  title="Delete Tier"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── CREATE / EDIT MODAL ─── */}
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
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 text-left relative"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1 mb-6">
                <h3 className="text-xl font-black text-slate-950">
                  {editingPlan ? `Edit "${editingPlan.name}"` : 'Create New SaaS Pricing Tier'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure the pricing, feature list, and promotional badges for this subscription plan.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Plan Name & Order Index */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Plan Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Professional Plan"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-rose-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={form.orderIndex}
                      onChange={e => setForm({ ...form, orderIndex: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono outline-none focus:bg-white focus:border-rose-600 transition-all"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Audience / Description *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Designed for busy sit-down restaurants requiring live kitchen alerts and analytics."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-rose-600 transition-all resize-none"
                  />
                </div>

                {/* Pricing & Limits */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Monthly Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={form.priceMonthly}
                      onChange={e => {
                        const val = e.target.value;
                        setForm({
                          ...form,
                          priceMonthly: val,
                          priceYearly: val ? Math.round(Number(val) * 0.8) : ''
                        });
                      }}
                      placeholder="1999"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black font-mono outline-none focus:bg-white focus:border-rose-600 transition-all text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Yearly (₹/mo) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={form.priceYearly}
                      onChange={e => setForm({ ...form, priceYearly: e.target.value })}
                      placeholder="1599"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black font-mono outline-none focus:bg-white focus:border-rose-600 transition-all text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Max Food Items
                    </label>
                    <input
                      type="text"
                      value={form.maxItems}
                      onChange={e => setForm({ ...form, maxItems: e.target.value })}
                      placeholder="Unlimited Items"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-rose-600 transition-all"
                    />
                  </div>
                </div>

                {/* Features Builder */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Plan Feature Bullets ({form.features.length})
                  </label>

                  {/* Add Feature input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={featureInput}
                      onChange={e => setFeatureInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                      placeholder="Type a feature (e.g. Multi-outlet kitchen sync)..."
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-rose-600 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddFeature()}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Quick Feature Suggestions */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-bold self-center mr-1">Quick Add:</span>
                    {FEATURE_SUGGESTIONS.slice(0, 5).map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAddFeature(sug)}
                        className="text-[10px] font-bold bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 px-2 py-1 rounded-lg border border-slate-200 transition-all flex items-center gap-1"
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
                        className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-800"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(idx)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Button CTA Text
                    </label>
                    <input
                      type="text"
                      value={form.ctaText}
                      onChange={e => setForm({ ...form, ctaText: e.target.value })}
                      placeholder="Start 14-Day Free Trial"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-rose-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Button Link
                    </label>
                    <input
                      type="text"
                      value={form.ctaLink}
                      onChange={e => setForm({ ...form, ctaLink: e.target.value })}
                      placeholder="/register"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-rose-600 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Flags Checkboxes */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.isPopular}
                      onChange={e => setForm({ ...form, isPopular: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>Highlight as "Most Popular"</span>
                    </span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={e => setForm({ ...form, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Active (Publish to Public Pricing Page)
                    </span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-xs shadow-md shadow-rose-600/20 transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center space-x-2"
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
