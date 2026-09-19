import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Lock,
  RefreshCcw,
  CheckCircle2,
  Clock,
  Smartphone,
  Copy,
  AlertCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';

export interface PaymentModalProps {
  planName: string;
  planId: string;
  amount: number;
  durationDays: number;
  upiId: string;
  restaurantName: string;
  razorpayEnabled?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  planName,
  planId,
  amount,
  durationDays,
  upiId,
  restaurantName,
  razorpayEnabled = true,
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'razorpay' | 'upi'>(
    razorpayEnabled ? 'razorpay' : 'upi'
  );
  const [copied, setCopied] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'pay' | 'success' | 'pending'>('pay');
  const [paymentError, setPaymentError] = useState('');

  const cleanUpi = (upiId || '').trim();
  const upiLink = cleanUpi
    ? `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=OrderKare&am=${amount}&cu=INR&tn=${encodeURIComponent(`${planName} - ${restaurantName}`)}`
    : '';
  const qrUrl = upiLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiLink)}&color=0f172a&bgcolor=ffffff&margin=2`
    : '';

  const handleCopy = () => {
    if (!cleanUpi) return;
    navigator.clipboard.writeText(cleanUpi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      script.onerror = () => reject(new Error('Razorpay secure checkout could not be loaded'));
      document.body.appendChild(script);
    });

  const openSecureCheckout = async () => {
    setIsSubmitting(true);
    setPaymentError('');
    try {
      const { data: paymentOrder } = await api.post('/subscriptions/payment-order', { planId });
      if (!paymentOrder?.keyId || !paymentOrder?.orderId || !paymentOrder?.amount) {
        throw new Error('Payment gateway order creation failed. Please try again.');
      }
      await loadRazorpay();
      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) throw new Error('Razorpay SDK failed to initialize');

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
          escape: false
        },
        handler: async (response: Record<string, string>) => {
          try {
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
            setPaymentError(
              err.response?.data?.message ||
                'Payment verification failed. Please contact support if your payment was deducted.'
            );
          } finally {
            setIsSubmitting(false);
          }
        },
      });
      checkout.open();
    } catch (err: any) {
      setIsSubmitting(false);
      const msg = err.response?.data?.message || err.message || 'Unable to initiate secure payment';
      setPaymentError(msg);
      if (err.response?.status === 503) {
        setActiveTab('upi');
      }
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
      if (response.data?.pending) {
        setStep('pending');
      }
    } catch (err: any) {
      setPaymentError(
        err.response?.data?.message || 'Failed to submit payment reference. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden z-10 my-8 border border-slate-100"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 p-6 text-white">
          <div className="absolute top-0 right-0 p-4">
            <button
              onClick={onClose}
              className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-all backdrop-blur-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-orange-500/20 text-orange-300 border border-orange-500/30">
              <Lock className="w-3 h-3" />
              Secure 256-Bit Checkout
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div>
              <h3 className="text-2xl font-black text-white">{planName}</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {restaurantName} • <span className="text-orange-400 font-semibold">{durationDays} Days Active Access</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Total Amount</span>
              <span className="text-3xl font-black text-orange-400">₹{amount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {step === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10 space-y-4"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-100 animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="space-y-1">
                <h4 className="text-2xl font-black text-slate-900">Payment Verified!</h4>
                <p className="text-sm text-slate-600 max-w-sm mx-auto font-medium">
                  Your subscription is now active! Your QR codes are unlocked and live orders are enabled.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                <RefreshCcw className="w-4 h-4 animate-spin" />
                Updating status...
              </div>
            </motion.div>
          ) : step === 'pending' ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900">Payment Reference Submitted</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Your reference <span className="font-mono font-bold text-slate-800">{utrNumber}</span> has been received. Our team will verify the payment and activate your permanent QR codes shortly.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-md cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Payment Method Selector Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('razorpay');
                    setPaymentError('');
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'razorpay'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-orange-500" />
                  <span>Instant Pay (Razorpay)</span>
                  <span className="hidden sm:inline-block bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.2 rounded-md font-extrabold">
                    Instant
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('upi');
                    setPaymentError('');
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'upi'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-slate-600" />
                  <span>Direct UPI / QR</span>
                </button>
              </div>

              {paymentError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-700 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-rose-800">Payment Alert</p>
                    <p className="mt-0.5">{paymentError}</p>
                  </div>
                </motion.div>
              )}

              {/* Tab 1: Razorpay Instant Online Payment */}
              {activeTab === 'razorpay' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-orange-50/60 to-amber-50/40 border border-orange-200/70 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-slate-600 font-medium">Selected Plan</span>
                      <span className="font-bold text-slate-900">{planName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-slate-600 font-medium">Validity</span>
                      <span className="font-bold text-slate-900">{durationDays} Days</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-orange-200/60 font-bold">
                      <span className="text-slate-700">Payable Now</span>
                      <span className="text-lg text-orange-600 font-black">₹{amount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Supports All Indian Payment Modes</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      UPI (Google Pay, PhonePe, Paytm, CRED), Credit/Debit Cards, Net Banking, and Wallets are supported with instant automatic account activation.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openSecureCheckout}
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-orange-500/25 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCcw className="w-4 h-4 animate-spin" />
                        <span>Opening Razorpay Gateway...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-orange-100" />
                        <span>Pay ₹{amount.toLocaleString('en-IN')} & Unlock Master QR</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 font-medium pt-1">
                    <span>⚡ Instant Activation</span>
                    <span>•</span>
                    <span>🔒 Razorpay Verified</span>
                    <span>•</span>
                    <span>🛡️ 100% Safe & Secure</span>
                  </div>
                </div>
              )}

              {/* Tab 2: Manual UPI / QR Code */}
              {activeTab === 'upi' && (
                <div className="space-y-4">
                  {/* QR Code Container */}
                  <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="inline-block bg-white p-3 rounded-2xl shadow-xs border border-slate-100">
                      {qrUrl ? (
                        <img src={qrUrl} alt="UPI Payment QR" className="w-40 h-40 mx-auto block" />
                      ) : (
                        <div className="w-40 h-40 mx-auto flex items-center justify-center text-xs text-slate-500 text-center px-4">
                          UPI ID not configured by Admin. Please use Instant Pay (Razorpay).
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-2">
                      Scan with <strong>Google Pay, PhonePe, Paytm, or BHIM</strong>
                    </p>
                  </div>

                  {/* UPI Copy Box */}
                  {cleanUpi && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Or Pay Directly To UPI ID
                      </label>
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                        <span className="flex-1 px-3 py-2 text-xs font-mono text-slate-800 select-all truncate">
                          {cleanUpi}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="px-3.5 py-2 border-l border-slate-200 text-slate-600 hover:text-orange-600 hover:bg-orange-50 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          {copied ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Manual UTR Submit Form */}
                  <form onSubmit={handleManualPayment} className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Enter UPI Transaction Reference / UTR Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 423987123456 (12 digits)"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        After transferring, paste the UTR / Ref number from your UPI app for manual verification.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !utrNumber.trim()}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSubmitting ? 'Submitting UTR...' : 'Submit UTR For Verification'}</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
