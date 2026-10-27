import React, { useEffect, useState } from "react";
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
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import api from "../lib/api";
import { PaymentModal } from "../components/PaymentModal";

interface SubscriptionData {
  restaurantId: string;
  restaurantName: string;
  slug: string;
  isSubscribed: boolean;
  isFirstTime: boolean;
  status: "PENDING" | "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  planName: string;
  validUntil: string | null;
  daysRemaining: number;
  qrCodeAllowed: boolean;
  payment?: { razorpayEnabled: boolean; upiId: string };
  plans: {
    id: string;
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

export const SubscriptionPage: React.FC = () => {
  const { user } = useAuthStore();

  const [subData, setSubData] = useState<SubscriptionData>({
    restaurantId: "",
    restaurantName: "Restaurant",
    slug: "",
    isSubscribed: false,
    isFirstTime: true,
    status: "PENDING",
    planName: "NONE",
    validUntil: null,
    daysRemaining: 0,
    qrCodeAllowed: false,
    plans: [],
    firstTimeOffer: {
      id: "FIRST_TIME_ACTIVATION",
      name: "First-Time 14 Days Trial", 
      price: 11,
      durationDays: 14, 
      description: "Special ₹11 activation offer for new restaurants.",
    },
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlanModal, setSelectedPlanModal] = useState<{
    id: string;
    name: string;
    price: number;
    days: number;
  } | null>(null);

  const fetchStatus = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get("/subscriptions/status");
      const plansRes = await api.get("/plans/active");

      if (res.data) {
        const formattedPlans = (plansRes.data.plans || []).map((p: any) => {
          let days = 30;
          const nameLower = p.name.toLowerCase();
          if (nameLower.includes("6") || nameLower.includes("half")) days = 180;
          if (nameLower.includes("year") || nameLower.includes("annual")) days = 365;

          return {
            id: p.id,
            name: p.name,
            price: p.priceMonthly,
            durationDays: days,
            periodText: days === 30 ? "per month" : `for ${days} days`,
            description: p.description || "Premium SaaS dining plan.",
            features: p.features || [],
            isPopular: p.isPopular,
          };
        });

        setSubData({
          ...res.data,
          plans: formattedPlans.length > 0 ? formattedPlans : [],
        });
      }
    } catch (err) {
      console.error("Failed to load subscription status or plans:", err);
    } finally {
      setIsRefreshing(false);
      setLoadingPlans(false);
    }
  };
  
  useEffect(() => {
    fetchStatus();
  }, []);

  const isSubscribed = subData?.isSubscribed ?? false;
  const isFirstTime = subData?.isFirstTime ?? true;
  const status = subData?.status ?? "PENDING";
  const daysLeft = subData?.daysRemaining ?? 0;
  const restaurantName = subData?.restaurantName || user?.name || "Restaurant";

  const totalDays =
    subData?.planName === "ANNUAL" ? 365
      : subData?.planName === "SIX_MONTHS" ? 180
        : 30;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((daysLeft / totalDays) * 100)),
  );

  const firstAvailablePlan = subData.plans[0];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-14 font-sans antialiased text-slate-800">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200/70 mb-2">
            <Crown className="w-3.5 h-3.5 text-orange-500" />
            <span>OrderKare Enterprise Billing & Licensing</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            QR Ordering & Plan Management
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
            Manage your restaurant master QR license, renew active dining plans,
            and unlock 0% commission digital ordering.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          disabled={isRefreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <RefreshCcw
            className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-orange-500" : ""}`}
          />
          <span>{isRefreshing ? "Syncing..." : "Refresh Status"}</span>
        </button>
      </div>

      {/* ── Status Hero Banner ── */}
      <div
        className={`rounded-3xl p-6 sm:p-8 transition-all relative overflow-hidden shadow-sm border-2 ${
          isSubscribed
            ? "bg-gradient-to-br from-emerald-500/10 via-teal-50/50 to-white border-emerald-400/80 shadow-emerald-500/5"
            : status === "EXPIRED"
              ? "bg-gradient-to-br from-rose-500/10 via-red-50/50 to-white border-rose-300 shadow-rose-500/5"
              : "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-slate-800 shadow-xl"
        }`}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                isSubscribed
                  ? "bg-emerald-500 text-white shadow-emerald-500/30"
                  : status === "EXPIRED"
                    ? "bg-rose-500 text-white shadow-rose-500/30"
                    : "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-orange-500/30"
              }`}
            >
              {isSubscribed ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : status === "EXPIRED" ? (
                <AlertCircle className="w-7 h-7" />
              ) : (
                <Sparkles className="w-7 h-7" />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full ${
                    isSubscribed
                      ? status === "TRIAL"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : status === "EXPIRED"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                  }`}
                >
                  {isSubscribed
                    ? status === "TRIAL"
                      ? "14-Day Free Trial Active" 
                      : "Active Commercial License"
                    : status === "EXPIRED"
                      ? "Subscription Expired"
                      : "Introductory Activation Required"}
                </span>

                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${
                    !isSubscribed && status === "PENDING"
                      ? "bg-white/10 text-slate-300 border-white/15"
                      : "bg-white/80 text-slate-700 border-slate-200/80"
                  }`}
                >
                  {restaurantName}
                </span>

                {isSubscribed && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-mono">
                    <QrCode className="w-3 h-3" />
                    QR Standee Live
                  </span>
                )}
              </div>

              <h2
                className={`text-xl sm:text-2xl font-black tracking-tight ${
                  !isSubscribed && status === "PENDING"
                    ? "text-white"
                    : "text-slate-900"
                }`}
              >
                {isSubscribed
                  ? `${daysLeft} Days of Active Master QR Ordering Remaining`
                  : status === "EXPIRED"
                    ? "Your Master QR Code is Currently Paused (Renew to Reactivate)"
                    : "Complete ₹11 Introductory Payment to Activate 14 Days Free"} 
              </h2>

              <p
                className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${
                  !isSubscribed && status === "PENDING"
                    ? "text-slate-300"
                    : "text-slate-600"
                }`}
              >
                {isSubscribed
                  ? `Your dining standees are live until ${new Date(
                      subData?.validUntil || "",
                    ).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}. Customers can scan any table to order seamlessly without reprinting codes.`
                  : status === "EXPIRED"
                    ? "Your universal QR codes remain saved permanently in the cloud. Renew any plan below to immediately re-enable table ordering without altering your physical standees."
                    : "New restaurant setups require a one-time ₹11 gateway authorization fee via Razorpay to generate your permanent Master QR standee and receive 14 full days of unlimited dining orders."} {/* 👈 Change 6 */}
              </p>

              {isSubscribed && subData?.validUntil && (
                <div className="pt-2 max-w-md space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500">
                    <span>Plan Expiration Progress</span>
                    <span className="font-mono text-emerald-700">
                      {daysLeft} Days Left ({progressPercent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Header Action CTA */}
          <div className="shrink-0 self-start lg:self-center">
            {!isSubscribed ? (
              <button
                onClick={() =>
                  setSelectedPlanModal({
                    id: isFirstTime
                      ? "FIRST_TIME_ACTIVATION"
                      : firstAvailablePlan?.id || "MONTHLY",
                    name: isFirstTime
                      ? "First-Time Activation (14 Days Free)" 
                      : firstAvailablePlan?.name || "Plan Renewal",
                    price: isFirstTime ? 11 : firstAvailablePlan?.price || 249, 
                    days: isFirstTime ? 14 : firstAvailablePlan?.durationDays || 30, 
                  })
                }
                className="px-6 py-4 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm rounded-2xl transition-all shadow-xl shadow-orange-500/25 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>
                  {isFirstTime
                    ? "⚡ Pay ₹11 & Activate 14 Days Free" 
                    : " Renew Subscription"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() =>
                  firstAvailablePlan &&
                  setSelectedPlanModal({
                    id: firstAvailablePlan.id,
                    name: firstAvailablePlan.name,
                    price: firstAvailablePlan.price,
                    days: firstAvailablePlan.durationDays,
                  })
                }
                className="px-5 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-extrabold text-xs rounded-2xl transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>Extend Validity</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ──  Introductory Card ── */}
      {isFirstTime && (
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
                <span>Special Introductory Offer</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                First-Time Setup: Pay ₹11 & Get 14 Days Free! 
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Activate your restaurant account with an introductory ₹11 payment
                via Razorpay. Instantly unlock universal Master QR standees,
                sub-second Kitchen Display alerts, live ordering, and digital
                menus for 14 full days with 0% commissions. 
              </p>
            </div>

            <button
              onClick={() =>
                setSelectedPlanModal({
                  id: "FIRST_TIME_ACTIVATION",
                  name: "First-Time Activation (14 Days Free)", 
                  price: 11, 
                  days: 14, 
                })
              }
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-sm rounded-2xl transition-all shadow-xl hover:shadow-orange-500/30 active:scale-95 shrink-0 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>Pay ₹11 & Activate Now</span> 
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Dynamic Pricing Matrix ── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Subscription Tiers for Continuous Dining
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Select an ongoing subscription plan. All plans include 0% order
              commissions and permanent QR standees.
            </p>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            ✓ 0% Platform Commission
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subData.plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`bg-white rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all ${
                plan.isPopular
                  ? "border-2 border-orange-500 shadow-xl relative transform md:-translate-y-2"
                  : "border-2 border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md"
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
                      plan.isPopular
                        ? "bg-orange-100 text-orange-600"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {index === 0 ? (
                      <Zap className="w-6 h-6" />
                    ) : index === 1 ? (
                      <Crown className="w-6 h-6" />
                    ) : (
                      <Shield className="w-6 h-6" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                      plan.isPopular
                        ? "text-orange-700 bg-orange-50 border border-orange-200"
                        : "text-slate-600 bg-slate-100"
                    }`}
                  >
                    {plan.durationDays} Days
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {plan.description}
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900 font-mono">
                      ₹{plan.price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      /{" "}
                      {plan.durationDays === 30
                        ? "mo"
                        : `${plan.durationDays} days`}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  {plan.features.map((feat, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 text-xs text-slate-700 font-medium"
                    >
                      <Check
                        className={`w-4 h-4 shrink-0 ${plan.isPopular ? "text-orange-500" : "text-emerald-600"}`}
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
                className={`mt-8 w-full py-3.5 font-extrabold text-xs rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer ${
                  plan.isPopular
                    ? "bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25"
                    : "bg-slate-900 hover:bg-slate-800 text-white"
                }`}
              >
                Select {plan.name} (₹{plan.price.toLocaleString("en-IN")})
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Permanent Universal QR Guarantee Card ── */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-14 h-14 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-center shrink-0 shadow-xs text-slate-800">
          <QrCode className="w-7 h-7 text-orange-500" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="font-extrabold text-slate-900 text-base">
            Permanent Universal QR Standee Guarantee
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            Your restaurant uses one master QR link across all dining tables.
            Once printed and placed on acrylic standees or tables, the QR code
            is permanently bound to your restaurant. When your plan is renewed,
            your existing standees automatically reactivate without reprinting.
          </p>
        </div>
      </div>

      {/* ── Security & Trust Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="bg-white border border-slate-200/70 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">
              256-Bit SSL Encrypted
            </p>
            <p className="text-[11px] text-slate-400">
              Bank-grade security powered by Razorpay
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/70 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">
              Instant QR Unlock
            </p>
            <p className="text-[11px] text-slate-400">
              Live ordering unlocks automatically in seconds
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/70 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">
              0% Commission Promise
            </p>
            <p className="text-[11px] text-slate-400">
              You keep 100% of your customer food revenue
            </p>
          </div>
        </div>
      </div>

      {/* ── Razorpay Single Flow ── */}
      <AnimatePresence>
        {selectedPlanModal && (
          <PaymentModal
            planName={selectedPlanModal.name}
            planId={selectedPlanModal.id}
            amount={selectedPlanModal.price}
            durationDays={selectedPlanModal.days}
            upiId={subData?.payment?.upiId || ""}
            restaurantName={restaurantName}
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