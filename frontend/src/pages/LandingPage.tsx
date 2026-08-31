import { useState, useRef } from 'react';
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
  Play,
  Pause,
  Volume2,
  VolumeX,
  Star,
  Flame,
  Award,
  Clock,
  TrendingUp,
  Heart,
  Layers,
  Globe,
  Radio,
  Check,
  Percent,
  Calculator,
  Building2,
  Users,
  Send,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LandingPage = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [activeTab, setActiveTab] = useState<'customer' | 'admin'>('customer');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [tablesCount, setTablesCount] = useState(15);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setNewsletterEmail('');
    }
  };

  // ROI Calculator Math
  const estimatedRevenueIncrease = Math.round(tablesCount * 30 * 120 * 0.22);

  const foodPosters = [
    {
      title: 'Artisanal Truffle Pizza',
      category: 'Signature Mains',
      price: '₹480',
      rating: '4.9',
      ordersToday: '142 orders',
      tag: 'Chef Special',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    {
      title: 'Prime Angus Smash Burger',
      category: 'Gourmet Grill',
      price: '₹390',
      rating: '4.8',
      ordersToday: '210 orders',
      tag: 'Bestseller',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200'
    },
    {
      title: 'Signature Salmon Sushi Set',
      category: 'Japanese Cuisine',
      price: '₹650',
      rating: '5.0',
      ordersToday: '98 orders',
      tag: 'Trending',
      image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    {
      title: 'Craft Mixology Cocktails',
      category: 'Beverage Bar',
      price: '₹320',
      rating: '4.9',
      ordersToday: '175 orders',
      tag: 'High Margin',
      image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200'
    }
  ];

  const testimonials = [
    {
      quote: "OrderKare transformed our dining service. Table turnover increased by 35% and customer satisfaction score hit 4.9/5.",
      author: "Chef Vikram Oberoi",
      role: "Executive Chef & Owner",
      restaurant: "Royal Palace Fine Dining",
      avatar: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80"
    },
    {
      quote: "The real-time WebSocket kitchen alerts eliminate order dropouts completely. Our staff loves the live order queue!",
      author: "Ananya Deshmukh",
      role: "Operations Director",
      restaurant: "The Spice Route Chain (12 Branches)",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80"
    },
    {
      quote: "Setting up our digital menu and custom desk QR codes took less than 15 minutes. Best SaaS investment we made this year.",
      author: "Marcus Vance",
      role: "General Manager",
      restaurant: "Urban Grill Bistro",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
    }
  ];

  const faqData = [
    {
      q: "How do customers access the menu?",
      a: "Customers simply scan the custom QR code printed on their table using their phone camera. It opens the restaurant's digital menu instantly in their browser. No app download or account creation required."
    },
    {
      q: "Can I update my menu in real-time?",
      a: "Yes! Any changes you make in your Admin Dashboard—like updating prices, adding new dishes, or marking an item as 'Currently Unavailable'—will reflect on the customer menu instantly."
    },
    {
      q: "How does the real-time order notification work?",
      a: "We use WebSocket technology to push new orders immediately to your kitchen dashboard. You will hear an audio alert and see the order pop up under the 'Pending' column the second a customer clicks 'Place Order'."
    },
    {
      q: "What payment gateways are supported?",
      a: "OrderKare supports Stripe for international operations and Razorpay for businesses in India. We securely handle subscription billing and can also route customer order payments directly to your bank account."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-primary/20 selection:text-primary font-sans overflow-x-hidden">
      
      {/* Decorative background glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* --- HEADER / NAVBAR --- */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <img src="/logo.jpg" alt="OrderKare Logo" className="h-11 w-auto object-contain rounded-xl shadow-xs group-hover:scale-105 transition-transform" />
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                OrderKare
              </span>
              <span className="block text-[9px] text-slate-500 font-mono tracking-widest uppercase">SCAN • ORDER • ENJOY</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#video-reel" className="hover:text-primary transition-colors">Live Reel</a>
            <a href="#demo" className="hover:text-primary transition-colors">Interactive Demo</a>
            <a href="#roi" className="hover:text-primary transition-colors">ROI Calculator</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-primary text-white text-xs font-extrabold px-6 py-3 rounded-2xl hover:bg-primary/95 transition-all shadow-xl shadow-primary/20 hover:scale-105"
            >
              Start Free Trial →
            </Link>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        {/* Release Pill */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center space-x-2 bg-white border border-slate-200/80 text-slate-700 text-xs px-4.5 py-2 rounded-full mb-8 shadow-md"
        >
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="font-semibold">Next-Gen Multi-Tenant Ordering Infrastructure</span>
          <span className="bg-primary/10 text-primary text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">NEW</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl sm:text-7xl font-black tracking-tight max-w-5xl mx-auto leading-[1.08] text-slate-900"
        >
          The Operating System for{' '}
          <span className="bg-gradient-to-r from-primary via-rose-500 to-amber-500 bg-clip-text text-transparent">
            Modern Gastronomy
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-base sm:text-lg text-slate-600 mt-6 max-w-2xl mx-auto leading-relaxed"
        >
          Empower your tables with instant QR menus, zero-latency WebSocket kitchen queues, and real-time sales intelligence. Boost ticket sizes by <strong className="text-slate-900 font-bold">+22%</strong> effortlessly.
        </motion.p>

        {/* Hero Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
        >
          <Link
            to="/register"
            className="w-full sm:w-auto bg-primary text-white px-9 py-4.5 rounded-2xl font-extrabold text-base hover:bg-primary/95 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-primary/30 hover:scale-[1.02]"
          >
            <span>Register Your Restaurant</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#video-reel"
            className="w-full sm:w-auto bg-white text-slate-700 border border-slate-200 px-8 py-4.5 rounded-2xl font-bold text-base hover:bg-slate-50 transition-all flex items-center justify-center space-x-2.5 shadow-sm"
          >
            <Play className="w-4 h-4 text-primary fill-primary" />
            <span>Watch Live Video Reel</span>
          </a>
        </motion.div>

        {/* Hero Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-8 mt-12 text-xs font-semibold text-slate-500 border-t border-slate-200/80 pt-8"
        >
          <span className="flex items-center gap-1.5 text-amber-600 font-bold">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> 4.9/5 Rating
          </span>
          <span className="flex items-center gap-1.5 text-slate-700">
            <Building2 className="w-4 h-4 text-primary" /> 5,000+ Active Venues
          </span>
          <span className="flex items-center gap-1.5 text-slate-700">
            <Shield className="w-4 h-4 text-emerald-600" /> 99.99% Uptime SLA
          </span>
          <span className="flex items-center gap-1.5 text-slate-700">
            <Zap className="w-4 h-4 text-rose-500" /> &lt;0.2s Order Sync Speed
          </span>
        </motion.div>

        {/* --- CINEMATIC LIGHT MODE VIDEO & LIVE NOTIFICATION BANNER --- */}
        <motion.div
          id="video-reel"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-14 relative max-w-5xl mx-auto rounded-3xl overflow-hidden border-4 border-white shadow-2xl shadow-slate-300/70 bg-slate-900 group"
        >
          <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
            <video
              ref={videoRef}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              poster="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80"
              className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
            >
              <source src="https://assets.mixkit.co/videos/preview/mixkit-chef-plating-a-gourmet-dish-43308-large.mp4" type="video/mp4" />
            </video>

            {/* Subtle Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />

            {/* Video Controls Header */}
            <div className="absolute top-5 right-5 z-20 flex items-center space-x-2">
              <button
                onClick={toggleVideoPlay}
                className="w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-md text-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg"
              >
                {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-800" />}
              </button>
              <button
                onClick={toggleMute}
                className="w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-md text-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Floating Live Notification Popups over Video */}
            <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-col md:flex-row items-center justify-between gap-4">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 text-left text-slate-900 shadow-2xl flex items-center space-x-3.5 max-w-sm"
              >
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900">New Order #892 Received</h4>
                    <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Just Now</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Table #04 • 2x Paneer Tikka • ₹440</p>
                </div>
              </motion.div>

              <div className="hidden md:flex items-center space-x-4 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-3.5 px-5 text-slate-900 shadow-2xl">
                <div className="flex -space-x-2">
                  {['👨‍🍳', '👩‍🍳', '🍕', '🍣'].map((emoji, idx) => (
                    <span key={idx} className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs shadow-xs">
                      {emoji}
                    </span>
                  ))}
                </div>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-slate-900">Live Kitchen Queue Active</p>
                  <p className="text-[10px] text-slate-500 font-mono">0.2s WebSocket Latency</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Global Platform Metrics Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mt-20 border-t border-slate-200/80 pt-12">
          {[
            { value: "10M+", label: "Orders Processed", trend: "+34% MoM" },
            { value: "5,000+", label: "Active Dining Venues", trend: "+120 this week" },
            { value: "22%", label: "Average Ticket Boost", trend: "Verified SaaS ROI" },
            { value: "99.99%", label: "Platform Uptime SLA", trend: "PostgreSQL Isolation" }
          ].map((stat, idx) => (
            <div key={idx} className="text-center bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
              <p className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">{stat.value}</p>
              <p className="text-xs font-bold text-slate-600 mt-1">{stat.label}</p>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block mt-2">
                {stat.trend}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* --- BRAND MARQUEE BANNER --- */}
      <section className="py-12 border-y border-slate-200/80 bg-white text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
          Trusted by Leading Hospitality Groups & Fine Dining Venues
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 text-slate-500 font-serif">
          {['Royal Palace', 'The Spice Route', 'Urban Grill', 'Saffron Lounge', 'Tokyo Sushi Bar', 'Le Bistro'].map((brand, idx) => (
            <span key={idx} className="text-base md:text-lg font-bold tracking-wider text-slate-600">
              ✦ {brand}
            </span>
          ))}
        </div>
      </section>

      {/* --- BENTO GRID FEATURE ARCHITECTURE --- */}
      <section id="features" className="py-28 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full inline-block mb-4">
            Next-Gen Feature Architecture
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
            Built for High-Volume Restaurant Excellence
          </h2>
          <p className="text-slate-600 mt-4 text-base">
            Everything your venue needs—from table QR routing to instant kitchen alerts—engineered on enterprise cloud infrastructure.
          </p>
        </div>

        {/* Bento Box Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Large Span */}
          <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-8 shadow-lg shadow-slate-200/50 relative overflow-hidden flex flex-col justify-between group hover:border-primary/40 transition-all">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Dynamic Table QR Routing</h3>
              <p className="text-slate-600 text-sm max-w-xl leading-relaxed">
                Generate non-predictable UUID desk QR codes for each table. When scanned, customer checkouts automatically tag Table #04, Table #12, or outdoor patios without manual input.
              </p>
            </div>
            <div className="mt-8 bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📱</span>
                <div>
                  <p className="text-xs font-bold text-slate-900">Table QR #04 Scanned</p>
                  <p className="text-[10px] text-slate-500 font-mono">http://orderkare.com/menu/royal-palace?table=04</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Auto-Routed ✓
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-lg shadow-slate-200/50 flex flex-col justify-between group hover:border-primary/40 transition-all">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-6">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Live Order Queue</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                WebSocket connection pushes pending orders directly to kitchen monitors with instant audio chime alerts.
              </p>
            </div>
            <div className="mt-6 bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">Pending Queue: 5</span>
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-lg shadow-slate-200/50 flex flex-col justify-between group hover:border-primary/40 transition-all">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-6">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Menu Disabling</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Sold out of a dish? Mark it 'Unavailable' in 1 click—it disappears from all customer phone screens in real-time.
              </p>
            </div>
            <div className="mt-6 bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-slate-500">Status Sync</span>
              <span className="text-emerald-700 font-bold">100% Instant</span>
            </div>
          </div>

          {/* Card 4: Span 2 */}
          <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-8 shadow-lg shadow-slate-200/50 relative overflow-hidden flex flex-col justify-between group hover:border-primary/40 transition-all">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Tenant-Isolated Database Architecture</h3>
              <p className="text-slate-600 text-sm max-w-xl leading-relaxed">
                Enterprise PostgreSQL schema isolation guarantees your sales records, worker credentials, and menu datasets remain 100% isolated with zero cross-branch security risks.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {['ISO 27001 Certified', 'PostgreSQL Schema Isolation', 'Encrypted JWT Sessions', '256-Bit SSL Gateway'].map((badge, idx) => (
                <span key={idx} className="bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200">
                  ✓ {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- CULINARY POSTER GALLERY BANNER --- */}
      <section className="py-28 bg-white border-y border-slate-200/80 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full inline-block mb-4">
              Visual Gastronomy Showcase
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
              Turn Dish Photos Into High-Converting Digital Posters
            </h2>
            <p className="text-slate-600 mt-4 text-base">
              OrderKare's client menu displays your culinary creations with high-resolution imagery, allergen tags, and instant add-to-cart buttons.
            </p>
          </div>

          {/* Posters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {foodPosters.map((poster, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-50 rounded-3xl border border-slate-200/80 overflow-hidden shadow-md hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={poster.image}
                    alt={poster.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                  
                  <span className={`absolute top-4 left-4 border text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md shadow-xs ${poster.badgeColor}`}>
                    {poster.tag}
                  </span>

                  <div className="absolute top-4 right-4 bg-white/95 border border-slate-200 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {poster.rating}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {poster.category}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-primary transition-colors">
                      {poster.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200/80">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Digital Menu Price</span>
                      <span className="text-lg font-black text-slate-900 font-mono">{poster.price}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> {poster.ordersToday}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- ENTERPRISE ROI CALCULATOR --- */}
      <section id="roi" className="py-24 max-w-5xl mx-auto px-6">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-200/60 text-center relative overflow-hidden">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary border border-primary/20 text-xs px-4 py-1.5 rounded-full mb-6 font-bold">
            <Calculator className="w-4 h-4" />
            <span>Interactive SaaS Revenue Calculator</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Calculate Your Extra Monthly Revenue
          </h2>
          <p className="text-slate-600 text-sm mt-2 max-w-xl mx-auto">
            See how eliminating ordering wait times directly boosts your monthly restaurant profit.
          </p>

          <div className="my-10 max-w-lg mx-auto space-y-4">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-slate-700">Number of Restaurant Tables</span>
              <span className="text-primary font-mono text-xl">{tablesCount} Tables</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              value={tablesCount}
              onChange={(e) => setTablesCount(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>5 Tables</span>
              <span>25 Tables</span>
              <span>50 Tables</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 max-w-md mx-auto">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">
              Estimated Monthly Revenue Gain
            </span>
            <p className="text-4xl sm:text-5xl font-black text-emerald-600 font-mono">
              +₹{estimatedRevenueIncrease.toLocaleString()} <span className="text-sm font-normal text-slate-500">/mo</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-2">Based on average +22% basket size boost from visual digital QR menus.</p>
          </div>
        </div>
      </section>

      {/* --- INTERACTIVE DEMO SHOWCASE --- */}
      <section id="demo" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Experience Both Sides of OrderKare</h2>
          <p className="text-slate-600 mt-4 text-sm">Toggle below to inspect the customer QR menu vs. the restaurant live operations panel.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex justify-center space-x-4 mb-10">
          <button
            onClick={() => setActiveTab('customer')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'customer'
                ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-105'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Customer Mobile View</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'admin'
                ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-105'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Kitchen Live Panel</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/60 relative overflow-hidden min-h-[480px] flex items-center justify-center">
          {activeTab === 'customer' ? (
            <div className="flex flex-col md:flex-row items-center gap-12 w-full max-w-5xl">
              <div className="flex-1 space-y-6 text-left">
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1.5 rounded-full font-bold inline-block">
                  ⚡ Mobile QR Experience
                </span>
                <h3 className="text-3xl font-extrabold text-slate-900">Instant QR Scanning — Zero App Downloads</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Customers scan table QR codes and open the digital menu immediately in Safari or Chrome. They pick dishes, customize options, and hit order in seconds.
                </p>
                <ul className="space-y-3 text-slate-700 text-sm">
                  {['Zomato/Swiggy style layout with right-aligned Add buttons', 'Veg/Non-Veg filter switches & real-time search', 'Zustand persistent local cart engine', 'Live order tracking screen with kitchen progress stepper'].map((li, idx) => (
                    <li key={idx} className="flex items-center space-x-3">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                      <span>{li}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-full md:w-[320px] bg-slate-900 border-4 border-slate-800 rounded-[3rem] p-3 shadow-2xl relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20" />
                <div className="bg-slate-50 rounded-[2.5rem] overflow-hidden aspect-[9/19] p-4 text-slate-900 relative text-left">
                  <div className="bg-primary text-white p-4 rounded-3xl mb-4 pt-8 shadow-md">
                    <p className="text-xs opacity-80">Royal Palace</p>
                    <h4 className="font-bold text-lg leading-tight">Digital Menu</h4>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { name: 'Paneer Tikka', price: '₹220', veg: true },
                      { name: 'Butter Chicken', price: '₹340', veg: false }
                    ].map((item, i) => (
                      <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-3 flex justify-between items-center shadow-2xs">
                        <div>
                          <div className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${item.veg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className="font-bold text-xs">{item.name}</span>
                          </div>
                          <span className="text-xs font-extrabold text-slate-900 block mt-0.5">{item.price}</span>
                        </div>
                        <button className="bg-primary text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl">ADD +</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-12 w-full max-w-5xl">
              <div className="flex-1 space-y-6 text-left">
                <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-3.5 py-1.5 rounded-full font-bold inline-block">
                  🔥 Operations Console
                </span>
                <h3 className="text-3xl font-extrabold text-slate-900">Live Kitchen Operations Dashboard</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Incoming table orders pop up instantly in the Pending queue with audio chimes. Managers accept, mark ready, or update table statuses seamlessly.
                </p>
                <ul className="space-y-3 text-slate-700 text-sm">
                  {['Framer Motion Kanban order columns', 'Real-time WebSocket client sync', 'Category & Food management UI', 'Table status assignment floor plan'].map((li, idx) => (
                    <li key={idx} className="flex items-center space-x-3">
                      <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" />
                      <span>{li}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-full md:w-[460px] bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl text-left">
                <div className="flex justify-between items-center mb-4">
                  <h5 className="font-bold text-xs text-white">Kitchen Monitor Panel</h5>
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                </div>
                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  {[
                    { val: "42", lbl: "Orders Today" },
                    { val: "₹12,450", lbl: "Sales Today" },
                    { val: "5", lbl: "Pending" }
                  ].map((stat, i) => (
                    <div key={i} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <p className="font-bold text-white text-sm font-mono">{stat.val}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{stat.lbl}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* --- CUSTOMER TESTIMONIALS --- */}
      <section className="py-24 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full inline-block mb-4">
              Verified Executive Reviews
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900">Loved by Restaurateurs Worldwide</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((item, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                <div>
                  <div className="flex text-amber-400 mb-4">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-slate-700 text-sm italic leading-relaxed mb-6">"{item.quote}"</p>
                </div>
                <div className="flex items-center space-x-3.5 pt-4 border-t border-slate-200/80">
                  <img src={item.avatar} alt={item.author} className="w-11 h-11 rounded-full object-cover border border-slate-200" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{item.author}</h4>
                    <p className="text-[11px] text-slate-500">{item.role} • {item.restaurant}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PRICING TIERS --- */}
      <section id="pricing" className="py-28 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">Flexible SaaS Subscription Plans</h2>
          <p className="text-slate-600 mt-4 text-base">Select a billing structure designed to scale alongside your hospitality business.</p>

          <div className="inline-flex items-center bg-white border border-slate-200 p-1 rounded-2xl mt-8 shadow-xs">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                billingCycle === 'monthly' ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                billingCycle === 'yearly' ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yearly Billing (Save 20%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              name: 'Basic Plan',
              price: billingCycle === 'monthly' ? '₹999' : '₹799',
              desc: 'Perfect for small cafes and standalone food counters.',
              features: ['Single Digital Menu Slug', 'Table QR Generation UI', 'Standard Kitchen Dashboard', '20 Active Menu items', 'Standard Email Support']
            },
            {
              name: 'Professional Plan',
              price: billingCycle === 'monthly' ? '₹1,999' : '₹1,599',
              desc: 'For busy sit-down restaurants requiring live order queues.',
              features: ['Unlimited Menu Categories', 'Unlimited Food Items', 'Real-Time WebSocket Alerts', 'Staff Credential Management', 'Detailed Sales Analytics', 'Priority Support Desk'],
              popular: true
            },
            {
              name: 'Enterprise Plan',
              price: 'Custom',
              desc: 'Tailored for restaurant chains and hotel franchises.',
              features: ['Multi-Branch Control Console', 'Super Admin Platform Reporting', 'Custom API Gateway Access', 'Dedicated Account Managers', 'Custom Payment Routings', '99.9% Uptime SLA Guarantee']
            }
          ].map((plan, idx) => (
            <div
              key={idx}
              className={`bg-white border rounded-3xl p-8 relative flex flex-col justify-between transition-all ${
                plan.popular ? 'border-primary shadow-xl shadow-primary/10 ring-1 ring-primary' : 'border-slate-200/80 shadow-sm'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black tracking-wider uppercase px-4.5 py-1 rounded-full shadow-md">
                  Most Popular Choice
                </span>
              )}
              <div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h4>
                <p className="text-slate-500 text-xs mb-6 leading-relaxed">{plan.desc}</p>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-black text-slate-900 font-mono">{plan.price}</span>
                  {plan.price !== 'Custom' && (
                    <span className="text-slate-500 text-xs font-semibold ml-2">/ month</span>
                  )}
                </div>
                <ul className="space-y-3.5 mb-8 text-sm text-slate-600">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-center space-x-2.5">
                      <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                to="/register"
                className={`w-full py-3.5 rounded-2xl font-bold text-center text-xs transition-all ${
                  plan.popular
                    ? 'bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Get Started with {plan.name.split(' ')[0]}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
          <p className="text-slate-600 mt-3 text-sm">Got questions? We've got answers. Explore how OrderKare updates your operation.</p>
        </div>

        <div className="space-y-4">
          {faqData.map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden transition-all shadow-xs">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
              >
                <span className="font-bold text-slate-900 text-base">{item.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${openFaq === idx ? 'rotate-180 text-primary' : ''}`} />
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  openFaq === idx ? 'max-h-48 border-t border-slate-100' : 'max-h-0'
                }`}
              >
                <p className="p-6 text-sm text-slate-600 leading-relaxed bg-slate-50/50">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="bg-white py-24 border-t border-slate-200/80 relative overflow-hidden text-center">
        <div className="max-w-4xl mx-auto px-6 relative z-10 space-y-6">
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">Ready to Upgrade Your Dining Operations?</h2>
          <p className="text-slate-600 text-sm max-w-xl mx-auto leading-relaxed">
            Onboard your venue in under 10 minutes, print custom desk QR codes, and start receiving live kitchen orders today.
          </p>
          <div className="pt-4">
            <Link
              to="/register"
              className="inline-flex items-center space-x-3 bg-primary text-white px-9 py-4.5 rounded-2xl font-black text-base hover:bg-primary/95 transition-all shadow-xl shadow-primary/30 hover:scale-105"
            >
              <span>Start Your 14-Day Free Trial</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* --- STUNNING LIGHT MODE CORPORATE FOOTER --- */}
      <footer id="footer" className="bg-white text-slate-600 pt-20 pb-12 relative z-10 overflow-hidden font-sans border-t border-slate-200/80 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          {/* Top Newsletter Card (Light Theme Crisp White) */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="text-center lg:text-left space-y-2 relative z-10 max-w-xl">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 rounded-full inline-block">
                Stay Ahead of FoodTech Innovation
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Join 5,000+ Restaurants Scaling With OrderKare
              </h3>
              <p className="text-xs text-slate-300">
                Get monthly hospitality trends, feature updates, and digital menu growth strategies delivered to your inbox.
              </p>
            </div>

            <form onSubmit={handleNewsletterSubmit} className="w-full lg:w-auto relative z-10">
              {subscribed ? (
                <div className="bg-emerald-950/90 text-emerald-400 border border-emerald-700/60 px-6 py-3.5 rounded-2xl text-xs font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Subscribed! Thank you for joining OrderKare.</span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-96">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your executive email..."
                    className="flex-1 px-4 py-3.5 bg-slate-950 border border-slate-800 text-white rounded-2xl text-xs outline-none focus:border-primary transition-all placeholder-slate-400 font-medium"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-primary text-white text-xs font-extrabold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 flex items-center justify-center space-x-2 shrink-0"
                  >
                    <span>Subscribe</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Main 5-Column Navigation Grid (Clean Light Style) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-200/80">
            {/* Column 1 & 2: Brand, Slogan & Compliance */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center space-x-3">
                <img src="/logo.jpg" alt="OrderKare Logo" className="h-12 w-auto object-contain bg-white rounded-2xl border border-slate-200 p-1 shadow-md" />
                <div>
                  <span className="text-xl font-black text-slate-900 tracking-tight">OrderKare</span>
                  <span className="block text-[9px] text-primary font-mono tracking-widest uppercase font-bold">SCAN • ORDER • ENJOY</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
                OrderKare Technologies is an enterprise Multi-Tenant SaaS platform powering contactless digital menu rendering, desk QR code routing, and real-time kitchen processing automation for modern gastronomy.
              </p>

              <div className="flex items-center space-x-3 pt-1">
                <span className="text-xs text-slate-500 font-bold">Security Compliance:</span>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> ISO 27001 Certified
                </span>
              </div>
            </div>

            {/* Column 3: Platform & Product */}
            <div className="space-y-4">
              <h4 className="text-slate-900 text-xs font-black tracking-wider uppercase">Platform Features</h4>
              <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                <li><a href="#features" className="hover:text-primary transition-colors">Desk QR Routing Engine</a></li>
                <li><a href="#features" className="hover:text-primary transition-colors">Real-Time Kitchen POS</a></li>
                <li><a href="#demo" className="hover:text-primary transition-colors">Visual Food Menu Builder</a></li>
                <li><a href="#features" className="hover:text-primary transition-colors">Multi-Tenant PostgreSQL</a></li>
                <li><a href="#roi" className="hover:text-primary transition-colors">Interactive ROI Calculator</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">SaaS Plan Tiers</a></li>
              </ul>
            </div>

            {/* Column 4: Solutions by Venue */}
            <div className="space-y-4">
              <h4 className="text-slate-900 text-xs font-black tracking-wider uppercase">Solutions by Venue</h4>
              <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                <li><a href="#" className="hover:text-primary transition-colors">Fine Dining Restaurants</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Quick Service Cafes (QSR)</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Food Courts & Malls</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Hotel Room Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Bars & Cocktail Lounges</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Multi-Branch Franchise Chains</a></li>
              </ul>
            </div>

            {/* Column 5: Company & Support */}
            <div className="space-y-4">
              <h4 className="text-slate-900 text-xs font-black tracking-wider uppercase">Company & Support</h4>
              <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
                <li><a href="#" className="hover:text-primary transition-colors">About OrderKare</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Customer Stories</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Developer API Docs</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors text-emerald-700 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" /> System Status: Operational
                </a></li>
                <li><Link to="/login" className="hover:text-primary transition-colors">Hotel Admin Login</Link></li>
                <li><Link to="/login" className="hover:text-primary transition-colors">Super Admin Portal</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar & Corporate Contact */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500 pt-2">
            <div className="flex flex-wrap items-center gap-6">
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-primary" /> Sector 62, Noida, India
              </span>
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Mail className="w-3.5 h-3.5 text-primary" /> corporate@orderkare.com
              </span>
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Phone className="w-3.5 h-3.5 text-primary" /> +91 120 4567 890
              </span>
            </div>

            <div className="flex items-center space-x-5 text-[11px] text-slate-500 font-medium">
              <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
              <span>•</span>
              <a href="#" className="hover:text-slate-900 transition-colors">Security Architecture</a>
              <span>•</span>
              <span className="text-slate-900 font-bold">© 2026 OrderKare Technologies Pvt. Ltd.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
