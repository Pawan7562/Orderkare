import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import {
  User, Mail, Lock, Eye, EyeOff, Building2, Phone, MapPin,
  ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, X, Shield, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '../components/ThemeToggle';

export const RegisterPage: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    restaurantName: '',
    phone: '',
    address: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'security' | null>(null);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass) && /[a-zA-Z]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const passwordStrength = getPasswordStrength(form.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = form.email.trim().toLowerCase();
    const cleanName = form.name.trim();
    const cleanRestaurant = form.restaurantName.trim();
    const cleanPhone = form.phone.trim();
    const cleanAddress = form.address.trim();

    if (!cleanName || !cleanEmail || !cleanRestaurant) {
      setError('Please provide your name, business email, and restaurant name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    const disposableDomains = [
      'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
      'temp-mail.org', 'throwawaymail.com', 'yopmail.com', 'trashmail.com',
      'sharklasers.com', 'dispostable.com', 'getnada.com', 'mohmal.com', 'test.com', 'fake.com'
    ];
    const emailDomain = cleanEmail.split('@')[1] || '';
    if (disposableDomains.includes(emailDomain) || cleanEmail.startsWith('test@') || cleanEmail.startsWith('fake@')) {
      setError('Please use a real, official email address. Temporary or disposable emails are not accepted.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!termsAgreed) {
      setError('Please accept the terms of service to create your account.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: cleanName,
        email: cleanEmail,
        password: form.password,
        restaurantName: cleanRestaurant,
        phone: cleanPhone,
        address: cleanAddress
      });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (msg && msg.toLowerCase().includes('already registered')) {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Server response timed out. Please verify your connection and try again.');
      } else {
        setError(msg || 'Registration failed. Please check your information and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfe] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-orange-500 selection:text-white antialiased flex flex-col justify-between relative overflow-hidden transition-colors duration-300">
      
      {/* ─── Ambient Glow Highlights (Matching Landing Page) ─── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-200/40 dark:bg-orange-950/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-rose-200/30 dark:bg-rose-950/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-amber-200/30 dark:bg-amber-950/15 rounded-full blur-3xl" />
      </div>

      {/* ─── Consistent Navigation Header ─── */}
      <header className="relative z-10 w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo.jpg"
            alt="OrderKare"
            className="h-8 w-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shadow-2xs group-hover:scale-105 transition-transform"
          />
          <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
            Order<span className="text-orange-600">Kare</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to website</span>
          </Link>

          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 px-3.5 py-1.5 rounded-full border border-orange-200 dark:border-orange-800/70 bg-orange-50/60 dark:bg-orange-950/40 hover:bg-orange-100/60 dark:hover:bg-orange-900/50 transition-all"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* ─── Main Register Container ─── */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-[580px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 p-7 sm:p-10 text-left transition-colors duration-300"
        >
          {/* Header Title Section */}
          <div className="space-y-2 mb-7 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200/70 dark:border-orange-800/70 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>15-Day Free Access • Instant QR Standee Setup</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Register your restaurant
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Generate your official table QR codes and begin accepting live digital orders in 10 minutes.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 px-3.5 py-2.5 rounded-xl text-xs font-medium mb-5 flex items-start gap-2.5"
            >
              <div className="w-4 h-4 rounded-full bg-rose-200 dark:bg-rose-800 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                !
              </div>
              <div className="flex-1">
                <span>{error}</span>
                {error.includes('already registered') && (
                  <Link to="/login" className="block mt-1 font-bold text-orange-600 dark:text-orange-400 underline hover:text-orange-700">
                    Click here to sign in with this email →
                  </Link>
                )}
              </div>
            </motion.div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Owner Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Owner / Manager Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Vikram Oberoi"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Business Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Business Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="owner@restaurant.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Restaurant Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Restaurant / Cafe Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="restaurantName"
                  required
                  value={form.restaurantName}
                  onChange={handleChange}
                  placeholder="Royal Palace Dining"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Contact Phone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Password (Min 8 Chars)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password Strength Indicator */}
                {form.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <div className={`h-1 flex-1 rounded-full transition-all ${
                        passwordStrength >= 1 ? (passwordStrength <= 2 ? 'bg-amber-400' : 'bg-emerald-500') : 'bg-rose-500'
                      }`} />
                      <div className={`h-1 flex-1 rounded-full transition-all ${
                        passwordStrength >= 2 ? (passwordStrength <= 2 ? 'bg-amber-400' : 'bg-emerald-500') : 'bg-slate-200 dark:bg-slate-800'
                      }`} />
                      <div className={`h-1 flex-1 rounded-full transition-all ${
                        passwordStrength >= 3 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                      }`} />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      <span>Password strength:</span>
                      <span className={
                        passwordStrength >= 3 ? 'text-emerald-600 dark:text-emerald-400' : passwordStrength >= 2 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-500'
                      }>
                        {passwordStrength >= 3 ? 'Strong' : passwordStrength >= 2 ? 'Moderate' : 'Too weak'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Restaurant Address & City
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <textarea
                  name="address"
                  required
                  rows={2}
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Plot 14, Sector 18, Commercial Hub, City"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={e => setTermsAgreed(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 dark:border-slate-700 text-orange-600 focus:ring-orange-500/20 accent-orange-600 cursor-pointer shrink-0 bg-slate-50 dark:bg-slate-950"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  I agree to the OrderKare{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setLegalModal('terms');
                    }}
                    className="text-orange-600 dark:text-orange-400 hover:underline font-semibold"
                  >
                    Terms of Service
                  </button>
                  ,{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setLegalModal('privacy');
                    }}
                    className="text-orange-600 dark:text-orange-400 hover:underline font-semibold"
                  >
                    Privacy Policy
                  </button>
                  , and 15-day free access terms.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold text-sm py-3.5 px-6 rounded-xl shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Setting up your restaurant...</span>
                  </>
                ) : (
                  <>
                    <span>Create Restaurant Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-7 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Already have an OrderKare account?{' '}
              <Link
                to="/login"
                className="font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:underline"
              >
                Sign in to dashboard
              </Link>
            </p>
          </div>
        </motion.div>
      </main>

      {/* ─── Minimal Consistent Footer ─── */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 text-center text-xs text-slate-400 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors duration-300">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>ISO 27001 Certified • Bank-Grade SSL Encryption</span>
        </div>
        <p className="text-slate-500 dark:text-slate-400">© 2026 OrderKare Technologies. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">Sign In</Link>
          <span>•</span>
          <button onClick={() => setLegalModal('security')} className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer">
            Security Architecture
          </button>
        </div>
      </footer>

      {/* ─── Legal Modals ─── */}
      <AnimatePresence>
        {legalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 sm:p-8 relative text-left max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setLegalModal(null)}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {legalModal === 'privacy' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                    <Shield className="w-4 h-4" />
                    <span>OrderKare Privacy Policy</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Data Sovereignty</h3>
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-3 leading-relaxed">
                    <p>
                      OrderKare Technologies secures all restaurant partner and dining customer data with TLS 1.3 in-transit and AES-256 at-rest encryption.
                    </p>
                    <p>
                      We never sell merchant order histories or guest contacts to advertising networks. Each restaurant has dedicated schema segregation.
                    </p>
                  </div>
                </div>
              )}

              {legalModal === 'terms' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Operational SLA</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Terms of Service</h3>
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-3 leading-relaxed">
                    <p>
                      OrderKare provides modern dining room automation software with guaranteed 99.9% uptime and zero per-order commission fees.
                    </p>
                    <p>
                      Subscribers can generate unlimited QR table stands, manage digital menus in real-time, and run multi-device kitchen displays.
                    </p>
                  </div>
                </div>
              )}

              {legalModal === 'security' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Enterprise Security</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Security Architecture</h3>
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-3 leading-relaxed">
                    <p>
                      Our infrastructure complies with modern ISO 27001 data governance and PCI-DSS compliance frameworks.
                    </p>
                    <p>
                      All database queries use parameterized SQL execution to protect against SQL injections, and auth tokens are secured using industry-standard JWT protocols.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setLegalModal(null)}
                  className="bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
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