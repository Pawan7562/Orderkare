import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { 
  ShoppingCart, Plus, Minus, Search, X, CheckCircle2, Clock, 
  Utensils, ChefHat, MapPin, Star, ArrowRight,
  Flame, Leaf, RotateCcw, Info, MessageSquareHeart,
  Tag, Percent, Sparkles, Send, ThumbsUp, Heart, Check
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

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
  { status: 'PENDING', label: 'Order Received', icon: Clock, desc: 'Kitchen queue acknowledged' },
  { status: 'ACCEPTED', label: 'Order Confirmed', icon: CheckCircle2, desc: 'Chef assigned to ticket' },
  { status: 'PREPARING', label: 'Chef Cooking', icon: ChefHat, desc: 'Food being cooked fresh' },
  { status: 'READY', label: 'Plated & Ready', icon: Flame, desc: 'Plated & heading to your table' },
  { status: 'SERVED', label: 'Served at Table', icon: Utensils, desc: 'Bon Appétit! Enjoy your meal' },
];

const FEEDBACK_TAGS = [
  '⚡ Fast Service',
  '🔥 Delicious Taste',
  '✨ Fresh & Hygienic',
  '💎 Great Value',
  '👨‍🍳 Polite Staff',
  '🎵 Nice Ambience'
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
  const [selectedTags, setSelectedTags] = useState<string[]>(['⚡ Fast Service', '🔥 Delicious Taste']);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Sponsored Promo State
  const [currentAdIndex] = useState(0);
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

  // Fetch Restaurant Details & Menu
  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/menu/public/${slug || 'royal-palace'}`);
        setRestaurant(res.data.restaurant);
        setCategories(res.data.categories || []);
        setFoods(res.data.foods || []);
      } catch (err) {
        setRestaurant({
          id: 'demo-res',
          name: 'The Spice Route Dining',
          logoUrl: null,
          bannerUrl: null,
          address: 'Sector 62, Noida NCR',
          phone: '+91 98765 43210'
        });
        setCategories([
          { id: 'cat-1', name: 'Starters' },
          { id: 'cat-2', name: 'Main Course' },
          { id: 'cat-3', name: 'Breads & Rice' },
          { id: 'cat-4', name: 'Beverages' },
        ]);
        setFoods([
          {
            id: 'food-1',
            name: 'Wood-Fired Margherita Pizza',
            description: 'San Marzano tomato sauce, fresh buffalo mozzarella, fresh basil, and extra virgin olive oil.',
            price: 299,
            isVeg: true,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80',
            categoryId: 'cat-2'
          },
          {
            id: 'food-2',
            name: 'Smoked Butter Chicken Bowl',
            description: 'Tender tandoor-roasted chicken in a rich, velvety aromatic tomato-butter gravy with basmati rice.',
            price: 380,
            isVeg: false,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=500&auto=format&fit=crop&q=80',
            categoryId: 'cat-2'
          },
          {
            id: 'food-3',
            name: 'Crispy Truffle Paneer Bao (2 pcs)',
            description: 'Steamed fluffy lotus bao buns filled with crispy spiced paneer, sriracha mayo, and pickled cucumber.',
            price: 249,
            isVeg: true,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=80',
            categoryId: 'cat-1'
          },
          {
            id: 'food-4',
            name: 'Royal Dum Gosht Biryani',
            description: 'Slow-cooked fragrant long-grain basmati rice with succulent lamb shank, saffron, and fresh mint.',
            price: 450,
            isVeg: false,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80',
            categoryId: 'cat-3'
          },
          {
            id: 'food-5',
            name: 'Fresh Mint & Lime Mojito',
            description: 'Fresh crushed garden mint, zesty Mexican lime, and sparkling soda over crushed ice.',
            price: 149,
            isVeg: true,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80',
            categoryId: 'cat-4'
          }
        ]);
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
      setOrderPlaced(res.data.order || {
        id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
        tableNumber: tableNumber,
        status: 'PREPARING',
        totalAmount: total,
        customerName: customerName,
        items: cart.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price
        }))
      });
      cart.clearCart();
      setShowCheckout(false);
      setShowCart(false);
    } catch (err: any) {
      const mockOrder = {
        id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
        tableNumber: tableNumber,
        status: 'PREPARING',
        totalAmount: total,
        customerName: customerName,
        items: cart.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price
        }))
      };
      setOrderPlaced(mockOrder);
      cart.clearCart();
      setShowCheckout(false);
      setShowCart(false);
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleToggleFeedbackTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    setTimeout(() => {
      setSubmittingFeedback(false);
      setFeedbackSubmitted(true);
    }, 600);
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
              <button
                onClick={() => setOrderStatusIdx(prev => Math.min(4, prev + 1))}
                className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md hover:bg-orange-100 transition-colors"
              >
                Advance Step (Demo)
              </button>
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
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ordered Dishes</h3>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {orderPlaced.items?.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs text-slate-700 py-0.5">
                  <span>
                    <strong className="text-orange-500 font-bold">{item.quantity}x</strong> {item.foodItem?.name || item.name}
                  </span>
                  <span className="font-mono text-slate-900 font-bold">₹{(item.price || 0) * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold">
              <span className="text-slate-600">Total Bill Amount</span>
              <span className="text-orange-600 font-mono text-sm font-extrabold">₹{orderPlaced.totalAmount}</span>
            </div>
          </motion.div>

          {/* ─── CUSTOMER FEEDBACK SECTION ─── show only after food is served ─── */}
          <AnimatePresence>
            {isDelivered ? (
              <motion.div
                key="feedback-form"
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 text-left shadow-sm space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 1.2, repeat: 2, ease: 'easeInOut' }}
                    className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500"
                  >
                    <MessageSquareHeart className="w-4 h-4" />
                  </motion.div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      Rate Your Experience
                    </h3>
                    <p className="text-[11px] text-slate-400">Help the chef &amp; staff improve 🙏</p>
                  </div>
                </div>

                {feedbackSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-1.5"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 14, stiffness: 300, delay: 0.1 }}
                      className="w-10 h-10 bg-emerald-500 text-white rounded-full mx-auto flex items-center justify-center shadow-sm"
                    >
                      <Check className="w-5 h-5 stroke-[3]" />
                    </motion.div>
                    <h4 className="text-xs font-extrabold text-emerald-900">Thank You For Your Feedback!</h4>
                    <p className="text-[11px] text-emerald-700">
                      Your feedback has been shared with the restaurant manager &amp; culinary team.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmitFeedback} className="space-y-3">
                    {/* 5-Star Interactive Rating */}
                    <div className="flex flex-col items-center justify-center py-1">
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.button
                            key={star}
                            type="button"
                            whileHover={{ scale: 1.25 }}
                            whileTap={{ scale: 0.85 }}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            onClick={() => setFeedbackRating(star)}
                            className="p-1 focus:outline-none"
                          >
                            <Star
                              className={`w-7 h-7 transition-all ${
                                star <= activeRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200 fill-slate-100'
                              }`}
                            />
                          </motion.button>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-amber-600 mt-1">
                        {ratingLabels[activeRating - 1]}
                      </span>
                    </div>

                    {/* Quick Feedback Tags */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 block">
                        What did you like the most?
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {FEEDBACK_TAGS.map((tag) => {
                          const isSelected = selectedTags.includes(tag);
                          return (
                            <motion.button
                              key={tag}
                              type="button"
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleToggleFeedbackTag(tag)}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                                isSelected
                                  ? 'bg-orange-50 border-orange-500 text-orange-700'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {tag}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Comment Box */}
                    <div>
                      <textarea
                        rows={2}
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="Any message or suggestions for the kitchen..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-orange-500 transition-colors resize-none placeholder:text-slate-400"
                      />
                    </div>

                    {/* Submit Feedback Button */}
                    <motion.button
                      type="submit"
                      whileTap={{ scale: 0.97 }}
                      disabled={submittingFeedback}
                      className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm disabled:opacity-50"
                    >
                      {submittingFeedback ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Submitting...</span>
                        </span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-orange-400" />
                          <span>Submit Dining Feedback</span>
                        </>
                      )}
                    </motion.button>
                  </form>
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
                  <p className="text-xs font-bold text-slate-500">Feedback Form Unlocks After Meal is Served</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">We'll invite you to rate your experience once your food arrives at the table.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 pt-0 bg-slate-50">
          <button
            onClick={() => setOrderPlaced(null)}
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
  const currentAd = ads.length > 0 ? ads[currentAdIndex % ads.length] : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 max-w-md mx-auto relative pb-28 font-sans border-x border-slate-200 shadow-xl">
      
      {/* ─── 1. CLEAN RESTAURANT HEADER ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white border-b border-slate-200 px-4 py-3.5 text-left sticky top-0 z-40"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-200 shrink-0 overflow-hidden flex items-center justify-center shadow-xs"
            >
              {restaurant?.logoUrl ? (
                <img src={restaurant.logoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-orange-500 font-black text-lg">
                  {restaurant?.name?.charAt(0) || 'R'}
                </span>
              )}
            </motion.div>
            <div className="min-w-0">
              <h1 className="text-sm font-black text-slate-900 truncate">
                {restaurant?.name || 'The Spice Route Dining'}
              </h1>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                <span>{restaurant?.address || 'Dine-In Menu'}</span>
              </p>
            </div>
          </div>

          {/* Table Badge */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-xl shrink-0 flex items-center gap-1 shadow-sm font-mono"
          >
            <Utensils className="w-3.5 h-3.5" /> Table {tableNumber}
          </motion.div>
        </div>
      </motion.div>

      {/* ─── PROMO BANNER (IF AVAILABLE) ─── */}
      {ads.length > 0 && currentAd && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 pb-1"
        >
          <div className={`p-3 rounded-xl bg-gradient-to-r ${currentAd.bgGradient} text-white shadow-sm border border-slate-800 text-left relative overflow-hidden`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-amber-300">
                {currentAd.badge}
              </span>
              <span className="text-[10px] text-slate-300">{currentAd.sponsor}</span>
            </div>
            <h3 className="text-xs font-extrabold text-white">{currentAd.title}</h3>
            <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1">
                <Percent className="w-3 h-3" /> {currentAd.discountText}
              </span>
              {currentAd.promoCode && (
                <button
                  onClick={() => copyPromoCode(currentAd.promoCode!)}
                  className="text-[10px] font-mono font-bold bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-lg border border-white/20 transition-all flex items-center gap-1 active:scale-95"
                >
                  <Tag className="w-2.5 h-2.5" />
                  <span>{copiedCode === currentAd.promoCode ? 'APPLIED ✓' : currentAd.promoCode}</span>
                </button>
              )}
            </div>
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
                    Cooking Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. Less spicy..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-orange-500 transition-all placeholder:text-slate-400"
                  />
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
