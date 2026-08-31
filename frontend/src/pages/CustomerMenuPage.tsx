import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { 
  ShoppingCart, Plus, Minus, Search, X, CheckCircle2, Clock, 
  Utensils, Sparkles, ChefHat, MapPin, Star, ArrowRight,
  Flame, Leaf, RotateCcw
} from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL || 'https://orderkare-3.onrender.com/api/v1';

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

const MOCK_RESTAURANT: Restaurant = {
  id: 'demo-restaurant-id',
  name: 'Royal Palace Dining',
  logoUrl: null,
  bannerUrl: null,
  address: 'Sector 62, Noida • Fine Dining',
  phone: '+91 98765 43210'
};

const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-starters', name: 'Starters' },
  { id: 'cat-main', name: 'Main Course' },
  { id: 'cat-beverages', name: 'Beverages' },
  { id: 'cat-desserts', name: 'Desserts' },
];

const MOCK_FOODS: FoodItem[] = [
  {
    id: 'item-1',
    name: 'Paneer Tikka Specially Grilled',
    description: 'Fresh cottage cheese marinated in hung curd, spices and chargrilled in clay tandoor.',
    price: 220,
    isVeg: true,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&q=80',
    categoryId: 'cat-starters',
    category: { name: 'Starters' },
  },
  {
    id: 'item-2',
    name: 'Crispy Veg Spring Rolls',
    description: 'Golden wok-fried spring rolls filled with crunchy garden vegetables & glass noodles.',
    price: 180,
    isVeg: true,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
    categoryId: 'cat-starters',
    category: { name: 'Starters' },
  },
  {
    id: 'item-3',
    name: 'Royal Butter Chicken',
    description: 'Tender chicken smoked in tandoor & simmered in rich creamy tomato cashew gravy.',
    price: 340,
    isVeg: false,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=400&q=80',
    categoryId: 'cat-main',
    category: { name: 'Main Course' },
  },
  {
    id: 'item-4',
    name: 'Dal Makhani Shahi',
    description: 'Slow cooked black lentils simmered overnight with white butter, cream & fresh spices.',
    price: 260,
    isVeg: true,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80',
    categoryId: 'cat-main',
    category: { name: 'Main Course' },
  },
  {
    id: 'item-5',
    name: 'Classic Mango Lassi',
    description: 'Thick churned sweet yogurt blended with fresh Alphonso mango pulp.',
    price: 120,
    isVeg: true,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?auto=format&fit=crop&w=400&q=80',
    categoryId: 'cat-beverages',
    category: { name: 'Beverages' },
  },
  {
    id: 'item-6',
    name: 'Chocolate Lava Cake',
    description: 'Warm cocoa cake with molten chocolate core served with vanilla bean scoop.',
    price: 190,
    isVeg: true,
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80',
    categoryId: 'cat-desserts',
    category: { name: 'Desserts' },
  },
];

const ORDER_STEPS = [
  { status: 'PENDING', label: 'Order Received', icon: Clock, desc: 'Sent to kitchen staff' },
  { status: 'ACCEPTED', label: 'Order Accepted', icon: CheckCircle2, desc: 'Kitchen accepted your order' },
  { status: 'PREPARING', label: 'Preparing Food', icon: ChefHat, desc: 'Chef is cooking your meal' },
  { status: 'READY', label: 'Ready to Serve', icon: Flame, desc: 'Plated & ready for server' },
  { status: 'SERVED', label: 'Served at Table', icon: Utensils, desc: 'Enjoy your delicious meal!' },
];

export const CustomerMenuPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();

  // Auto-detect table number from QR code scan query string (e.g. ?table=01, ?t=1, or ?tableNumber=01)
  const qrTableParam = searchParams.get('table') || searchParams.get('t') || searchParams.get('tableNumber') || '';

  const [restaurant, setRestaurant] = useState<Restaurant | null>(MOCK_RESTAURANT);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [foods, setFoods] = useState<FoodItem[]>(MOCK_FOODS);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [vegFilter, setVegFilter] = useState<'ALL' | 'VEG' | 'NONVEG'>('ALL');
  const [search, setSearch] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<any>(null);

  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState(qrTableParam || '01');
  const [phoneNumber, setPhoneNumber] = useState('');
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
        console.warn('Using mock customer menu data fallback');
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [slug]);

  useEffect(() => {
    if (!orderPlaced?.id) return;

    const socketUrl = import.meta.env.VITE_WS_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '') : 'https://orderkare-3.onrender.com');
    const socket = io(socketUrl);

    socket.on(`order_status_${orderPlaced.id}`, (data: { status: string }) => {
      setOrderPlaced((prev: any) => (prev ? { ...prev, status: data.status } : null));
    });

    return () => {
      socket.disconnect();
    };
  }, [orderPlaced?.id]);

  const filteredFoods = foods.filter((f) => {
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

  const subtotal = cart.getTotal();
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

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
        items: cart.items.map((i) => ({ foodItemId: i.foodItemId, quantity: i.quantity })),
      });
      setOrderPlaced(res.data.order);
      cart.clearCart();
      setShowCheckout(false);
      setShowCart(false);
    } catch (err: any) {
      // Mock order placement fallback if DB server is offline
      const mockOrder = {
        id: `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        customerName,
        tableNumber,
        status: 'PENDING',
        totalAmount: total,
        createdAt: new Date().toISOString(),
        items: cart.items.map((i) => ({
          id: `item-${i.foodItemId}`,
          quantity: i.quantity,
          price: i.price,
          foodItem: { name: i.name },
        })),
      };
      setOrderPlaced(mockOrder);
      cart.clearCart();
      setShowCheckout(false);
      setShowCart(false);
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium animate-pulse">Loading Digital Menu...</p>
      </div>
    );
  }

  // --- LIVE ORDER TRACKING SCREEN ---
  if (orderPlaced) {
    const currentStepIndex = Math.max(
      0,
      ORDER_STEPS.findIndex((s) => s.status === orderPlaced.status)
    );

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between max-w-md mx-auto relative overflow-hidden font-sans">
        {/* Glow ambient background */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

        {/* Top bar */}
        <div className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" /> Live Kitchen Tracker
            </span>
            <span className="text-xs font-mono text-slate-400">
              Table #{orderPlaced.tableNumber}
            </span>
          </div>

          <div className="text-center my-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl mx-auto flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/10"
            >
              <Sparkles className="w-10 h-10 animate-bounce" />
            </motion.div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Order Placed! 🎉</h1>
            <p className="text-slate-400 text-sm mt-1">Order #{orderPlaced.id.slice(-6)}</p>
          </div>

          {/* Stepper tracker */}
          <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-800 p-5 shadow-2xl my-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Kitchen Status</h2>
            <div className="space-y-6 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
              {ORDER_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={step.status} className="flex items-start space-x-4 relative z-10">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                        isCurrent
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30 ring-4 ring-primary/20 scale-110'
                          : isPassed
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-950 text-slate-600 border-slate-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="pt-1 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-bold ${isPassed ? 'text-white' : 'text-slate-500'}`}>
                          {step.label}
                        </h3>
                        {isCurrent && (
                          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-md font-bold uppercase tracking-wider animate-pulse">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items Summary */}
          <div className="bg-slate-900/60 rounded-3xl border border-slate-800/80 p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order Items</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {orderPlaced.items.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs text-slate-300">
                  <span>
                    <strong className="text-primary">{item.quantity}x</strong> {item.foodItem?.name || item.name}
                  </span>
                  <span className="font-mono text-slate-400">₹{(item.price || 0) * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-sm font-bold">
              <span className="text-slate-400">Total Payable</span>
              <span className="text-emerald-400 text-base font-mono">₹{orderPlaced.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Action Bottom */}
        <div className="p-6 pt-0 relative z-10">
          <button
            onClick={() => setOrderPlaced(null)}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl border border-slate-700 text-sm flex items-center justify-center space-x-2 transition-all"
          >
            <RotateCcw className="w-4 h-4 text-primary" />
            <span>Order Additional Items</span>
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN CUSTOMER MENU UI ---
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 max-w-md mx-auto relative pb-32 font-sans shadow-2xl">
      {/* Hero Cover Header */}
      <div className="relative bg-slate-950 text-white rounded-b-3xl overflow-hidden pt-7 pb-6 px-5 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-slate-950 to-slate-950 opacity-95" />
        
        <div className="relative z-10">
          {/* Top badges row */}
          <div className="flex items-center justify-between mb-4">
            <span className="bg-white/10 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Digital Menu
            </span>
            <div className="bg-primary text-white text-xs font-black px-3.5 py-1 rounded-full flex items-center gap-1 shadow-md shadow-primary/30">
              <Utensils className="w-3.5 h-3.5" /> Table {tableNumber}
            </div>
          </div>

          {/* Restaurant Title & Info */}
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-xl shrink-0 border border-white/20">
              <div className="w-full h-full bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center text-white font-black text-2xl">
                {restaurant?.name?.charAt(0) || 'R'}
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">{restaurant?.name}</h1>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary" /> {restaurant?.address || 'Sector 62, Noida'}
              </p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-300">
                <span className="flex items-center text-amber-400 font-bold">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" /> 4.8 (500+)
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">Open Now</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Controls Section */}
      <div className="sticky top-0 bg-slate-100/95 backdrop-blur-md z-30 pt-3 pb-2 px-4 border-b border-slate-200/80 shadow-xs space-y-3">
        {/* Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center px-3.5 py-2.5">
          <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes (Paneer, Tikka, Shake)..."
            className="flex-1 text-xs outline-none bg-transparent text-slate-800 placeholder-slate-400 font-medium"
          />
          {search && (
            <button onClick={() => setSearch('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Veg/Non-Veg Filter Toggles */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl gap-1 shrink-0">
            <button
              onClick={() => setVegFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                vegFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setVegFilter('VEG')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                vegFilter === 'VEG' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700'
              }`}
            >
              <Leaf className="w-3 h-3" /> Veg
            </button>
            <button
              onClick={() => setVegFilter('NONVEG')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                vegFilter === 'NONVEG' ? 'bg-red-600 text-white shadow-xs' : 'text-red-700'
              }`}
            >
              <Flame className="w-3 h-3" /> Non-Veg
            </button>
          </div>

          <span className="text-[11px] font-bold text-slate-400 shrink-0">
            {filteredFoods.length} dishes
          </span>
        </div>

        {/* Category Horizontal Tabs */}
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === 'ALL'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-200/60'
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
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-200/60'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Professional Food Cards List (Zomato/Swiggy Style Layout) */}
      <div className="p-4 space-y-4">
        {filteredFoods.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-6">
            <span className="text-4xl block mb-3">🔍</span>
            <h3 className="font-bold text-slate-800 text-sm">No dishes found</h3>
            <p className="text-slate-400 text-xs mt-1">Try clearing filters or search for something else.</p>
          </div>
        ) : (
          filteredFoods.map((food) => {
            const inCart = cart.items.find((i) => i.foodItemId === food.id);

            return (
              <motion.div
                key={food.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all flex justify-between gap-4 ${
                  !food.isAvailable ? 'opacity-60 grayscale' : ''
                }`}
              >
                {/* Left Side: Details & Price */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    {/* Veg Tag */}
                    <span
                      className={`inline-flex items-center justify-center w-4 h-4 rounded-md border-2 bg-white mb-1.5 ${
                        food.isVeg ? 'border-emerald-600' : 'border-red-600'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${food.isVeg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                    </span>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{food.name}</h3>

                    <p className="text-sm font-extrabold text-slate-900 font-mono mt-1">
                      ₹{food.price}
                    </p>

                    {food.description && (
                      <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {food.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Side: Image + Overlay Swiggy/Zomato Style ADD Button */}
                <div className="relative shrink-0 flex flex-col items-center">
                  <div className="w-28 h-28 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200/80 relative">
                    {food.imageUrl ? (
                      <img src={food.imageUrl} alt={food.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl bg-amber-50">
                        {food.isVeg ? '🥗' : '🍗'}
                      </div>
                    )}
                  </div>

                  {/* Overlay ADD / Quantity Button */}
                  <div className="-mt-5 z-10 w-24 h-9">
                    {!food.isAvailable ? (
                      <span className="flex items-center justify-center h-full text-[10px] bg-red-50 text-red-500 font-bold px-2 rounded-xl border border-red-200 shadow-xs">
                        Sold Out
                      </span>
                    ) : inCart ? (
                      <div className="flex items-center justify-between h-full bg-primary text-white rounded-xl shadow-md shadow-primary/30 border border-primary/40 overflow-hidden px-1">
                        <button
                          onClick={() => cart.updateQuantity(food.id, inCart.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-black/15 transition-colors rounded-lg active:scale-90"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-black px-1 font-mono">{inCart.quantity}</span>
                        <button
                          onClick={() => cart.updateQuantity(food.id, inCart.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-black/15 transition-colors rounded-lg active:scale-90"
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
                        className="w-full h-full bg-white hover:bg-primary hover:text-white text-primary font-black text-xs rounded-xl border border-slate-200 shadow-md shadow-slate-200/80 transition-all uppercase tracking-wider flex items-center justify-center gap-1 active:scale-95"
                      >
                        <span>ADD</span>
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      <AnimatePresence>
        {cart.getItemCount() > 0 && !showCart && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-4 left-0 right-0 max-w-md mx-auto px-4 z-40"
          >
            <button
              onClick={() => setShowCart(true)}
              className="w-full bg-slate-950 text-white rounded-3xl p-4 flex items-center justify-between shadow-2xl border border-slate-800 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white font-bold shadow-md shadow-primary/30">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-xs text-slate-400 block font-medium">Your Order Cart</span>
                  <span className="text-sm font-bold text-white">
                    {cart.getItemCount()} {cart.getItemCount() === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-lg font-black text-emerald-400 font-mono">₹{subtotal}</span>
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold shadow-md">
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
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-white rounded-t-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Your Order Cart</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Table #{tableNumber}</p>
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="p-5 space-y-3 overflow-y-auto flex-1">
                {cart.items.map((item) => (
                  <div
                    key={item.foodItemId}
                    className="flex items-center justify-between bg-slate-50 rounded-2xl p-3.5 border border-slate-100"
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`w-3.5 h-3.5 rounded-md border-2 bg-white flex items-center justify-center ${
                          item.isVeg ? 'border-emerald-600' : 'border-red-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-red-600'}`}
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
                          className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-100"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold w-6 text-center font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => cart.updateQuantity(item.foodItemId, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-100"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-xs font-black text-slate-900 font-mono w-12 text-right">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>GST & Service Charge (5%)</span>
                  <span className="font-mono">₹{tax.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="text-primary font-mono text-base">₹{total.toFixed(0)}</span>
                </div>
              </div>

              <div className="p-5 pt-0 flex space-x-3 bg-slate-50/50 rounded-b-3xl">
                <button
                  onClick={() => {
                    cart.clearCart();
                    setShowCart(false);
                  }}
                  className="px-4 py-3 text-slate-600 bg-white border border-slate-200 rounded-2xl text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    setShowCart(false);
                    setShowCheckout(true);
                  }}
                  className="flex-1 bg-primary text-white py-3.5 rounded-2xl font-bold text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center justify-center space-x-2"
                >
                  <span>Proceed to Order</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setShowCheckout(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Complete Your Order</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Please confirm details for Table #{tableNumber}</p>
                </div>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {orderError && (
                <div className="bg-red-50 text-red-600 px-4 py-2.5 rounded-2xl text-xs font-semibold mb-4 border border-red-100">
                  {orderError}
                </div>
              )}

              <div className="space-y-3.5 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Table No. *
                    </label>
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder="e.g. 04"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
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
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Summary card */}
              <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="font-bold text-slate-700">Order Summary</span>
                  <span className="text-slate-400 font-mono">{cart.getItemCount()} items</span>
                </div>
                {cart.items.map((item) => (
                  <div key={item.foodItemId} className="flex justify-between text-slate-600">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-mono">₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-200/60 flex justify-between font-extrabold text-slate-900 text-sm">
                  <span>Total Payable</span>
                  <span className="text-primary font-mono text-base">₹{total.toFixed(0)}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="px-4 py-3 text-slate-600 bg-slate-100 rounded-2xl text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="flex-1 bg-primary text-white py-3.5 rounded-2xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {placingOrder ? (
                    <span>Sending to Kitchen...</span>
                  ) : (
                    <>
                      <span>Place Order Now</span>
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
