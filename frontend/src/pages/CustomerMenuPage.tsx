import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useCartStore } from '../store/cartStore';
import { 
  ShoppingCart, Plus, Minus, Search, X, CheckCircle2, Clock, 
  Utensils, ChefHat, MapPin, Star, ArrowRight,
  Flame, Leaf, RotateCcw, Info, MessageSquareHeart,
  Tag, Percent, Sparkles, Send, ThumbsUp, Heart, Check, Radio, Printer,
  Award, Smile, ThumbsDown
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

const API = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api/v1'
    : 'https://orderkare-3.onrender.com/api/v1'
);

const statusToStepIndex = (status: string): number => {
  const s = (status || '').toUpperCase();
  if (s === 'PENDING') return 0;
  if (s === 'ACCEPTED') return 1;
  if (s === 'PREPARING') return 2;
  if (s === 'READY') return 3;
  if (s === 'SERVED' || s === 'COMPLETED') return 4;
  return 0;
};

const formatDisplayName = (name?: string) => {
  if (!name) return 'The Spice Route Dining';
  const trimmed = name.trim();
  if (/^(.)\1{4,}/i.test(trimmed)) {
    return 'Punjab Spice Hub';
  }
  return trimmed;
};

const formatAddress = (addr?: string) => {
  if (!addr) return 'Dine-In Menu';
  const lines = addr.split(/[\r\n]+/).map(s => s.trim()).filter(Boolean);
  const unique = Array.from(new Set(lines));
  return unique.join(', ') || 'Dine-In Menu';
};

interface Restaurant {
  id: string;
  slug?: string;
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
  { status: 'PENDING', label: 'Order Received', icon: Clock, desc: 'Kitchen queue acknowledged' },
  { status: 'ACCEPTED', label: 'Order Confirmed', icon: CheckCircle2, desc: 'Chef assigned to ticket' },
  { status: 'PREPARING', label: 'Chef Cooking', icon: ChefHat, desc: 'Food being cooked fresh' },
  { status: 'READY', label: 'Plated & Ready', icon: Flame, desc: 'Plated & heading to your table' },
  { status: 'SERVED', label: 'Served at Table', icon: Utensils, desc: 'Bon Appétit! Enjoy your meal' },
];

const FEEDBACK_TAGS = [
  '⚡ Super Fast Service',
  '🔥 Piping Hot & Fresh',
  '😋 Bursting with Flavor',
  '✨ Spotless Hygiene',
  '🍽️ Generous Portions',
  '👨‍🍳 Master Chef Presentation',
  '🛎️ Polite & Courteous Staff',
  '🎵 Lovely Dining Ambience',
  '💰 Great Value for Money',
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', damping: 20, stiffness: 300 }
  }
};

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

  // Live order tracker states
  const [orderStatusIdx, setOrderStatusIdx] = useState(1);
  const [remainingMinutes, setRemainingMinutes] = useState(14);
  const [remainingSeconds, setRemainingSeconds] = useState(30);

  // Customer Feedback state
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(['⚡ Super Fast Service', '🔥 Piping Hot & Fresh']);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [favoriteDishes, setFavoriteDishes] = useState<string[]>([]);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackToastMsg, setFeedbackToastMsg] = useState<string | null>(null);

  // Sponsored Promo State
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Auto-cycle sponsored ads if multiple are active
  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex(prev => (prev + 1) % ads.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [ads.length]);

  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState(qrTableParam || '01');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'counter' | 'upi'>('counter');
  const [loading, setLoading] = useState(true);
  const [orderError, setOrderError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

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

  // Order Prep Timer Countdown Simulation
  useEffect(() => {
    if (!orderPlaced) return;
    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev > 0) return prev - 1;
        setRemainingMinutes(min => {
          if (min > 0) return min - 1;
          return 0;
        });
        return 59;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [orderPlaced]);

  // Fetch Super Admin Managed Active Ads
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await axios.get(`${API}/super-admin/ads`);
        if (res.data?.ads && Array.isArray(res.data.ads)) {
          const activeOnly = res.data.ads.filter((a: SponsoredAd) => a.isActive !== false);
          setAds(activeOnly);
        }
      } catch (err) {
        setAds([
          {
            id: 'fallback-1',
            sponsor: 'Coca-Cola Zero Sugar',
            badge: 'Exclusive Offer',
            title: 'Chilled Refreshment with Every Meal',
            description: 'Pair your favourite dishes with crisp Coca-Cola Zero Sugar.',
            discountText: 'Flat ₹50 OFF',
            promoCode: 'COKEZERO',
            imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&auto=format&fit=crop&q=80',
            ctaText: 'Claim Offer',
            bgGradient: 'from-red-900 via-zinc-900 to-black',
            isActive: true,
          }
        ]);
      }
    };
    fetchAds();
  }, []);

  const [isSubscriptionActive, setIsSubscriptionActive] = useState(true);

  // Fetch Restaurant Details & Menu
  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        if (!slug) {
          setRestaurant(null);
          setCategories([]);
          setFoods([]);
          return;
        }
        const res = await axios.get(`${API}/menu/public/${slug}`);
        setRestaurant(res.data.restaurant);
        setCategories(res.data.categories || []);
        setFoods(res.data.foods || []);
        setIsSubscriptionActive(res.data.isSubscriptionActive ?? true);
      } catch (err) {
        console.error('Failed to load menu for slug:', slug, err);
        setRestaurant(null);
        setCategories([]);
        setFoods([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [slug]);

  // Filtered Food Items based on search, category, and dietary preferences
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
    if (!isSubscriptionActive) {
      setOrderError('Digital ordering is temporarily paused for this restaurant. Please place your order directly with staff.');
      return;
    }
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
      const targetSlug = slug || restaurant?.slug || restaurant?.id || 'royal-palace';
      const cleanTable = String(tableNumber).replace(/^Table\s*#?/i, '').trim() || '1';
      const res = await axios.post(`${API}/orders/place/${targetSlug}`, {
        customerName: customerName.trim(),
        tableNumber: cleanTable,
        phoneNumber: phoneNumber ? phoneNumber.trim() : undefined,
        notes: orderNotes ? `${orderNotes}${appliedPromo ? ` [Promo: ${appliedPromo}]` : ''}` : (appliedPromo ? `[Promo: ${appliedPromo}]` : undefined),
        paymentMethod,
        items: cart.items.map((i) => ({ foodItemId: i.foodItemId, quantity: i.quantity })),
      });

      const newOrder = res.data.order;
      setOrderPlaced(newOrder);
      setOrderStatusIdx(statusToStepIndex(newOrder.status));
      try {
        localStorage.setItem(`orderkare_active_order_${targetSlug}`, JSON.stringify(newOrder));
      } catch {}
      cart.clearCart();
      setShowCheckout(false);
      setShowCart(false);
    } catch (err: any) {
      console.error('Order placement error:', err);
      const msg = err.response?.data?.message || 'Could not place order. Please check your table number or items and try again.';
      setOrderError(msg);
    } finally {
      setPlacingOrder(false);
    }
  };

  // Restore existing active order from localStorage on mount
  useEffect(() => {
    const targetSlug = slug || 'royal-palace';
    try {
      const stored = localStorage.getItem(`orderkare_active_order_${targetSlug}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id) {
          axios.get(`${API}/orders/status/${parsed.id}`)
            .then(res => {
              const liveOrder = res.data?.order;
              if (liveOrder && liveOrder.status !== 'COMPLETED' && liveOrder.status !== 'REJECTED') {
                setOrderPlaced(liveOrder);
                const stepIdx = statusToStepIndex(liveOrder.status);
                setOrderStatusIdx(stepIdx);
                if (liveOrder.tableNumber) setTableNumber(liveOrder.tableNumber);

                // Auto-open feedback if served and not yet submitted
                if (stepIdx >= 4) {
                  const alreadyDone = localStorage.getItem(`feedback_submitted_${liveOrder.id}`);
                  if (!alreadyDone) {
                    setShowFeedbackModal(true);
                  } else {
                    setFeedbackSubmitted(true);
                  }
                }
              }
            })
            .catch(() => {});
        }
      }
    } catch {}
  }, [slug]);

  // Live order tracker synchronization (WebSockets + Polling)
  useEffect(() => {
    if (!orderPlaced?.id) return;
    const orderId = orderPlaced.id;

    // Check if feedback was already submitted for this order
    try {
      if (localStorage.getItem(`feedback_submitted_${orderId}`)) {
        setFeedbackSubmitted(true);
      }
    } catch {}

    const socketUrl = import.meta.env.VITE_WS_URL || (
      typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000'
        : 'https://orderkare-3.onrender.com'
    );

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
    });

    const updateStatus = (newStatus: string) => {
      if (!newStatus) return;
      setOrderPlaced((prev: any) => (prev ? { ...prev, status: newStatus } : prev));
      const newIdx = statusToStepIndex(newStatus);
      setOrderStatusIdx(newIdx);

      // Auto-open feedback modal when food is served!
      if (newIdx >= 4) {
        try {
          const alreadyDone = localStorage.getItem(`feedback_submitted_${orderId}`);
          if (!alreadyDone) {
            setShowFeedbackModal(true);
          }
        } catch {
          setShowFeedbackModal(true);
        }
      }
    };

    socket.on('connect', () => {
      socket.emit('join_order', orderId);
      if (restaurant?.id) {
        socket.emit('join_restaurant', restaurant.id);
      }
    });

    socket.on(`order_status_${orderId}`, (data: any) => {
      if (data?.status) updateStatus(data.status);
    });

    socket.on('order_status_update', (data: any) => {
      if (data?.orderId === orderId && data?.status) {
        updateStatus(data.status);
      }
    });

    // Resilient Polling Fallback (every 3.5s)
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/orders/status/${orderId}`);
        if (res.data?.order?.status) {
          updateStatus(res.data.order.status);
        }
      } catch {}
    }, 3500);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [orderPlaced?.id, restaurant?.id]);

  const handleToggleFeedbackTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleToggleFavoriteDish = (dishName: string) => {
    setFavoriteDishes(prev =>
      prev.includes(dishName) ? prev.filter(d => d !== dishName) : [...prev, dishName]
    );
  };

  const handleReturnToMenu = (withToast?: boolean | any) => {
    const showToast = typeof withToast === 'boolean' ? withToast : false;
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('orderkare_active_order_') || key.startsWith('active_order_')) {
          localStorage.removeItem(key);
        }
      });
      const targetSlug = slug || restaurant?.slug || restaurant?.id || 'royal-palace';
      localStorage.removeItem(`orderkare_active_order_${targetSlug}`);
    } catch {}
    setShowFeedbackModal(false);
    setOrderPlaced(null);
    setFeedbackSubmitted(false);
    if (showToast) {
      setFeedbackToastMsg('🎉 Thank you for your review! Enjoy your meal & visit again.');
      setTimeout(() => setFeedbackToastMsg(null), 4000);
    }
  };

  const handleSubmitFeedback = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderPlaced?.id) {
      handleReturnToMenu(true);
      return;
    }
    setSubmittingFeedback(true);
    const orderId = orderPlaced.id;
    try {
      const fullComment = [
        feedbackComment.trim(),
        selectedTags.length > 0 ? `[Tags: ${selectedTags.join(', ')}]` : '',
        favoriteDishes.length > 0 ? `[Loved: ${favoriteDishes.join(', ')}]` : ''
      ].filter(Boolean).join(' ');

      await axios.post(`${API}/orders/${orderId}/feedback`, {
        rating: feedbackRating,
        comment: fullComment,
        customerName: customerName || orderPlaced.customerName || 'Guest',
        tags: selectedTags,
        favoriteDishes,
      });

      try {
        localStorage.setItem(`feedback_submitted_${orderId}`, 'true');
      } catch {}
    } catch (err) {
      console.error('Feedback submit error:', err);
    } finally {
      setSubmittingFeedback(false);
      // Immediately redirect customer back to the menu!
      handleReturnToMenu(true);
    }
  };

  const copyPromoCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setAppliedPromo(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const activeRating = hoverRating !== null ? hoverRating : feedbackRating;
  const ratingLabels = ['Poor 😞', 'Fair 😕', 'Average 😐', 'Good! 😊', 'Outstanding! 🌟'];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4 font-sans">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          <div className="w-14 h-14 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          <ChefHat className="w-6 h-6 text-orange-500 absolute inset-0 m-auto" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-slate-900 text-sm font-extrabold">Loading Digital Menu</p>
          <p className="text-slate-400 text-xs mt-0.5">Connecting to your table...</p>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── LIVE ORDER TRACKING & FEEDBACK SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  if (orderPlaced) {
    const isDelivered = orderStatusIdx >= 4;

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between max-w-md mx-auto relative overflow-hidden font-sans border-x border-slate-200 shadow-xl">
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-xs uppercase tracking-wider text-orange-600 font-extrabold bg-orange-50 border border-orange-200 px-3 py-1 rounded-full flex items-center gap-1.5"
            >
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
              <span>Live Kitchen Dispatch</span>
            </motion.div>
            <span className="text-xs font-black font-mono bg-white border border-slate-200 text-slate-800 px-3 py-1 rounded-full shadow-sm">
              Table #{orderPlaced.tableNumber}
            </span>
          </div>

          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/50 rounded-full blur-2xl pointer-events-none" />

            <motion.div
              animate={isDelivered ? { scale: [1, 1.15, 1] } : { y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-14 h-14 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-md shadow-orange-500/20"
            >
              {isDelivered ? (
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              ) : (
                <ChefHat className="w-7 h-7 stroke-[2.5]" />
              )}
            </motion.div>

            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {isDelivered ? 'Order Served! Enjoy Your Meal' : 'Chef is Cooking Your Order!'}
            </h1>

            <p className="text-slate-500 text-xs font-medium">
              Order #{String(orderPlaced.id || '').slice(-6).toUpperCase()} • Dispatched to Kitchen Display
            </p>

            {/* Estimated Prep Countdown */}
            {!isDelivered && (
              <div className="pt-2">
                <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-orange-700 font-mono">
                  <Clock className="w-3.5 h-3.5 text-orange-500 animate-spin" />
                  <span>
                    Est. Time: {String(remainingMinutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')} mins
                  </span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Stepper tracker */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-left"
          >
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Preparation Status</h2>
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-700">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span>Live Kitchen Sync</span>
              </div>
            </div>

            <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {ORDER_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = idx <= orderStatusIdx;
                const isCurrent = idx === orderStatusIdx;

                return (
                  <div key={step.status} className="flex items-start space-x-3 relative z-10">
                    <motion.div
                      animate={isCurrent ? { scale: [1, 1.08, 1] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                        isCurrent
                          ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/30'
                          : isPassed
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </motion.div>
                    <div className="pt-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-xs font-bold ${isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                          {step.label}
                        </h3>
                        {isCurrent && (
                          <span className="text-[9px] bg-orange-50 border border-orange-200 text-orange-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Ordered Dishes Summary */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 text-left shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ordered Dishes</h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                {orderPlaced.items?.length || 0} {orderPlaced.items?.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {orderPlaced.items?.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs text-slate-700 py-0.5">
                  <span>
                    <strong className="text-orange-500 font-bold">{item.quantity}x</strong> {item.foodItem?.name || item.name}
                  </span>
                  <span className="font-mono text-slate-900 font-bold">₹{(item.price || item.foodItem?.price || 0) * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold">
              <span className="text-slate-600">Total Bill Amount</span>
              <span className="text-orange-600 font-mono text-sm font-extrabold">₹{orderPlaced.totalAmount}</span>
            </div>

            {orderPlaced.notes && (
              <div className="py-2 px-2.5 bg-amber-50 rounded-xl border border-amber-200 text-left text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <span>🌶️</span>
                <span>Kitchen Note: <strong className="text-amber-950 font-black">{orderPlaced.notes}</strong></span>
              </div>
            )}

            {/* Quick Actions for Customer */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={handleReturnToMenu}
                className="flex-1 py-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add More Dishes</span>
              </button>
              <button
                onClick={() => window.print()}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                title="Print Receipt"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print Receipt</span>
              </button>
            </div>
          </motion.div>

          {/* ─── CUSTOMER FEEDBACK SECTION ─── show only after food is served ─── */}
          <AnimatePresence>
            {isDelivered ? (
              <motion.div
                key="feedback-card"
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 text-left shadow-sm space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <motion.div
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-xs"
                    >
                      <Star className="w-4 h-4 fill-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <span>Dining Experience</span>
                        {feedbackSubmitted && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full lowercase first-letter:uppercase">
                            Submitted ✓
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-400">Your feedback helps the chef & staff improve</p>
                    </div>
                  </div>

                  {!feedbackSubmitted && (
                    <button
                      onClick={() => setShowFeedbackModal(true)}
                      className="px-2.5 py-1 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Rate Now</span>
                    </button>
                  )}
                </div>

                {feedbackSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-center space-y-1.5"
                  >
                    <div className="flex items-center justify-center gap-1 text-amber-500">
                      {[...Array(feedbackRating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <h4 className="text-xs font-black text-emerald-900">Thank You For Your Review!</h4>
                    <p className="text-[11px] text-emerald-700">
                      Your rating has been shared directly with the kitchen and restaurant manager.
                    </p>
                  </motion.div>
                ) : (
                  <div className="pt-1">
                    <button
                      onClick={() => setShowFeedbackModal(true)}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md shadow-orange-500/20 active:scale-98 transition-all"
                    >
                      <Star className="w-4 h-4 fill-white" />
                      <span>Leave Your Dining Review (5★)</span>
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              /* Waiting state — shown while order is still being prepared */
              <motion.div
                key="feedback-locked"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-100 border border-dashed border-slate-300 rounded-2xl p-4 flex items-center gap-3 text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <MessageSquareHeart className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Feedback Form Unlocks When Served</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">We'll automatically invite you to review your meal once it is served at table #{orderPlaced.tableNumber}.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── PROFESSIONAL AUTOMATIC FEEDBACK MODAL ─── */}
        <AnimatePresence>
          {showFeedbackModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
            >
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 p-5 space-y-4 max-h-[90vh] overflow-y-auto text-left relative"
              >
                {/* Header with Close */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-500">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">How Was Your Meal?</h3>
                      <p className="text-[10px] text-slate-400">
                        {restaurant?.name || 'Restaurant'} • Table #{orderPlaced.tableNumber}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFeedbackModal(false)}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {feedbackSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-8 text-center space-y-3"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.4 }}
                      className="w-14 h-14 bg-emerald-500 text-white rounded-full mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30"
                    >
                      <Check className="w-7 h-7 stroke-[3]" />
                    </motion.div>
                    <h4 className="text-base font-black text-slate-900">Feedback Submitted!</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Thank you for dining with us. Your ratings and suggestions have been forwarded directly to the culinary & management team.
                    </p>
                    <div className="pt-3">
                      <button
                        onClick={handleReturnToMenu}
                        className="w-full py-3 bg-slate-900 hover:bg-black text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                        <span>Return to Digital Menu</span>
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmitFeedback} className="space-y-4">
                    {/* 5-Star Interactive Rating */}
                    <div className="bg-gradient-to-b from-orange-50/50 to-amber-50/30 border border-orange-100 rounded-2xl p-4 text-center space-y-2">
                      <span className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">
                        Overall Dining Experience
                      </span>
                      <div className="flex items-center justify-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.button
                            key={star}
                            type="button"
                            whileHover={{ scale: 1.25 }}
                            whileTap={{ scale: 0.85 }}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            onClick={() => setFeedbackRating(star)}
                            className="p-1 focus:outline-none transition-transform"
                          >
                            <Star
                              className={`w-8 h-8 transition-all drop-shadow-xs ${
                                star <= activeRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200 fill-slate-100'
                              }`}
                            />
                          </motion.button>
                        ))}
                      </div>
                      <div className="inline-block px-3 py-1 bg-white border border-amber-200/80 rounded-full text-xs font-black text-amber-700 shadow-2xs">
                        {ratingLabels[activeRating - 1]}
                      </div>
                    </div>

                    {/* Dish-by-Dish Favorite Selector */}
                    {orderPlaced.items && orderPlaced.items.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-700 block flex items-center justify-between">
                          <span>Which dish did you enjoy most?</span>
                          <span className="text-[10px] text-slate-400">Tap ❤️ to vote</span>
                        </label>
                        <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto pr-1">
                          {orderPlaced.items.map((item: any, idx: number) => {
                            const dishName = item.foodItem?.name || item.name || `Dish #${idx + 1}`;
                            const isFav = favoriteDishes.includes(dishName);
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleToggleFavoriteDish(dishName)}
                                className={`w-full px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-between ${
                                  isFav
                                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <span>{dishName}</span>
                                <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-300'}`} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quick Highlights / Tags */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        What stood out to you?
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {FEEDBACK_TAGS.map((tag) => {
                          const isSelected = selectedTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleToggleFeedbackTag(tag)}
                              className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border transition-all ${
                                isSelected
                                  ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-2xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Comment Box */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Compliment or Note to Chef & Manager
                      </label>
                      <textarea
                        rows={2}
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="Tell us what you loved or how we could make your next meal even better..."
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-orange-500 transition-colors resize-none placeholder:text-slate-400"
                      />
                    </div>

                    {/* Submit & Cancel Buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowFeedbackModal(false)}
                        className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                      >
                        Skip
                      </button>
                      <button
                        type="submit"
                        disabled={submittingFeedback}
                        className="flex-1 bg-slate-900 hover:bg-black text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md active:scale-98 disabled:opacity-50"
                      >
                        {submittingFeedback ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Submitting Review...</span>
                          </span>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5 text-orange-400" />
                            <span>Submit Feedback</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 pt-0 bg-slate-50">
          <button
            onClick={handleReturnToMenu}
            className="w-full bg-white hover:bg-slate-100 text-slate-800 font-bold py-3 rounded-xl border border-slate-200 text-xs flex items-center justify-center space-x-2 transition-all active:scale-98 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-orange-500" />
            <span>Order More Dishes</span>
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── MAIN DIGITAL MENU VIEW (ANIMATED, CLEAN & PROFESSIONAL)
  // ═══════════════════════════════════════════════════════════════════════════
  if (!restaurant) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto font-sans border-x border-slate-200">
        <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-3xl flex items-center justify-center mb-4 shadow-sm border border-orange-100">
          <Utensils className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Restaurant Menu Not Found</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
          The requested restaurant menu could not be found or is currently inactive. Please ensure you scanned the correct QR code.
        </p>
      </div>
    );
  }

  if (restaurant && (restaurant as any).isSubscriptionActive === false) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto font-sans border-x border-slate-200">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mb-4 shadow-sm border border-amber-200">
          <Clock className="w-8 h-8" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-3 py-1 rounded-full mb-2">
          Service Temporarily Paused
        </span>
        <h2 className="text-xl font-black text-slate-900">{restaurant.name}</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
          This restaurant's digital menu and QR ordering are temporarily paused due to an inactive subscription.
        </p>
        <div className="mt-5 p-4 bg-white border border-slate-200 rounded-2xl w-full max-w-xs text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-800">Need to place an order?</p>
          <p className="text-slate-500">Please contact the restaurant steward or counter staff directly.</p>
        </div>
      </div>
    );
  }

  const currentAd = ads.length > 0 ? ads[currentAdIndex % ads.length] : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 max-w-md mx-auto relative pb-28 font-sans border-x border-slate-200 shadow-xl">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {feedbackToastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 text-center sticky top-0 z-50 shadow-md flex items-center justify-between"
          >
            <span>{feedbackToastMsg}</span>
            <button onClick={() => setFeedbackToastMsg(null)} className="p-1 hover:bg-white/20 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 1. CLEAN RESTAURANT HEADER ─── */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 text-left sticky top-0 z-40 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shrink-0 overflow-hidden flex items-center justify-center shadow-xs">
              {restaurant?.logoUrl ? (
                <img src={restaurant.logoUrl} alt={formatDisplayName(restaurant.name)} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-base uppercase">
                  {formatDisplayName(restaurant?.name).charAt(0)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-extrabold text-slate-900 truncate tracking-tight">
                {formatDisplayName(restaurant?.name)}
              </h1>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate font-medium">
                <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                <span className="truncate">{formatAddress(restaurant?.address)}</span>
              </p>
            </div>
          </div>

          {/* Table Badge */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black px-3.5 py-1.5 rounded-full shrink-0 flex items-center gap-1.5 shadow-sm font-mono tracking-wide">
            <Utensils className="w-3.5 h-3.5" /> Table #{tableNumber}
          </div>
        </div>
      </div>

      {/* Paused Subscription Notice Banner */}
      {!isSubscriptionActive && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 font-medium flex items-center justify-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Ordering is temporarily paused for this restaurant. Viewing menu only.</span>
        </div>
      )}

      {/* ─── PROMO & SPONSORED BANNER (100% PURE, CLEAN & UNOBSTRUCTED) ─── */}
      {ads.length > 0 && currentAd && (
        <motion.div
          key={currentAd.id || currentAdIndex}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="px-3 pt-3 pb-1 text-left"
        >
          <div className="w-full rounded-2xl overflow-hidden shadow-xs border border-slate-200 bg-white">
            {/* Pure Clean Graphic Banner Image - 100% Unobstructed, Zero Overlays */}
            {currentAd.ctaLink ? (
              <a
                href={currentAd.ctaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full overflow-hidden bg-white cursor-pointer"
              >
                {currentAd.imageUrl ? (
                  <img
                    src={currentAd.imageUrl}
                    alt={currentAd.title || currentAd.sponsor || 'Advertisement'}
                    className="w-full h-auto max-h-[220px] object-cover object-center block"
                  />
                ) : (
                  <div className="w-full p-5 flex flex-col justify-center bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                    <span className="text-[10px] font-black uppercase text-white/90">{currentAd.badge || 'Special Offer'}</span>
                    <h3 className="text-base font-black mt-0.5">{currentAd.title}</h3>
                    <p className="text-xs text-white/90 mt-1">{currentAd.description}</p>
                  </div>
                )}
              </a>
            ) : (
              <div
                onClick={() => currentAd.promoCode && copyPromoCode(currentAd.promoCode)}
                className={`block w-full overflow-hidden bg-white ${currentAd.promoCode ? 'cursor-pointer' : ''}`}
              >
                {currentAd.imageUrl ? (
                  <img
                    src={currentAd.imageUrl}
                    alt={currentAd.title || currentAd.sponsor || 'Advertisement'}
                    className="w-full h-auto max-h-[220px] object-cover object-center block"
                  />
                ) : (
                  <div className="w-full p-5 flex flex-col justify-center bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                    <span className="text-[10px] font-black uppercase text-white/90">{currentAd.badge || 'Special Offer'}</span>
                    <h3 className="text-base font-black mt-0.5">{currentAd.title}</h3>
                    <p className="text-xs text-white/90 mt-1">{currentAd.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Clean, Lightweight Action Footer (Below the Banner Graphic) */}
            {(
              (currentAd.discountText && !['0', '00', '0%', 'none', 'n/a', 'null'].includes(currentAd.discountText.trim().toLowerCase())) || 
              currentAd.promoCode || 
              currentAd.ctaText ||
              currentAd.sponsor
            ) && (
              <div className="px-3.5 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {currentAd.sponsor && (
                    <span className="text-[11px] font-bold text-slate-700 truncate">
                      {currentAd.sponsor}
                    </span>
                  )}

                  {currentAd.discountText && !['0', '00', '0%', 'none', 'n/a', 'null'].includes(currentAd.discountText.trim().toLowerCase()) && (
                    <span className="inline-flex items-center gap-0.5 bg-orange-50 text-orange-700 border border-orange-200 font-black text-[11px] px-2 py-0.5 rounded-md font-mono shrink-0">
                      <Percent className="w-2.5 h-2.5 stroke-[3]" />
                      <span>{currentAd.discountText}</span>
                    </span>
                  )}

                  {currentAd.promoCode && (
                    <button
                      type="button"
                      onClick={() => copyPromoCode(currentAd.promoCode!)}
                      className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-slate-200 hover:border-orange-200 px-2 py-0.5 rounded-md transition-all active:scale-95 shrink-0 cursor-pointer"
                      title="Click to copy coupon code"
                    >
                      <Tag className="w-2.5 h-2.5 text-orange-500" />
                      <span>{copiedCode === currentAd.promoCode ? 'COPIED ✓' : currentAd.promoCode}</span>
                    </button>
                  )}
                </div>

                {currentAd.ctaLink ? (
                  <a
                    href={currentAd.ctaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg shadow-2xs transition-all active:scale-95 shrink-0"
                  >
                    <span>{currentAd.ctaText || 'Visit'}</span>
                    <ArrowRight className="w-3 h-3 text-white" />
                  </a>
                ) : currentAd.promoCode ? (
                  <button
                    type="button"
                    onClick={() => copyPromoCode(currentAd.promoCode!)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer"
                  >
                    <span>{currentAd.ctaText || 'Use Code'}</span>
                    <ArrowRight className="w-3 h-3 text-white" />
                  </button>
                ) : null}
              </div>
            )}

            {/* Pagination Slide Dots */}
            {ads.length > 1 && (
              <div className="py-1.5 bg-white border-t border-slate-50 flex items-center justify-center gap-1.5">
                {ads.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setCurrentAdIndex(dotIdx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      dotIdx === (currentAdIndex % ads.length)
                        ? 'w-5 bg-orange-500'
                        : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                    }`}
                    aria-label={`Go to slide ${dotIdx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ─── 2. STICKY SEARCH & CATEGORY BAR ─── */}
      <div className="bg-white/95 backdrop-blur-sm z-30 px-3 py-2.5 border-b border-slate-200 shadow-xs space-y-2 text-left">
        {/* Search Input */}
        <div className="bg-slate-100 rounded-xl flex items-center px-3 py-2 border border-slate-200 focus-within:bg-white focus-within:border-orange-500 transition-colors">
          <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search delicious dishes or drinks..."
            className="flex-1 text-xs outline-none bg-transparent text-slate-900 placeholder-slate-400 font-medium"
          />
          {search && (
            <button onClick={() => setSearch('')} className="p-0.5 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dietary Filters & Counter */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg gap-1 shrink-0 relative">
            <button
              onClick={() => setVegFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all relative ${
                vegFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setVegFilter('VEG')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 relative ${
                vegFilter === 'VEG' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700'
              }`}
            >
              <Leaf className="w-3 h-3" /> Veg
            </button>
            <button
              onClick={() => setVegFilter('NONVEG')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 relative ${
                vegFilter === 'NONVEG' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-700'
              }`}
            >
              <Flame className="w-3 h-3" /> Non-Veg
            </button>
          </div>

          <span className="text-[11px] font-bold text-slate-400 shrink-0 font-mono">
            {filteredFoods.length} items
          </span>
        </div>

        {/* Category Pills with smooth scrolling */}
        <div className="flex space-x-1.5 overflow-x-auto no-scrollbar pt-0.5 text-xs font-bold">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeCategory === 'ALL'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🔥 All Menu
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 3. ANIMATED FOOD ITEM LIST ─── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-3 space-y-3 text-left"
      >
        {filteredFoods.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
          >
            <span className="text-3xl block mb-2">🍽️</span>
            <h3 className="font-bold text-slate-800 text-sm">No items found</h3>
            <p className="text-slate-400 text-xs mt-1">Try selecting another category or clearing the search.</p>
          </motion.div>
        ) : (
          filteredFoods.map((food) => {
            const inCart = cart.items.find((i) => i.foodItemId === food.id);

            return (
              <motion.div
                key={food.id}
                variants={itemVariants}
                className={`bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm hover:shadow-md transition-shadow flex justify-between gap-3 ${
                  !food.isAvailable ? 'opacity-60' : ''
                }`}
              >
                {/* Left details */}
                <div
                  className="flex-1 min-w-0 flex flex-col justify-between cursor-pointer"
                  onClick={() => setSelectedFood(food)}
                >
                  <div>
                    {/* Veg/Non-Veg Dot Emblem */}
                    <span
                      className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-sm border bg-white mb-1.5 ${
                        food.isVeg ? 'border-emerald-600' : 'border-rose-600'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${food.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                    </span>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {food.name}
                    </h3>

                    <p className="text-sm font-extrabold text-slate-900 font-mono mt-0.5">
                      ₹{food.price}
                    </p>

                    {food.description && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {food.description}
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 font-medium pt-2 flex items-center gap-1 hover:text-orange-500">
                    <Info className="w-3 h-3" /> View details
                  </span>
                </div>

                {/* Right Image + ADD Button */}
                <div className="relative shrink-0 flex flex-col items-center">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="w-24 h-24 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 cursor-pointer"
                    onClick={() => setSelectedFood(food)}
                  >
                    {food.imageUrl ? (
                      <img src={food.imageUrl} alt={food.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl bg-orange-50">
                        {food.isVeg ? '🥗' : '🍗'}
                      </div>
                    )}
                  </motion.div>

                  {/* Add / Stepper Button */}
                  <div className="-mt-3.5 z-10 w-20 h-7">
                    {!food.isAvailable ? (
                      <span className="flex items-center justify-center h-full text-[10px] bg-rose-50 text-rose-600 font-bold px-2 rounded-lg border border-rose-200 shadow-sm">
                        Sold Out
                      </span>
                    ) : inCart ? (
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="flex items-center justify-between h-full bg-orange-500 text-white rounded-lg shadow-sm overflow-hidden px-1"
                      >
                        <button
                          onClick={() => cart.updateQuantity(food.id, inCart.quantity - 1)}
                          className="w-5 h-5 flex items-center justify-center hover:bg-black/20 rounded active:scale-90"
                          aria-label="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-1 font-mono">{inCart.quantity}</span>
                        <button
                          onClick={() => cart.updateQuantity(food.id, inCart.quantity + 1)}
                          className="w-5 h-5 flex items-center justify-center hover:bg-black/20 rounded active:scale-90"
                          aria-label="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() =>
                          cart.addItem({
                            foodItemId: food.id,
                            name: food.name,
                            price: food.price,
                            isVeg: food.isVeg,
                          })
                        }
                        className="w-full h-full bg-white hover:bg-orange-500 hover:text-white text-orange-600 font-bold text-xs rounded-lg border border-slate-200 shadow-sm uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                      >
                        <span>ADD</span>
                        <Plus className="w-3 h-3 stroke-[3]" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* ─── 4. DISH DETAIL MODAL ─── */}
      <AnimatePresence>
        {selectedFood && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
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
              <div className="h-48 bg-slate-100 relative overflow-hidden shrink-0">
                {selectedFood.imageUrl ? (
                  <img src={selectedFood.imageUrl} alt={selectedFood.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl bg-orange-50">
                    {selectedFood.isVeg ? '🥗' : '🍗'}
                  </div>
                )}
                <button
                  onClick={() => setSelectedFood(null)}
                  className="absolute top-3 right-3 p-1.5 bg-slate-900/60 text-white hover:bg-slate-900 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3 bg-white/95 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedFood.isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <span>{selectedFood.isVeg ? 'Pure Vegetarian' : 'Non-Vegetarian'}</span>
                </div>
              </div>

              <div className="p-4 space-y-3 overflow-y-auto flex-1">
                <div className="flex justify-between items-start">
                  <h2 className="text-lg font-bold text-slate-900">{selectedFood.name}</h2>
                  <span className="text-lg font-bold text-orange-600 font-mono">₹{selectedFood.price}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedFood.description || 'Prepared fresh upon order with culinary ingredients and spices.'}
                </p>
              </div>

              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    cart.addItem({
                      foodItemId: selectedFood.id,
                      name: selectedFood.name,
                      price: selectedFood.price,
                      isVeg: selectedFood.isVeg,
                    });
                    setSelectedFood(null);
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-orange-500/20"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add to Order • ₹{selectedFood.price}</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── 5. FLOATING BOTTOM CART BAR ─── */}
      <AnimatePresence>
        {cart.getItemCount() > 0 && !showCart && !showCheckout && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 280 }}
            className="fixed bottom-3 left-0 right-0 max-w-md mx-auto px-3 z-40"
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCart(true)}
              className="w-full bg-slate-900 text-white rounded-2xl p-3.5 flex items-center justify-between shadow-xl border border-slate-800 transition-all"
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold shadow-sm">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Table #{tableNumber}</span>
                  <span className="text-xs font-bold text-white">
                    {cart.getItemCount()} {cart.getItemCount() === 1 ? 'item' : 'items'} in cart
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <span className="text-sm font-extrabold text-orange-400 font-mono">₹{total}</span>
                <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 6. CART DRAWER BOTTOM SHEET ─── */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-white rounded-t-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl text-left border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Your Table Order</h2>
                  <p className="text-xs text-slate-500 font-medium">Table #{tableNumber}</p>
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items List */}
              <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
                {cart.items.map((item) => (
                  <motion.div
                    key={item.foodItemId}
                    layout
                    className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-200"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`w-3.5 h-3.5 rounded-sm border bg-white flex items-center justify-center ${
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
                      <div className="flex items-center bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                        <button
                          onClick={() => cart.updateQuantity(item.foodItemId, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-90"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-5 text-center font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => cart.updateQuantity(item.foodItemId, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-90"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-xs font-bold text-slate-900 font-mono w-10 text-right">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Price Summary */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold">₹{subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount ({appliedPromo})</span>
                    <span className="font-mono">-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>GST (5%)</span>
                  <span className="font-mono">₹{tax}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Total</span>
                  <span className="text-orange-600 font-mono text-base">₹{total}</span>
                </div>
              </div>

              <div className="p-4 pt-0 flex space-x-2.5 bg-slate-50 rounded-b-3xl">
                <button
                  onClick={() => {
                    cart.clearCart();
                    setShowCart(false);
                  }}
                  className="px-4 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  Clear
                </button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowCart(false);
                    setShowCheckout(true);
                  }}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-xs transition-all shadow-md shadow-orange-500/20 flex items-center justify-center space-x-1.5"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 7. CHECKOUT MODAL ─── */}
      <AnimatePresence>
        {showCheckout && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowCheckout(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 shadow-2xl border border-slate-200 text-left max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Confirm Order</h2>
                  <p className="text-xs text-slate-500">Send order directly to kitchen</p>
                </div>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {orderError && (
                <div className="bg-rose-50 text-rose-700 px-3 py-2 rounded-xl text-xs font-semibold mb-3 border border-rose-200">
                  {orderError}
                </div>
              )}

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-orange-500 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Table Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder="01"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-orange-500 font-mono transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-orange-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Special Cooking Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. Less spicy, extra sauce, mild taste..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-orange-500 transition-all placeholder:text-slate-400"
                  />
                  {/* Quick 1-Tap Cooking Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['🌶️ Less Spicy', '🌶️ Extra Spicy', '🌿 Jain / No Garlic', '🥣 Extra Gravy', '🥤 Less Ice'].map((tag) => {
                      const isSelected = orderNotes.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setOrderNotes(prev => {
                              if (!prev) return tag;
                              if (prev.includes(tag)) {
                                return prev.replace(tag, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim();
                              }
                              return `${prev}, ${tag}`;
                            });
                          }}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-amber-100 border-amber-400 text-amber-900 font-black shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Payment Preference
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('counter')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        paymentMethod === 'counter'
                          ? 'bg-orange-50 border-orange-500 text-orange-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="text-xs block font-bold">Pay at Counter</span>
                      <span className="text-[10px] text-slate-500">Cash / Card on desk</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        paymentMethod === 'upi'
                          ? 'bg-orange-50 border-orange-500 text-orange-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="text-xs block font-bold">Direct UPI</span>
                      <span className="text-[10px] text-slate-500">GPay, PhonePe, Paytm</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-200 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Total ({cart.getItemCount()} items)</span>
                <span className="text-orange-600 font-mono font-bold text-sm">₹{total}</span>
              </div>

              <div className="flex space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="px-4 py-2.5 text-slate-600 bg-slate-100 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Back
                </button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  {placingOrder ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Placing Order...</span>
                    </span>
                  ) : (
                    <>
                      <span>Send Order • ₹{total}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
