import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  QrCode, Utensils, BarChart3, Shield, ArrowRight, CheckCircle2,
  ChevronDown, Smartphone, Zap, Star, Check, Menu, X, ChefHat,
  Clock, CreditCard, Layers, ArrowUpRight, Globe, Bell, PieChart,
  Users, TrendingUp, Sparkles, ShoppingCart, CheckCircle, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence, useInView, useMotionValue, useSpring } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ThemeToggle } from '../components/ThemeToggle'; // 👈 Global Toggle Import

/* ─── Motion Variants ─── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: 'easeOut' }
  })
};

const fadeLeft: Variants = {
  hidden: { opacity: 0, x: 28 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: 'easeOut' }
  })
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
};

/* ─── Animated Spring Number ─── */
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) motionVal.set(value);
  }, [inView, value, motionVal]);

  useEffect(() => {
    return spring.on('change', (v) => setDisplay(Math.round(v)));
  }, [spring]);

  return (
    <span ref={ref}>
      {display >= 1000000
        ? `${(display / 1000000).toFixed(1)}M`
        : display >= 1000
        ? `${(display / 1000).toFixed(0)}K`
        : display}
      {suffix}
    </span>
  );
}

/* ─── Partner Client Names ─── */
const CLIENTS = [
  'Royal Palace Dining', 'The Spice Route', 'Urban Grill Bistro', 'Saffron Kitchen',
  'Blue Leaf Café', 'Monsoon Bar & Grill', 'Jade Garden', 'The Copper Pot',
  'Fire & Ice', 'Chateau Blanc', 'Amber Kitchen', 'The Grand Table'
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Platform', href: '#platform' },
    { label: 'FAQ', href: '#faq' },
  ];

  const features = [
    {
      title: 'QR Table Ordering',
      desc: 'Guests scan, browse, and order directly from their phone browser. No app install, zero lag — orders hit the kitchen in under a second.',
      Icon: QrCode,
      color: 'from-orange-500 to-rose-600',
    },
    {
      title: 'Real-Time Kitchen Display',
      desc: 'WebSocket-powered live order feed on kitchen tablets. Loud audio chimes, elapsed prep timers, and one-tap status advancement.',
      Icon: Bell,
      color: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Zero Commission Payments',
      desc: 'Accept direct UPI, cash, or card. Keep 100% of every rupee. Transparent subscription with zero hidden per-order deductions.',
      Icon: CreditCard,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Instant Menu Management',
      desc: 'Update prices, photos, descriptions, or mark items sold-out in real-time. Changes sync across all guest phones immediately.',
      Icon: Utensils,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Sales & Revenue Analytics',
      desc: 'Daily turnover, best-selling dishes, peak dining hours, and table occupancy rates — all visualized in a crisp dashboard.',
      Icon: PieChart,
      color: 'from-purple-500 to-violet-600',
    },
    {
      title: 'Multi-Device Ready',
      desc: 'Works seamlessly on guest smartphones, kitchen Android tablets, and manager laptops — unified platform across your restaurant.',
      Icon: Smartphone,
      color: 'from-slate-700 to-slate-800',
    },
  ];

  const steps = [
    {
      n: '01',
      title: 'Scan Table QR',
      desc: 'Guest points camera at table QR code. Menu loads instantly in browser with zero downloads or sign-ups.',
      Icon: QrCode
    },
    {
      n: '02',
      title: 'Browse & Customize',
      desc: 'Visual categorized menu with Veg/Non-Veg filters, spice levels, and custom cooking instructions.',
      Icon: Utensils
    },
    {
      n: '03',
      title: 'Kitchen Receives Live',
      desc: 'Kitchen display screen chimes and prints/displays the order with live elapsed prep timers.',
      Icon: Zap
    },
    {
      n: '04',
      title: 'Pay & Settle',
      desc: 'Guest pays via dynamic UPI QR or settles at counter. Analytics and inventory sync automatically.',
      Icon: CheckCircle2
    },
  ];

  const testimonials = [
    {
      quote: 'OrderKare cut our order errors to absolute zero and accelerated our average table turnover by 35%. The kitchen display is a game-changer.',
      author: 'Chef Vikram Oberoi',
      role: 'Executive Chef',
      restaurant: 'Royal Palace Dining',
      city: 'Delhi NCR',
      initial: 'V',
      color: 'bg-orange-500'
    },
    {
      quote: 'Orders pop up on the kitchen screen in 0.2 seconds. Our staff operates with 100% clarity and guests love how fast the menu opens with zero app downloads.',
      author: 'Ananya Deshmukh',
      role: 'Operations Director',
      restaurant: 'The Spice Route Group',
      city: 'Mumbai',
      initial: 'A',
      color: 'bg-blue-600'
    },
    {
      quote: 'We generated custom QR codes for 45 tables in 10 minutes. Revenue increased by 22% in month one. The instant UPI soundbox announcements are flawless.',
      author: 'Marcus Vance',
      role: 'General Manager',
      restaurant: 'Urban Grill Bistro',
      city: 'Bengaluru',
      initial: 'M',
      color: 'bg-emerald-600'
    },
    {
      quote: 'The 0% commission model saved us over ₹65,000 in third-party aggregator cuts in our first quarter alone. We keep 100% of every rupee.',
      author: 'Rajeev Malhotra',
      role: 'Founder & MD',
      restaurant: 'Saffron Kitchen & Lounge',
      city: 'Pune',
      initial: 'R',
      color: 'bg-purple-600'
    },
    {
      quote: 'Waiters spend more time giving great hospitality rather than running paper tickets back and forth to the chef. It transformed our floor flow.',
      author: 'Kavita Sen',
      role: 'Head of Operations',
      restaurant: 'Blue Leaf Café & Roastery',
      city: 'Kolkata',
      initial: 'K',
      color: 'bg-rose-500'
    },
    {
      quote: 'The real-time sold-out toggle is incredible. During peak Friday nights, marking dishes unavailable takes 1 tap and updates all 60 table screens.',
      author: 'Arjun Singhania',
      role: 'Managing Partner',
      restaurant: 'Fire & Ice Gastropub',
      city: 'Hyderabad',
      initial: 'A',
      color: 'bg-amber-600'
    },
  ];

  const faqs = [
    {
      q: 'Do guests need to download an application?',
      a: 'No. Guests simply scan the table QR code with their phone camera, and the digital menu opens instantly in Safari, Chrome, or any mobile browser — zero downloads, zero app store friction.'
    },
    {
      q: 'Can I use my existing restaurant UPI ID for direct payments?',
      a: 'Yes. Configure your UPI ID in the admin settings. Guests can pay directly via Google Pay, PhonePe, Paytm, or choose cash on delivery / pay at counter.'
    },
    {
      q: 'How many table QR codes can I generate?',
      a: 'Unlimited. You can create as many tables and zones as you need, download print-ready high-resolution PDF table stands, and re-generate whenever necessary.'
    },
    {
      q: 'Can kitchen staff mark out-of-stock items instantly?',
      a: 'Yes. With a single tap in the dashboard, any item or category can be marked sold out and is immediately disabled across all customer menus in real time.'
    },
    {
      q: 'How are kitchen orders announced and tracked?',
      a: 'The Kitchen Display System (KDS) receives orders in sub-second time via WebSockets with an audible chime alert, colour-coded order status, and live prep time counters.'
    },
  ];

  const [supportEmail, setSupportEmail] = useState('orderkareindia@gmail.com');
  const [supportPhone, setSupportPhone] = useState('+91 6201945618');

  useEffect(() => {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const API = import.meta.env.VITE_API_URL?.trim() || (isLocal ? 'http://localhost:5000/api/v1' : 'https://orderkare-3.onrender.com/api/v1');

    axios.get(`${API}/settings/public`)
      .then(res => {
        if (res.data?.settings) {
          if (res.data.settings.supportEmail) setSupportEmail(res.data.settings.supportEmail);
          if (res.data.settings.supportPhone) setSupportPhone(res.data.settings.supportPhone);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#fafbfe] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased overflow-x-hidden selection:bg-orange-500 selection:text-white transition-colors duration-300">

      {/* ═══════════════════════════════ TOP ANNOUNCEMENT BAR ═══════════════════════════════ */}
            {/* ═══════════════════════════════ TOP ANNOUNCEMENT BAR ═══════════════════════════════ */}
      <div className="bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 text-white text-xs py-2.5 px-4 font-medium tracking-wide shadow-xs overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <span className="relative z-20 shrink-0 bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">New</span>
          <div className="relative min-w-0 flex-1 overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-orange-500 via-orange-500/70 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-amber-500 via-amber-500/70 to-transparent z-10 pointer-events-none" />
            
            {/* 👈 Clean Marquee Track */}
            <div className="flex animate-marquee whitespace-nowrap">
              <div className="flex items-center shrink-0">
                <span className="px-6">Real-time kitchen display and instant UPI QR ordering are now live</span>
                <span className="text-white/60">✦</span>
                <span className="px-6">Serve faster with OrderKare restaurant operations</span>
                <span className="text-white/60">✦</span>
                <a href="#features" className="px-6 underline font-semibold hover:text-orange-100 transition-colors">Explore platform features →</a>
              </div>
              <div className="flex items-center shrink-0">
                <span className="px-6">Real-time kitchen display and instant UPI QR ordering are now live</span>
                <span className="text-white/60">✦</span>
                <span className="px-6">Serve faster with OrderKare restaurant operations</span>
                <span className="text-white/60">✦</span>
                <a href="#features" className="px-6 underline font-semibold hover:text-orange-100 transition-colors">Explore platform features →</a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ═══════════════════════════════ HEADER ═══════════════════════════════ */}
      <header className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs' : 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/logo.jpg" alt="OrderKare" className="h-8 w-8 rounded-lg object-cover border border-slate-200 shadow-xs group-hover:scale-105 transition-transform" />
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Order<span className="text-orange-600">Kare</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-[14px] font-medium text-slate-600 dark:text-slate-300">
            {navLinks.map(l => (
              <a key={l.href} href={l.href} className="hover:text-orange-600 transition-colors duration-200">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-3">
            {/* 👈 GLOBAL DARK MODE TOGGLE */}
            <ThemeToggle />

            <Link to="/login" className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 hover:text-orange-600 px-3.5 py-2 transition-colors">
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-[13px] font-semibold px-5 py-2.5 rounded-full shadow-md shadow-orange-500/20 hover:shadow-lg transition-all active:scale-95"
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5 shadow-lg"
            >
              <div className="flex flex-col gap-1">
                {navLinks.map(l => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 transition-all"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link to="/login" className="text-center py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  Sign In
                </Link>
                <Link to="/register" className="text-center py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-semibold shadow-md hover:from-orange-600 hover:to-rose-600">
                  Start 14-Day Free Trial
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══════════════════════════════ HERO SECTION ═══════════════════════════════ */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-white dark:bg-slate-950">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-orange-100/40 dark:bg-orange-900/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-rose-100/30 dark:bg-rose-900/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.35] dark:opacity-[0.1]"
            style={{
              backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
              backgroundSize: '32px 32px'
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="lg:col-span-7 text-left space-y-6"
            >
              <motion.div variants={fadeUp} custom={0}>
                <span className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs px-4 py-1.5 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-orange-300 transition-colors">
                  <Sparkles className="w-4 h-4 text-orange-500 fill-orange-500" />
                  <span>Trusted by 1000+ restaurants</span>
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#0f172a] dark:text-white leading-[1.12]"
              >
                Restaurant Ordering <br />
                Made Smarter{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">
                  with
                </span>{' '}
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">
                  QR
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed"
              >
                Customers scan the table QR, order food, make payment and your kitchen receives the order instantly.
              </motion.p>

              <motion.div
                variants={fadeUp}
                custom={3}
                className="flex flex-wrap items-center gap-4 pt-2"
              >
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold text-[15px] shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all active:scale-95"
                >
                  Start With Us
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[15px] transition-all"
                >
                  Book Demo
                </a>
              </motion.div>

              <motion.div
                variants={fadeUp}
                custom={4}
                className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-4 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500 fill-orange-500" />
                  <span>Instant Orders</span>
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-500" />
                  <span>Secure Payments</span>
                </span>
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  <span>Sales Analytics</span>
                </span>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 relative flex items-center justify-center"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="absolute -left-4 sm:-left-10 top-16 z-20 bg-white dark:bg-slate-800 rounded-2xl p-3.5 shadow-2xl border border-slate-100 dark:border-slate-700 text-center hover:-translate-y-1 transition-transform cursor-pointer"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-50 to-rose-50 dark:from-slate-700 dark:to-slate-800 rounded-xl p-1.5 flex items-center justify-center border border-orange-200 dark:border-slate-600">
                  <svg className="w-full h-full text-orange-500" viewBox="0 0 100 100" fill="currentColor">
                    <path d="M10 10h30v30H10V10zm6 6v18h18V16H16zm4 4h10v10H20V20zm40-10h30v30H60V10zm6 6v18h18V16H66zm4 4h10v10H70V20zM10 60h30v30H10V60zm6 6v18h18V66H16zm4 4h10v10H20V70zm40-10h10v10H60V60zm20 0h10v10H80V60zm-10 10h10v10H70V70zm10 10h10v10H80V80zm-20 0h10v10H60V80zm-15-35h10v10H45V45zm0-25h10v10H45V20zm0 50h10v10H45V70z" />
                  </svg>
                </div>
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-2 whitespace-nowrap">Scan to Order</p>
              </motion.div>

              <div className="relative w-full max-w-[310px] sm:max-w-[330px] rounded-[48px] bg-[#0f172a] dark:bg-slate-800 p-3.5 shadow-2xl shadow-slate-900/25 border-4 border-slate-800 dark:border-slate-700">
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-4 bg-[#0f172a] dark:bg-slate-800 rounded-full z-30" />
                <div className="bg-[#f8fafc] dark:bg-slate-900 rounded-[38px] overflow-hidden p-4 pt-7 text-left space-y-3 relative">
                  <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700 pb-3">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Table 5 · Spice Garden</p>
                      <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Digital Menu</h4>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shadow-xs">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-2.5 flex items-center gap-3 border border-slate-100 dark:border-slate-700 shadow-xs">
                    <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&auto=format&fit=crop&q=80" alt="Margherita Pizza" className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-xs" />
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">Margherita Pizza</h5>
                      <p className="text-xs font-extrabold text-orange-600 mt-0.5">₹249</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-2.5 flex items-center gap-3 border border-slate-100 dark:border-slate-700 shadow-xs">
                    <img src="https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=200&auto=format&fit=crop&q=80" alt="Paneer Tikka" className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-xs" />
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">Paneer Tikka</h5>
                      <p className="text-xs font-extrabold text-orange-600 mt-0.5">₹199</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-2.5 flex items-center gap-3 border border-slate-100 dark:border-slate-700 shadow-xs">
                    <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80" alt="Veg Burger" className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-xs" />
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">Veg Burger</h5>
                      <p className="text-xs font-extrabold text-orange-600 mt-0.5">₹149</p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-center">
                    <div className="w-24 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="absolute -bottom-3 -right-2 sm:-right-8 z-30 bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div className="text-left pr-2">
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">Order Confirmed</p>
                  <p className="text-[10px] font-semibold text-slate-400">Kitchen notified</p>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ CLIENT TICKER BAR ═══════════════════════════════ */}
      <div className="relative border-y border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 pointer-events-none" />
        <div className="flex whitespace-nowrap animate-marquee">
          {[...CLIENTS, ...CLIENTS, ...CLIENTS].map((name, i) => (
            <span key={i} className="inline-flex items-center gap-6 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              {name}
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════ STATS COUNTERS ═══════════════════════════════ */}
      <section className="py-16 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/70 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { target: 1000, suffix: '+', label: 'Active Restaurants', Icon: Utensils, clr: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30' },
              { target: 2500000, suffix: '+', label: 'Orders Processed', Icon: Layers, clr: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
              { target: 99.9, suffix: '%', label: 'Platform Uptime SLA', Icon: Shield, clr: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30', raw: '99.9%' },
              { target: 14, suffix: '-Day', label: 'Free Trial Guarantee', Icon: Sparkles, clr: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="space-y-2">
                <div className="flex justify-center mb-2">
                  <div className={`w-11 h-11 rounded-xl ${s.clr} flex items-center justify-center border border-slate-200/60 dark:border-slate-700 shadow-xs`}>
                    <s.Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
                  {s.raw ? s.raw : <AnimatedNumber value={s.target} suffix={s.suffix} />}
                </p>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════ CORE FEATURES ═══════════════════════════════ */}
      <section id="features" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="text-center max-w-2xl mx-auto mb-16 space-y-3"
          >
            <motion.p variants={fadeUp} custom={0} className="text-xs font-bold text-orange-600 uppercase tracking-widest">
              Why Choose OrderKare
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Everything modern dining rooms need
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
              Replace slow paper slips and error-prone order taking with an ultra-responsive digital workflow.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeLeft}
                custom={i}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-7 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 text-left"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 text-white shadow-md shadow-orange-500/10`}>
                  <f.Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2.5">{f.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════ HOW IT WORKS ═══════════════════════════════ */}
      <section id="how-it-works" className="py-24 bg-slate-50/80 dark:bg-slate-900/50 border-y border-slate-200/70 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="text-center max-w-2xl mx-auto mb-16 space-y-3"
          >
            <motion.p variants={fadeUp} custom={0} className="text-xs font-bold text-orange-600 uppercase tracking-widest">
              Frictionless Flow
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Four steps to 35% faster service
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-slate-600 dark:text-slate-400 text-base">
              From table seating to kitchen dispatch in seconds.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            {steps.map((s, i) => (
              <motion.div
                key={i}
                variants={fadeLeft}
                custom={i}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-black text-slate-200 dark:text-slate-800 font-mono select-none">{s.n}</span>
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800/50 flex items-center justify-center text-orange-600 dark:text-orange-400">
                    <s.Icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.desc}</p>
                {i < 3 && (
                  <div className="hidden md:flex absolute top-10 -right-3.5 z-10 w-7 h-7 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 items-center justify-center shadow-xs">
                    <ArrowRight className="w-3.5 h-3.5 text-orange-600" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════ PLATFORM SCREENS ═══════════════════════════════ */}
      <section id="platform" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="text-center max-w-2xl mx-auto mb-16 space-y-3"
          >
            <motion.p variants={fadeUp} custom={0} className="text-xs font-bold text-orange-600 uppercase tracking-widest">
              Unified Platform
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Three seamless interfaces, one system
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-slate-600 dark:text-slate-400 text-base">
              Custom-built interfaces tailored specifically for guests, chefs, and managers.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                title: 'Customer Mobile Menu',
                badge: 'For Guests',
                desc: 'Blazing fast digital menu that loads in Safari or Chrome without any app installation.',
                Icon: Smartphone,
                iconBg: 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50',
                feats: ['Instant QR Scan & Load', 'Veg / Non-Veg & Spice Filters', 'Add Cooking Notes & Modifiers', 'Live Order Status Tracker']
              },
              {
                title: 'Kitchen Display (KDS)',
                badge: 'For Cooks & Chefs',
                desc: 'Live order board on any kitchen tablet with audible chimes and colour-coded status buttons.',
                Icon: ChefHat,
                iconBg: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50',
                feats: ['Sub-second WebSocket Push', 'Loud Audio Chimes on New Order', 'Elapsed Prep Timer per Table', '1-Tap Status Advance (Cooking / Ready)']
              },
              {
                title: 'Admin Management',
                badge: 'For Owners & Managers',
                desc: 'Complete control of menus, tables, revenue reports, staff roles, and direct UPI setup.',
                Icon: BarChart3,
                iconBg: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50',
                feats: ['Real-time Sales & Turnover Stats', '1-Tap Sold-Out Menu Toggling', 'Print-Ready PDF QR Stands', 'Multi-Device Staff Access']
              },
            ].map((scr, i) => (
              <motion.div
                key={i}
                variants={fadeLeft}
                custom={i}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-7 text-left hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${scr.iconBg} border flex items-center justify-center`}>
                      <scr.Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {scr.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{scr.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">{scr.desc}</p>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  {scr.feats.map((feat, fi) => (
                    <div key={fi} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-emerald-700 dark:text-emerald-400" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════ TESTIMONIALS ═══════════════════════════════ */}
      <section className="py-24 bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-200/70 dark:border-slate-800 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="max-w-2xl mx-auto space-y-3"
          >
            <motion.p variants={fadeUp} custom={0} className="text-xs font-bold text-orange-600 uppercase tracking-widest">
              Real Experiences
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Trusted by leading restaurant owners
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              4.9/5 Average Rating · Over 2,400+ Verified Restaurant Merchants
            </motion.p>
          </motion.div>
        </div>

        <div className="relative overflow-hidden py-3">
          <div className="absolute left-0 top-0 bottom-0 w-28 sm:w-40 bg-gradient-to-r from-slate-50 dark:from-slate-900 via-slate-50/80 dark:via-slate-900/80 to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-28 sm:w-40 bg-gradient-to-l from-slate-50 dark:from-slate-900 via-slate-50/80 dark:via-slate-900/80 to-transparent z-20 pointer-events-none" />

          <div className="flex gap-6 animate-marquee whitespace-normal">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div
                key={i}
                className="w-[340px] sm:w-[380px] shrink-0 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-orange-200 dark:hover:border-orange-800/50 transition-all duration-300 text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex text-amber-400 gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Verified
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold shadow-xs shrink-0`}>
                    {t.initial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{t.author}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{t.role} · {t.restaurant} ({t.city})</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ FAQ SECTION ═══════════════════════════════ */}
      <section id="faq" className="py-24 bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-200/70 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="text-center mb-14 space-y-3"
          >
            <motion.p variants={fadeUp} custom={0} className="text-xs font-bold text-orange-600 uppercase tracking-widest">
              Common Questions
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
            className="space-y-3"
          >
            {faqs.map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4.5 text-left focus:outline-none"
                >
                  <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base pr-4">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${openFaq === i ? 'rotate-180 text-orange-600' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50"
                    >
                      <p className="px-6 py-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════ FINAL CALL TO ACTION ═══════════════════════════════ */}
      <section className="py-20 md:py-28 bg-white dark:bg-slate-950 border-t border-slate-200/70 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-orange-100/60 via-amber-100/50 to-rose-100/60 dark:from-orange-900/20 dark:via-amber-900/20 dark:to-rose-900/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="space-y-6"
          >
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 text-orange-700 dark:text-orange-400 text-xs font-bold px-4 py-1.5 rounded-full">
                <Zap className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                Zero setup fee · 14-day free trial · Cancel anytime
              </span>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight"
            >
              Modernize your restaurant <br />in less than 10 minutes
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-slate-600 dark:text-slate-400 text-base max-w-lg mx-auto leading-relaxed"
            >
              Upload your menu, print table QR codes, and start receiving seamless real-time kitchen orders today.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link
                to="/register"
                className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold px-8 py-4 rounded-full shadow-lg shadow-orange-500/25 transition-all active:scale-95"
              >
                Start 14-Day Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold px-7 py-4 rounded-full transition-all"
              >
                Sign In <ArrowUpRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════ PROFESSIONAL SAAS FOOTER ═══════════════════════════════ */}
      <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          {/* Newsletter Box */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="text-left">
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">Stay updated with restaurant technology</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">Join 1,000+ restaurant owners receiving our monthly hospitality tech & growth insights.</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email.trim()) {
                  setSubscribed(true);
                  setEmail('');
                  setTimeout(() => setSubscribed(false), 4000);
                }
              }}
              className="w-full sm:w-auto"
            >
              {subscribed ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 px-4 py-2.5 rounded-full text-xs inline-block">
                  Subscribed successfully ✓
                </span>
              ) : (
                <div className="flex gap-2 w-full sm:w-84">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="manager@restaurant.com"
                    className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-full transition-all text-xs shrink-0"
                  >
                    Subscribe
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* 4-Column Navigation Grid (Removed Portal Column) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs text-left">
            {/* Brand Information */}
            <div className="col-span-2 md:col-span-1 space-y-3.5">
              <div className="flex items-center gap-2">
                <img src="/logo.jpg" alt="OrderKare" className="h-7 w-7 object-cover rounded-lg border border-slate-200 shadow-xs" />
                <span className="font-black text-slate-900 dark:text-white text-base">Order<span className="text-orange-600">Kare</span></span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs">
                Next-generation QR table ordering, sub-second kitchen display (KDS), and 0% commission direct UPI payments for modern restaurants.
              </p>
              <div className="pt-1 text-[11px] text-slate-400 dark:text-slate-500 space-y-1">
                <p>📍 Naubatpur, Patna, India</p>
                <p>✉️ <a href={`mailto:orderkareindia@gmail.com`} className="text-slate-600 dark:text-slate-300 hover:text-orange-600 font-medium">orderkareindia@gmail.com</a></p>
                <p>📞 <a href={`tel:${supportPhone}`} className="text-slate-600 dark:text-slate-300 hover:text-orange-600 font-medium">{supportPhone}</a></p>
              </div>
            </div>

            {/* Column 2: Product */}
            <div className="space-y-3">
              <h5 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Product</h5>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400 font-medium">
                <li><a href="#features" className="hover:text-orange-600 transition-colors">QR Table Ordering</a></li>
                <li><a href="#platform" className="hover:text-orange-600 transition-colors">Kitchen Display (KDS)</a></li>
                <li><a href="#features" className="hover:text-orange-600 transition-colors">Digital Menu Builder</a></li>
                <li><a href="#platform" className="hover:text-orange-600 transition-colors">UPI Soundbox Sync</a></li>
              </ul>
            </div>

            {/* Column 3: Solutions */}
            <div className="space-y-3">
              <h5 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Solutions</h5>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400 font-medium">
                <li><span className="hover:text-orange-600 cursor-default transition-colors">Fine Dining & Bistros</span></li>
                <li><span className="hover:text-orange-600 cursor-default transition-colors">Quick Service (QSR)</span></li>
                <li><span className="hover:text-orange-600 cursor-default transition-colors">Cafes & Bakeries</span></li>
                <li><span className="hover:text-orange-600 cursor-default transition-colors">Food Courts & Bars</span></li>
                <li><span className="hover:text-orange-600 cursor-default transition-colors">Multi-Branch Chains</span></li>
              </ul>
            </div>

            {/* Column 4: Trust & Legal (Links updated) */}
            <div className="space-y-3">
              <h5 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Legal</h5>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400 font-medium">
                <li><Link to="/privacy-policy" className="hover:text-orange-600 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="hover:text-orange-600 transition-colors">Terms of Service</Link></li>
                <li><Link to="/refund-policy" className="hover:text-orange-600 transition-colors">Refund Policy</Link></li>
                <li><span className="text-slate-500 dark:text-slate-500">0% Commission Model</span></li>
                <li><span className="text-slate-500 dark:text-slate-500">256-bit TLS Security</span></li>
                <li><a href={`mailto:orderkareindia@gmail.com`} className="hover:text-orange-600 transition-colors">Contact Support</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <p>© 2026 OrderKare. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <Link to="/privacy-policy" className="hover:text-slate-900 dark:hover:text-white transition-colors font-medium">Privacy</Link>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <Link to="/terms-of-service" className="hover:text-slate-900 dark:hover:text-white transition-colors font-medium">Terms</Link>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <Link to="/refund-policy" className="hover:text-slate-900 dark:hover:text-white transition-colors font-medium">Refund</Link>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-slate-400 dark:text-slate-500">Made with ❤️ for modern restaurants</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};