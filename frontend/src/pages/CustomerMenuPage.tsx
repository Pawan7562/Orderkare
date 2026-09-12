import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { 
  ShoppingCart, Plus, Minus, Search, X, CheckCircle2, Clock, 
  Utensils, Sparkles, ChefHat, MapPin, Star, ArrowRight,
  Flame, Leaf, RotateCcw, Info, ShieldCheck,
  CreditCard, BellRing, Tag, Percent, Award
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api/v1'
    : 'https://orderkare-3.onrender.com/api/v1'
);

interface Restaurant {
  id: string;
  name: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  address?: string;
  phone?: string;
}

interface Category {
  id: string;
  name: string;
}

interface FoodItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  imageUrl: string | null;
  categoryId?: string;
  category?: { name: string };
}

interface SponsoredAd {
  id: string;
  sponsor: string;
  badge: string;
  title: string;
  description: string;
  discountText: string;
  promoCode?: string | null;
  imageUrl: string;
  ctaText: string;
  ctaLink?: string | null;
  bgGradient: string;
  isActive?: boolean;
}

const ORDER_STEPS = [
  { status: 'PENDING', label: 'Order Received', icon: Clock, desc: 'Ticket sent to kitchen' },
  { status: 'ACCEPTED', label: 'Order Accepted', icon: CheckCircle2, desc: 'Kitchen acknowledged ticket' },
  { status: 'PREPARING', label: 'Chef Cooking', icon: ChefHat, desc: 'Dishes currently being prepared' },
  { status: 'READY', label: 'Ready to Serve', icon: Flame, desc: 'Plated & headed to your table' },
  { status: 'SERVED', label: 'Served at Table', icon: Utensils, desc: 'Bon appétit! Enjoy your meal' },
];

export const CustomerMenuPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();

  // Auto-detect table number from QR code scan query string (e.g. ?table=04, ?t=4, or ?tableNumber=04)
  const qrTableParam = searchParams.get('table') || searchParams.get('t') || searchParams.get('tableNumber') || '';

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [ads, setAds] = useState<SponsoredAd[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [vegFilter, setVegFilter] = useState<'ALL' | 'VEG' | 'NONVEG'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<any>(null);

  // Sponsored Banner Carousel State
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState(qrTableParam || '01');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'counter' | 'upi'>('counter');
  const [loading, setLoading] = useState(true);
  const [orderError, setOrderError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);

  const cart = useCartStore();

  useEffect(() => {
    if (!qrTableParam) {
      setTableNumber('01');
      return;
    }

    const normalizedTable = /^\d+$/.test(qrTableParam.trim())
      ? qrTableParam.trim().padStart(2, '0')
      : qrTableParam.trim() || '01';

    setTableNumber(normalizedTable);
  }, [qrTableParam]);

  // Fetch Super Admin Managed Active Ads
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await axios.get(`${API}/ads`);
        if (res.data?.ads) {
          setAds(res.data.ads);
        }
      } catch (err) {
        // Silently handle offline/empty ads
      }
    };
    fetchAds();
  }, []);

  // Auto-rotate sponsored banner carousel every 6 seconds if multiple active ads exist
  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [ads.length]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const [catRes, foodRes] = await Promise.all([
          axios.get(`${API}/menu/${slug}/categories`),
          axios.get(`${API}/menu/${slug}/foods`),
        ]);
        if (catRes.data?.restaurant) setRestaurant(catRes.data.restaurant);
        if (catRes.data?.categories?.length) {
          setCategories(catRes.data.categories);
        }
        if (foodRes.data?.foods?.length) {
          setFoods(foodRes.data.foods);
        }
      } catch (err: any) {
        setOrderError('Menu is temporarily unavailable. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [slug]);

  useEffect(() => {
    if (!orderPlaced?.id) return;

    const feedbackKey = `order-feedback-${orderPlaced.id}`;
    const savedFeedback = localStorage.getItem(feedbackKey);
    if (savedFeedback) {
      try {
        const parsed = JSON.parse(savedFeedback);
        if (parsed.rating) setFeedbackRating(parsed.rating);
        if (parsed.text) setFeedbackText(parsed.text);
        setFeedbackSubmitted(true);
      } catch {
        // ignore malformed saved feedback
      }
    }
  }, [orderPlaced?.id]);

  useEffect(() => {
    if (!orderPlaced?.id) return;

    const pollStatus = async () => {
      try {
        const response = await axios.get(`${API}/orders/track/${orderPlaced.id}`);
        const currentOrder = response.data?.order;
        if (currentOrder) setOrderPlaced((prev: any) => ({ ...prev, ...currentOrder }));
      } catch {
        // Keep the last known status while service reconnects
      }
    };
    void pollStatus();
    const interval = window.setInterval(pollStatus, 4000);
    return () => window.clearInterval(interval);
  }, [orderPlaced?.id]);

  const filteredFoods = useMemo(() => {
    return foods.filter((f) => {
      const matchesCategory =
        activeCategory === 'ALL' ||
        f.categoryId === activeCategory ||
        f.category?.name === categories.find((c) => c.id === activeCategory)?.name;

      const matchesSearch =
        !search ||
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(search.toLowerCase()));

      const matchesVeg =
        vegFilter === 'ALL' ||
        (vegFilter === 'VEG' && f.isVeg) ||
        (vegFilter === 'NONVEG' && !f.isVeg);

      return matchesCategory && matchesSearch && matchesVeg;
    });
  }, [foods, activeCategory, search, vegFilter, categories]);

  const subtotal = cart.getTotal();
  const discountAmount = appliedPromo ? 50 : 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = Math.round(taxableAmount * 0.05);
  const total = taxableAmount + tax;

  const handlePlaceOrder = async () => {
    if (!customerName.trim()) {
      setOrderError('Please enter your name');
      return;
    }
    if (!tableNumber.trim()) {
      setOrderError('Please enter table number');
      return;
    }
    setPlacingOrder(true);
    setOrderError('');
    try {
      const res = await axios.post(`${API}/orders/place/${slug || 'royal-palace'}`, {
        customerName,
        tableNumber,
        phoneNumber: phoneNumber || undefined,
        notes: orderNotes ? `${orderNotes}${appliedPromo ? ` [Promo: ${appliedPromo}]` : ''}` : (appliedPromo ? `[Promo: ${appliedPromo}]` : undefined),
        paymentMethod,
        items: cart.items.map((i) => ({ foodItemId: i.foodItemId, quantity: i.quantity })),
      });
      setOrderPlaced(res.data.order);
      cart.clearCart();
      setShowCheckout(false);
      setShowCart(false);
    } catch (err: any) {
      setOrderError(err.response?.data?.message || 'Order could not be placed. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleCallWaiter = () => {
    setWaiterCalled(true);
    setTimeout(() => setWaiterCalled(false), 4000);
  };

  const copyPromoCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setAppliedPromo(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4 font-sans">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
          <ChefHat className="w-5 h-5 text-rose-600 absolute inset-0 m-auto" />
        </div>
        <div className="text-center">
          <p className="text-slate-900 text-sm font-bold">Loading Menu</p>
          <p className="text-slate-400 text-xs mt-0.5">Connecting to table service...</p>
        </div>
      </div>
    );
  }

  // --- LIVE ORDER TRACKING SCREEN ---
  if (orderPlaced) {
    const finalDeliveryStatuses = ['SERVED', 'COMPLETED', 'DELIVERED', 'RECEIVED'];
    const isDelivered = finalDeliveryStatuses.includes(String(orderPlaced.status || '').toUpperCase());
    const currentStepIndex = Math.max(
      0,
      ORDER_STEPS.findIndex((s) => s.status === orderPlaced.status)
    );

    if (isDelivered) {
      const handleFeedbackSubmit = async () => {
        const feedbackKey = `order-feedback-${orderPlaced.id}`;
        const payload = {
          rating: feedbackRating,
          comment: feedbackText,
          customerName: customerName || 'Guest',
        };

        try {
          await axios.post(`${API}/orders/${orderPlaced.id}/feedback`, payload);
        } catch (error) {
          localStorage.setItem(feedbackKey, JSON.stringify(payload));
        }

        localStorage.setItem(feedbackKey, JSON.stringify(payload));
        setFeedbackSubmitted(true);
      };

      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between max-w-lg mx-auto relative overflow-hidden font-sans border-x border-slate-200 shadow-2xl">
          <div className="p-6 relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Served at Table
              </span>
              <span className="text-xs font-bold font-mono bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full shadow-2xs">
                Table #{orderPlaced.tableNumber}
              </span>
            </div>

            <div className="text-center my-2">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 bg-emerald-50 border border-emerald-200 rounded-3xl mx-auto flex items-center justify-center text-emerald-600 mb-4 shadow-xl shadow-emerald-500/10"
              >
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Enjoyed your dining?</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Order #{orderPlaced.id.slice(-6).toUpperCase()} • Your feedback is appreciated
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xl space-y-5 text-left">
              <div>
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Rate your food & service</h2>
                <div className="flex items-center justify-between gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className={`flex-1 rounded-2xl border h-12 text-xl font-bold transition-all flex items-center justify-center ${
                        feedbackRating >= star
                          ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-500/20'
                          : 'bg-slate-50 text-slate-300 border-slate-200 hover:border-slate-400'
                      }`}
                      aria-label={`Rate ${star} out of 5`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Comments & Feedback
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={3}
                  placeholder="How was your meal, preparation speed, and dining experience?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 px-3.5 py-3 outline-none focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 resize-none font-medium"
                />
              </div>

              {feedbackSubmitted && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-4 py-2.5 text-xs font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Thank you! Your feedback has been recorded.</span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 space-y-3 text-left shadow-sm">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Order Items</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {orderPlaced.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs text-slate-700">
                    <span>
                      <strong className="text-rose-600">{item.quantity}x</strong> {item.foodItem?.name || item.name}
                    </span>
                    <span className="font-mono text-slate-900 font-bold">₹{(item.price || 0) * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-sm font-bold">
                <span className="text-slate-500">Total Settled</span>
                <span className="text-emerald-700 text-base font-mono font-black">₹{orderPlaced.totalAmount}</span>
              </div>
            </div>
          </div>

          <div className="p-6 pt-0 relative z-10 space-y-3">
            <button
              onClick={handleFeedbackSubmit}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-rose-600/20 active:scale-98"
            >
              <Star className="w-4 h-4 fill-white" />
              <span>{feedbackSubmitted ? 'Update Review' : 'Submit Feedback'}</span>
            </button>
            <button
              onClick={() => setOrderPlaced(null)}
              className="w-full bg-white hover:bg-slate-50 text-slate-800 font-bold py-3.5 rounded-2xl border border-slate-200 text-xs flex items-center justify-center space-x-2 transition-all active:scale-98 shadow-2xs"
            >
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span>Order More Food & Beverages</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between max-w-lg mx-auto relative overflow-hidden font-sans border-x border-slate-200 shadow-2xl">
        <div className="p-6 relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-rose-700 font-bold bg-rose-50 border border-rose-200 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 bg-rose-600 rounded-full animate-ping" /> Live Kitchen Dispatch
            </span>
            <span className="text-xs font-bold font-mono bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full shadow-2xs">
              Table #{orderPlaced.tableNumber}
            </span>
          </div>

          <div className="text-center my-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 bg-rose-50 border border-rose-200 rounded-3xl mx-auto flex items-center justify-center text-rose-600 mb-4 shadow-xl shadow-rose-600/10"
            >
              <Sparkles className="w-10 h-10 animate-bounce" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Order in the Kitchen!</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Order #{orderPlaced.id.slice(-6).toUpperCase()} • Your table ticket is being prepared
            </p>
          </div>

          {/* Stepper tracker */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xl text-left">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-5">Live Preparation Tracker</h2>
            <div className="space-y-6 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-100">
              {ORDER_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={step.status} className="flex items-start space-x-4 relative z-10">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                        isCurrent
                          ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-600/30 ring-4 ring-rose-500/15 scale-110'
                          : isPassed
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="pt-1 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-bold ${isPassed ? 'text-slate-950' : 'text-slate-400'}`}>
                          {step.label}
                        </h3>
                        {isCurrent && (
                          <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider animate-pulse">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items Summary */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 space-y-3 text-left shadow-sm">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Dishes on this Ticket</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {orderPlaced.items.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs text-slate-700">
                  <span>
                    <strong className="text-rose-600">{item.quantity}x</strong> {item.foodItem?.name || item.name}
                  </span>
                  <span className="font-mono text-slate-900 font-bold">₹{(item.price || 0) * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-sm font-bold">
              <span className="text-slate-500">Order Subtotal</span>
              <span className="text-rose-600 text-base font-mono font-black">₹{orderPlaced.totalAmount}</span>
            </div>
          </div>
        </div>

        <div className="p-6 pt-0 relative z-10">
          <button
            onClick={() => setOrderPlaced(null)}
            className="w-full bg-white hover:bg-slate-50 text-slate-800 font-bold py-3.5 rounded-2xl border border-slate-200 text-xs flex items-center justify-center space-x-2 transition-all active:scale-98 shadow-sm"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Add More Dishes to Table</span>
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN CUSTOMER MENU UI ---
  const currentAd = ads.length > 0 ? ads[currentAdIndex % ads.length] : null;

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 max-w-lg mx-auto relative pb-32 font-sans border-x border-slate-200/90 shadow-2xl">
      
      {/* Clean Restaurant Header */}
      <div className="relative bg-slate-950 text-white pt-6 pb-6 px-5 shadow-lg overflow-hidden text-left">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3.5">
          {/* Top badges bar */}
          <div className="flex items-center justify-between">
            <span className="bg-white/10 backdrop-blur-md border border-white/15 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" /> Digital Table Menu
            </span>
            <div className="bg-rose-600 text-white text-xs font-extrabold px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-md shadow-rose-600/30 font-mono">
              <Utensils className="w-3.5 h-3.5" /> Table {tableNumber}
            </div>
          </div>

          {/* Restaurant Title & Info */}
          <div className="flex items-start space-x-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-lg shrink-0 border border-white/20">
              {restaurant?.logoUrl ? (
                <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-rose-600 to-amber-600 rounded-xl flex items-center justify-center text-white font-black text-xl">
                  {restaurant?.name?.charAt(0) || 'R'}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">{restaurant?.name || 'Restaurant Dining'}</h1>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-400 shrink-0" /> {restaurant?.address || 'Dining Room Service Area'}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-300">
                <span className="flex items-center text-amber-400 font-bold">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-1" /> 4.9 (450+ Diners)
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Kitchen Open
                </span>
              </div>
            </div>
          </div>

          {/* Quick Utility Actions */}
          <div className="pt-0.5 flex items-center gap-2">
            <button
              onClick={handleCallWaiter}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
              <span>{waiterCalled ? 'Staff Notified ✓' : 'Call Waiter'}</span>
            </button>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-medium px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hygienic Prep</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- DEDICATED SPONSORED ADS (ONLY RENDERED WHEN SUPER ADMIN HAS ACTIVE ADS) --- */}
      {ads.length > 0 && currentAd && (
        <div className="p-4 pt-4">
          <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200 text-left bg-slate-900 text-white">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentAd.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35 }}
                className={`p-5 relative bg-gradient-to-r ${currentAd.bgGradient} flex flex-col justify-between min-h-[150px]`}
              >
                {/* Background Accent */}
                <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-25 overflow-hidden pointer-events-none">
                  <img src={currentAd.imageUrl} alt={currentAd.title} className="w-full h-full object-cover" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2 relative z-10">
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-amber-300 border border-white/10 flex items-center gap-1">
                        <Award className="w-3 h-3" /> {currentAd.badge}
                      </span>
                      <span className="text-[10px] text-slate-300 font-bold">• {currentAd.sponsor}</span>
                    </div>

                    {ads.length > 1 && (
                      <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                        {currentAdIndex + 1}/{ads.length}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-black text-white tracking-tight leading-snug relative z-10 max-w-[85%]">
                    {currentAd.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-[85%] line-clamp-2 leading-relaxed relative z-10 font-normal">
                    {currentAd.description}
                  </p>
                </div>

                {/* Offer Action Row */}
                <div className="mt-3.5 pt-2.5 border-t border-white/10 flex items-center justify-between relative z-10">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-amber-300 font-mono flex items-center gap-1">
                      <Percent className="w-3 h-3" /> {currentAd.discountText}
                    </span>
                    {currentAd.promoCode && (
                      <button
                        onClick={() => copyPromoCode(currentAd.promoCode!)}
                        className="text-[10px] font-mono font-bold bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 rounded border border-white/20 transition-all flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        <span>{copiedCode === currentAd.promoCode ? 'APPLIED ✓' : currentAd.promoCode}</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (currentAd.promoCode) copyPromoCode(currentAd.promoCode);
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center space-x-1"
                  >
                    <span>{currentAd.ctaText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Dots indicator */}
            {ads.length > 1 && (
              <div className="absolute bottom-2 right-4 flex space-x-1.5 z-20">
                {ads.map((ad, idx) => (
                  <button
                    key={ad.id}
                    onClick={() => setCurrentAdIndex(idx)}
                    className={`h-1 rounded-full transition-all ${
                      currentAdIndex === idx ? 'w-5 bg-rose-500' : 'w-1.5 bg-white/30'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky Filter & Search Bar */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-xl z-30 pt-3 pb-2 px-4 border-b border-slate-200/90 shadow-xs space-y-2.5 text-left">
        {/* Search Bar */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs flex items-center px-3.5 py-2.5 focus-within:bg-white focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/10 transition-all">
          <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes, drinks, desserts..."
            className="flex-1 text-xs outline-none bg-transparent text-slate-900 placeholder-slate-400 font-medium"
          />
          {search && (
            <button onClick={() => setSearch('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dietary & Count Controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 shrink-0">
            <button
              onClick={() => setVegFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                vegFilter === 'ALL' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setVegFilter('VEG')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                vegFilter === 'VEG' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" /> Veg
            </button>
            <button
              onClick={() => setVegFilter('NONVEG')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                vegFilter === 'NONVEG' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Non-Veg
            </button>
          </div>

          <span className="text-[11px] font-bold text-slate-400 shrink-0 font-mono">
            {filteredFoods.length} dishes
          </span>
        </div>

        {/* Category Carousel */}
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === 'ALL'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            🔥 All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Food Cards List */}
      <div className="p-4 space-y-3.5 text-left">
        {filteredFoods.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-2xs">
            <span className="text-4xl block mb-3">🔍</span>
            <h3 className="font-bold text-slate-900 text-sm">No dishes match your selection</h3>
            <p className="text-slate-400 text-xs mt-1">Try switching filters or clearing your search query.</p>
          </div>
        ) : (
          filteredFoods.map((food) => {
            const inCart = cart.items.find((i) => i.foodItemId === food.id);

            return (
              <motion.div
                key={food.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-3xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md transition-all flex justify-between gap-4 ${
                  !food.isAvailable ? 'opacity-60 grayscale' : ''
                }`}
              >
                {/* Left details */}
                <div
                  className="flex-1 min-w-0 flex flex-col justify-between cursor-pointer"
                  onClick={() => setSelectedFood(food)}
                >
                  <div>
                    {/* Veg/Non-Veg Emblem */}
                    <span
                      className={`inline-flex items-center justify-center w-4 h-4 rounded-md border-2 bg-white mb-1.5 ${
                        food.isVeg ? 'border-emerald-600' : 'border-rose-600'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${food.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                    </span>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug hover:text-rose-600 transition-colors">
                      {food.name}
                    </h3>

                    <p className="text-sm font-black text-slate-900 font-mono mt-1">
                      ₹{food.price}
                    </p>

                    {food.description && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {food.description}
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 font-medium pt-2 flex items-center gap-1 hover:text-rose-600">
                    <Info className="w-3 h-3" /> Details
                  </span>
                </div>

                {/* Right image + ADD button */}
                <div className="relative shrink-0 flex flex-col items-center">
                  <div
                    className="w-28 h-28 rounded-2xl bg-slate-50 overflow-hidden border border-slate-200/80 cursor-pointer relative"
                    onClick={() => setSelectedFood(food)}
                  >
                    {food.imageUrl ? (
                      <img src={food.imageUrl} alt={food.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl bg-amber-50">
                        {food.isVeg ? '🥗' : '🍗'}
                      </div>
                    )}
                  </div>

                  {/* Add to Cart Stepper Button */}
                  <div className="-mt-5 z-10 w-24 h-9">
                    {!food.isAvailable ? (
                      <span className="flex items-center justify-center h-full text-[10px] bg-rose-50 text-rose-600 font-bold px-2 rounded-xl border border-rose-200 shadow-xs">
                        Sold Out
                      </span>
                    ) : inCart ? (
                      <div className="flex items-center justify-between h-full bg-rose-600 text-white rounded-xl shadow-md shadow-rose-600/30 border border-rose-600 overflow-hidden px-1">
                        <button
                          onClick={() => cart.updateQuantity(food.id, inCart.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-black/20 transition-colors rounded-lg active:scale-90"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-black px-1 font-mono">{inCart.quantity}</span>
                        <button
                          onClick={() => cart.updateQuantity(food.id, inCart.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-black/20 transition-colors rounded-lg active:scale-90"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          cart.addItem({
                            foodItemId: food.id,
                            name: food.name,
                            price: food.price,
                            isVeg: food.isVeg,
                          })
                        }
                        className="w-full h-full bg-white hover:bg-rose-600 hover:text-white text-rose-600 font-extrabold text-xs rounded-xl border border-slate-200 shadow-md shadow-slate-200/80 transition-all uppercase tracking-wider flex items-center justify-center gap-1 active:scale-95"
                      >
                        <span>ADD</span>
                        <Plus className="w-3 h-3 stroke-[3]" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Dish Detail Modal */}
      <AnimatePresence>
        {selectedFood && (
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setSelectedFood(null)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 260 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl text-left border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Photo Banner */}
              <div className="h-56 bg-slate-100 relative overflow-hidden shrink-0">
                {selectedFood.imageUrl ? (
                  <img src={selectedFood.imageUrl} alt={selectedFood.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl bg-amber-50">
                    {selectedFood.isVeg ? '🥗' : '🍗'}
                  </div>
                )}
                <button
                  onClick={() => setSelectedFood(null)}
                  className="absolute top-4 right-4 p-2 bg-slate-950/60 text-white hover:bg-slate-950 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-md">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      selectedFood.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <span>{selectedFood.isVeg ? 'Pure Vegetarian' : 'Non-Vegetarian'}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-black text-slate-950">{selectedFood.name}</h2>
                    <span className="text-xl font-black text-rose-600 font-mono">₹{selectedFood.price}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {selectedFood.description || 'Prepared fresh upon order with premium culinary ingredients and spices.'}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Preparation Time</span>
                    <span className="font-bold text-slate-800">10-15 mins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kitchen Line</span>
                    <span className="font-bold text-slate-800">Direct KDS Monitor</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => {
                    cart.addItem({
                      foodItemId: selectedFood.id,
                      name: selectedFood.name,
                      price: selectedFood.price,
                      isVeg: selectedFood.isVeg,
                    });
                    setSelectedFood(null);
                  }}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-rose-600/20 active:scale-98"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add to Order • ₹{selectedFood.price}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Cart Bar */}
      <AnimatePresence>
        {cart.getItemCount() > 0 && !showCart && !showCheckout && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-4 left-0 right-0 max-w-lg mx-auto px-4 z-40"
          >
            <button
              onClick={() => setShowCart(true)}
              className="w-full bg-slate-950 text-white rounded-3xl p-4 flex items-center justify-between shadow-2xl border border-slate-800 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white font-bold shadow-md shadow-rose-600/30">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Table #{tableNumber} Cart</span>
                  <span className="text-sm font-bold text-white">
                    {cart.getItemCount()} {cart.getItemCount() === 1 ? 'dish' : 'dishes'} added
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-base font-black text-rose-400 font-mono">₹{total}</span>
                <div className="w-9 h-9 rounded-full bg-rose-600 flex items-center justify-center text-white font-bold shadow-md">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Bottom Sheet Drawer */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-end justify-center"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-white rounded-t-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl text-left border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Your Table Order</h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Table #{tableNumber}</p>
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="p-5 space-y-3 overflow-y-auto flex-1">
                {cart.items.map((item) => (
                  <div
                    key={item.foodItemId}
                    className="flex items-center justify-between bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80"
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`w-3.5 h-3.5 rounded-md border-2 bg-white flex items-center justify-center ${
                          item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`}
                        />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{item.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">₹{item.price} each</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                        <button
                          onClick={() => cart.updateQuantity(item.foodItemId, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors active:scale-90"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold w-6 text-center font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => cart.updateQuantity(item.foodItemId, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors active:scale-90"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-xs font-black text-slate-900 font-mono w-14 text-right">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Food Subtotal</span>
                  <span className="font-mono font-bold">₹{subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Voucher Promo ({appliedPromo})</span>
                    <span className="font-mono">-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Taxes & GST (5%)</span>
                  <span className="font-mono">₹{tax}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Payable</span>
                  <span className="text-rose-600 font-mono text-base">₹{total}</span>
                </div>
              </div>

              <div className="p-5 pt-0 flex space-x-3 bg-slate-50 rounded-b-3xl">
                <button
                  onClick={() => {
                    cart.clearCart();
                    setShowCart(false);
                  }}
                  className="px-4 py-3 text-slate-600 bg-white border border-slate-200 rounded-2xl text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  Clear Cart
                </button>
                <button
                  onClick={() => {
                    setShowCart(false);
                    setShowCheckout(true);
                  }}
                  className="flex-1 bg-rose-600 text-white py-3.5 rounded-2xl font-bold text-xs hover:bg-rose-700 transition-all shadow-md shadow-rose-600/20 flex items-center justify-center space-x-2 active:scale-98"
                >
                  <span>Proceed to Confirm</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Details Drawer */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowCheckout(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 text-left max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Confirm Table Order</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Direct dispatch to kitchen screen</p>
                </div>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {orderError && (
                <div className="bg-rose-50 text-rose-700 px-4 py-2.5 rounded-2xl text-xs font-semibold mb-4 border border-rose-200">
                  {orderError}
                </div>
              )}

              <div className="space-y-3.5 mb-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:border-rose-600 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Table Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder="04"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-rose-600 focus:ring-4 focus:ring-rose-500/10 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98765..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:border-rose-600 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Special Cooking Notes
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. Less spicy, dressing on side..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:border-rose-600 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Promo Code Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Promo / Voucher Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={appliedPromo}
                      onChange={(e) => setAppliedPromo(e.target.value.toUpperCase())}
                      placeholder="e.g. COKEZERO or UPIDINE"
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold font-mono outline-none focus:bg-white focus:border-rose-600 focus:ring-2 focus:ring-rose-500/10 uppercase"
                    />
                    {appliedPromo && (
                      <button
                        type="button"
                        onClick={() => setAppliedPromo('')}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-2xl text-xs font-bold text-slate-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Payment Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Payment Preference
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('counter')}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        paymentMethod === 'counter'
                          ? 'bg-rose-50 border-rose-600 text-rose-950 font-bold shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="text-xs block font-bold">Pay at Counter</span>
                      <span className="text-[10px] text-slate-500">Cash or UPI at desk</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        paymentMethod === 'upi'
                          ? 'bg-rose-50 border-rose-600 text-rose-950 font-bold shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="text-xs block font-bold">Direct UPI QR</span>
                      <span className="text-[10px] text-slate-500">GPay, PhonePe, Paytm</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Order items preview */}
              <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-900">Total Items ({cart.getItemCount()})</span>
                  <span className="text-rose-600 font-bold font-mono">Table #{tableNumber}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Voucher Applied ({appliedPromo})</span>
                    <span className="font-mono">-₹{discountAmount}</span>
                  </div>
                )}
                <div className="pt-1 flex justify-between font-extrabold text-slate-950 text-sm">
                  <span>Grand Total</span>
                  <span className="text-rose-600 font-mono text-base">₹{total}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="px-4 py-3.5 text-slate-600 bg-slate-100 rounded-2xl text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="flex-1 bg-rose-600 text-white py-3.5 rounded-2xl text-xs font-bold hover:bg-rose-700 transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center space-x-2 active:scale-98"
                >
                  {placingOrder ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending to Kitchen...</span>
                    </span>
                  ) : (
                    <>
                      <span>Dispatch Order • ₹{total}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
