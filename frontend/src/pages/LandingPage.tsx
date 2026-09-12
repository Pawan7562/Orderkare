import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  Utensils,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Smartphone,
  Sparkles,
  Zap,
  Mail,
  Phone,
  MapPin,
  Star,
  Check,
  Calculator,
  Users,
  Send,
  Menu,
  X,
  Plus,
  Minus,
  RefreshCw,
  Monitor,
  ChefHat,
  TrendingUp,
  Clock,
  CreditCard,
  FileX,
  UserX,
  Timer,
  Layers,
  Download,
  Receipt,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [activeScreenTab, setActiveScreenTab] = useState<'guest' | 'kitchen' | 'dashboard'>('guest');
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  // Interactive Guest Demo State
  const [guestCart, setGuestCart] = useState<{ [id: string]: number }>({
    'truffle-pizza': 1,
    'craft-mocktail': 2
  });
  const [demoOrderSent, setDemoOrderSent] = useState(false);

  // Interactive Kitchen Orders
  const [kitchenOrders, setKitchenOrders] = useState([
    { id: '#108', table: 'Table 04', items: '2x Truffle Pizza, 1x Mocktail', time: 'Just now', status: 'Pending' },
    { id: '#107', table: 'Table 12', items: '1x Angus Burger, 1x Cold Brew', time: '3m ago', status: 'Cooking' },
    { id: '#106', table: 'Table 08', items: '1x Margherita Pizza', time: '7m ago', status: 'Ready' }
  ]);

  // ROI Calculator State
  const [tablesCount, setTablesCount] = useState(20);
  const [avgTicket, setAvgTicket] = useState(750);

  // FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Cart Helper
  const updateGuestCart = (id: string, delta: number) => {
    setGuestCart(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleSendDemoOrder = () => {
    setDemoOrderSent(true);
    setTimeout(() => setDemoOrderSent(false), 3500);
  };

  // Kitchen Status Cycle
  const advanceKitchenStatus = (id: string) => {
    setKitchenOrders(prev =>
      prev.map(ord => {
        if (ord.id === id) {
          const next = ord.status === 'Pending' ? 'Cooking' : ord.status === 'Cooking' ? 'Ready' : 'Pending';
          return { ...ord, status: next };
        }
        return ord;
      })
    );
  };

  // ROI Math
  const calculatedStats = useMemo(() => {
    const ordersPerMonth = tablesCount * 3 * 30;
    const monthlyExtraRevenue = Math.round(ordersPerMonth * avgTicket * 0.22);
    const annualExtraRevenue = monthlyExtraRevenue * 12;
    const hoursSavedPerMonth = Math.round(tablesCount * 1.5 * 30 * 0.08);

    return {
      monthlyExtra: monthlyExtraRevenue,
      annualExtra: annualExtraRevenue,
      hoursSaved: hoursSavedPerMonth
    };
  }, [tablesCount, avgTicket]);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setNewsletterEmail('');
    }
  };

  const testimonials = [
    {
      quote:
        'OrderKare transformed our service flow during peak dinner rush. Table turnover accelerated by 35% and order errors dropped to zero.',
      author: 'Chef Vikram Oberoi',
      role: 'Executive Chef & Owner',
      restaurant: 'Royal Palace Dining',
      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80'
    },
    {
      quote:
        'The live WebSocket kitchen screen eliminates forgotten paper slips. Orders pop up in 0.2 seconds and our kitchen staff operates with complete clarity.',
      author: 'Ananya Deshmukh',
      role: 'Operations Director',
      restaurant: 'The Spice Route Group',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80'
    },
    {
      quote:
        'Creating desk QR codes for all 30 tables and uploading our menu took less than 15 minutes. Our diners love the fast mobile menu.',
      author: 'Marcus Vance',
      role: 'General Manager',
      restaurant: 'Urban Grill Bistro',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    }
  ];

  const faqData = [
    {
      q: 'Do guests need to download an application or sign up?',
      a: 'No app download or account creation is needed. Guests simply scan their tabletop QR code using their default phone camera. The digital menu opens in Mobile Safari or Chrome instantly in 0.4 seconds.'
    },
    {
      q: 'Can I use my own restaurant UPI ID for customer payments?',
      a: 'Yes! You can configure your restaurant UPI ID or QR in the settings. Diners can pay directly via any UPI app (Google Pay, PhonePe, Paytm), or choose to pay at the counter.'
    },
    {
      q: 'Can I create unlimited tables and print custom QR codes?',
      a: 'Yes. You can add unlimited tables across dining rooms, outdoor patios, or bars, generate custom QR codes, and download high-resolution PDFs for table tent printing.'
    },
    {
      q: 'Can staff 86 / mark sold-out dishes in real time?',
      a: 'Yes. From your Admin Dashboard, toggle any dish to "Unavailable" with 1 click. The item disappears from all customer phone menus immediately without requiring a page refresh.'
    },
    {
      q: 'How are kitchen orders received and notified?',
      a: 'Orders push over real-time WebSockets to your kitchen tablet or display monitor with an audible alert chime. Cooks see table numbers, dish notes, and elapsed prep timers.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans selection:bg-rose-500/15 selection:text-rose-600 antialiased overflow-x-hidden">
      {/* --- CLEAN STICKY HEADER --- */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <img
                src="/logo.jpg"
                alt="OrderKare Logo"
                className="h-10 w-10 object-cover rounded-xl border border-slate-200 shadow-xs group-hover:scale-105 transition-transform duration-200"
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl font-extrabold tracking-tight text-slate-950 leading-none">
                Order<span className="text-rose-600">Kare</span>
              </span>
              <span className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase mt-0.5">
                Scan • Order • Enjoy
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-8 text-sm font-semibold text-slate-600">
            <a href="#why" className="hover:text-rose-600 transition-colors">Why OrderKare</a>
            <a href="#how-it-works" className="hover:text-rose-600 transition-colors">How It Works</a>
            <a href="#screens" className="hover:text-rose-600 transition-colors">Screens</a>
            <a href="#demo" className="hover:text-rose-600 transition-colors">Live Sandbox</a>
            <a href="#roi" className="hover:text-rose-600 transition-colors">ROI Calculator</a>
            <a href="#pricing" className="hover:text-rose-600 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-rose-600 transition-colors">FAQ</a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center space-x-3">
            <Link
              to="/login"
              className="text-sm font-bold text-slate-700 hover:text-rose-600 px-3.5 py-2 transition-colors"
            >
              Sign In
            </Link>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/register"
                className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md shadow-rose-600/20 transition-all"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>

          {/* Mobile Hamburger */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 px-6 py-6 space-y-4 shadow-xl text-left"
            >
              <div className="flex flex-col space-y-3 text-sm font-semibold text-slate-700">
                <a href="#why" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-rose-600">Why OrderKare</a>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-rose-600">How It Works</a>
                <a href="#screens" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-rose-600">Screens</a>
                <a href="#demo" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-rose-600">Live Sandbox</a>
                <a href="#roi" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-rose-600">ROI Calculator</a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-rose-600">Pricing</a>
                <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-rose-600">FAQ</a>
              </div>
              <div className="pt-4 border-t border-slate-100 flex flex-col space-y-2">
                <Link
                  to="/login"
                  className="w-full text-center py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="w-full text-center py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold shadow-md"
                >
                  Start Free 14-Day Trial
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 text-left space-y-6"
            >
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-2xs">
                <Sparkles className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold text-slate-800">
                  Trusted by 1,000+ Restaurants & Cafes
                </span>
                <span className="bg-rose-50 text-rose-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  0.2s Sync
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.12]">
                Restaurant Ordering Made Smarter with{' '}
                <span className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
                  Instant Table QR
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed font-normal">
                Customers scan the table QR code, browse your photo-rich menu, order food, and pay. Your kitchen
                receives tickets instantly on live monitors with zero order mix-ups.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to="/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-base px-8 py-4 rounded-2xl shadow-xl shadow-rose-600/20 transition-all"
                  >
                    <span>Start Free Trial</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <a
                    href="#demo"
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-base px-7 py-4 rounded-2xl shadow-xs transition-all"
                  >
                    <Monitor className="w-4 h-4 text-slate-600" />
                    <span>Watch Interactive Demo</span>
                  </a>
                </motion.div>
              </div>

              {/* Key Features Pill */}
              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" /> Instant Table Orders
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" /> Direct UPI & Cash
                </span>
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" /> Live Sales Analytics
                </span>
              </div>
            </motion.div>

            {/* Right Column Showcase Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xl shadow-slate-200/80 relative">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 text-left">
                  <div className="flex items-center space-x-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Royal Palace • Table #04</h4>
                      <p className="text-[10px] text-slate-400 font-mono">orderkare.com/menu/royal-palace</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Active Session
                  </span>
                </div>

                {/* Split Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Phone Menu Card */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col justify-between text-left">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md block w-fit mb-2">
                        Guest Mobile Menu
                      </span>
                      <div className="space-y-2">
                        <div className="bg-white p-2 rounded-xl border border-slate-200/70">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                            <span>Truffle Pizza</span>
                            <span className="text-rose-600 font-mono">₹480</span>
                          </div>
                          <span className="text-[10px] text-slate-400">Wild mushrooms, parmesan</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-200/70">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                            <span>Craft Mocktail</span>
                            <span className="text-rose-600 font-mono">₹320</span>
                          </div>
                          <span className="text-[10px] text-slate-400">Smoked rosemary, citrus</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/70 flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900 font-mono">₹800 Subtotal</span>
                      <span className="bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                        Ordered ✓
                      </span>
                    </div>
                  </div>

                  {/* KDS Kitchen Card */}
                  <div className="bg-slate-900 text-white rounded-2xl p-3.5 flex flex-col justify-between text-left shadow-sm">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                          Kitchen Ticket #108
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">Table 04</span>
                      </div>

                      <div className="space-y-1.5 text-[11px] font-medium text-slate-300">
                        <div className="flex justify-between border-b border-slate-800 pb-1">
                          <span>1x Truffle Pizza</span>
                          <span className="text-amber-400 font-bold">COOKING</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-1">
                          <span>1x Craft Mocktail</span>
                          <span className="text-emerald-400 font-bold">READY</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono pt-1">Timer: 02m 14s</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Line Status</span>
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded animate-pulse">
                        In Kitchen
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Card */}
                <div className="mt-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between text-left">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Custom Desk QR Codes</p>
                      <p className="text-[10px] text-slate-400">Table numbers automatically tagged</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Live Sync
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- WHY RESTAURANTS CHOOSE ORDERKARE (PAIN POINTS SOLVED) --- */}
      <section id="why" className="py-20 md:py-28 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200 px-3.5 py-1 rounded-full inline-block">
              Why Choose OrderKare
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Solve Every Common Restaurant Bottleneck
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Everything you need to run a modern, faster, and more profitable dining service.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              {
                title: 'No Calling Waiters',
                desc: 'Guests never have to wave hands or wait across crowded rooms. Orders flow directly to the kitchen line in seconds.',
                icon: UserX,
                badge: 'Zero Waiter Lag'
              },
              {
                title: 'No Paper Menus',
                desc: 'Eliminate expensive menu reprints and dirty physical cards. Update items, prices, and daily specials in 1 click.',
                icon: FileX,
                badge: 'Digital Convenience'
              },
              {
                title: 'Faster Table Turns',
                desc: 'Diners scan and order the moment they sit down. Reduce average table turnover by 15-20 minutes during peak rush.',
                icon: Timer,
                badge: '+35% Capacity'
              },
              {
                title: 'Instant UPI & Cash',
                desc: 'Accept direct UPI payments through customer phones, or collect cash at counter with clear digital receipts.',
                icon: CreditCard,
                badge: 'Zero Commissions'
              }
            ].map((card, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="bg-slate-50/70 border border-slate-200/90 rounded-3xl p-7 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-rose-600 shadow-2xs">
                      <card.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{card.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (STEP-BY-STEP) --- */}
      <section id="how-it-works" className="py-20 md:py-28 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600 bg-rose-50 border border-rose-200 px-3.5 py-1 rounded-full inline-block">
              Frictionless 4 Steps
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              From Table Seat to Served Food
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              A clean, effortless dining progression that your guests and staff will love.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
            {[
              {
                step: '01',
                title: 'Scan Table QR',
                desc: 'Guest sits at Table #04 and scans the QR code with phone camera. Menu opens in 0.4s without downloading any app.',
                icon: QrCode
              },
              {
                step: '02',
                title: 'Select Dishes',
                desc: 'Guest browses visual food cards, filters veg/non-veg, adds custom notes for chef, and adds to cart.',
                icon: Utensils
              },
              {
                step: '03',
                title: 'Kitchen Receives',
                desc: 'Ticket chimes instantly on kitchen screen with table number. Line cooks click start cooking.',
                icon: Zap
              },
              {
                step: '04',
                title: 'Pay & Settle',
                desc: 'Guest pays via direct UPI QR or cash at counter. Sales and daily revenue update automatically.',
                icon: Receipt
              }
            ].map((step, idx) => (
              <div key={idx} className="bg-white border border-slate-200/90 rounded-3xl p-7 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-xs font-black font-mono text-rose-600 uppercase tracking-wider">
                      Step {step.step}
                    </span>
                    <step.icon className="w-5 h-5 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CRAFTED FOR EVERY SCREEN (DEVICE SHOWCASE) --- */}
      <section id="screens" className="py-20 md:py-28 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200 px-3.5 py-1 rounded-full inline-block">
              Multi-Device Software
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Beautiful on Every Screen
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              From customer phones to kitchen tablets and manager laptops—crafted with precision.
            </p>
          </div>

          {/* Screen Switcher */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex bg-slate-100 border border-slate-200 p-1.5 rounded-2xl">
              {[
                { id: 'guest', label: 'Customer Mobile Menu', icon: Smartphone },
                { id: 'kitchen', label: 'Kitchen KDS Screen', icon: ChefHat },
                { id: 'dashboard', label: 'Manager Admin Panel', icon: BarChart3 }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveScreenTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    activeScreenTab === tab.id
                      ? 'bg-white text-slate-950 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Screen Display Container */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-10 max-w-5xl mx-auto text-left">
            {activeScreenTab === 'guest' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full inline-block">
                    Customer Experience
                  </span>
                  <h3 className="text-2xl font-black text-slate-950">
                    Fast, Visual Ordering in Any Mobile Browser
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Designed like top consumer food apps. Diners easily filter Vegetarian, Non-Veg, check prices, customize notes, and track order progress.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Instant camera QR scan (zero app download)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Veg / Non-Veg dietary toggle filters</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Persistent cart with live subtotal calculation</li>
                  </ul>
                </div>
                <div className="flex justify-center">
                  <div className="w-full max-w-[280px] bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-900">Royal Palace • Table 04</span>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Active</span>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-900">Truffle Pizza</p>
                          <span className="text-slate-500 font-mono">₹480</span>
                        </div>
                        <button className="bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">Add +</button>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-900">Prime Smash Burger</p>
                          <span className="text-slate-500 font-mono">₹390</span>
                        </div>
                        <button className="bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">Add +</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeScreenTab === 'kitchen' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full inline-block">
                    Kitchen Display System (KDS)
                  </span>
                  <h3 className="text-2xl font-black text-slate-950">
                    Real-Time Kitchen Orders with Live Audio Chimes
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Eliminate missing tickets. As soon as a guest orders, the ticket chimes and pops up with table numbers, timestamps, and item modifications.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Sub-second WebSocket order dispatch</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1-Click status advancement (Pending ➔ Cooking ➔ Ready)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Works on any iPad, Android tablet, or TV browser</li>
                  </ul>
                </div>
                <div className="flex justify-center">
                  <div className="w-full max-w-[340px] bg-slate-900 text-white rounded-3xl p-4 shadow-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2 text-xs">
                      <span className="font-bold text-white">Kitchen Orders</span>
                      <span className="text-amber-400 font-mono text-[11px]">3 Active</span>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>#108 • Table 04</span>
                        <span className="text-rose-400">Cooking</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">2x Truffle Pizza, 1x Mocktail</p>
                      <span className="text-[10px] text-slate-500 font-mono block pt-1">02m 14s elapsed</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeScreenTab === 'dashboard' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full inline-block">
                    Restaurant Operations
                  </span>
                  <h3 className="text-2xl font-black text-slate-950">
                    All Tables, Menus, and Sales in One Place
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Create new tables, download QR code printouts, disable sold-out dishes, and review daily sales and popular items from one dashboard.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Table QR Generator with instant PDF downloads</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1-Click 86 / Sold-Out dish toggles</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Daily gross revenue and order volume tracking</li>
                  </ul>
                </div>
                <div className="flex justify-center">
                  <div className="w-full max-w-[340px] bg-white border border-slate-200 rounded-3xl p-4 shadow-xl space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2 text-xs">
                      <span className="font-bold text-slate-900">Today's Performance</span>
                      <span className="text-emerald-600 font-mono font-bold">+18%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-left">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-medium">Orders Today</span>
                        <p className="text-base font-black text-slate-900 font-mono">42</p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-medium">Today Sales</span>
                        <p className="text-base font-black text-slate-900 font-mono">₹18,450</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- INTERACTIVE DUAL SANDBOX --- */}
      <section id="demo" className="py-20 md:py-28 bg-slate-50/60 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 bg-white border border-slate-200 px-3.5 py-1 rounded-full inline-block">
              Interactive Test Sandbox
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Try Placing a Test Order
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Add dishes below, see the live cart update, and dispatch a simulated order to the kitchen!
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-5 text-left">
                <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-1.5 rounded-full font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Real-Time Customer Flow Simulator</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-950">
                  Instant Table QR Experience
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Notice how fast items update in the cart without page reloading. Once placed, the kitchen instantly receives the ticket with sound alerts.
                </p>

                <div className="space-y-2.5 text-sm text-slate-700">
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Table UUID is automatically tagged to the cart</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Real-time kitchen ticket notification with audio chime</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Direct UPI payments or pay at counter options</span>
                  </div>
                </div>
              </div>

              {/* Interactive Phone Simulation */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-[310px] bg-slate-900 border-4 border-slate-800 rounded-[2.5rem] p-3 shadow-2xl">
                  <div className="bg-white rounded-[2rem] p-4 text-left overflow-hidden min-h-[420px] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                        <div>
                          <h5 className="font-extrabold text-xs text-slate-900">Royal Palace</h5>
                          <span className="text-[9px] text-slate-500 font-mono">Table 04 • Lunch Menu</span>
                        </div>
                        <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                          Active
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {[
                          { id: 'truffle-pizza', name: 'Truffle Pizza', price: 480, veg: true },
                          { id: 'craft-mocktail', name: 'Craft Mocktail', price: 320, veg: true },
                          { id: 'angus-burger', name: 'Angus Burger', price: 390, veg: false }
                        ].map(item => {
                          const qty = guestCart[item.id] || 0;
                          return (
                            <div
                              key={item.id}
                              className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between"
                            >
                              <div>
                                <div className="flex items-center space-x-1.5">
                                  <span className={`w-2 h-2 rounded-full ${item.veg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                  <span className="text-xs font-bold text-slate-900">{item.name}</span>
                                </div>
                                <span className="text-xs font-bold text-slate-500 font-mono">₹{item.price}</span>
                              </div>

                              <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg p-1">
                                <button
                                  onClick={() => updateGuestCart(item.id, -1)}
                                  className="p-1 text-slate-600 hover:text-slate-950"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-bold text-slate-900 min-w-3 text-center">{qty}</span>
                                <button
                                  onClick={() => updateGuestCart(item.id, 1)}
                                  className="p-1 text-slate-600 hover:text-slate-950"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      {demoOrderSent ? (
                        <div className="bg-emerald-600 text-white text-xs font-bold py-2.5 rounded-xl text-center flex items-center justify-center space-x-1.5 animate-pulse">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Order Sent to Kitchen!</span>
                        </div>
                      ) : (
                        <button
                          onClick={handleSendDemoOrder}
                          className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-sm flex items-center justify-between px-3"
                        >
                          <span>Place Order</span>
                          <span className="font-mono">
                            ₹
                            {(guestCart['truffle-pizza'] || 0) * 480 +
                              (guestCart['craft-mocktail'] || 0) * 320 +
                              (guestCart['angus-burger'] || 0) * 390}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- ROI CALCULATOR --- */}
      <section id="roi" className="py-20 md:py-28 bg-white border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-8 sm:p-12 shadow-xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 bg-white border border-slate-200 px-3.5 py-1 rounded-full inline-block mb-4">
              Revenue Simulator
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Calculate Your Monthly Revenue Gain
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-lg mx-auto">
              Faster table turnover and visual menus directly boost average ticket sizes by +22%.
            </p>

            <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-xl mx-auto">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700">Number of Tables</span>
                  <span className="text-rose-600 font-mono text-base">{tablesCount} Tables</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={tablesCount}
                  onChange={e => setTablesCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                />
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700">Average Bill / Table</span>
                  <span className="text-rose-600 font-mono text-base">₹{avgTicket}</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="2000"
                  step="50"
                  value={avgTicket}
                  onChange={e => setAvgTicket(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4">
                <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                  Extra Monthly Revenue
                </span>
                <p className="text-2xl font-black text-emerald-700 font-mono mt-1">
                  +₹{calculatedStats.monthlyExtra.toLocaleString()}
                </p>
              </div>

              <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4">
                <span className="text-[10px] text-rose-800 font-bold uppercase tracking-wider block">
                  Extra Annual Profit
                </span>
                <p className="text-2xl font-black text-rose-600 font-mono mt-1">
                  +₹{calculatedStats.annualExtra.toLocaleString()}
                </p>
              </div>

              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4">
                <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">
                  Staff Hours Saved / Mo
                </span>
                <p className="text-2xl font-black text-amber-700 font-mono mt-1">
                  {calculatedStats.hoursSaved} hrs
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="py-20 md:py-28 bg-slate-50/50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full inline-block">
              Restaurateur Reviews
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Loved by World-Class Dining Venues
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {testimonials.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200/90 rounded-3xl p-7 flex flex-col justify-between shadow-xs hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex text-amber-400 mb-4">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 text-sm italic leading-relaxed mb-6">"{item.quote}"</p>
                </div>

                <div className="flex items-center space-x-3.5 pt-4 border-t border-slate-100">
                  <img
                    src={item.avatar}
                    alt={item.author}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="font-bold text-slate-950 text-xs">{item.author}</h4>
                    <p className="text-[10px] text-slate-500">{item.role} • {item.restaurant}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PRICING PLANS --- */}
      <section id="pricing" className="py-20 md:py-28 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200 px-3.5 py-1 rounded-full inline-block">
              Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Simple Plans. 0% Commission.
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Keep 100% of your restaurant order proceeds.
            </p>

            <div className="pt-2 flex justify-center">
              <div className="inline-flex bg-slate-100 border border-slate-200 p-1.5 rounded-2xl">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                    billingCycle === 'monthly' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    billingCycle === 'yearly' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <span>Yearly</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
            {[
              {
                name: 'Starter Plan',
                price: billingCycle === 'monthly' ? '₹999' : '₹799',
                desc: 'Perfect for small bistros, cafes, and food trucks.',
                features: ['Up to 15 Table QR Codes', 'Digital Menu Builder', 'Kitchen Monitor View', 'Email Support']
              },
              {
                name: 'Professional Plan',
                price: billingCycle === 'monthly' ? '₹1,999' : '₹1,599',
                desc: 'For busy dining rooms and high-volume restaurants.',
                features: ['Unlimited Table QR Codes', 'Real-Time WebSocket KDS Alerts', 'Staff & Waiter Management', '1-Click Dish 86 Disabling', 'Detailed Sales Analytics', '24/7 Priority Support'],
                popular: true
              },
              {
                name: 'Enterprise Plan',
                price: 'Custom',
                desc: 'For multi-branch chains and hotel resort dining.',
                features: ['Multi-Branch Console', 'Dedicated Account Manager', 'Custom API Integrations', 'Centralized Menu Sync', '99.99% Uptime SLA']
              }
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`bg-white border rounded-3xl p-8 relative flex flex-col justify-between transition-all ${
                  plan.popular
                    ? 'border-rose-600 shadow-xl shadow-rose-600/10 ring-2 ring-rose-600'
                    : 'border-slate-200/90 shadow-2xs'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[10px] font-extrabold uppercase px-3.5 py-1 rounded-full shadow-md">
                    Most Popular
                  </span>
                )}

                <div>
                  <h4 className="text-xl font-bold text-slate-950 mb-1">{plan.name}</h4>
                  <p className="text-slate-500 text-xs mb-5">{plan.desc}</p>
                  <div className="flex items-baseline mb-6">
                    <span className="text-3xl sm:text-4xl font-black text-slate-950 font-mono">{plan.price}</span>
                    {plan.price !== 'Custom' && <span className="text-slate-500 text-xs ml-1.5">/ mo</span>}
                  </div>
                  <ul className="space-y-3 mb-8 text-sm text-slate-600">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-center space-x-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to="/register"
                  className={`w-full py-3 rounded-xl font-bold text-center text-xs transition-all ${
                    plan.popular
                      ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-md'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  Choose {plan.name.split(' ')[0]}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FAQ ACCORDION --- */}
      <section id="faq" className="py-20 md:py-28 bg-slate-50/60 border-t border-slate-200/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 bg-white border border-slate-200 px-3.5 py-1 rounded-full inline-block">
              Help Center
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3 text-left">
            {faqData.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden transition-all shadow-2xs"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                >
                  <span className="font-bold text-slate-900 text-sm sm:text-base">{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      openFaq === idx ? 'rotate-180 text-rose-600' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-100"
                    >
                      <p className="p-5 text-sm text-slate-600 leading-relaxed bg-slate-50/50">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CLEAN FINAL CTA BANNER --- */}
      <section className="bg-slate-950 text-white py-20 md:py-24 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to Modernize Your Restaurant?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Deploy OrderKare in under 10 minutes. Print desk QR codes, upload your menu, and start receiving real-time kitchen orders today.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-7 py-3.5 rounded-xl font-bold text-sm border border-slate-800 transition-all"
            >
              <span>Admin Login</span>
            </Link>
          </div>
        </div>
      </section>

      {/* --- CLEAN CORPORATE FOOTER --- */}
      <footer id="footer" className="bg-white text-slate-600 pt-16 pb-12 border-t border-slate-200 text-left text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Newsletter Strip */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Stay updated with restaurant technology</h4>
              <p className="text-slate-500 text-xs mt-0.5">Receive monthly product updates and table turnover benchmarks.</p>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="w-full sm:w-auto">
              {subscribed ? (
                <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl inline-block">
                  Subscribed successfully ✓
                </span>
              ) : (
                <div className="flex gap-2 w-full sm:w-80">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={e => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email..."
                    className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-rose-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all text-xs shrink-0"
                  >
                    Subscribe
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Nav Columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1 space-y-3">
              <div className="flex items-center space-x-2">
                <img src="/logo.jpg" alt="OrderKare" className="h-8 w-8 object-cover rounded-lg border border-slate-200" />
                <span className="font-black text-slate-900 text-base">Order<span className="text-rose-600">Kare</span></span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Modern multi-tenant restaurant operating system for QR ordering and real-time kitchen operations.
              </p>
            </div>

            <div className="space-y-2.5">
              <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Product</h5>
              <ul className="space-y-2 text-slate-500">
                <li><a href="#why" className="hover:text-slate-900">Why OrderKare</a></li>
                <li><a href="#how-it-works" className="hover:text-slate-900">How It Works</a></li>
                <li><a href="#screens" className="hover:text-slate-900">Screens</a></li>
                <li><a href="#demo" className="hover:text-slate-900">Interactive Demo</a></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Pricing & Access</h5>
              <ul className="space-y-2 text-slate-500">
                <li><a href="#pricing" className="hover:text-slate-900">Pricing Plans</a></li>
                <li><Link to="/login" className="hover:text-slate-900">Restaurant Sign In</Link></li>
                <li><Link to="/register" className="hover:text-slate-900">Register Venue</Link></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Contact</h5>
              <ul className="space-y-2 text-slate-500">
                <li><a href="mailto:corporate@orderkare.com" className="hover:text-slate-900">corporate@orderkare.com</a></li>
                <li>Sector 62, Noida, NCR, India</li>
                <li className="text-emerald-600 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> System Operational
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
            <p>© 2026 OrderKare Technologies Pvt. Ltd. All rights reserved.</p>
            <div className="flex space-x-4">
              <button onClick={() => setLegalModal('privacy')} className="hover:text-slate-600 transition-colors">
                Privacy Policy
              </button>
              <span>•</span>
              <button onClick={() => setLegalModal('terms')} className="hover:text-slate-600 transition-colors">
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* --- PRODUCTION LEGAL MODALS --- */}
      <AnimatePresence>
        {legalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 relative text-left max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setLegalModal(null)}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>

              {legalModal === 'privacy' ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-xs font-bold text-rose-600 uppercase tracking-wider">
                    <Shield className="w-4 h-4" />
                    <span>OrderKare Data Governance</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-950">Privacy Policy</h3>
                  <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                    <p>
                      OrderKare Technologies Pvt. Ltd. respects the sovereignty and privacy of restaurant partners and dining guests. All transaction records and customer ordering metrics are encrypted in transit via TLS 1.3 and at rest with AES-256.
                    </p>
                    <p>
                      <strong>1. Data Sovereignty:</strong> Your restaurant owns 100% of your guest and order data. We never sell, monetize, or share merchant customer records with third parties.
                    </p>
                    <p>
                      <strong>2. Multi-Tenant Isolation:</strong> Every registered restaurant operates inside a segregated PostgreSQL database schema, ensuring complete separation from other dining establishments.
                    </p>
                    <p>
                      <strong>3. Payment Security:</strong> Digital payments handled via Stripe, Razorpay, or UPI operate under PCI-DSS Level 1 compliance. OrderKare does not store raw credit card credentials.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-xs font-bold text-rose-600 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Service Level Agreement</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-950">Terms of Service</h3>
                  <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                    <p>
                      By registering an account with OrderKare Technologies Pvt. Ltd., you agree to these operational terms:
                    </p>
                    <p>
                      <strong>1. 14-Day Free Trial:</strong> All new restaurant signups receive 14 days of unrestricted access to table QR generation, live kitchen dispatch, and sales reporting without credit card commitments.
                    </p>
                    <p>
                      <strong>2. 0% Platform Commission:</strong> OrderKare operates on a transparent SaaS subscription model. We do not deduct per-order commissions on dine-in meals.
                    </p>
                    <p>
                      <strong>3. Service Uptime:</strong> We guarantee a 99.9% platform availability SLA for live kitchen dispatch systems and customer digital menus.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setLegalModal(null)}
                  className="bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

