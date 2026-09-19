import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Lock,
  RefreshCcw,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Zap,
  Sparkles,
  Smartphone,
  Building2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';

export interface PaymentModalProps {
  planName: string;
  planId: string;
  amount: number;
  durationDays: number;
  restaurantName: string;
  onClose: () => void;
  onSuccess: () => void;
  upiId?: string;
  razorpayEnabled?: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  planName,
  planId,
  amount,
  durationDays,
  restaurantName,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'pay' | 'verifying' | 'success'>('pay');
  const [paymentError, setPaymentError] = useState('');

  const loadRazorpay = () =>
    new Promise<void>((resolve, reject) => {
      if ((window as any).Razorpay) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Razorpay secure checkout could not be loaded. Please check your internet connection.'));
      document.body.appendChild(script);
    });

  const openSecureCheckout = async () => {
    setIsSubmitting(true);
    setPaymentError('');
    try {
      // 1. Create secure payment order on backend
      const { data: paymentOrder } = await api.post('/subscriptions/payment-order', { planId });
      if (!paymentOrder?.keyId || !paymentOrder?.orderId || !paymentOrder?.amount) {
        throw new Error('Payment gateway order creation failed. Please try again.');
      }

      // 2. Load Razorpay Checkout SDK
      await loadRazorpay();
      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) throw new Error('Razorpay SDK failed to initialize');

      // 3. Open Razorpay Gateway Modal
      const checkout = new Razorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency || 'INR',
        name: 'OrderKare',
        description: `${planName} (${durationDays} Days) - ${restaurantName}`,
        order_id: paymentOrder.orderId,
        theme: { color: '#f97316' },
        prefill: {
          name: restaurantName,
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
          },
          backdropclose: false,
          escape: false,
        },
        handler: async (response: Record<string, string>) => {
          setStep('verifying');
          try {
            // 4. Verify payment on server
            const verifyRes = await api.post('/subscriptions/payment-verify', {
              planId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data?.success) {
              setStep('success');
              setTimeout(() => {
                onSuccess();
                onClose();
              }, 2200);
            }
          } catch (err: any) {
            setStep('pay');
            setPaymentError(
              err.response?.data?.message ||
                'Payment verification failed. Please contact support if your account was debited.'
            );
          } finally {
            setIsSubmitting(false);
          }
        },
      });

      checkout.open();
    } catch (err: any) {
      setIsSubmitting(false);
      setStep('pay');
      const msg = err.response?.data?.message || err.message || 'Unable to initiate secure Razorpay payment.';
      setPaymentError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={isSubmitting ? undefined : onClose}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 360 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden z-10 my-8 border border-slate-100"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 p-6 text-white overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-40 h-40 bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-orange-500/20 text-orange-300 border border-orange-500/30">
              <Lock className="w-3 h-3" />
              Razorpay Secure Checkout
            </span>

            {!isSubmitting && (
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative z-10">
            <h3 className="text-xl font-black text-white tracking-tight">{planName}</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {restaurantName} • <span className="text-orange-300 font-semibold">{durationDays} Days Access</span>
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {step === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-4"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-100 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="text-2xl font-black text-slate-900">Payment Verified!</h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                  Your subscription is active and your restaurant QR code ordering is now live.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                Updating your account...
              </div>
            </motion.div>
          ) : step === 'verifying' ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                <RefreshCcw className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900">Verifying Payment...</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Confirming your payment receipt with Razorpay. Please do not close this window.
                </p>
              </div>
            </div>
          ) : (
            <>
              {paymentError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-700 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-rose-800">Payment Error</p>
                    <p className="mt-0.5">{paymentError}</p>
                  </div>
                </motion.div>
              )}

              {/* Price Breakdown Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Plan Duration</span>
                  <span className="font-bold text-slate-900 font-mono">{durationDays} Days</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Taxes & GST</span>
                  <span className="font-bold text-emerald-600 text-[11px]">Included</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-200 font-bold">
                  <span className="text-slate-800">Total Payable</span>
                  <span className="text-2xl text-slate-900 font-mono font-black">
                    ₹{amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Supported Payment Modes Banner */}
              <div className="p-3.5 bg-orange-50/50 rounded-2xl border border-orange-200/60 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-orange-950 font-bold text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  <span>All Payment Modes Supported</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  UPI (Google Pay, PhonePe, Paytm, CRED, BHIM), Credit/Debit Cards, Net Banking & Wallets via Razorpay.
                </p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={openSecureCheckout}
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-orange-500/25 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                    <span>Connecting to Razorpay...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-orange-100" />
                    <span>Pay ₹{amount.toLocaleString('en-IN')} with Razorpay</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 font-medium pt-1">
                <span>⚡ Instant QR Unlock</span>
                <span>•</span>
                <span>🔒 256-Bit SSL</span>
                <span>•</span>
                <span>🛡️ PCI-DSS Compliant</span>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
