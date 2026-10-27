import { QrCode, Sparkles, AlertCircle, CheckCircle2, ArrowRight, ChevronRight, Lock } from 'lucide-react';

export interface SubscriptionData {
  restaurantId: string;
  restaurantName: string;
  slug: string;
  isSubscribed: boolean;
  isFirstTime: boolean;
  status: 'PENDING' | 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  planName: string;
  validUntil: string | null;
  daysRemaining: number;
  totalDays?: number;
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

interface Props {
  sub: SubscriptionData | null;
  restaurantName?: string;
  onPrimary: () => void;       // pay / renew / extend
  primaryDisabled?: boolean;
}

// The same subscription banner is used on the Dashboard and on the Subscription page
export const SubscriptionHero = ({ sub, restaurantName, onPrimary, primaryDisabled }: Props) => {
  // No data yet (first load): show a quiet placeholder instead of a wrong "expired" state
  if (!sub) {
    return <div className="rounded-3xl border-2 border-slate-200 bg-white h-44 animate-pulse" />;
  }

  const isSubscribed = sub.isSubscribed;
  const isFirstTime = sub.isFirstTime;
  const status = sub.status;
  const daysLeft = sub.daysRemaining ?? 0;
  const offer = sub.firstTimeOffer;
  const name = restaurantName || sub.restaurantName || 'Restaurant';

  const totalDays = sub.totalDays && sub.totalDays > 0 ? sub.totalDays : 30;
  const progressPercent = Math.min(100, Math.max(0, Math.round((daysLeft / totalDays) * 100)));

  const isDark = !isSubscribed && status !== 'EXPIRED'; // new restaurant, nothing paid yet

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 transition-all relative overflow-hidden shadow-sm border-2 ${
        isSubscribed
          ? 'bg-gradient-to-br from-emerald-500/10 via-teal-50/50 to-white border-emerald-400/80 shadow-emerald-500/5'
          : status === 'EXPIRED'
          ? 'bg-gradient-to-br from-rose-500/10 via-red-50/50 to-white border-rose-300 shadow-rose-500/5'
          : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-slate-800 shadow-xl'
      }`}
    >
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4 sm:gap-5">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
              isSubscribed
                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                : status === 'EXPIRED'
                ? 'bg-rose-500 text-white shadow-rose-500/30'
                : 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-orange-500/30'
            }`}
          >
            {isSubscribed ? (
              <CheckCircle2 className="w-7 h-7" />
            ) : status === 'EXPIRED' ? (
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
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : status === 'EXPIRED'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                }`}
              >
                {isSubscribed
                  ? status === 'TRIAL'
                    ? `${offer.durationDays}-Day Trial Active`
                    : 'Active Commercial License'
                  : status === 'EXPIRED'
                  ? 'Subscription Expired'
                  : 'Activation Required'}
              </span>

              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${
                  isDark ? 'bg-white/10 text-slate-300 border-white/15' : 'bg-white/80 text-slate-700 border-slate-200/80'
                }`}
              >
                {name}
              </span>

              {isSubscribed && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-mono">
                  <QrCode className="w-3 h-3" />
                  QR Standee Live
                </span>
              )}

              {!isSubscribed && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Features Locked
                </span>
              )}
            </div>

            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isSubscribed
                ? `${daysLeft} Days of Active Master QR Ordering Remaining`
                : status === 'EXPIRED'
                ? 'Your Master QR Code Is Paused (Renew to Reactivate)'
                : isFirstTime
                ? `Pay ₹${offer.price} to Start Your ${offer.durationDays}-Day Trial`
                : 'Choose a Plan to Activate Your Master QR'}
            </h2>

            <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {isSubscribed
                ? `Your dining standees are live until ${new Date(sub.validUntil || '').toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}. Customers can scan any table to order seamlessly without reprinting codes.`
                : status === 'EXPIRED'
                ? 'Your QR codes stay saved in the cloud. Renew a plan to turn on table ordering again without changing your printed standees. All other sections stay locked until you renew.'
                : `A one-time ₹${offer.price} activation fee unlocks your Master QR standee, live ordering and every feature for ${offer.durationDays} days. All other sections stay locked until the subscription is active.`}
            </p>

            {isSubscribed && sub.validUntil && (
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

        <div className="shrink-0 self-start lg:self-center">
          {!isSubscribed ? (
            <button
              onClick={onPrimary}
              disabled={primaryDisabled}
              className="px-6 py-4 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm rounded-2xl transition-all shadow-xl shadow-orange-500/25 active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {isFirstTime ? `Pay ₹${offer.price} & Start ${offer.durationDays}-Day Trial` : 'Renew Subscription'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onPrimary}
              disabled={primaryDisabled}
              className="px-5 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-extrabold text-xs rounded-2xl transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Extend Validity</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};