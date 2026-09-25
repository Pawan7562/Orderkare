import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  X,
  HelpCircle,
  Shield,
  KeyRound,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [supportEmail, setSupportEmail] = useState('support@orderkare.com');
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'security' | null>(null);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch public platform settings
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

  // Step 1: Request Password Reset Code
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

  // Step 2: Submit Reset Code and Set New Password
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

      {/* Main Login Card Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[440px] bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/60 p-8 sm:p-10 text-left"
        >
          {/* Card Header */}
          <div className="space-y-2 mb-8 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              Sign in to OrderKare
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Enter your credentials to access your restaurant operations dashboard.
            </p>
          </div>

          {/* Success Banner */}
          {successBanner && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-medium mb-6 flex items-start space-x-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successBanner}</span>
            </motion.div>
          )}

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-medium mb-6 flex items-start space-x-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="manager@restaurant.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-rose-600 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleOpenForgotModal}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-rose-600 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-600">Remember me for 30 days</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3.5 px-6 rounded-xl font-bold text-sm transition-all shadow-md shadow-rose-600/20 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center space-x-2 cursor-pointer"
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

          {/* Registration Redirect */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-bold text-rose-600 hover:text-rose-700 hover:underline"
              >
                Register your restaurant
              </Link>
            </p>
          </div>
        </motion.div>
      </main>

      {/* Clean Bottom Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-slate-400 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>All Systems Operational</span>
        </div>
        <p>© 2026 OrderKare Technologies Pvt. Ltd. All rights reserved.</p>
        <div className="flex items-center space-x-4">
          <button onClick={() => setLegalModal('privacy')} className="hover:text-slate-600 transition-colors cursor-pointer">
            Privacy
          </button>
          <span>•</span>
          <button onClick={() => setLegalModal('terms')} className="hover:text-slate-600 transition-colors cursor-pointer">
            Terms
          </button>
          <span>•</span>
          <button onClick={() => setLegalModal('security')} className="hover:text-slate-600 transition-colors cursor-pointer">
            Security
          </button>
        </div>
      </footer>

      {/* Interactive Forgot Password Modal */}
      <AnimatePresence>
        {forgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 relative text-left"
            >
              <button
                onClick={() => setForgotModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-orange-500 text-white flex items-center justify-center mb-4 shadow-md shadow-rose-500/20">
                <KeyRound className="w-5 h-5" />
              </div>

              <h3 className="text-xl font-extrabold text-slate-950 mb-1">
                {forgotStep === 'REQUEST' ? 'Reset Hotel Admin Password' : 'Enter Verification Code'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                {forgotStep === 'REQUEST'
                  ? 'Enter your registered hotel administrator email to receive a secure 6-digit recovery code.'
                  : `Enter the 6-digit code sent to ${forgotEmail} and choose a new master password.`}
              </p>

              {/* Error Message inside modal */}
              {forgotError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs font-medium mb-4 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{forgotError}</span>
                </div>
              )}

              {/* Success Message inside modal */}
              {forgotSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-xl text-xs font-medium mb-4 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {forgotStep === 'REQUEST' ? (
                /* Step 1: Request Code */
                <form onSubmit={handleRequestResetCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
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
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-rose-600 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(false)}
                      className="px-4 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {forgotLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>{forgotLoading ? 'Sending Code...' : 'Send Recovery Code'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Enter Code & Set New Password */
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        6-Digit Security Code
                      </label>
                      <button
                        type="button"
                        onClick={handleRequestResetCode}
                        disabled={forgotLoading}
                        className="text-[11px] font-semibold text-rose-600 hover:underline"
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
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-base font-mono font-bold tracking-widest text-slate-900 focus:bg-white focus:border-rose-600 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
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
                        className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-rose-600 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-rose-600 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setForgotStep('REQUEST')}
                      className="px-4 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {forgotLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      <span>{forgotLoading ? 'Resetting...' : 'Reset Password & Save'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Support Contact Footer inside modal */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Need urgent assistance?</span>
                <a href={`mailto:${supportEmail}`} className="font-semibold text-rose-600 hover:underline">
                  {supportEmail}
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
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
                  className="bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
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
