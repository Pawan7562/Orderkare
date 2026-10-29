import React, { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Percent,
  X,
  Power,
  Upload,
  Link as LinkIcon,
  Check,
  Sparkles,
  ShieldCheck,
  Search,
  Filter,
  Copy,
  Tag,
  AlertCircle,
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

const STOCK_PRESETS = [
  {
    name: 'Coca-Cola Zero Sugar',
    url: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=800&q=80',
    title: 'Chilled Refreshment with Every Meal',
    sponsor: 'Coca-Cola',
    badge: 'Exclusive Offer',
    discountText: 'Flat ₹50 OFF',
    promoCode: 'COKEZERO',
    gradient: 'from-red-950/90 via-slate-900 to-slate-950',
  },
  {
    name: 'Gourmet Woodfired Pizza',
    url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    title: 'Authentic Handcrafted Pizza Night',
    sponsor: 'Italian Bistro Special',
    badge: 'Chef Pick',
    discountText: '20% OFF on 2 Pizzas',
    promoCode: 'PIZZALOVE',
    gradient: 'from-amber-950/90 via-slate-900 to-slate-950',
  },
  {
    name: 'Royal Dum Biryani',
    url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    title: 'Aromatic Dum Biryani Feast',
    sponsor: 'Nawabi Kitchen',
    badge: 'Trending Combo',
    discountText: 'Free Raita & Dessert',
    promoCode: 'BIRYANI50',
    gradient: 'from-emerald-950/90 via-slate-900 to-slate-950',
  },
  {
    name: 'Artisan Mocktails & Drinks',
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    title: 'Cool Summer Mojitos & Mocktails',
    sponsor: 'Bar & Beverage Lounge',
    badge: 'Happy Hours',
    discountText: 'Buy 1 Get 1 Free',
    promoCode: 'SUMMERCOOL',
    gradient: 'from-indigo-950/90 via-slate-900 to-slate-950',
  },
  {
    name: 'Belgian Chocolate Dessert',
    url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
    title: 'Rich Belgian Chocolate Lava Cake',
    sponsor: 'Dessert Boutique',
    badge: 'Sweet Ending',
    discountText: 'Free with ₹999+ Order',
    promoCode: 'SWEETTREAT',
    gradient: 'from-rose-950/90 via-slate-900 to-slate-950',
  },
];

export const SuperAdminAds: React.FC = () => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageUploadMode, setImageUploadMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isDraggingImage, setIsDraggingImage] = useState(false);

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
    bgGradient: 'from-orange-950/90 via-slate-900 to-slate-950',
    isActive: true,
    orderIndex: 0,
  });

  const fetchAds = async () => {
    try {
      setLoading(true);
      setError('');
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

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, JPEG, WEBP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image file size should be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const scale = MAX_WIDTH / img.width;
        if (scale < 1) {
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setForm((prev) => ({ ...prev, imageUrl: dataUrl }));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  const applyPreset = (preset: typeof STOCK_PRESETS[0]) => {
    setForm((prev) => ({
      ...prev,
      sponsor: preset.sponsor,
      badge: preset.badge,
      title: preset.title,
      discountText: preset.discountText,
      promoCode: preset.promoCode,
      imageUrl: preset.url,
      bgGradient: preset.gradient,
    }));
  };

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
      bgGradient: 'from-orange-950/90 via-slate-900 to-slate-950',
      isActive: true,
      orderIndex: ads.length + 1,
    });
    setImageUploadMode('upload');
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
      bgGradient: ad.bgGradient || 'from-orange-950/90 via-slate-900 to-slate-950',
      isActive: ad.isActive,
      orderIndex: ad.orderIndex,
    });
    setImageUploadMode('url');
    setModalOpen(true);
  };

  const handleToggleActive = async (ad: Advertisement) => {
    try {
      const updatedStatus = !ad.isActive;
      await api.put(`/ads/${ad.id}`, { isActive: updatedStatus });
      setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, isActive: updatedStatus } : a)));
      showSuccess(`"${ad.sponsor}" ad is now ${updatedStatus ? 'Active on customer menus' : 'Paused'}.`);
    } catch (err: any) {
      setError('Failed to update ad status.');
    }
  };

  const handleDelete = async (id: string, sponsor: string) => {
    if (!window.confirm(`Are you sure you want to delete the "${sponsor}" advertisement?`)) return;
    try {
      await api.delete(`/ads/${id}`);
      setAds((prev) => prev.filter((a) => a.id !== id));
      showSuccess(`"${sponsor}" advertisement deleted.`);
    } catch (err: any) {
      setError('Failed to delete ad.');
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
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
        setAds((prev) => prev.map((a) => (a.id === editingAd.id ? res.data.ad : a)));
        showSuccess('Advertisement updated successfully.');
      } else {
        const res = await api.post('/ads', form);
        setAds((prev) => [res.data.ad, ...prev]);
        showSuccess('New advertisement campaign launched.');
      }
      setModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save advertisement.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeAdsCount = ads.filter((a) => a.isActive).length;
  const inactiveAdsCount = ads.length - activeAdsCount;

  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        ad.sponsor.toLowerCase().includes(q) ||
        ad.title.toLowerCase().includes(q) ||
        (ad.promoCode && ad.promoCode.toLowerCase().includes(q)) ||
        ad.discountText.toLowerCase().includes(q);

      const matchesFilter =
        filter === 'ALL' ||
        (filter === 'ACTIVE' && ad.isActive) ||
        (filter === 'INACTIVE' && !ad.isActive);

      return matchesSearch && matchesFilter;
    });
  }, [ads, search, filter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-14 font-sans antialiased text-slate-800 dark:text-slate-200 transition-colors duration-300">
      
      {/* ── Executive Top Header Banner (Matches Landing Page Theme) ── */}
      <div className="relative bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-orange-500/10 dark:bg-orange-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-rose-500/10 dark:bg-rose-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/40 text-orange-600 dark:text-orange-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Monetization & Brand Ads</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Verified Partners</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Customer Menu Advertisements
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Manage promotional banner campaigns, sponsor partnerships, voucher codes, and dining room QR menu placements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-orange-500/25 active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Launch New Campaign</span>
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

      {/* ── Summary KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Campaigns</span>
            <div className="h-1.5 w-7 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
          </div>
          <div>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight block">
              {activeAdsCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 block">
              Running live on customer QR menus
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Campaigns</span>
            <div className="h-1.5 w-7 rounded-full bg-gradient-to-r from-orange-500 to-rose-500" />
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight block">
              {ads.length}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 block">
              Managed in advertising inventory
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Paused / Drafts</span>
            <div className="h-1.5 w-7 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
          </div>
          <div>
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight block">
              {inactiveAdsCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 block">
              Paused or awaiting schedule
            </span>
          </div>
        </div>
      </div>

      {/* ── Toolbar: Search & Status Filter ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by sponsor, title, discount or voucher code..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {[
              { id: 'ALL' as const, label: 'All Campaigns', count: ads.length },
              { id: 'ACTIVE' as const, label: 'Live Active', count: activeAdsCount, color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' },
              { id: 'INACTIVE' as const, label: 'Paused', count: inactiveAdsCount, color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' },
            ].map((tab) => {
              const isSelected = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm shadow-orange-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                      isSelected ? 'bg-white/20 text-white' : tab.color || 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Ads Cards Grid ── */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold">Loading advertisements...</p>
        </div>
      ) : filteredAds.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3">
          <Megaphone className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">No advertisements found</h3>
          <p className="text-slate-400 dark:text-slate-500 text-xs max-w-sm mx-auto">
            Create sponsored ads to run brand partnerships, beverage promotions, or dining cashback vouchers.
          </p>
          <button
            onClick={openCreateModal}
            className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            Create First Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAds.map((ad) => (
            <div
              key={ad.id}
              className={`bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-all ${
                ad.isActive
                  ? 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  : 'border-slate-200/60 dark:border-slate-800/60 opacity-70 bg-slate-50/50 dark:bg-slate-800/20'
              }`}
            >
              {/* Top Banner Card Simulation */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                        ad.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${ad.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      {ad.isActive ? 'Live on Menu' : 'Paused'}
                    </span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{ad.sponsor}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(ad)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer ${
                        ad.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-100'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      title={ad.isActive ? 'Pause Ad' : 'Activate Ad'}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{ad.isActive ? 'Live' : 'Turn On'}</span>
                    </button>
                  </div>
                </div>

                {/* Banner Mini Preview - Clean Light/Dark Theme */}
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 overflow-hidden shadow-xs">
                  <div className="relative aspect-[21/9] bg-slate-50 dark:bg-slate-800 overflow-hidden">
                    <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase bg-white/95 dark:bg-slate-900/95 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50 px-2.5 py-0.5 rounded-full shadow-xs backdrop-blur-md">
                        {ad.badge}
                      </span>
                    </div>
                  </div>
                  <div className="p-3.5 bg-white dark:bg-slate-800/80 space-y-1 text-left">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight truncate">{ad.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{ad.description}</p>
                    <div className="pt-1.5 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-orange-600 dark:text-orange-400 font-mono">
                        <Percent className="w-3 h-3 stroke-[3]" />
                        <span>{ad.discountText}</span>
                      </span>
                      {ad.promoCode && (
                        <div className="flex items-center gap-1">
                          <span className="bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900/40 px-2 py-0.5 rounded-md font-mono font-bold text-[10px]">
                            {ad.promoCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyCode(ad.promoCode || '', ad.id)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                            title="Copy Promo Code"
                          >
                            {copiedCode === ad.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Controls */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 dark:text-slate-500 text-[11px] font-mono">
                  CTA: <strong className="text-slate-700 dark:text-slate-300">{ad.ctaText}</strong>
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(ad)}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors font-bold flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ad.id, ad.sponsor)}
                    className="p-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 rounded-xl transition-colors font-bold flex items-center space-x-1.5 cursor-pointer"
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

      {/* ─── CREATE / EDIT AD MODAL ─── */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 sm:p-8 relative text-left max-h-[90vh] overflow-y-auto transition-colors"
            >
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1 mb-6">
                <h3 className="text-xl font-black text-slate-950 dark:text-white">
                  {editingAd ? 'Edit Advertisement Campaign' : 'Create New Sponsored Ad'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure banner visuals, brand sponsor details, voucher incentives, and live menu visibility.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Sponsor Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Sponsor / Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.sponsor}
                      onChange={(e) => setForm({ ...form, sponsor: e.target.value })}
                      placeholder="e.g. Coca-Cola Zero Sugar"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Badge Text */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Badge Text
                    </label>
                    <input
                      type="text"
                      value={form.badge}
                      onChange={(e) => setForm({ ...form, badge: e.target.value })}
                      placeholder="Sponsored Partner / Chef Special"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Headline / Campaign Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Pair Any Main Course with Chilled Coke"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Offer Description *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Get crisp zero-sugar refreshment. Add to cart & enjoy direct pairing combo discount."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none placeholder:text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Discount Text */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Discount Incentive *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.discountText}
                      onChange={(e) => setForm({ ...form, discountText: e.target.value })}
                      placeholder="e.g. Flat ₹50 OFF on Combos"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Promo Code */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Voucher / Promo Code
                    </label>
                    <input
                      type="text"
                      value={form.promoCode}
                      onChange={(e) => setForm({ ...form, promoCode: e.target.value.toUpperCase() })}
                      placeholder="COKEZERO"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all uppercase placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Image Upload & Management Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Banner Promotional Image *
                    </label>
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setImageUploadMode('upload')}
                        className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                          imageUploadMode === 'upload'
                            ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-xs'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload File</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUploadMode('url')}
                        className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                          imageUploadMode === 'url'
                            ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-xs'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>Paste URL</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUploadMode('presets')}
                        className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                          imageUploadMode === 'presets'
                            ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-xs'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Presets</span>
                      </button>
                    </div>
                  </div>

                  {/* Mode 1: File Upload */}
                  {imageUploadMode === 'upload' && (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingImage(true);
                      }}
                      onDragLeave={() => setIsDraggingImage(false)}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                        isDraggingImage
                          ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/30'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
                      }`}
                    >
                      {form.imageUrl ? (
                        <div className="flex items-center gap-4 text-left">
                          <div className="w-24 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800 shadow-xs">
                            <img src={form.imageUrl} alt="Uploaded preview" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span className="truncate">Image Loaded Successfully</span>
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">Ready for banner display</p>
                            <label className="inline-block mt-1 text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer">
                              Change Image File
                              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, imageUrl: '' }))}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                            title="Remove image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block space-y-2">
                          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                          <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs mx-auto flex items-center justify-center text-orange-600 dark:text-orange-400">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Click to choose image file <span className="text-slate-400 dark:text-slate-500 font-normal">or drag & drop here</span>
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                              Supports JPG, PNG, WEBP up to 10MB (automatically optimized)
                            </p>
                          </div>
                        </label>
                      )}
                    </div>
                  )}

                  {/* Mode 2: URL Input */}
                  {imageUploadMode === 'url' && (
                    <div className="space-y-2">
                      <div className="relative flex items-center">
                        <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5" />
                        <input
                          type="url"
                          value={form.imageUrl}
                          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                        />
                      </div>
                      {form.imageUrl ? (
                        <div className="h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 relative">
                          <img src={form.imageUrl} alt="URL Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Mode 3: Presets */}
                  {imageUploadMode === 'presets' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                      {STOCK_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => applyPreset(p)}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                            form.imageUrl === p.url
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 ring-2 ring-orange-500/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                          }`}
                        >
                          <img src={p.url} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                            <p className="text-[10px] text-orange-600 dark:text-orange-400 font-mono font-bold truncate">{p.discountText}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* CTA Button Text */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Call-To-Action Button Text
                  </label>
                  <input
                    type="text"
                    value={form.ctaText}
                    onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                    placeholder="Claim Offer"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Active Checkbox */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 accent-orange-600 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Publish Live on Customer QR Menus
                    </span>
                  </label>
                </div>

                <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-xs font-bold shadow-md shadow-orange-500/25 transition-all disabled:opacity-50 cursor-pointer"
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
