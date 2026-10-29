import React, { useCallback, useEffect, useState } from 'react';
import {
  Check,
  Crown,
  Zap,
  Shield,
  RefreshCcw,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Lock,
} from 'lucide-react';
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

  const [subData, setSubData] = useState<SubscriptionData | null>(() => readCache());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPlanModal, setSelectedPlanModal] = useState<{
    id: string;
    name: string;
    price: number;
    days: number;
  } | null>(null);

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

  const handlePrimary = () => {
    if (!subData) return;
    if (!isSubscribed && isFirstTime && offer) {
      setSelectedPlanModal({
        id: offer.id,
        name: offer.name,
        price: offer.price,
        days: offer.durationDays,
      });
      return;
    }
    if (firstPlan) {
      setSelectedPlanModal({
        id: firstPlan.id,
        name: firstPlan.name,
        price: firstPlan.price,
        days: firstPlan.durationDays,
      });
    }
  };

  const primaryDisabled = !subData || (!(!isSubscribed && isFirstTime) && !firstPlan);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-14">
      {/* ─── 1. TOP HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/60 mb-2">
            <Crown className="w-3.5 h-3.5 text-orange-500" />
            <span>OrderKare Billing & Licensing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Subscription & Licensing
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-2xl font-medium">
            Manage your restaurant master QR license, renewal cycles, and 0% commission digital ordering
          </p>
        </div>

        <button
          onClick={fetchStatus}
          disabled={isRefreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Refresh Status'}</span>
        </button>
      </div>

      {/* ─── 2. SUBSCRIPTION STATUS HERO ─── */}
      <SubscriptionHero
        sub={subData}
        restaurantName={restaurantName}
        onPrimary={handlePrimary}
        primaryDisabled={primaryDisabled}
      />

      {/* ─── 3. LOCK NOTICE (ONLY WHEN UNPAID) ─── */}
      {subData && !isSubscribed && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4">
          <Lock className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
          <p className="text-xs sm:text-sm text-rose-800 dark:text-rose-300 font-medium leading-relaxed">
            Your restaurant features are currently locked. Orders, menu, tables, workers, analytics, and settings are unavailable until your subscription is activated. Select a plan below to activate your account.
          </p>
        </div>
      )}

      {/* ─── 4. SUBSCRIPTION PLANS ─── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Subscription Plans
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Choose the billing cycle that fits your venue. All plans include 0% commission and permanent QR standees.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>0% Commission Guaranteed</span>
          </span>
        </div>

        {!subData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-80 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse"
              />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500 font-medium shadow-2xs">
            No plans are currently active. Please contact support.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all relative ${
                  plan.isPopular
                    ? 'border-2 border-orange-500 shadow-lg shadow-orange-500/10'
                    : 'border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-xs">
                    Most Popular
                  </div>
                )}

                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold ${
                        plan.isPopular
                          ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {index === 0 ? (
                        <Zap className="w-5 h-5" />
                      ) : index === 1 ? (
                        <Crown className="w-5 h-5" />
                      ) : (
                        <Shield className="w-5 h-5" />
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                        plan.isPopular
                          ? 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800'
                          : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {plan.durationDays} Days
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {plan.description}
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono">
                      ₹{plan.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                      / {plan.durationDays === 30 ? 'month' : `${plan.durationDays} days`}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                    {plan.features.map((feat, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium"
                      >
                        <Check
                          className={`w-3.5 h-3.5 shrink-0 ${
                            plan.isPopular ? 'text-orange-500' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() =>
                    setSelectedPlanModal({
                      id: plan.id,
                      name: plan.name,
                      price: plan.price,
                      days: plan.durationDays,
                    })
                  }
                  className={`mt-8 w-full py-3 font-extrabold text-xs rounded-xl transition-all shadow-xs active:scale-98 cursor-pointer ${
                    plan.isPopular
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-orange-500/25'
                      : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white'
                  }`}
                >
                  Select {plan.name} (₹{plan.price.toLocaleString('en-IN')})
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── 5. PERMANENT UNIVERSAL QR STANDEE GUARANTEE ─── */}
      <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-2xs">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl flex items-center justify-center shrink-0 shadow-2xs text-slate-800 dark:text-white">
          <QrCode className="w-6 h-6 text-orange-500" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
            Permanent Master Standee Guarantee
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            Your restaurant uses one permanent master QR link for all dining stations. Once printed, the standee remains tied to your restaurant cloud account. Whenever you renew your subscription, your existing printed standees reactivate automatically without reprinting.
          </p>
        </div>
      </div>

      {/* ─── 6. TRUST & ASSURANCE STRIP ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">256-Bit SSL Encrypted</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Secure payments via UPI & Razorpay</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <Zap className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">Instant QR Standee Unlock</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Ordering turns on right after payment</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">0% Commission Promise</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Keep 100% of your customer billing</p>
          </div>
        </div>
      </div>

      {/* ─── 7. PAYMENT MODAL ─── */}
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
              window.dispatchEvent(new Event('orderkare:subscription-updated'));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};