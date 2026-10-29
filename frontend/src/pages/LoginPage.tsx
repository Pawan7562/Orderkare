import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, ShieldCheck,
  CheckCircle2, X, Shield, KeyRound, RefreshCw,
  Sparkles, AlertCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '../components/ThemeToggle';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password Flow State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'REQUEST' | 'RESET'>('REQUEST');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Support & Legal
  const [supportEmail, setSupportEmail] = useState('orderkareindia@gmail.com');
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'security' | null>(null);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/settings/public')
      .then(res => {
        if (res.data?.settings?.supportEmail) {
          setSupportEmail(res.data.settings.supportEmail);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessBanner('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: cleanEmail, password });
      login(res.data.user, res.data.token);
      if (res.data.user.role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Server response timed out. Please check your internet connection and try again.');
      } else {
        setError(msg || 'Invalid email or password. Please verify your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForgotModal = () => {
    setForgotEmail(email || '');
    setForgotStep('REQUEST');
    setForgotError('');
    setForgotSuccess('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotModalOpen(true);
  };

  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError('Please enter your registered email address.');
      return;
    }
    setForgotError('');
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotSuccess(res.data?.message || 'Verification code sent to your email.');
      if (res.data?.resetCode) {
        setResetCode(res.data.resetCode);
      }
      setForgotStep('RESET');
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'No account found with this email.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || !newPassword) {
      setForgotError('Verification code and new password are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match. Please verify.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters.');
      return;
    }

    setForgotError('');
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: forgotEmail,
        code: resetCode,
        newPassword
      });

      setEmail(forgotEmail);
      setPassword(newPassword);
      setForgotModalOpen(false);
      setSuccessBanner(res.data?.message || 'Password reset successfully! Please sign in.');
    } catch (err: any) {
      setForgotError(err.response?.data?.message || 'Invalid verification code or expired session.');
    } finally {
      setForgotLoading(false);
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
            to="/register"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 px-3.5 py-1.5 rounded-full border border-orange-200 dark:border-orange-800/70 bg-orange-50/60 dark:bg-orange-950/40 hover:bg-orange-100/60 dark:hover:bg-orange-900/50 transition-all"
          >
            <span>Register</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* ─── Main Login Card ─── */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-[440px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 p-8 sm:p-10 text-left transition-colors duration-300"
        >
          {/* Header Title Section */}
          <div className="space-y-2 mb-7 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200/70 dark:border-orange-800/70 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Restaurant Admin Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Sign in to OrderKare
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Enter your credentials to manage live orders, menu, and dining operations.
            </p>
          </div>

          {/* Success Banner */}
          {successBanner && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 px-3.5 py-2.5 rounded-xl text-xs font-medium mb-5 flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>{successBanner}</span>
            </motion.div>
          )}

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 px-3.5 py-2.5 rounded-xl text-xs font-medium mb-5 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="manager@restaurant.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleOpenForgotModal}
                  className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-orange-600 focus:ring-orange-500/20 accent-orange-600 cursor-pointer bg-slate-50 dark:bg-slate-950"
                />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Remember me for 30 days</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-bold text-sm py-3.5 px-6 rounded-xl shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in securely...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Register Link */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:underline"
              >
                Register your restaurant
              </Link>
            </p>
          </div>
        </motion.div>
      </main>

      {/* ─── Minimal Consistent Footer ─── */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 text-center text-xs text-slate-400 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors duration-300">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>All Systems Operational</span>
        </div>
        <p className="text-slate-500 dark:text-slate-400">© 2026 OrderKare Technologies. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <button onClick={() => setLegalModal('privacy')} className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer">
            Privacy
          </button>
          <span>•</span>
          <button onClick={() => setLegalModal('terms')} className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer">
            Terms
          </button>
          <span>•</span>
          <button onClick={() => setLegalModal('security')} className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer">
            Security
          </button>
        </div>
      </footer>

      {/* ─── Forgot Password Modal ─── */}
      <AnimatePresence>
        {forgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 sm:p-8 relative text-left"
            >
              <button
                onClick={() => setForgotModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-rose-500 text-white flex items-center justify-center mb-4 shadow-md shadow-orange-500/20">
                <KeyRound className="w-5 h-5" />
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">
                {forgotStep === 'REQUEST' ? 'Reset Hotel Admin Password' : 'Enter Verification Code'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                {forgotStep === 'REQUEST'
                  ? 'Enter your registered hotel administrator email to receive a secure 6-digit recovery code.'
                  : `Enter the 6-digit code sent to ${forgotEmail} and choose a new master password.`}
              </p>

              {forgotError && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 px-3.5 py-2.5 rounded-xl text-xs font-medium mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotSuccess && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 px-3.5 py-2.5 rounded-xl text-xs font-medium mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {forgotStep === 'REQUEST' ? (
                <form onSubmit={handleRequestResetCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        placeholder="admin@hotel.com"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(false)}
                      className="px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {forgotLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>{forgotLoading ? 'Sending Code...' : 'Send Recovery Code'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        6-Digit Security Code
                      </label>
                      <button
                        type="button"
                        onClick={handleRequestResetCode}
                        disabled={forgotLoading}
                        className="text-[11px] font-semibold text-orange-600 hover:underline"
                      >
                        Resend Code
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={resetCode}
                      onChange={e => setResetCode(e.target.value)}
                      placeholder="e.g. 583920"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-base font-mono font-bold tracking-widest text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setForgotStep('REQUEST')}
                      className="px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {forgotLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      <span>{forgotLoading ? 'Resetting...' : 'Save Password'}</span>
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Need assistance?</span>
                <a href={`mailto:${supportEmail}`} className="font-semibold text-orange-600 dark:text-orange-400 hover:underline">
                  {supportEmail}
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
