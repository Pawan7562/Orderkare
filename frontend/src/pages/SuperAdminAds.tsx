import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Tag,
  Percent,
  Eye,
  ArrowRight,
  X,
  Award,
  Power
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Advertisement {
  id: string;
  sponsor: string;
  badge: string;
  title: string;
  description: string;
  discountText: string;
  promoCode?: string | null;
  imageUrl: string;
  ctaText: string;
  ctaLink?: string | null;
  bgGradient: string;
  isActive: boolean;
  orderIndex: number;
  createdAt: string;
}

const GRADIENT_PRESETS = [
  { label: 'Ruby / Dark Slate', value: 'from-red-950/90 via-slate-900 to-slate-950' },
  { label: 'Amber / Dark Bronze', value: 'from-amber-950/90 via-slate-900 to-slate-950' },
  { label: 'Emerald / Forest Dark', value: 'from-emerald-950/90 via-slate-900 to-slate-950' },
  { label: 'Indigo / Midnight Blue', value: 'from-indigo-950/90 via-slate-900 to-slate-950' },
  { label: 'Rose / Royal Velvet', value: 'from-rose-950/90 via-slate-900 to-slate-950' },
];

export const SuperAdminAds: React.FC = () => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    sponsor: '',
    badge: 'Sponsored Partner',
    title: '',
    description: '',
    discountText: '',
    promoCode: '',
    imageUrl: '',
    ctaText: 'Claim Offer',
    ctaLink: '',
    bgGradient: 'from-red-950/90 via-slate-900 to-slate-950',
    isActive: true,
    orderIndex: 0
  });

  const fetchAds = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ads/all');
      if (res.data?.ads) {
        setAds(res.data.ads);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load advertisements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const openCreateModal = () => {
    setEditingAd(null);
    setForm({
      sponsor: '',
      badge: 'Sponsored Partner',
      title: '',
      description: '',
      discountText: '',
      promoCode: '',
      imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=600&q=80',
      ctaText: 'Claim Offer',
      ctaLink: '',
      bgGradient: 'from-red-950/90 via-slate-900 to-slate-950',
      isActive: true,
      orderIndex: ads.length + 1
    });
    setModalOpen(true);
  };

  const openEditModal = (ad: Advertisement) => {
    setEditingAd(ad);
    setForm({
      sponsor: ad.sponsor,
      badge: ad.badge,
      title: ad.title,
      description: ad.description,
      discountText: ad.discountText,
      promoCode: ad.promoCode || '',
      imageUrl: ad.imageUrl,
      ctaText: ad.ctaText,
      ctaLink: ad.ctaLink || '',
      bgGradient: ad.bgGradient,
      isActive: ad.isActive,
      orderIndex: ad.orderIndex
    });
    setModalOpen(true);
  };

  const handleToggleActive = async (ad: Advertisement) => {
    try {
      const updatedStatus = !ad.isActive;
      await api.put(`/ads/${ad.id}`, { isActive: updatedStatus });
      setAds(prev => prev.map(a => a.id === ad.id ? { ...a, isActive: updatedStatus } : a));
      showSuccess(`"${ad.sponsor}" ad is now ${updatedStatus ? 'Active on customer menus' : 'Deactivated'}.`);
    } catch (err: any) {
      setError('Failed to update ad status.');
    }
  };

  const handleDelete = async (id: string, sponsor: string) => {
    if (!window.confirm(`Are you sure you want to delete the "${sponsor}" advertisement?`)) return;
    try {
      await api.delete(`/ads/${id}`);
      setAds(prev => prev.filter(a => a.id !== id));
      showSuccess(`"${sponsor}" advertisement deleted.`);
    } catch (err: any) {
      setError('Failed to delete ad.');
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (editingAd) {
        const res = await api.put(`/ads/${editingAd.id}`, form);
        setAds(prev => prev.map(a => a.id === editingAd.id ? res.data.ad : a));
        showSuccess('Advertisement updated successfully.');
      } else {
        const res = await api.post('/ads', form);
        setAds(prev => [res.data.ad, ...prev]);
        showSuccess('New advertisement campaign launched.');
      }
      setModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save advertisement.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeAdsCount = ads.filter(a => a.isActive).length;

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-rose-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Megaphone className="w-4 h-4" />
            <span>Monetization & Brand Partnerships</span>
          </div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">
            Customer Menu Advertisements
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Control which sponsored ads and promotional campaigns run across dining room QR menus.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-md shadow-rose-600/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Launch New Ad</span>
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
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Campaigns</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-emerald-600 font-mono">{activeAdsCount}</span>
            <span className="text-xs text-slate-500 font-medium">Running live on QR menus</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Campaigns</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">{ads.length}</span>
            <span className="text-xs text-slate-500 font-medium">Managed in database</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Status Overview</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-700 font-mono">{ads.length - activeAdsCount}</span>
            <span className="text-xs text-slate-500 font-medium">Drafts / Inactive</span>
          </div>
        </div>
      </div>

      {/* Ads List */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold">Loading advertisements...</p>
        </div>
      ) : ads.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Megaphone className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">No advertisements currently configured</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            Create sponsored ads to run brand partnerships, bank dining cashback offers, or special culinary promotions.
          </p>
          <button
            onClick={openCreateModal}
            className="bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs hover:bg-rose-700 transition-colors"
          >
            Create First Ad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className={`bg-white border rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-all ${
                ad.isActive ? 'border-slate-200/90' : 'border-slate-200/50 opacity-70 bg-slate-50/50'
              }`}
            >
              {/* Top Banner Card Simulation */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        ad.isActive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${ad.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      {ad.isActive ? 'Live on Menu' : 'Inactive'}
                    </span>
                    <span className="text-xs font-bold text-slate-600">{ad.sponsor}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleToggleActive(ad)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-colors flex items-center space-x-1 ${
                        ad.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                      title={ad.isActive ? 'Deactivate Ad' : 'Activate Ad'}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{ad.isActive ? 'Active' : 'Turn On'}</span>
                    </button>
                  </div>
                </div>

                {/* Banner Mini Preview */}
                <div className={`p-4 rounded-2xl bg-gradient-to-r ${ad.bgGradient} text-white relative overflow-hidden shadow-inner`}>
                  <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-25 overflow-hidden pointer-events-none">
                    <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="relative z-10 space-y-1">
                    <span className="text-[9px] font-extrabold uppercase bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-amber-300">
                      {ad.badge}
                    </span>
                    <h4 className="text-sm font-black leading-tight max-w-[85%]">{ad.title}</h4>
                    <p className="text-[11px] text-slate-300 max-w-[85%] line-clamp-2">{ad.description}</p>
                    <div className="pt-2 flex items-center space-x-2 text-xs font-bold text-amber-300">
                      <Percent className="w-3.5 h-3.5" />
                      <span>{ad.discountText}</span>
                      {ad.promoCode && (
                        <span className="bg-white/10 px-2 py-0.5 rounded font-mono text-[10px] text-white">
                          Code: {ad.promoCode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Controls */}
              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px] font-mono">
                  CTA: <strong className="text-slate-700">{ad.ctaText}</strong>
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(ad)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-bold flex items-center space-x-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(ad.id, ad.sponsor)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors font-bold flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Ad Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 relative text-left max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1 mb-6">
                <h3 className="text-xl font-black text-slate-950">
                  {editingAd ? 'Edit Advertisement Campaign' : 'Create New Sponsored Ad'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure the banner visuals, sponsor details, voucher incentives, and active visibility.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Sponsor Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Sponsor / Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.sponsor}
                      onChange={e => setForm({ ...form, sponsor: e.target.value })}
                      placeholder="e.g. Coca-Cola Zero Sugar"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-rose-600 transition-all"
                    />
                  </div>

                  {/* Badge Text */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Badge Text
                    </label>
                    <input
                      type="text"
                      value={form.badge}
                      onChange={e => setForm({ ...form, badge: e.target.value })}
                      placeholder="Sponsored Partner / Chef Special"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-rose-600 transition-all"
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Headline / Campaign Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Pair Any Main Course with Chilled Coke"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-rose-600 transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Offer Description *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Get crisp zero-sugar refreshment. Add to cart & enjoy direct pairing combo."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-rose-600 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Discount Text */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Discount Text *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.discountText}
                      onChange={e => setForm({ ...form, discountText: e.target.value })}
                      placeholder="e.g. Flat ₹50 OFF with Combo"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-rose-600 transition-all"
                    />
                  </div>

                  {/* Promo Code */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Voucher / Promo Code
                    </label>
                    <input
                      type="text"
                      value={form.promoCode}
                      onChange={e => setForm({ ...form, promoCode: e.target.value.toUpperCase() })}
                      placeholder="COKEZERO"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono outline-none focus:bg-white focus:border-rose-600 transition-all uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Image URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Banner Image URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={form.imageUrl}
                      onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-rose-600 transition-all"
                    />
                  </div>

                  {/* CTA Text */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={form.ctaText}
                      onChange={e => setForm({ ...form, ctaText: e.target.value })}
                      placeholder="Claim Offer"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-rose-600 transition-all"
                    />
                  </div>
                </div>

                {/* Color Gradient Theme */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Visual Gradient Palette
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {GRADIENT_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setForm({ ...form, bgGradient: preset.value })}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all ${
                          form.bgGradient === preset.value
                            ? 'border-rose-600 bg-rose-50 text-rose-950 ring-2 ring-rose-500/20'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>{preset.label}</span>
                        <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${preset.value}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Checkbox */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={e => setForm({ ...form, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Publish Live on Customer QR Menus
                    </span>
                  </label>
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingAd ? 'Update Campaign' : 'Launch Campaign'}
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
