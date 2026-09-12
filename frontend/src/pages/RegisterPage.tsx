import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Phone,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  X,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!termsAgreed) {
      setError('Please accept the terms of service to create your account.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 font-sans selection:bg-rose-500/15 selection:text-rose-600 antialiased flex flex-col justify-between relative overflow-hidden">
      
      {/* Background Subtle Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-rose-100/50 via-amber-50/40 to-transparent rounded-full blur-3xl opacity-70" />
      </div>

      {/* Top Header / Nav */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2.5 group">
          <img
            src="/logo.jpg"
            alt="OrderKare"
            className="h-9 w-9 object-cover rounded-xl border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col text-left">
            <span className="text-lg font-extrabold tracking-tight text-slate-950 leading-none">
              Order<span className="text-rose-600">Kare</span>
            </span>
            <span className="text-[8px] font-semibold tracking-wider text-slate-400 uppercase mt-0.5">
              Restaurant OS
            </span>
          </div>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to website</span>
        </Link>
      </header>

      {/* Main Form Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[560px] bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/60 p-8 sm:p-10 text-left"
        >
          {/* Header */}
          <div className="space-y-2 mb-8 text-center sm:text-left">
            <div className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>14-Day Full Access Free Trial</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              Register your restaurant
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Start generating instant table QR codes and accepting digital orders in 10 minutes.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-medium mb-6 flex items-start space-x-2.5"
            >
              <div className="w-4 h-4 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                !
              </div>
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Owner Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Owner / Manager Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Vikram Oberoi"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-rose-600 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Business Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="owner@restaurant.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-rose-600 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Restaurant Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Restaurant / Cafe Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="restaurantName"
                  required
                  value={form.restaurantName}
                  onChange={handleChange}
                  placeholder="Royal Palace Fine Dining"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-rose-600 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contact Phone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-rose-600 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password (Min 8 Chars)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
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
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-rose-600 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Restaurant Address & City
              </label>
              <div className="relative">
                <div className="absolute top-3.5 left-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <textarea
                  name="address"
                  required
                  rows={2}
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Plot 14, Sector 18, Commercial Hub, City"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-rose-600 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all placeholder:text-slate-400 resize-none"
                />
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="pt-1">
              <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={e => setTermsAgreed(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer shrink-0"
                />
                <span className="text-xs text-slate-600 leading-relaxed">
                  I agree to the OrderKare{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setLegalModal('terms');
                    }}
                    className="text-rose-600 hover:underline font-bold"
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
                    className="text-rose-600 hover:underline font-bold"
                  >
                    Privacy Policy
                  </button>
                  , and 14-day free trial conditions.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3.5 px-6 rounded-xl font-bold text-sm transition-all shadow-md shadow-rose-600/20 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Creating your account...' : 'Create Account & Start Trial'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an OrderKare account?{' '}
              <Link
                to="/login"
                className="font-bold text-rose-600 hover:text-rose-700 hover:underline"
              >
                Sign in to dashboard
              </Link>
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-slate-400 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>ISO 27001 Certified • Bank-Grade SSL Encryption</span>
        </div>
        <p>© 2026 OrderKare Technologies Pvt. Ltd. All rights reserved.</p>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="hover:text-slate-600 transition-colors">Sign In</Link>
          <span>•</span>
          <button onClick={() => setLegalModal('security')} className="hover:text-slate-600 transition-colors">
            Security Architecture
          </button>
        </div>
      </footer>

      {/* Legal Modals */}
      <AnimatePresence>
        {legalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 relative text-left max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setLegalModal(null)}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>

              {legalModal === 'privacy' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-xs font-bold text-rose-600 uppercase tracking-wider">
                    <Shield className="w-4 h-4" />
                    <span>OrderKare Privacy Policy</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-950">Data Sovereignty</h3>
                  <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                    <p>
                      OrderKare Technologies Pvt. Ltd. secures all restaurant partner and dining customer data with TLS 1.3 in-transit and AES-256 at-rest encryption.
                    </p>
                    <p>
                      We never sell merchant order histories or guest contacts to advertising networks. Each restaurant has dedicated schema segregation.
                    </p>
                  </div>
                </div>
              )}

              {legalModal === 'terms' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-xs font-bold text-rose-600 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Operational SLA</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-950">Terms of Service</h3>
                  <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
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
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Enterprise Security</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-950">Security Architecture</h3>
                  <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                    <p>
                      Our infrastructure complies with modern ISO 27001 data governance and PCI-DSS compliance frameworks.
                    </p>
                    <p>
                      All database queries use parameterized SQL execution to protect against SQL injections, and auth tokens are secured using industry-standard JWT protocols.
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

