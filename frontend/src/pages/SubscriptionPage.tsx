import { useEffect, useState } from 'react';
import {
  Check, Sparkles, Crown, Zap, Shield, CreditCard, X, Copy,
  CheckCircle2, Clock, RefreshCcw, Star, AlertCircle, QrCode, ArrowRight, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

interface SubscriptionData {
  restaurantId: string;
  restaurantName: string;
  slug: string;
  isSubscribed: boolean;
  isFirstTime: boolean;
  status: 'PENDING' | 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  planName: string;
  validUntil: string | null;
  daysRemaining: number;
  qrCodeAllowed: boolean;
  payment?: { razorpayEnabled: boolean; upiId: string };
  plans: {
    id: 'MONTHLY' | 'SIX_MONTHS' | 'ANNUAL';
    name: string;
    price: number;
    durationDays: number;
    periodText: string;
    description: string;
    features: string[];
    isPopular: boolean;
  }[];
  firstTimeOffer: {
    id: string;
    name: string;
    price: number;
    durationDays: number;
    description: string;
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
interface PaymentModalProps {
  planName: string;
  planId: string;
  amount: number;
  durationDays: number;
  upiId: string;
  restaurantName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal = ({
  planName,
  planId,
  amount,
  durationDays,
  upiId,
  restaurantName,
  onClose,
  onSuccess
}: PaymentModalProps) => {
  const [copied, setCopied] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'pay' | 'success' | 'pending'>('pay');
  const [manualMode, setManualMode] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const cleanUpi = upiId.trim();
  const upiLink = cleanUpi ? `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=OrderKare&am=${amount}&cu=INR&tn=${encodeURIComponent(`${planName} - ${restaurantName}`)}` : '';
  const qrUrl = upiLink ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiLink)}&color=0f172a&bgcolor=ffffff&margin=2` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanUpi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadRazorpay = () => new Promise<void>((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Secure checkout could not load'));
    document.body.appendChild(script);
  });

  const openSecureCheckout = async () => {
    setIsSubmitting(true);
    setPaymentError('');
    try {
      const { data: paymentOrder } = await api.post('/subscriptions/payment-order', { planId });
      if (!paymentOrder?.keyId || !paymentOrder?.orderId || !paymentOrder?.amount) {
        throw new Error('The payment server returned an incomplete Razorpay order.');
      }
      await loadRazorpay();
      if (!window.Razorpay) throw new Error('Secure checkout is unavailable');

      const checkout = new window.Razorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'OrderKare',
        description: `${planName} - ${restaurantName}`,
        order_id: paymentOrder.orderId,
        theme: { color: '#f97316' },
        handler: async (response: Record<string, string>) => {
          try {
            await api.post('/subscriptions/payment-verify', { planId, ...response });
            setStep('success');
            setTimeout(() => { onSuccess(); onClose(); }, 1800);
          } catch (err: any) {
            setPaymentError(err.response?.data?.message || 'Payment verification failed. Contact support if you were charged.');
          } finally {
            setIsSubmitting(false);
          }
        },
        modal: { ondismiss: () => setIsSubmitting(false) },
      });
      checkout.open();
    } catch (err: any) {
      setIsSubmitting(false);
      if (err.response?.status === 503) setManualMode(true);
      setPaymentError(err.response?.data?.message || err.message || 'Unable to start secure payment. Please try again.');
    }
  };

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim()) return;
    setIsSubmitting(true);
    setPaymentError('');
    try {
      const response = await api.post('/subscriptions/pay', {
        planId,
        paymentReference: utrNumber.trim(),
      });
      if (response.data?.pending) setStep('pending');
    } catch (err: any) {
      setPaymentError(err.response?.data?.message || 'Payment reference submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto z-10"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
            Secure UPI Checkout
          </span>
          <h3 className="text-xl font-black mt-2">{planName}</h3>
          <p className="text-xs text-orange-100 mt-0.5">{restaurantName} • {durationDays} Days Active Access</p>
        </div>

        <div className="p-6 space-y-5">
          {step === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-3"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md shadow-emerald-100">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="text-lg font-black text-slate-900">Payment Verified!</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Your subscription is now active. Your permanent table QR codes are unlocked and ready for ordering.
              </p>
            </motion.div>
          ) : step === 'pending' ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-9 h-9" />
              </div>
              <h4 className="text-lg font-black text-slate-900">Payment submitted for review</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">Your QR codes will unlock after the UPI payment is verified. A reference number alone cannot activate access.</p>
              <button onClick={onClose} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold">Close</button>
            </div>
          ) : (
            <>
              {paymentError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700">
                  {paymentError}
                </div>
              )}

              {/* Amount Display */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Total Amount Due</span>
                  <p className="text-2xl font-black text-slate-900">₹{amount.toLocaleString('en-IN')}</p>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  Zero Transaction Fee
                </span>
              </div>

              {/* QR Code */}
              <div className="text-center">
                <div className="inline-block bg-white border-2 border-slate-100 rounded-2xl p-3 shadow-xs">
                  {qrUrl ? <img src={qrUrl} alt="UPI Payment QR" className="w-44 h-44 mx-auto block" /> : (
                    <div className="w-44 h-44 mx-auto flex items-center justify-center text-xs text-slate-500 text-center px-5">
                      Manual UPI payment is not configured. Use secure checkout.
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  Scan using <strong>Google Pay, PhonePe, Paytm, or BHIM UPI</strong>
                </p>
              </div>

              {/* UPI ID Copy Field */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Pay directly to UPI ID
                </label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                  <span className="flex-1 px-3 py-2 text-xs font-mono text-slate-700 truncate">{cleanUpi || 'Not configured'}</span>
                  {cleanUpi && <button
                    onClick={handleCopy}
                    className="px-3 py-2 border-l border-slate-200 text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>}
                </div>
              </div>

              {!manualMode && (
                <button
                  type="button"
                  onClick={openSecureCheckout}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-sm rounded-2xl shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Opening secure checkout...' : `Pay ₹${amount} securely`}
                </button>
              )}

              <form onSubmit={handleManualPayment} className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    UPI Reference / UTR No. <span className="text-slate-400 font-normal">(required for manual review)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 423987123456"
                    value={utrNumber}
                    onChange={e => setUtrNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm rounded-2xl transition-all shadow-md shadow-orange-500/20 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting reference...' : 'Submit payment reference'}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main Subscription Page ──────────────────────────────────────────────────
export const SubscriptionPage = () => {
  const { user } = useAuthStore();
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlanModal, setSelectedPlanModal] = useState<{
    id: string;
    name: string;
    price: number;
    days: number;
  } | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/subscriptions/status');
      setSubData(res.data);
    } catch (err) {
      console.error('Failed to load subscription status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const isSubscribed = subData?.isSubscribed ?? false;
  const isFirstTime = subData?.isFirstTime ?? true;
  const status = subData?.status ?? 'PENDING';
  const daysLeft = subData?.daysRemaining ?? 0;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Subscription & QR Activation</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Manage your hotel subscription status, unlock permanent table QR codes, and select renewal plans
        </p>
      </div>

      {/* Subscription Status Banner */}
      <div className={`border-2 rounded-3xl p-6 transition-all ${
        isSubscribed
          ? 'bg-gradient-to-br from-emerald-50 via-teal-50/30 to-white border-emerald-200'
          : status === 'EXPIRED'
          ? 'bg-gradient-to-br from-rose-50 via-red-50/30 to-white border-rose-200'
          : 'bg-gradient-to-br from-orange-50 via-amber-50/30 to-white border-orange-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              isSubscribed
                ? 'bg-emerald-500 text-white shadow-emerald-200'
                : status === 'EXPIRED'
                ? 'bg-rose-500 text-white shadow-rose-200'
                : 'bg-orange-500 text-white shadow-orange-200'
            }`}>
              {isSubscribed ? <Crown className="w-6 h-6" /> : status === 'EXPIRED' ? <AlertCircle className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  isSubscribed
                    ? 'bg-emerald-100 text-emerald-800'
                    : status === 'EXPIRED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {isSubscribed
                    ? status === 'TRIAL' ? '1 Month Free Trial (Active)' : 'Active Subscription'
                    : status === 'EXPIRED'
                    ? 'Subscription Expired'
                    : 'First-Time Activation Required'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {subData?.restaurantName}
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-900 mt-1">
                {isSubscribed
                  ? `${daysLeft} Days of Active QR Ordering Remaining`
                  : status === 'EXPIRED'
                  ? 'Your QR Code is Currently Paused (Renew to Activate)'
                  : 'Complete ₹1 Activation to Unlock 1 Month Free'}
              </h2>

              <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                {isSubscribed
                  ? `Your permanent QR code is active until ${new Date(subData?.validUntil || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}. Customers can scan and place orders at any time.`
                  : status === 'EXPIRED'
                  ? 'Your permanent QR code remains saved. Select any renewal plan below to immediately re-activate ordering for all your table stands.'
                  : 'New accounts require a one-time ₹1 activation payment to generate table QR codes and receive a full 30 days free trial.'}
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          {!isSubscribed && (
            <button
              onClick={() => setSelectedPlanModal({
                id: isFirstTime ? 'FIRST_TIME_ACTIVATION' : 'MONTHLY',
                name: isFirstTime ? 'First-Time Activation (1 Month Free)' : 'Monthly Plan Renewal',
                price: isFirstTime ? 1 : 249,
                days: 30
              })}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-extrabold text-sm rounded-2xl transition-all shadow-md shadow-orange-500/20 shrink-0 self-start sm:self-auto"
            >
              {isFirstTime ? '⚡ Activate for ₹1 (1 Month Free)' : '🔄 Renew Subscription'}
            </button>
          )}
        </div>
      </div>

      {/* ── First-Time Special Offer Card (if not yet activated) ── */}
      {isFirstTime && (
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Special Introductory Offer</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black">
                First-Time Activation: Pay ₹1 & Get 1 Month Free!
              </h3>
              <p className="text-xs sm:text-sm text-orange-100 leading-relaxed">
                Activate your restaurant account with a single ₹1 payment. Instantly unlock permanent table QR code standee generation, real-time live kitchen dispatch, customer menu, and full analytics for 30 days.
              </p>
            </div>

            <button
              onClick={() => setSelectedPlanModal({
                id: 'FIRST_TIME_ACTIVATION',
                name: 'First-Time Activation (1 Month Free)',
                price: 1,
                days: 30
              })}
              className="px-8 py-4 bg-white text-orange-600 hover:bg-orange-50 font-black text-sm rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 shrink-0 flex items-center justify-center gap-2"
            >
              <span>Pay ₹1 & Activate Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Three Subscription Plans (Monthly, 6 Months, Annual) ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Subscription Plans for Ongoing Access</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            After your initial free month or at any time, renew your plan to keep your permanent QR code active
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Monthly Plan */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  30 Days
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">Monthly Plan</h3>
                <p className="text-xs text-slate-400 mt-0.5">Flexible month-to-month billing</p>
              </div>

              <div className="pt-1">
                <span className="text-3xl font-black text-slate-900">₹249</span>
                <span className="text-xs text-slate-400 font-medium"> / month</span>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                {[
                  'Permanent Table QR Generation',
                  'Full Digital Menu & Live Orders',
                  'Live Kitchen Audio Ringtone',
                  'Customer Reviews & Ratings',
                  'Standard Email Support',
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedPlanModal({
                id: 'MONTHLY',
                name: 'Monthly Plan Renewal',
                price: 249,
                days: 30
              })}
              className="mt-6 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
            >
              Select Monthly (₹249)
            </button>
          </div>

          {/* 2. 6 Months Plan (Most Popular) */}
          <div className="bg-white border-2 border-orange-500 rounded-3xl p-6 shadow-md relative flex flex-col justify-between hover:shadow-lg transition-all">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm">
              ★ Most Popular — Save 20%
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center font-bold">
                  <Crown className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  180 Days
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">6 Months Plan</h3>
                <p className="text-xs text-slate-400 mt-0.5">Recommended for established restaurants</p>
              </div>

              <div className="pt-1">
                <span className="text-3xl font-black text-slate-900">₹1,199</span>
                <span className="text-xs text-slate-400 font-medium"> / 6 months <span className="text-orange-600 font-bold">(~₹199/mo)</span></span>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                {[
                  'Everything in Monthly +',
                  'Save 20% on monthly rates',
                  'Permanent QR Never Changes',
                  'Table QR Standee Print Presets',
                  'Priority WhatsApp Support',
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
                    <Check className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedPlanModal({
                id: 'SIX_MONTHS',
                name: '6 Months Plan Renewal',
                price: 1199,
                days: 180
              })}
              className="mt-6 w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-orange-500/20"
            >
              Select 6 Months (₹1,199)
            </button>
          </div>

          {/* 3. Annual Plan (Best Value) */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center font-bold">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  365 Days • Save 33%
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">Annual Plan</h3>
                <p className="text-xs text-slate-400 mt-0.5">Year-round uninterrupted digital ordering</p>
              </div>

              <div className="pt-1">
                <span className="text-3xl font-black text-slate-900">₹1,999</span>
                <span className="text-xs text-slate-400 font-medium"> / year <span className="text-purple-600 font-bold">(~₹166/mo)</span></span>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                {[
                  'Everything in 6 Months +',
                  'Save 33% — Highest Discount',
                  'Unlimited Table QR Standees',
                  'Comprehensive Revenue Analytics',
                  'Zero Commission on Orders',
                  'VIP 24/7 Phone & Priority Support',
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <Check className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedPlanModal({
                id: 'ANNUAL',
                name: 'Annual Plan Renewal',
                price: 1999,
                days: 365
              })}
              className="mt-6 w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm shadow-purple-200"
            >
              Select Annual (₹1,999)
            </button>
          </div>
        </div>
      </div>

      {/* ── Permanent QR Policy Note ── */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
          <QrCode className="w-6 h-6 text-slate-700" />
        </div>
        <div className="flex-1 text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-900 text-sm">Permanent QR Code Guarantee</p>
          <p>
            Your restaurant QR code is generated <strong>only once</strong> and stays permanently linked to your account.
            When your plan is renewed, the same QR code automatically reactivates immediately without reprinting your table stands.
          </p>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {selectedPlanModal && (
          <PaymentModal
            planName={selectedPlanModal.name}
            planId={selectedPlanModal.id}
            amount={selectedPlanModal.price}
            durationDays={selectedPlanModal.days}
            upiId={subData?.payment?.upiId || ''}
            restaurantName={subData?.restaurantName || user?.name || 'Restaurant'}
            onClose={() => setSelectedPlanModal(null)}
            onSuccess={() => {
              fetchStatus();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
