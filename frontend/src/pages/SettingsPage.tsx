import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { Download, Copy, QrCode, CheckCircle, Lock, Sparkles, ExternalLink, Printer } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { PaymentModal } from '../components/PaymentModal';

export const SettingsPage = () => {
  const { user } = useAuthStore();
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
  const [copied, setCopied] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchSettings = async () => {
    try {
      const [resMe, resSub] = await Promise.all([
        api.get('/auth/me'),
        api.get('/subscriptions/status').catch(() => ({ data: { isSubscribed: false, isFirstTime: true } })),
      ]);
      const rest = resMe.data.user?.restaurant;
      if (rest) {
        setRestaurant(rest);
        try { localStorage.setItem('orderkare_restaurant', JSON.stringify(rest)); } catch {}
      }
      if (resSub.data) {
        setSubscription(resSub.data);
        try { localStorage.setItem('orderkare_dash_sub', JSON.stringify(resSub.data)); } catch {}
      }
    } catch {
      /* empty */
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const isSubscribed = subscription?.isSubscribed ?? false;
  const isFirstTime = subscription?.isFirstTime ?? true;
  const restaurantName = restaurant?.name || user?.name || 'Restaurant';

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
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(menuUrl)}&color=0f172a&bgcolor=ffffff&margin=4`;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `${restaurant?.name || 'restaurant'}-master-qr.png`;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-3xl pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your restaurant settings and universal QR standee</p>
      </div>

      {/* Restaurant Info */}
      <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
        <h2 className="font-bold text-slate-900 mb-4">Restaurant Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide">Name</label>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{restaurant?.name || '—'}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide">Slug</label>
            <p className="text-sm font-medium text-slate-800 mt-0.5 font-mono">{restaurant?.slug || '—'}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide">Address</label>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{restaurant?.address || '—'}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide">Phone</label>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{restaurant?.phone || '—'}</p>
          </div>
        </div>
      </div>

      {/* Universal Master QR Code */}
      <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900 flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-orange-500" />
            <span>Official Master Restaurant QR Standee</span>
          </h2>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
            isSubscribed ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
          }`}>
            {isSubscribed ? 'Active' : 'Locked'}
          </span>
        </div>
        <p className="text-sm text-slate-500 mb-5">
          This is your restaurant's single universal QR code. Place it on all dining tables or at your counter. Guests scan this single QR and enter their Table Number at checkout.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          {/* QR Image Preview */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm text-center relative shrink-0">
            {!isSubscribed ? (
              <div className="relative">
                <div className="w-48 h-48 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center filter blur-xs">
                  <QrCode className="w-24 h-24 text-slate-400" />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-xs rounded-2xl p-4 text-white space-y-1">
                  <Lock className="w-6 h-6 text-orange-400" />
                  <span className="text-[11px] font-bold text-orange-300">₹1 Activation Required</span>
                </div>
              </div>
            ) : (
              menuUrl && (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}`}
                  alt="Master QR Code"
                  className="w-48 h-48 mx-auto block"
                />
              )
            )}
            <span className="inline-block mt-3 text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
              Universal Master QR
            </span>
          </div>

          {/* QR Details */}
          <div className="flex-1 space-y-4 w-full">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Direct Scan URL</label>
              <div className="flex items-center mt-1.5 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <input
                  type="text"
                  value={menuUrl}
                  readOnly
                  className="flex-1 px-4 py-2.5 bg-transparent text-sm text-slate-700 outline-none font-mono select-all"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2.5 text-orange-600 hover:bg-orange-50 transition-colors border-l border-slate-200 cursor-pointer"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isSubscribed ? (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isFirstTime ? 'Pay ₹1 & Unlock Master QR (30 Days Free)' : 'Renew & Unlock Master QR'}</span>
              </button>
            ) : (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleDownloadQR}
                  className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download High-Res QR</span>
                </button>
                <a
                  href={menuUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 bg-slate-100 text-slate-700 hover:bg-slate-200 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Test Scan Experience ↗</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm">
        <h2 className="font-bold text-slate-900 mb-4">Account</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide">Name</label>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{user?.name || '—'}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide">Email</label>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{user?.email || '—'}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide">Role</label>
            <p className="text-sm font-medium text-slate-800 mt-0.5">{user?.role || '—'}</p>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <PaymentModal
            planName={isFirstTime ? 'First-Time Activation (1 Month Free)' : 'Monthly Plan Renewal'}
            planId={isFirstTime ? 'FIRST_TIME_ACTIVATION' : 'MONTHLY'}
            amount={isFirstTime ? 1 : 249}
            durationDays={30}
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
