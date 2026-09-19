import React, { useEffect, useState } from 'react';
import {
  Check,
  Sparkles,
  Crown,
  Zap,
  Shield,
  RefreshCcw,
  AlertCircle,
  QrCode,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { PaymentModal } from '../components/PaymentModal';

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

  if (loading) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded-xl" />
          <div className="h-4 w-96 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-36 bg-slate-100 rounded-3xl border border-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-96 bg-slate-100 rounded-3xl border border-slate-200" />
          <div className="h-96 bg-slate-100 rounded-3xl border border-slate-200" />
          <div className="h-96 bg-slate-100 rounded-3xl border border-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-orange-100 text-orange-700 mb-2">
            <Crown className="w-3.5 h-3.5" />
            <span>OrderKare Subscription & Licensing</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">QR Ordering & Subscription</h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Activate your universal master QR standee, manage subscription validity, and unlock uninterrupted digital dining operations.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Subscription Status Banner */}
      <div
        className={`border-2 rounded-3xl p-6 sm:p-8 transition-all relative overflow-hidden shadow-xs ${
          isSubscribed
            ? 'bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white border-emerald-300'
            : status === 'EXPIRED'
            ? 'bg-gradient-to-br from-rose-50 via-red-50/40 to-white border-rose-300'
            : 'bg-gradient-to-br from-orange-50 via-amber-50/40 to-white border-orange-300'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4 sm:gap-5">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                isSubscribed
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                  : status === 'EXPIRED'
                  ? 'bg-rose-500 text-white shadow-rose-500/20'
                  : 'bg-orange-500 text-white shadow-orange-500/20'
              }`}
            >
              {isSubscribed ? (
                <Crown className="w-7 h-7" />
              ) : status === 'EXPIRED' ? (
                <AlertCircle className="w-7 h-7" />
              ) : (
                <Sparkles className="w-7 h-7" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full ${
                    isSubscribed
                      ? status === 'TRIAL'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : status === 'EXPIRED'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-orange-100 text-orange-800 border border-orange-200'
                  }`}
                >
                  {isSubscribed
                    ? status === 'TRIAL'
                      ? '1 Month Free Trial (Active)'
                      : 'Active Subscription'
                    : status === 'EXPIRED'
                    ? 'Subscription Expired'
                    : 'First-Time Activation Required'}
                </span>
                <span className="text-xs text-slate-500 font-semibold bg-white/70 px-2 py-0.5 rounded-md border border-slate-200/60">
                  {subData?.restaurantName || user?.name}
                </span>
              </div>

              <h2 className="text-2xl font-black text-slate-900 mt-1">
                {isSubscribed
                  ? `${daysLeft} Days of Active Master QR Ordering Remaining`
                  : status === 'EXPIRED'
                  ? 'Your Master QR Code is Currently Paused (Renew to Reactivate)'
                  : 'Complete ₹1 Activation to Unlock 1 Month Free'}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                {isSubscribed
                  ? `Your restaurant master QR standee is fully active until ${new Date(
                      subData?.validUntil || ''
                    ).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}. Customers can scan from any table to browse and order.`
                  : status === 'EXPIRED'
                  ? 'Your master QR code standee remains saved permanently. Renew any plan below to immediately restore live customer ordering without reprinting your standees.'
                  : 'New restaurant accounts require a one-time ₹1 activation fee to generate your permanent master QR standee and receive 30 full days of unlimited digital ordering.'}
              </p>
            </div>
          </div>

          {/* Quick CTA */}
          {!isSubscribed && (
            <button
              onClick={() =>
                setSelectedPlanModal({
                  id: isFirstTime ? 'FIRST_TIME_ACTIVATION' : 'MONTHLY',
                  name: isFirstTime
                    ? 'First-Time Activation (1 Month Free)'
                    : 'Monthly Plan Renewal',
                  price: isFirstTime ? 1 : 249,
                  days: 30,
                })
              }
              className="px-6 py-3.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-orange-500/25 shrink-0 self-start lg:self-center active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>{isFirstTime ? '⚡ Pay ₹1 & Activate 1 Month Free' : '🔄 Renew Subscription'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── First-Time Special Offer Card ── */}
      {isFirstTime && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-slate-900 via-orange-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-orange-500/20"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 bg-orange-500/20 border border-orange-500/40 text-orange-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>Special Introductory Promotion</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                First-Time Activation: Pay ₹1 & Get 1 Full Month Free!
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Activate your restaurant account with an introductory ₹1 payment via Razorpay. Instantly generate your official universal Master QR standee, live kitchen ringtone alerts, digital menu customization, and real-time ordering for 30 days.
              </p>
            </div>

            <button
              onClick={() =>
                setSelectedPlanModal({
                  id: 'FIRST_TIME_ACTIVATION',
                  name: 'First-Time Activation (1 Month Free)',
                  price: 1,
                  days: 30,
                })
              }
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-sm rounded-2xl transition-all shadow-xl hover:shadow-orange-500/30 active:scale-95 shrink-0 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Pay ₹1 & Activate Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Plans Matrix (Monthly, 6 Months, Annual) ── */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Subscription Plans for Ongoing Access</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Choose a plan that fits your restaurant. All plans include permanent Master QR guarantee and 0% commission on orders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Monthly Plan */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center font-bold">
                  <Zap className="w-6 h-6 text-slate-700" />
                </div>
                <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
                  30 Days
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">Monthly Plan</h3>
                <p className="text-xs text-slate-400 mt-0.5">Flexible month-to-month digital dining</p>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">₹249</span>
                  <span className="text-xs text-slate-400 font-semibold">/ month</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Billed monthly • Cancel anytime</span>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                {[
                  'Single Master QR Code Standee',
                  'Full Digital Menu & Real-Time Orders',
                  'Live Kitchen Audio Ringtone',
                  'Customer Reviews & Ratings',
                  'Standard Email Support',
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() =>
                setSelectedPlanModal({
                  id: 'MONTHLY',
                  name: 'Monthly Plan Renewal',
                  price: 249,
                  days: 30,
                })
              }
              className="mt-8 w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
            >
              Select Monthly (₹249)
            </button>
          </div>

          {/* 2. 6 Months Plan (Most Popular) */}
          <div className="bg-white border-2 border-orange-500 rounded-3xl p-6 sm:p-7 shadow-xl relative flex flex-col justify-between hover:shadow-2xl transition-all transform md:-translate-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
              ★ Most Popular — Save 20%
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center font-bold">
                  <Crown className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-[10px] font-extrabold text-orange-700 bg-orange-50 px-3 py-1 rounded-full uppercase tracking-wider border border-orange-200">
                  180 Days
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">6 Months Plan</h3>
                <p className="text-xs text-slate-400 mt-0.5">Best choice for growing dining outlets</p>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">₹1,199</span>
                  <span className="text-xs text-slate-400 font-semibold">/ 6 mos</span>
                </div>
                <span className="text-[11px] text-orange-600 font-bold">
                  Equivalent to ~₹199 / month (Save 20%)
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                {[
                  'Everything in Monthly +',
                  'Save 20% on recurring billing',
                  'Master QR Code Never Changes',
                  'Table QR Standee Print Presets',
                  'Priority WhatsApp Support',
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-slate-800 font-bold">
                    <Check className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() =>
                setSelectedPlanModal({
                  id: 'SIX_MONTHS',
                  name: '6 Months Plan Renewal',
                  price: 1199,
                  days: 180,
                })
              }
              className="mt-8 w-full py-3.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-xl transition-all shadow-lg shadow-orange-500/25 active:scale-98 cursor-pointer"
            >
              Select 6 Months (₹1,199)
            </button>
          </div>

          {/* 3. Annual Plan (Best Value) */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col justify-between hover:border-purple-300 hover:shadow-md transition-all">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center font-bold">
                  <Shield className="w-6 h-6 text-purple-700" />
                </div>
                <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 px-3 py-1 rounded-full uppercase tracking-wider border border-purple-200">
                  365 Days • Save 33%
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">Annual Plan</h3>
                <p className="text-xs text-slate-400 mt-0.5">Year-round uninterrupted operations</p>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">₹1,999</span>
                  <span className="text-xs text-slate-400 font-semibold">/ year</span>
                </div>
                <span className="text-[11px] text-purple-600 font-bold">
                  Equivalent to ~₹166 / month (Save 33%)
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                {[
                  'Everything in 6 Months +',
                  'Save 33% — Highest Value Discount',
                  'Universal Master QR Standees',
                  'Comprehensive Revenue Analytics',
                  'Zero Commission on Orders',
                  'VIP 24/7 Phone & Priority Support',
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                    <Check className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() =>
                setSelectedPlanModal({
                  id: 'ANNUAL',
                  name: 'Annual Plan Renewal',
                  price: 1999,
                  days: 365,
                })
              }
              className="mt-8 w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-purple-200 active:scale-98 cursor-pointer"
            >
              Select Annual (₹1,999)
            </button>
          </div>
        </div>
      </div>

      {/* ── Permanent QR Guarantee Card ── */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shrink-0 shadow-xs text-slate-800">
          <QrCode className="w-7 h-7 text-orange-500" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="font-extrabold text-slate-900 text-base">Permanent Universal QR Standee Guarantee</h4>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Your restaurant uses one master QR code across all dining tables. Once printed and placed on tables or standees, the QR link stays permanently tied to your restaurant. When your plan is renewed, your existing standees automatically reactivate without ever reprinting.
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
            razorpayEnabled={subData?.payment?.razorpayEnabled ?? true}
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
