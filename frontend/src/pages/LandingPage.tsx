import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode, Utensils, BarChart3, Shield, ArrowRight, CheckCircle2,
  ChevronDown, Smartphone, Zap, Star, Check, Menu, X, ChefHat,
  Clock, CreditCard, Layers, ArrowUpRight, Globe, Bell, PieChart,
  Users, TrendingUp, Sparkles, ShoppingCart, CheckCircle, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence, useInView, useMotionValue, useSpring } from 'framer-motion';
import type { Variants } from 'framer-motion';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);
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
    { label: 'Pricing', href: '#pricing' },
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

  const plans = [
    {
      name: 'Starter',
      price: { monthly: '₹999', yearly: '₹799' },
      desc: 'Ideal for small cafes, bakeries & food trucks',
      features: [
        'Up to 15 Table QR Codes',
        'Real-time Digital Menu',
        'Kitchen Display Screen (KDS)',
        'Basic Daily Analytics',
        'Email & Chat Support'
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Professional',
      price: { monthly: '₹1,999', yearly: '₹1,599' },
      desc: 'For busy restaurants & high-volume dining rooms',
      features: [
        'Unlimited Table QR Codes',
        'Sub-second WebSocket KDS Feed',
        'Staff & Waiter Management',
        '1-Tap Sold-Out Inventory Toggle',
        'Advanced Revenue Analytics & Export',
        '24/7 Priority Support & Soundbox Sync'
      ],
      cta: 'Start 14-Day Free Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      price: { monthly: 'Custom', yearly: 'Custom' },
      desc: 'Multi-branch restaurant chains & hotel groups',
      features: [
        'Multi-Branch Centralized Console',
        'Dedicated Account Manager',
        'Custom POS / ERP Integrations',
        'Centralized Menu & Recipe Sync',
        'Custom Domain & 99.99% Uptime SLA'
      ],
      cta: 'Contact Sales',
      popular: false
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafbfe] text-slate-900 font-sans antialiased overflow-x-hidden selection:bg-orange-500 selection:text-white">

      {/* ═══════════════════════════════ TOP ANNOUNCEMENT BAR ═══════════════════════════════ */}
      <div className="bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 text-white text-xs py-2.5 px-4 font-medium tracking-wide shadow-xs overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <span className="relative z-20 shrink-0 bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">New</span>
          <div className="relative min-w-0 flex-1 overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-orange-500 via-orange-500/70 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-amber-500 via-amber-500/70 to-transparent z-10 pointer-events-none" />
            <div className="animate-marquee-ltr whitespace-nowrap">
              {[1, 2].map((copy) => (
                <div key={copy} className="flex items-center shrink-0">
                  <span className="px-6">Real-time kitchen display and instant UPI QR ordering are now live</span>
                  <span className="text-white/60">✦</span>
                  <span className="px-6">Serve faster with OrderKare restaurant operations</span>
                  <span className="text-white/60">✦</span>
                  <a href="#features" className="px-6 underline font-semibold hover:text-orange-100 transition-colors">Explore platform features →</a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════ HEADER ═══════════════════════════════ */}
      <header className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs' : 'bg-white/60 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/logo.jpg" alt="OrderKare" className="h-8 w-8 rounded-lg object-cover border border-slate-200 shadow-xs group-hover:scale-105 transition-transform" />
            <span className="text-lg font-black tracking-tight text-slate-900">
              Order<span className="text-orange-600">Kare</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-[14px] font-medium text-slate-600">
            {navLinks.map(l => (
              <a key={l.href} href={l.href} className="hover:text-orange-600 transition-colors duration-200">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-3">
            <Link to="/login" className="text-[13px] font-semibold text-slate-700 hover:text-orange-600 px-3.5 py-2 transition-colors">
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
            className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
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
              className="lg:hidden bg-white border-b border-slate-200 px-6 py-5 shadow-lg"
            >
              <div className="flex flex-col gap-1">
                {navLinks.map(l => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-all"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-100">
                <Link to="/login" className="text-center py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">
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

      {/* ═══════════════════════════════════════════════════════════════════════════
          ⭐ HERO SECTION — EXACT MATCH TO USER REFERENCE DESIGN
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-white">
        {/* Subtle Light Ambient Texture & Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-orange-100/40 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-rose-100/30 blur-3xl" />
          {/* Subtle Grid texture */}
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
              backgroundSize: '32px 32px'
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* ─── LEFT COLUMN: HEADLINE, DESCRIPTION, CTAS & TRUST POINTS ─── */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="lg:col-span-7 text-left space-y-6"
            >
              {/* Pill Badge */}
              <motion.div variants={fadeUp} custom={0}>
                <span className="inline-flex items-center gap-2 bg-white border border-slate-200 shadow-xs px-4 py-1.5 rounded-full text-xs font-semibold text-slate-700 hover:border-orange-300 transition-colors">
                  <Sparkles className="w-4 h-4 text-orange-500 fill-orange-500" />
                  <span>Trusted by 1000+ restaurants</span>
                </span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#0f172a] leading-[1.12]"
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

              {/* Subtitle */}
              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed"
              >
                Customers scan the table QR, order food, make payment and your kitchen receives the order instantly.
              </motion.p>

              {/* CTA Buttons */}
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
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[15px] transition-all"
                >
                  Book Demo
                </a>
              </motion.div>

              {/* 3 Trust Points */}
              <motion.div
                variants={fadeUp}
                custom={4}
                className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-4 text-xs sm:text-sm font-semibold text-slate-700"
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

            {/* ─── RIGHT COLUMN: FLOATING QR STAND + SMARTPHONE MENU MOCKUP ─── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 relative flex items-center justify-center"
            >
              {/* 1. FLOATING QR CODE STAND (LEFT SIDE OF PHONE) */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="absolute -left-4 sm:-left-10 top-16 z-20 bg-white rounded-2xl p-3.5 shadow-2xl border border-slate-100 text-center hover:-translate-y-1 transition-transform cursor-pointer"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-50 to-rose-50 rounded-xl p-1.5 flex items-center justify-center border border-orange-200">
                  {/* Styled Orange QR Code SVG */}
                  <svg className="w-full h-full text-orange-500" viewBox="0 0 100 100" fill="currentColor">
                    <path d="M10 10h30v30H10V10zm6 6v18h18V16H16zm4 4h10v10H20V20zm40-10h30v30H60V10zm6 6v18h18V16H66zm4 4h10v10H70V20zM10 60h30v30H10V60zm6 6v18h18V66H16zm4 4h10v10H20V70zm40-10h10v10H60V60zm20 0h10v10H80V60zm-10 10h10v10H70V70zm10 10h10v10H80V80zm-20 0h10v10H60V80zm-15-35h10v10H45V45zm0-25h10v10H45V20zm0 50h10v10H45V70z" />
                  </svg>
                </div>
                <p className="text-[11px] font-bold text-slate-800 mt-2 whitespace-nowrap">Scan to Order</p>
              </motion.div>

              {/* 2. SMARTPHONE DEVICE MOCKUP */}
              <div className="relative w-full max-w-[310px] sm:max-w-[330px] rounded-[48px] bg-[#0f172a] p-3.5 shadow-2xl shadow-slate-900/25 border-4 border-slate-800">
                {/* Phone Speaker & Camera Notch */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-4 bg-[#0f172a] rounded-full z-30" />

                {/* Phone Screen Container */}
                <div className="bg-[#f8fafc] rounded-[38px] overflow-hidden p-4 pt-7 text-left space-y-3 relative">

                  {/* Top Bar inside Screen */}
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Table 5 · Spice Garden</p>
                      <h4 className="text-base font-black text-slate-900 tracking-tight">Digital Menu</h4>
                    </div>
                    {/* Orange Cart Icon Button */}
                    <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Food Item 1: Margherita Pizza */}
                  <div className="bg-white rounded-2xl p-2.5 flex items-center gap-3 border border-slate-100 shadow-xs hover:border-orange-200 transition-colors">
                    <img
                      src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&auto=format&fit=crop&q=80"
                      alt="Margherita Pizza"
                      className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-xs"
                    />
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-slate-900 truncate">Margherita Pizza</h5>
                      <p className="text-xs font-extrabold text-orange-600 mt-0.5">₹249</p>
                    </div>
                  </div>

                  {/* Food Item 2: Paneer Tikka */}
                  <div className="bg-white rounded-2xl p-2.5 flex items-center gap-3 border border-slate-100 shadow-xs hover:border-orange-200 transition-colors">
                    <img
                      src="https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=200&auto=format&fit=crop&q=80"
                      alt="Paneer Tikka"
                      className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-xs"
                    />
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-slate-900 truncate">Paneer Tikka</h5>
                      <p className="text-xs font-extrabold text-orange-600 mt-0.5">₹199</p>
                    </div>
                  </div>

                  {/* Food Item 3: Veg Burger */}
                  <div className="bg-white rounded-2xl p-2.5 flex items-center gap-3 border border-slate-100 shadow-xs hover:border-orange-200 transition-colors">
                    <img
                      src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80"
                      alt="Veg Burger"
                      className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-xs"
                    />
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-slate-900 truncate">Veg Burger</h5>
                      <p className="text-xs font-extrabold text-orange-600 mt-0.5">₹149</p>
                    </div>
                  </div>

                  {/* Bottom Home Indicator Bar */}
                  <div className="pt-2 flex justify-center">
                    <div className="w-24 h-1 bg-slate-300 rounded-full" />
                  </div>
                </div>
              </div>

              {/* 3. FLOATING ORDER CONFIRMED CARD (BOTTOM RIGHT OF PHONE) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="absolute -bottom-3 -right-2 sm:-right-8 z-30 bg-white rounded-2xl p-3 shadow-2xl border border-slate-100 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div className="text-left pr-2">
                  <p className="text-xs font-extrabold text-slate-900">Order Confirmed</p>
                  <p className="text-[10px] font-semibold text-slate-400">Kitchen notified</p>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ CLIENT TICKER BAR ═══════════════════════════════ */}
      <div className="relative border-y border-slate-200/80 bg-white py-4 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
        <div className="flex whitespace-nowrap animate-marquee">
          {[...CLIENTS, ...CLIENTS, ...CLIENTS].map((name, i) => (
            <span key={i} className="inline-flex items-center gap-6 px-6 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-700 transition-colors">
              {name}
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════ STATS COUNTERS ═══════════════════════════════ */}
      <section className="py-16 bg-slate-50/70 border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { target: 1000, suffix: '+', label: 'Active Restaurants', Icon: Utensils, clr: 'text-orange-600 bg-orange-50' },
              { target: 2500000, suffix: '+', label: 'Orders Processed', Icon: Layers, clr: 'text-blue-600 bg-blue-50' },
              { target: 99.9, suffix: '%', label: 'Platform Uptime SLA', Icon: Shield, clr: 'text-emerald-600 bg-emerald-50', raw: '99.9%' },
              { target: 14, suffix: '-Day', label: 'Free Trial Guarantee', Icon: Sparkles, clr: 'text-amber-600 bg-amber-50' },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="space-y-2">
                <div className="flex justify-center mb-2">
                  <div className={`w-11 h-11 rounded-xl ${s.clr} flex items-center justify-center border border-slate-200/60 shadow-xs`}>
                    <s.Icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                  {s.raw ? s.raw : <AnimatedNumber value={s.target} suffix={s.suffix} />}
                </p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════ CORE FEATURES ═══════════════════════════════ */}
      <section id="features" className="py-24 bg-white">
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
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything modern dining rooms need
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-slate-600 text-base leading-relaxed">
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
                className="bg-white border border-slate-200/90 rounded-2xl p-7 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 text-left"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 text-white shadow-md shadow-orange-500/10`}>
                  <f.Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2.5">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════ HOW IT WORKS ═══════════════════════════════ */}
      <section id="how-it-works" className="py-24 bg-slate-50/80 border-y border-slate-200/70">
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
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Four steps to 35% faster service
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-slate-600 text-base">
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
                className="relative bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl font-black text-slate-200 font-mono select-none">{s.n}</span>
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                    <s.Icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                {i < 3 && (
                  <div className="hidden md:flex absolute top-10 -right-3.5 z-10 w-7 h-7 rounded-full bg-white border border-slate-200 items-center justify-center shadow-xs">
                    <ArrowRight className="w-3.5 h-3.5 text-orange-600" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════ PLATFORM SCREENS ═══════════════════════════════ */}
      <section id="platform" className="py-24 bg-white">
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
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Three seamless interfaces, one system
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-slate-600 text-base">
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
                iconBg: 'bg-orange-50 text-orange-600 border-orange-100',
                feats: ['Instant QR Scan & Load', 'Veg / Non-Veg & Spice Filters', 'Add Cooking Notes & Modifiers', 'Live Order Status Tracker']
              },
              {
                title: 'Kitchen Display (KDS)',
                badge: 'For Cooks & Chefs',
                desc: 'Live order board on any kitchen tablet with audible chimes and colour-coded status buttons.',
                Icon: ChefHat,
                iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
                feats: ['Sub-second WebSocket Push', 'Loud Audio Chimes on New Order', 'Elapsed Prep Timer per Table', '1-Tap Status Advance (Cooking / Ready)']
              },
              {
                title: 'Admin Management',
                badge: 'For Owners & Managers',
                desc: 'Complete control of menus, tables, revenue reports, staff roles, and direct UPI setup.',
                Icon: BarChart3,
                iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
                feats: ['Real-time Sales & Turnover Stats', '1-Tap Sold-Out Menu Toggling', 'Print-Ready PDF QR Stands', 'Multi-Device Staff Access']
              },
            ].map((scr, i) => (
              <motion.div
                key={i}
                variants={fadeLeft}
                custom={i}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-white border border-slate-200/90 rounded-2xl p-7 text-left hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${scr.iconBg} border flex items-center justify-center`}>
                      <scr.Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {scr.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{scr.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">{scr.desc}</p>
                </div>
                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                  {scr.feats.map((feat, fi) => (
                    <div key={fi} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-emerald-700" />
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

      {/* ═══════════════════════════════ TESTIMONIALS (LEFT TO RIGHT ANIMATED MARQUEE) ═══════════════════════════════ */}
      <section className="py-24 bg-slate-50/80 border-t border-slate-200/70 overflow-hidden relative">
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
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Trusted by leading restaurant owners
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-sm text-slate-500 font-medium">
              4.9/5 Average Rating · Over 2,400+ Verified Restaurant Merchants
            </motion.p>
          </motion.div>
        </div>

        {/* Continuous Right-to-Left Moving Review Track */}
        <div className="relative overflow-hidden py-3">
          {/* Edge Fade Masks */}
          <div className="absolute left-0 top-0 bottom-0 w-28 sm:w-40 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-28 sm:w-40 bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent z-20 pointer-events-none" />

          {/* Marquee Track (Right to Left) */}
          <div className="flex gap-6 animate-marquee whitespace-normal">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div
                key={i}
                className="w-[340px] sm:w-[380px] shrink-0 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex text-amber-400 gap-0.5">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" /> Verified
                    </span>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold shadow-xs shrink-0`}>
                    {t.initial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{t.author}</p>
                    <p className="text-xs text-slate-500 truncate">{t.role} · {t.restaurant} ({t.city})</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ PRICING SECTION ═══════════════════════════════ */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="text-center max-w-2xl mx-auto mb-12 space-y-3"
          >
            <motion.p variants={fadeUp} custom={0} className="text-xs font-bold text-orange-600 uppercase tracking-widest">
              Simple Pricing
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              0% commission. Keep every rupee.
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-slate-600 text-base">
              Predictable flat monthly subscription. No per-order cuts or hidden transaction charges.
            </motion.p>

            {/* Monthly / Yearly Toggle */}
            <motion.div variants={fadeUp} custom={3} className="flex justify-center pt-3">
              <div className="inline-flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                {(['monthly', 'yearly'] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => setBillingCycle(c)}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${billingCycle === c ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    {c === 'yearly' ? (
                      <span className="flex items-center gap-1.5">
                        Yearly <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md">Save 20%</span>
                      </span>
                    ) : 'Monthly'}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Pricing Cards Grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                variants={fadeLeft}
                custom={i}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className={`relative flex flex-col justify-between rounded-2xl p-7 text-left transition-all ${
                  plan.popular
                    ? 'bg-white border-2 border-orange-500 shadow-xl shadow-orange-500/10'
                    : 'bg-white border border-slate-200/90 shadow-xs hover:shadow-md'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[11px] font-extrabold uppercase px-3.5 py-1 rounded-full shadow-md shadow-orange-500/30">
                    Most Popular
                  </span>
                )}
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h4>
                  <p className="text-xs text-slate-500 mb-6">{plan.desc}</p>
                  <div className="flex items-baseline mb-6">
                    <span className="text-4xl font-black text-slate-900 tracking-tight">
                      {plan.price[billingCycle]}
                    </span>
                    {plan.price[billingCycle] !== 'Custom' && (
                      <span className="text-xs text-slate-500 ml-1.5 font-medium">/ month</span>
                    )}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat, fi) => (
                      <li key={fi} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  to="/register"
                  className={`block w-full py-3.5 rounded-xl font-bold text-center text-sm transition-all active:scale-95 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:from-orange-600 hover:to-rose-600 shadow-md shadow-orange-500/25'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════ FAQ SECTION ═══════════════════════════════ */}
      <section id="faq" className="py-24 bg-slate-50/80 border-t border-slate-200/70">
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
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
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
                className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4.5 text-left focus:outline-none"
                >
                  <span className="font-bold text-slate-900 text-sm sm:text-base pr-4">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${openFaq === i ? 'rotate-180 text-orange-600' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="border-t border-slate-100 bg-slate-50/50"
                    >
                      <p className="px-6 py-4 text-xs sm:text-sm text-slate-600 leading-relaxed">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════ FINAL CALL TO ACTION ═══════════════════════════════ */}
      <section className="py-20 md:py-28 bg-white border-t border-slate-200/70 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-orange-100/60 via-amber-100/50 to-rose-100/60 rounded-full blur-3xl" />
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
              <span className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold px-4 py-1.5 rounded-full">
                <Zap className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                Zero setup fee · 14-day free trial · Cancel anytime
              </span>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight"
            >
              Modernize your restaurant <br />in less than 10 minutes
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-slate-600 text-base max-w-lg mx-auto leading-relaxed"
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
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-7 py-4 rounded-full transition-all"
              >
                Sign In <ArrowUpRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════ PROFESSIONAL SAAS FOOTER ═══════════════════════════════ */}
      <footer className="bg-slate-50 border-t border-slate-200/80 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          {/* Newsletter Box */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="text-left">
              <h4 className="font-extrabold text-base text-slate-900 tracking-tight">Stay updated with restaurant technology</h4>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Join 1,000+ restaurant owners receiving our monthly hospitality tech & growth insights.</p>
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
                <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-full text-xs inline-block">
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
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-full transition-all text-xs shrink-0"
                  >
                    Subscribe
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* 5-Column Navigation Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-xs text-left">
            {/* Brand Information */}
            <div className="col-span-2 md:col-span-1 space-y-3.5">
              <div className="flex items-center gap-2">
                <img src="/logo.jpg" alt="OrderKare" className="h-7 w-7 object-cover rounded-lg border border-slate-200 shadow-xs" />
                <span className="font-black text-slate-900 text-base">Order<span className="text-orange-600">Kare</span></span>
              </div>
              <p className="text-slate-500 leading-relaxed text-xs">
                Next-generation QR table ordering, sub-second kitchen display (KDS), and 0% commission direct UPI payments for modern restaurants.
              </p>
              <div className="pt-1 text-[11px] text-slate-400 space-y-1">
                <p>📍 Sector 62, Noida NCR, India</p>
                <p>✉️ <a href="mailto:support@orderkare.com" className="text-slate-600 hover:text-orange-600 font-medium">support@orderkare.com</a></p>
              </div>
            </div>

            {/* Column 2: Product */}
            <div className="space-y-3">
              <h5 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">Product</h5>
              <ul className="space-y-2 text-slate-600 font-medium">
                <li><a href="#features" className="hover:text-orange-600 transition-colors">QR Table Ordering</a></li>
                <li><a href="#platform" className="hover:text-orange-600 transition-colors">Kitchen Display (KDS)</a></li>
                <li><a href="#features" className="hover:text-orange-600 transition-colors">Digital Menu Builder</a></li>
                <li><a href="#platform" className="hover:text-orange-600 transition-colors">UPI Soundbox Sync</a></li>
                <li><a href="#pricing" className="hover:text-orange-600 transition-colors">Pricing & Plans</a></li>
              </ul>
            </div>

            {/* Column 3: Solutions */}
            <div className="space-y-3">
              <h5 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">Solutions</h5>
              <ul className="space-y-2 text-slate-600 font-medium">
                <li><span className="hover:text-orange-600 cursor-default transition-colors">Fine Dining & Bistros</span></li>
                <li><span className="hover:text-orange-600 cursor-default transition-colors">Quick Service (QSR)</span></li>
                <li><span className="hover:text-orange-600 cursor-default transition-colors">Cafes & Bakeries</span></li>
                <li><span className="hover:text-orange-600 cursor-default transition-colors">Food Courts & Bars</span></li>
                <li><span className="hover:text-orange-600 cursor-default transition-colors">Multi-Branch Chains</span></li>
              </ul>
            </div>

            {/* Column 4: Portals & Access */}
            <div className="space-y-3">
              <h5 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">Portals</h5>
              <ul className="space-y-2 text-slate-600 font-medium">
                <li><Link to="/login" className="hover:text-orange-600 transition-colors">Restaurant Sign In</Link></li>
                <li><Link to="/register" className="hover:text-orange-600 transition-colors">Create Account</Link></li>
                <li><Link to="/login" className="hover:text-orange-600 transition-colors">Kitchen KDS Login</Link></li>
                <li><Link to="/login" className="hover:text-orange-600 transition-colors">Staff Access</Link></li>
                <li><a href="#faq" className="hover:text-orange-600 transition-colors">Help & FAQ</a></li>
              </ul>
            </div>

            {/* Column 5: Trust & Legal */}
            <div className="space-y-3">
              <h5 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">Company</h5>
              <ul className="space-y-2 text-slate-600 font-medium">
                <li><button onClick={() => setLegalModal('privacy')} className="hover:text-orange-600 transition-colors text-left">Privacy Policy</button></li>
                <li><button onClick={() => setLegalModal('terms')} className="hover:text-orange-600 transition-colors text-left">Terms of Service</button></li>
                <li><span className="text-slate-500">0% Commission Model</span></li>
                <li><span className="text-slate-500">256-bit TLS Security</span></li>
                <li><a href="mailto:support@orderkare.com" className="hover:text-orange-600 transition-colors">Contact Support</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="pt-6 border-t border-slate-200/80 flex flex-col lg:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 OrderKare Technologies Pvt. Ltd. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <button onClick={() => setLegalModal('privacy')} className="hover:text-slate-900 transition-colors font-medium">Privacy</button>
              <span className="text-slate-300">·</span>
              <button onClick={() => setLegalModal('terms')} className="hover:text-slate-900 transition-colors font-medium">Terms</button>
              <span className="text-slate-300">·</span>
              <span className="text-slate-400">Made with ❤️ for modern restaurants</span>
              <span className="hidden sm:inline text-slate-300">·</span>
              <span className="text-slate-400">
                Developed by{' '}
                <a
                  href="https://www.nexifyforge.in"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-orange-600 hover:text-orange-700 transition-colors"
                >
                  Nexify Forge
                </a>
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════ LEGAL MODALS (LIGHT) ═══════════════════════════════ */}
      <AnimatePresence>
        {legalModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 relative max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setLegalModal(null)}
                className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              {legalModal === 'privacy' ? (
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-widest">
                    <Shield className="w-4 h-4" /> Data Governance
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Privacy Policy</h3>
                  <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                    <p>OrderKare Technologies Pvt. Ltd. prioritizes the data privacy of restaurant merchants and their guests. All network traffic is encrypted via TLS 1.3.</p>
                    <p><strong className="text-slate-900">Data Ownership:</strong> You own 100% of your restaurant menus, orders, customer records, and sales history.</p>
                    <p><strong className="text-slate-900">Isolation:</strong> Multi-tenant segregation ensures full database isolation between restaurants.</p>
                    <p><strong className="text-slate-900">Payments:</strong> Direct UPI transactions connect directly to your merchant account. We never hold your revenue.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4" /> Service Agreement
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Terms of Service</h3>
                  <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                    <p>By creating an account on OrderKare, you agree to our service terms:</p>
                    <p><strong className="text-slate-900">Free Trial:</strong> 14 days full feature access with no payment method required.</p>
                    <p><strong className="text-slate-900">Zero Commission:</strong> Fixed monthly/yearly subscription with zero per-order charges.</p>
                    <p><strong className="text-slate-900">Uptime SLA:</strong> 99.9% uptime commitment for customer digital menus and kitchen display sync.</p>
                  </div>
                </div>
              )}
              <div className="pt-5 mt-5 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setLegalModal(null)}
                  className="bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
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
