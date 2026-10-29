import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import {
  Download,
  Copy,
  QrCode,
  CheckCircle2,
  Lock,
  Sparkles,
  ExternalLink,
  Printer,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Volume2,
  Bell,
  Laptop,
  Check,
  Radio,
  Sliders,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaymentModal } from '../components/PaymentModal';

export const SettingsPage = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'restaurant' | 'qr' | 'account' | 'preferences'>('restaurant');

  const [restaurant, setRestaurant] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('orderkare_restaurant');
      return cached ? JSON.parse(cached) : (user as any)?.restaurant || null;
    } catch {
      return (user as any)?.restaurant || null;
    }
  });

  const [subscription, setSubscription] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('orderkare_dash_sub');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [plans, setPlans] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [testSoundPlaying, setTestSoundPlaying] = useState(false);

  const fetchSettings = async () => {
    try {
      const [resMe, resSub, resPlans] = await Promise.all([
        api.get('/auth/me'),
        api.get('/subscriptions/status').catch(() => ({
          data: { isSubscribed: false, isFirstTime: true },
        })),
        api.get('/plans/active').catch(() => ({ data: { plans: [] } })),
      ]);

      const rest = resMe.data.user?.restaurant;
      if (rest) {
        setRestaurant(rest);
        try {
          localStorage.setItem('orderkare_restaurant', JSON.stringify(rest));
        } catch {}
      }
      if (resSub.data) {
        setSubscription(resSub.data);
        try {
          localStorage.setItem('orderkare_dash_sub', JSON.stringify(resSub.data));
        } catch {}
      }
      if (resPlans.data?.plans) {
        setPlans(resPlans.data.plans);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const isSubscribed = subscription?.isSubscribed ?? false;
  const isFirstTime = subscription?.isFirstTime ?? true;
  const restaurantName = restaurant?.name || user?.name || 'Restaurant';
  const firstPlan = plans[0];

  const menuUrl = (() => {
    const slug = restaurant?.slug || user?.restaurantId;
    if (!slug) return '';
    const baseOrigin = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;
    const normalizedOrigin = baseOrigin.replace(/\/$/, '');
    return `${normalizedOrigin}/menu/${slug}`;
  })();

  const handleCopy = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(
      menuUrl
    )}&color=0f172a&bgcolor=ffffff&margin=4`;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `${restaurant?.name || 'restaurant'}-master-qr.png`;
    link.click();
  };

  const playTestChime = () => {
    setTestSoundPlaying(true);
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-120.wav');
      audio.play().catch(() => {});
    } catch {}
    setTimeout(() => setTestSoundPlaying(false), 1200);
  };

  return (
    <div className="space-y-7 pb-12 max-w-5xl mx-auto">
      {/* ─── 1. TOP HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Settings & Configuration
            </h1>
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs px-3 py-1 rounded-full font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Verified Account</span>
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage your restaurant profile, universal QR standee, and system preferences
          </p>
        </div>
      </div>

      {/* ─── 2. TABBED NAVIGATION ─── */}
      <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs overflow-x-auto no-scrollbar">
        {[
          { key: 'restaurant', label: 'Restaurant Profile', icon: Building2 },
          { key: 'qr', label: 'Master QR Standee', icon: QrCode },
          { key: 'account', label: 'Admin Account', icon: User },
          { key: 'preferences', label: 'Preferences & Alerts', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-xs shadow-orange-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── 3. TAB CONTENT PANELS ─── */}
      <div className="space-y-6">
        {/* TAB 1: RESTAURANT PROFILE */}
        {activeTab === 'restaurant' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Restaurant Profile
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Public dining information displayed to your guests
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  Active Venue
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-orange-500" />
                    <span>Restaurant Name</span>
                  </span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white pt-1">
                    {restaurant?.name || 'OrderKare Kitchen'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-orange-500" />
                    <span>Contact Phone</span>
                  </span>
                  <p className="text-sm font-mono font-bold text-slate-900 dark:text-white pt-1">
                    {restaurant?.phone || user?.email || '—'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1 sm:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    <span>Physical Address</span>
                  </span>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 pt-1">
                    {restaurant?.address || 'Mohali, Punjab, India'}
                  </p>
                </div>
              </div>

              {/* Public Menu URL */}
              <div className="pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                  Live Customer Menu Link
                </label>
                <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-w-2xl">
                  <input
                    type="text"
                    readOnly
                    value={menuUrl}
                    className="flex-1 px-4 py-2.5 bg-transparent text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 outline-none select-all"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2.5 border-l border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <a
                    href={menuUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 border-l border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                    title="Open customer menu in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: MASTER QR STANDEE */}
        {activeTab === 'qr' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-2xs">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                {/* QR Image Box */}
                <div className="bg-gradient-to-br from-slate-50 to-orange-50/40 dark:from-slate-800 dark:to-slate-800/50 border border-orange-200/80 dark:border-slate-700 rounded-2xl p-5 text-center shrink-0 w-64 shadow-xs">
                  {!isSubscribed ? (
                    <div className="relative">
                      <div className="w-48 h-48 mx-auto bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center filter blur-xs select-none">
                        <QrCode className="w-24 h-24 text-slate-400" />
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-xs rounded-2xl p-4 text-white space-y-1.5">
                        <Lock className="w-6 h-6 text-orange-400" />
                        <span className="text-xs font-bold text-orange-300">
                          Activation Required
                        </span>
                        <p className="text-[11px] text-slate-200 text-center">
                          Activate plan to unlock permanent standee
                        </p>
                      </div>
                    </div>
                  ) : (
                    menuUrl && (
                      <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-xs inline-block">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                            menuUrl
                          )}`}
                          alt="Master QR Code"
                          className="w-44 h-44 mx-auto block"
                        />
                      </div>
                    )
                  )}
                  <span className="inline-block mt-3 text-xs font-mono font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                    Universal QR Standee
                  </span>
                </div>

                {/* QR Information & Controls */}
                <div className="flex-1 space-y-4 w-full">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Single QR for All Dining Tables</span>
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      Universal Restaurant QR Standee
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Place this single master QR standee across all your dining tables or at your front counter. Guests scan with their phone camera, browse dishes, and enter their Table # during checkout.
                    </p>
                  </div>

                  {/* Direct Scan URL */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                      Direct Scan URL
                    </label>
                    <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-w-xl">
                      <input
                        type="text"
                        value={menuUrl}
                        readOnly
                        className="flex-1 px-4 py-2.5 bg-transparent text-xs sm:text-sm font-mono text-slate-700 dark:text-slate-200 outline-none select-all"
                      />
                      <button
                        onClick={handleCopy}
                        className="px-4 py-2.5 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors border-l border-slate-200 dark:border-slate-700"
                      >
                        {copied ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isSubscribed ? (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-xs shadow-orange-500/25 flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {isFirstTime
                          ? 'Activate Master QR (30 Days Free Access)'
                          : `Renew & Unlock Master QR (₹${firstPlan?.priceMonthly || 249})`}
                      </span>
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-2.5 pt-1">
                      <button
                        onClick={handleDownloadQR}
                        className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs shadow-orange-500/20"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download High-Res QR</span>
                      </button>

                      <a
                        href={menuUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Preview Scan Experience</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: ADMIN ACCOUNT */}
        {activeTab === 'account' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Administrator Credentials
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Primary administrative account and security access
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-2.5 py-1 rounded-lg border border-orange-200 dark:border-orange-800">
                  {user?.role || 'RESTAURANT_ADMIN'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-orange-500" />
                    <span>Administrator Name</span>
                  </span>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white pt-1">
                    {user?.name || 'Administrator'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-orange-500" />
                    <span>Login Email Address</span>
                  </span>
                  <p className="text-sm font-mono font-bold text-slate-900 dark:text-white pt-1">
                    {user?.email || '—'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1 sm:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Security & Session Status</span>
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 pt-1">
                    Encrypted JWT Session Active • Cloud Isolation Level A Verified
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: PREFERENCES & ALERTS */}
        {activeTab === 'preferences' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Preferences & Audio Alerts
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Configure real-time notifications and kitchen sound feedback
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Audio Bell Test */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                        Order Chime Audio Bell
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Test the alert chime that sounds when new customer orders arrive
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={playTestChime}
                    disabled={testSoundPlaying}
                    className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-orange-600 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${testSoundPlaying ? 'animate-bounce text-orange-500' : ''}`} />
                    <span>{testSoundPlaying ? 'Playing Chime...' : 'Test Sound'}</span>
                  </button>
                </div>

                {/* System Specs */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                        OrderKare Cloud SaaS Engine
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        WebSocket v4.8 • Real-time dispatch active
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    v2.4.0 Production
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ─── 4. PAYMENT MODAL ─── */}
      <AnimatePresence>
        {showPaymentModal && (
          <PaymentModal
            planName={
              isFirstTime
                ? 'First-Time Activation (30 Days Free Access)'
                : firstPlan?.name || 'Monthly Plan Renewal'
            }
            planId={isFirstTime ? 'FIRST_TIME_ACTIVATION' : firstPlan?.id || 'MONTHLY'}
            amount={isFirstTime ? 1 : firstPlan?.priceMonthly || 249}
            durationDays={isFirstTime ? 30 : firstPlan?.days || 30}
            upiId={subscription?.payment?.upiId || ''}
            restaurantName={restaurantName}
            razorpayEnabled={subscription?.payment?.razorpayEnabled ?? true}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={() => {
              fetchSettings();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
