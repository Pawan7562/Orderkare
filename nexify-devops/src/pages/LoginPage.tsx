import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, Terminal, ArrowRight, Key, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [developerEmail, setDeveloperEmail] = useState('dev@nexifyforge.com');
  const [accessKey, setAccessKey] = useState('nexify_master_devops_2026');
  const [securityPin, setSecurityPin] = useState('7562');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    setTimeout(() => {
      if (accessKey.trim() && securityPin === '7562') {
        localStorage.setItem('nexify_dev_token', 'nexify_dev_authenticated_session');
        navigate('/');
      } else {
        setError('Invalid Developer Access Key or 2FA Security PIN. Check internal team vault.');
        setIsSubmitting(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/25 mx-auto">
            ⚡
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">NEXIFY DEVOPS</h1>
          <p className="text-xs text-slate-500 font-medium">
            Internal Fleet Control Plane • Nexify Forge Technologies
          </p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="enterprise-card rounded-3xl p-6 sm:p-8 shadow-xl space-y-5"
        >
          <div className="flex items-center gap-2 text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 p-2.5 rounded-xl font-semibold">
            <Terminal className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Developer Restricted Session Access</span>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Developer Identity</label>
              <input
                type="email"
                value={developerEmail}
                onChange={(e) => setDeveloperEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Scoped Access Key</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  required
                  placeholder="nexify_key_..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Internal 2FA PIN</label>
              <input
                type="password"
                maxLength={6}
                value={securityPin}
                onChange={(e) => setSecurityPin(e.target.value)}
                required
                placeholder="PIN: 7562"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:border-emerald-500 focus:bg-white tracking-widest text-center text-sm font-bold transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 theme-btn-primary rounded-xl text-xs flex items-center justify-center gap-2 mt-2 disabled:opacity-50 shadow-md"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Authenticate to Control Plane'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-mono pt-3 border-t border-slate-100">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit TLS Hardware Encrypted Session</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
