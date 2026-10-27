import React, { useCallback, useEffect, useState } from 'react';
import { Check, Crown, Zap, Shield, RefreshCcw, QrCode, ShieldCheck, CheckCircle2, Sparkles, ArrowRight, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { PaymentModal } from '../components/PaymentModal';
import { SubscriptionHero, type SubscriptionData } from '../components/SubscriptionHero';

const CACHE_KEY = 'orderkare_subscription_status';

const readCache = (): SubscriptionData | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as SubscriptionData) : null;
  } catch {
    return null;
  }
};

export const SubscriptionPage: React.FC = () => {
  const { user } = useAuthStore();

  // Show the last known status instantly, then refresh it in the background
  const [subData, setSubData] = useState<SubscriptionData | null>(() => readCache());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPlanModal, setSelectedPlanModal] = useState<{
    id: string;
    name: string;
    price: number;
    days: number;
  } | null>(null);

  // One request: the status endpoint already returns the active plans
  const fetchStatus = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get('/subscriptions/status');
      if (res.data) {
        setSubData(res.data);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(res.data));
        } catch {}
      }
    } catch (err) {
      console.error('Failed to load subscription status:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const restaurantName = subData?.restaurantName || user?.name || 'Restaurant';
  const isSubscribed = subData?.isSubscribed ?? false;
  const isFirstTime = subData?.isFirstTime ?? true;
  const plans = subData?.plans ?? [];
  const offer = subData?.firstTimeOffer;
  const firstPlan = plans[0];

  // Main banner button: pay the trial fee, renew, or extend
  const handlePrimary = () => {
    if (!subData) return;
    if (!isSubscribed && isFirstTime && offer) {
      setSelectedPlanModal({ id: offer.id, name: offer.name, price: offer.price, days: offer.durationDays });
      return;
    }
    if (firstPlan) {
      setSelectedPlanModal({ id: firstPlan.id, name: firstPlan.name, price: firstPlan.price, days: firstPlan.durationDays });
    }
  };

  const primaryDisabled = !subData || (!(!isSubscribed && isFirstTime) && !firstPlan);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-14 font-sans antialiased text-slate-800">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200/70 mb-2">
            <Crown className="w-3.5 h-3.5 text-orange-500" />
            <span>OrderKare Billing & Licensing</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">QR Ordering & Plan Management</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
            Manage your restaurant's master QR license, renew your plan, and keep 0% commission digital ordering running.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          disabled={isRefreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Refresh Status'}</span>
        </button>
      </div>

      {/* ── Status banner (same card as the Dashboard) ── */}
      <SubscriptionHero sub={subData} restaurantName={restaurantName} onPrimary={handlePrimary} primaryDisabled={primaryDisabled} />

      {/* ── Lock notice ── */}
      {subData && !isSubscribed && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <Lock className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          <p className="text-xs sm:text-sm text-rose-800 font-medium leading-relaxed">
            Your account is locked. Orders, menu, tables, workers, analytics and settings are unavailable, and customers cannot
            place orders until your subscription is active. This page stays open so you can pay.
          </p>
        </div>
      )}

      {/* ── First-time offer card ── */}
      {subData && isFirstTime && offer && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-r from-slate-900 via-orange-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl overflow-hidden border border-orange-500/30"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 bg-orange-500/20 border border-orange-500/40 text-orange-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>Introductory Offer</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Pay ₹{offer.price} and Get {offer.durationDays} Days of Full Access
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {offer.description} After the trial, choose one of the plans below to keep your QR codes and features active.
              </p>
            </div>

            <button
              onClick={() => setSelectedPlanModal({ id: offer.id, name: offer.name, price: offer.price, days: offer.durationDays })}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-sm rounded-2xl transition-all shadow-xl hover:shadow-orange-500/30 active:scale-95 shrink-0 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>Pay ₹{offer.price} & Start Trial</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Plans ── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Subscription Plans</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Select a plan to keep ordering active. All plans include 0% order commission and permanent QR standees.
            </p>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            ✓ 0% Platform Commission
          </span>
        </div>

        {!subData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 rounded-3xl border-2 border-slate-200 bg-white animate-pulse" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 font-medium">
            No plans are available right now. Please contact support.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all ${
                  plan.isPopular
                    ? 'border-2 border-orange-500 shadow-xl relative transform md:-translate-y-2'
                    : 'border-2 border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
                    ★ Most Popular
                  </div>
                )}

                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                        plan.isPopular ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {index === 0 ? <Zap className="w-6 h-6" /> : index === 1 ? <Crown className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                        plan.isPopular ? 'text-orange-700 bg-orange-50 border border-orange-200' : 'text-slate-600 bg-slate-100'
                      }`}
                    >
                      {plan.durationDays} Days
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900 font-mono">₹{plan.price.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-slate-400 font-semibold">
                      / {plan.durationDays === 30 ? 'mo' : `${plan.durationDays} days`}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                        <Check className={`w-4 h-4 shrink-0 ${plan.isPopular ? 'text-orange-500' : 'text-emerald-600'}`} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPlanModal({ id: plan.id, name: plan.name, price: plan.price, days: plan.durationDays })}
                  className={`mt-8 w-full py-3.5 font-extrabold text-xs rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer ${
                    plan.isPopular
                      ? 'bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  Select {plan.name} (₹{plan.price.toLocaleString('en-IN')})
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Permanent QR guarantee ── */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-14 h-14 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-center shrink-0 shadow-xs text-slate-800">
          <QrCode className="w-7 h-7 text-orange-500" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="font-extrabold text-slate-900 text-base">Permanent Universal QR Standee Guarantee</h4>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            Your restaurant uses one master QR link for all tables. Once printed, the QR code stays tied to your restaurant. When your
            plan is renewed, your existing standees reactivate automatically without reprinting.
          </p>
        </div>
      </div>

      {/* ── Trust strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="bg-white border border-slate-200/70 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">256-Bit SSL Encrypted</p>
            <p className="text-[11px] text-slate-400">Secure payments powered by Razorpay</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200/70 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Instant QR Unlock</p>
            <p className="text-[11px] text-slate-400">Ordering unlocks automatically after payment</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200/70 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">0% Commission Promise</p>
            <p className="text-[11px] text-slate-400">You keep 100% of your food revenue</p>
          </div>
        </div>
      </div>

      {/* ── Payment modal ── */}
      <AnimatePresence>
        {selectedPlanModal && (
          <PaymentModal
            planName={selectedPlanModal.name}
            planId={selectedPlanModal.id}
            amount={selectedPlanModal.price}
            durationDays={selectedPlanModal.days}
            upiId={subData?.payment?.upiId || ''}
            restaurantName={restaurantName}
            razorpayEnabled={subData?.payment?.razorpayEnabled ?? true}
            onClose={() => setSelectedPlanModal(null)}
            onSuccess={() => {
              fetchStatus();
              // Tell the rest of the app (lock screen, dashboard) to re-check right away
              window.dispatchEvent(new Event('orderkare:subscription-updated'));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};