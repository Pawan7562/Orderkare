import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import {
  Globe,
  Key,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertTriangle,
  Database,
  Activity,
  Download,
  Trash2,
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  DollarSign,
  RefreshCw,
  Sliders,
  Power,
  Building2,
  Users,
  ShoppingBag,
  UtensilsCrossed,
  Tag,
  Sparkles,
  Clock,
  HardDrive,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'platform' | 'payments' | 'security' | 'policies' | 'health';

interface HealthData {
  status: string;
  dbConnected: boolean;
  latencyMs: number;
  uptimeSeconds: number;
  nodeVersion: string;
  memoryUsageMb: number;
  totalMemoryMb: number;
  counts: {
    restaurants: number;
    users: number;
    orders: number;
    foodItems: number;
    advertisements: number;
    pricingPlans: number;
  };
}

export const SuperAdminSettings = () => {
  const { user, login } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('platform');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Platform & Branding Settings
  const [platformName, setPlatformName] = useState('OrderKare Technologies');
  const [supportEmail, setSupportEmail] = useState('support@orderkare.com');
  const [supportPhone, setSupportPhone] = useState('+91 98765 43210');
  const [platformUrl, setPlatformUrl] = useState('https://orderkare.co.in');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [freeTrialDays, setFreeTrialDays] = useState(14);

  // Payment Gateways
  const [paymentMode, setPaymentMode] = useState<'live' | 'test'>('live');
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [defaultUpiId, setDefaultUpiId] = useState('orderkare@icici');

  // Password / Secret Visibility Toggles
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Security Credentials
  const [adminName, setAdminName] = useState(user?.name || 'Super Admin');
  const [adminEmail, setAdminEmail] = useState(user?.email || 'superadmin@orderkare.com');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingAuth, setUpdatingAuth] = useState(false);

  // Operational Policies
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'OrderKare is undergoing scheduled system maintenance. We will be back online shortly!'
  );
  const [autoApproveRestaurants, setAutoApproveRestaurants] = useState(true);
  const [enableCustomerFeedback, setEnableCustomerFeedback] = useState(true);
  const [enableAudioAlerts, setEnableAudioAlerts] = useState(true);

  // Health & Diagnostics
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [exportingBackup, setExportingBackup] = useState(false);
  const [purgingOrders, setPurgingOrders] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  // Show Toast
  const triggerToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Load Settings from API
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings');
      if (res.data?.settings) {
        const s = res.data.settings;
        if (s.platformName !== undefined) setPlatformName(s.platformName || '');
        if (s.supportEmail !== undefined) setSupportEmail(s.supportEmail || '');
        if (s.supportPhone !== undefined) setSupportPhone(s.supportPhone || '');
        if (s.platformUrl !== undefined) setPlatformUrl(s.platformUrl || '');
        if (s.currencySymbol !== undefined) setCurrencySymbol(s.currencySymbol || '₹');
        if (s.defaultCurrency !== undefined) setDefaultCurrency(s.defaultCurrency || 'INR');
        if (s.freeTrialDays !== undefined) setFreeTrialDays(s.freeTrialDays);

        if (s.paymentMode !== undefined) setPaymentMode(s.paymentMode || 'live');
        if (s.stripePublishableKey !== undefined) setStripePublishableKey(s.stripePublishableKey || '');
        if (s.stripeSecretKey !== undefined) setStripeSecretKey(s.stripeSecretKey || '');
        if (s.razorpayKeyId !== undefined) setRazorpayKeyId(s.razorpayKeyId || '');
        setRazorpayKeySecret('');
        if (s.defaultUpiId !== undefined) setDefaultUpiId(s.defaultUpiId || 'orderkare@icici');

        if (s.maintenanceMode !== undefined) setMaintenanceMode(Boolean(s.maintenanceMode));
        if (s.maintenanceMessage !== undefined) setMaintenanceMessage(s.maintenanceMessage || '');
        if (s.autoApproveRestaurants !== undefined) setAutoApproveRestaurants(Boolean(s.autoApproveRestaurants));
        if (s.enableCustomerFeedback !== undefined) setEnableCustomerFeedback(Boolean(s.enableCustomerFeedback));
        if (s.enableAudioAlerts !== undefined) setEnableAudioAlerts(Boolean(s.enableAudioAlerts));
      }
    } catch (err) {
      console.error('Failed to load system settings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Live Server Health
  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await api.get('/settings/health');
      if (res.data) {
        setHealthData(res.data.health || res.data);
      }
    } catch (err) {
      console.error('Failed to retrieve system health diagnostics:', err);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'health') {
      fetchHealth();
    }
  }, [activeTab]);

  // Save System Settings
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        platformName,
        supportEmail,
        supportPhone,
        platformUrl,
        currencySymbol,
        defaultCurrency,
        freeTrialDays: Number(freeTrialDays),
        paymentMode,
        stripePublishableKey,
        stripeSecretKey: stripeSecretKey.trim() || undefined,
        razorpayKeyId,
        razorpayKeySecret: razorpayKeySecret.trim() || undefined,
        defaultUpiId,
        maintenanceMode,
        maintenanceMessage,
        autoApproveRestaurants,
        enableCustomerFeedback,
        enableAudioAlerts,
      };

      const res = await api.put('/settings', payload);
      triggerToast('success', res.data?.message || 'Platform settings updated successfully!');

      if (res.data?.settings) {
        const s = res.data.settings;
        if (s.supportEmail !== undefined) setSupportEmail(s.supportEmail || '');
        if (s.platformName !== undefined) setPlatformName(s.platformName || '');
        if (s.supportPhone !== undefined) setSupportPhone(s.supportPhone || '');
      }
    } catch (err: any) {
      triggerToast('error', err.response?.data?.message || 'Failed to update system settings.');
    } finally {
      setSaving(false);
    }
  };

  // Update Super Admin Account & Password
  const handleUpdateAdminAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      triggerToast('error', 'New passwords do not match. Please verify.');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      triggerToast('error', 'New password must contain at least 6 characters.');
      return;
    }

    setUpdatingAuth(true);
    try {
      const res = await api.post('/settings/credentials', {
        name: adminName,
        email: adminEmail,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      if (res.data?.user) {
        const token = res.data.token || localStorage.getItem('token') || '';
        login(res.data.user, token);
        if (res.data.user.name) setAdminName(res.data.user.name);
        if (res.data.user.email) setAdminEmail(res.data.user.email);
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      triggerToast('success', res.data?.message || 'Super Admin credentials updated successfully!');
    } catch (err: any) {
      triggerToast('error', err.response?.data?.message || 'Failed to update admin account credentials.');
    } finally {
      setUpdatingAuth(false);
    }
  };

  // Export JSON Database Backup
  const handleExportBackup = async () => {
    setExportingBackup(true);
    try {
      const res = await api.get('/settings/backup');
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `orderkare_system_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      triggerToast('success', 'Full database snapshot JSON exported successfully!');
    } catch (err) {
      triggerToast('error', 'Failed to export database backup snapshot.');
    } finally {
      setExportingBackup(false);
    }
  };

  // Safe Purge Test Orders
  const handlePurgeTestOrders = async () => {
    setPurgingOrders(true);
    try {
      const res = await api.post('/settings/purge-test-orders');
      triggerToast('success', res.data?.message || 'Test orders purged successfully!');
      setShowPurgeConfirm(false);
      fetchHealth();
    } catch (err) {
      triggerToast('error', 'Failed to purge test orders.');
    } finally {
      setPurgingOrders(false);
    }
  };

  const navTabs = [
    { id: 'platform' as const, label: 'Platform & Branding', icon: Globe, badge: 'Core' },
    { id: 'payments' as const, label: 'Payment Gateways', icon: Key, badge: paymentMode === 'live' ? 'Live' : 'Test' },
    { id: 'security' as const, label: 'Super Admin Access', icon: ShieldCheck, badge: 'Admin' },
    { id: 'policies' as const, label: 'System Controls', icon: Sliders, badge: maintenanceMode ? 'Maintenance' : 'Active' },
    { id: 'health' as const, label: 'Database & Health', icon: Database, badge: 'Telemetry' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 px-4 sm:px-6 font-sans antialiased text-slate-800 dark:text-slate-200 transition-colors duration-300">
      
      {/* ── Executive Top Header Banner (Matches Landing Page Theme) ── */}
      <div className="relative bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-orange-500/10 dark:bg-orange-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-rose-500/10 dark:bg-rose-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-900/50 text-orange-600 dark:text-orange-400">
                <Sparkles className="w-4 h-4" />
                <span>Master Infrastructure</span>
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>System Configuration</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              System Settings & Infrastructure
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              Configure global platform identity, API payment gateways, root administrator credentials, operational feature switches, and database cluster telemetry.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => handleSaveSettings()}
              disabled={saving || loading}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-2xl text-sm sm:text-base font-extrabold transition-all shadow-lg shadow-orange-500/25 active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
            >
              {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Alert Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`p-5 rounded-2xl text-sm sm:text-base font-bold border flex items-center space-x-3.5 shadow-2xl ${
              toast.type === 'success'
                ? 'bg-emerald-500 text-white border-emerald-400'
                : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-6 h-6 shrink-0 text-white" />
            ) : (
              <AlertTriangle className="w-6 h-6 shrink-0 text-white" />
            )}
            <span className="flex-1">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navigation Tab Bar ── */}
      <div className="flex items-center gap-3 border-b border-slate-200/80 dark:border-slate-800 overflow-x-auto pb-2 no-scrollbar">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center space-x-3 px-5 py-3.5 rounded-2xl text-sm sm:text-base font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/25'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
              <span>{tab.label}</span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full uppercase tracking-wider font-mono font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-20 text-center space-y-4 shadow-sm">
          <RefreshCw className="w-10 h-10 text-orange-500 animate-spin mx-auto" />
          <p className="text-base font-bold text-slate-700 dark:text-slate-300">Loading system parameters and security keys...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* TAB 1: Platform & Branding */}
          {activeTab === 'platform' && (
            <form onSubmit={handleSaveSettings} className="space-y-8">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-10 shadow-xs space-y-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-3">
                    <Globe className="w-6 h-6 text-orange-500" />
                    <span>Global Platform Branding & Communication</span>
                  </h2>
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    These branding variables appear on customer digital menus, support footers, invoices, and automated notifications.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2.5">
                      Platform Brand Title
                    </label>
                    <div className="relative">
                      <Globe className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
                      <input
                        type="text"
                        value={platformName}
                        onChange={(e) => setPlatformName(e.target.value)}
                        placeholder="e.g. OrderKare Technologies"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm sm:text-base font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2.5">
                      Live Platform Web URL
                    </label>
                    <div className="relative">
                      <Globe className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
                      <input
                        type="url"
                        value={platformUrl}
                        onChange={(e) => setPlatformUrl(e.target.value)}
                        placeholder="https://orderkare.co.in"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm sm:text-base font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2.5">
                      Support Email (Customer Inquiries)
                    </label>
                    <div className="relative">
                      <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
                      <input
                        type="email"
                        required
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        placeholder="support@orderkare.com"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm sm:text-base font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2.5">
                      Support & WhatsApp Helpline
                    </label>
                    <div className="relative">
                      <Phone className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
                      <input
                        type="text"
                        value={supportPhone}
                        onChange={(e) => setSupportPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm sm:text-base font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Currency & Trial Rules */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-10 shadow-xs space-y-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-3">
                    <DollarSign className="w-6 h-6 text-orange-500" />
                    <span>Currency & Free Trial Setup</span>
                  </h2>
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Define default billing currency, symbols, and automatic introductory trial duration for newly onboarded venues.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2.5">
                      Currency Symbol
                    </label>
                    <input
                      type="text"
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      placeholder="₹"
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm sm:text-base font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2.5">
                      ISO Currency Code
                    </label>
                    <input
                      type="text"
                      value={defaultCurrency}
                      onChange={(e) => setDefaultCurrency(e.target.value.toUpperCase())}
                      placeholder="INR"
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm sm:text-base font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2.5">
                      Free Trial Duration (Days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={freeTrialDays}
                      onChange={(e) => setFreeTrialDays(Number(e.target.value))}
                      placeholder="14"
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm sm:text-base font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white px-7 py-3.5 rounded-2xl text-sm sm:text-base font-bold transition-all shadow-md shadow-orange-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    <span>{saving ? 'Saving Info...' : 'Save Platform & Branding'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: Payment Gateways */}
          {activeTab === 'payments' && (
            <form onSubmit={handleSaveSettings} className="space-y-8">
              {/* Environment Switcher */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-lg sm:text-xl flex items-center space-x-3">
                    <Key className="w-5 h-5 text-orange-500" />
                    <span>Payment Gateway Processing Environment</span>
                  </h3>
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Toggle between Live Production processing and Test Sandbox mode for gateway verification.
                  </p>
                </div>
                <div className="flex items-center space-x-2.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('live')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all cursor-pointer ${
                      paymentMode === 'live'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Live Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('test')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all cursor-pointer ${
                      paymentMode === 'test'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Sandbox / Test
                  </button>
                </div>
              </div>

              {/* Razorpay Gateway */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-10 shadow-xs space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center font-black text-blue-600 dark:text-blue-400 text-sm">
                      RZP
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white text-lg sm:text-xl">Razorpay Integration (UPI, Cards & NetBanking)</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Used for QR payments, UPI intent, and Indian Rupee billing</p>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 self-start sm:self-auto">
                    Primary Gateway
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2.5">
                      Razorpay Key ID
                    </label>
                    <input
                      type="text"
                      value={razorpayKeyId}
                      onChange={(e) => setRazorpayKeyId(e.target.value)}
                      placeholder="rzp_live_xxxxxxxxxxxxxx"
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm sm:text-base font-mono font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2.5">
                      Razorpay Key Secret (Optional Fallback)
                    </label>
                    <div className="relative">
                      <input
                        type={showRazorpaySecret ? 'text' : 'password'}
                        value={razorpayKeySecret}
                        onChange={(e) => setRazorpayKeySecret(e.target.value)}
                        placeholder="Configured securely in environment variables"
                        className="w-full pl-5 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm sm:text-base font-mono font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRazorpaySecret(!showRazorpaySecret)}
                        className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showRazorpaySecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2.5">
                    Default Platform UPI VPA ID
                  </label>
                  <input
                    type="text"
                    value={defaultUpiId}
                    onChange={(e) => setDefaultUpiId(e.target.value)}
                    placeholder="orderkare@icici"
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm sm:text-base font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Stripe Gateway */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-10 shadow-xs space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 text-sm">
                      STP
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white text-lg sm:text-xl">Stripe Gateway (International & Cards)</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Used for global multi-currency checkout and recurring subscription charges</p>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 self-start sm:self-auto">
                    International
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2.5">
                      Stripe Publishable Key
                    </label>
                    <input
                      type="text"
                      value={stripePublishableKey}
                      onChange={(e) => setStripePublishableKey(e.target.value)}
                      placeholder="pk_live_51Mxxxxxxxxxxxxxxxx"
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm sm:text-base font-mono font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2.5">
                      Stripe Secret Key
                    </label>
                    <div className="relative">
                      <input
                        type={showStripeSecret ? 'text' : 'password'}
                        value={stripeSecretKey}
                        onChange={(e) => setStripeSecretKey(e.target.value)}
                        placeholder="sk_live_51Mxxxxxxxxxxxxxxxx"
                        className="w-full pl-5 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm sm:text-base font-mono font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStripeSecret(!showStripeSecret)}
                        className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showStripeSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white px-7 py-3.5 rounded-2xl text-sm sm:text-base font-bold transition-all shadow-md shadow-orange-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    <span>{saving ? 'Saving Keys...' : 'Save Payment Gateways'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: Super Admin Security & Access */}
          {activeTab === 'security' && (
            <div className="space-y-8">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-10 shadow-xs space-y-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-3">
                    <ShieldCheck className="w-6 h-6 text-orange-500" />
                    <span>Super Admin Profile & Access Credentials</span>
                  </h2>
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Manage your administrator login identity, profile name, and master access password.
                  </p>
                </div>

                <form onSubmit={handleUpdateAdminAccount} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2.5">
                        Super Admin Name
                      </label>
                      <div className="relative">
                        <User className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
                        <input
                          type="text"
                          required
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm sm:text-base font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2.5">
                        Super Admin Email (Login Username)
                      </label>
                      <div className="relative">
                        <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
                        <input
                          type="email"
                          required
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm sm:text-base font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Change Sub-section */}
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-6">
                    <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Change Master Password (Optional)
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2.5">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Current root password"
                            className="w-full pl-4 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm sm:text-base font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2.5">
                          New Master Password
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min. 6 characters"
                            className="w-full pl-4 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm sm:text-base font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2.5">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-type new password"
                          className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm sm:text-base font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={updatingAuth}
                      className="flex items-center space-x-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white px-8 py-3.5 rounded-2xl text-sm sm:text-base font-extrabold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {updatingAuth ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                      <span>{updatingAuth ? 'Updating Security...' : 'Update Admin Credentials'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: Operational Policies & Controls */}
          {activeTab === 'policies' && (
            <div className="space-y-8">
              {/* Maintenance Mode Box */}
              <div
                className={`rounded-3xl border p-8 sm:p-10 shadow-xs transition-all ${
                  maintenanceMode
                    ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-950 dark:text-rose-200'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                        maintenanceMode
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Power className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg sm:text-xl">Emergency System Maintenance Mode</h3>
                      <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 max-w-2xl font-medium leading-relaxed">
                        When enabled, a broadcast banner will be displayed to all public visitors, and customer ordering will be paused for upgrades.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                    className={`px-6 py-3 rounded-2xl text-sm sm:text-base font-black transition-all cursor-pointer shadow-md ${
                      maintenanceMode
                        ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {maintenanceMode ? 'Maintenance Mode Active' : 'Normal Operation'}
                  </button>
                </div>

                {maintenanceMode && (
                  <div className="mt-6 pt-6 border-t border-rose-200 dark:border-rose-900/50 space-y-3">
                    <label className="block text-sm font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wide">
                      Broadcast Maintenance Announcement
                    </label>
                    <textarea
                      rows={3}
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      placeholder="Enter the broadcast message visible to all restaurant clients..."
                      className="w-full p-4 bg-white dark:bg-slate-800/90 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-sm sm:text-base font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 placeholder:text-slate-400"
                    />
                  </div>
                )}
              </div>

              {/* System Policies Grid */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-10 shadow-xs space-y-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-3">
                    <Sliders className="w-6 h-6 text-orange-500" />
                    <span>Operational Feature Controls</span>
                  </h2>
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Configure automated onboarding rules, customer review collection, and kitchen soundbox alerts.
                  </p>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Auto Approve */}
                  <div className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Auto-Approve New Restaurant Registrations</h4>
                      <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                        Instantly activate newly registered restaurants without requiring manual Super Admin approval.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoApproveRestaurants(!autoApproveRestaurants)}
                      className={`w-16 h-8 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        autoApproveRestaurants ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform shadow-md ${
                          autoApproveRestaurants ? 'left-9' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Enable Feedback */}
                  <div className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Enable Customer Post-Order Feedback</h4>
                      <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                        Allow diners to submit 5-star ratings and food feedback on the live menu after payment.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnableCustomerFeedback(!enableCustomerFeedback)}
                      className={`w-16 h-8 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        enableCustomerFeedback ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform shadow-md ${
                          enableCustomerFeedback ? 'left-9' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Audio Alerts */}
                  <div className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Enable Kitchen & Waiter Audio Chimes</h4>
                      <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                        Play auditory alert chimes when new live orders are placed or table assistance is requested.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnableAudioAlerts(!enableAudioAlerts)}
                      className={`w-16 h-8 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        enableAudioAlerts ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform shadow-md ${
                          enableAudioAlerts ? 'left-9' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSaveSettings()}
                    disabled={saving}
                    className="flex items-center space-x-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white px-7 py-3.5 rounded-2xl text-sm sm:text-base font-bold transition-all shadow-md shadow-orange-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    <span>{saving ? 'Saving...' : 'Save System Rules'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Database & Diagnostics */}
          {activeTab === 'health' && (
            <div className="space-y-8">
              {/* Live Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Database Status</span>
                    <Database className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{healthData?.dbConnected ? 'PostgreSQL Online' : 'Connecting...'}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold">Neon Serverless Cluster</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Database Latency</span>
                    <Activity className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                    {healthData?.latencyMs !== undefined ? `${healthData.latencyMs} ms` : '—'}
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-semibold">High-Speed Cloud Response</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Platform Uptime</span>
                    <Clock className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                    {healthData?.uptimeSeconds
                      ? `${Math.floor(healthData.uptimeSeconds / 3600)}h ${Math.floor(
                          (healthData.uptimeSeconds % 3600) / 60
                        )}m`
                      : 'Active'}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold font-mono">Node.js {healthData?.nodeVersion || 'v20'}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Memory Allocation</span>
                    <HardDrive className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                    {healthData?.memoryUsageMb ? `${healthData.memoryUsageMb} MB` : '—'}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold font-mono">
                    Allocated: {healthData?.totalMemoryMb || 128} MB
                  </p>
                </div>
              </div>

              {/* Data Entity Metrics */}
              {healthData?.counts && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-10 shadow-xs space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white text-lg sm:text-xl flex items-center space-x-3">
                        <Activity className="w-5 h-5 text-orange-500" />
                        <span>Platform Entity Volume & Records</span>
                      </h3>
                      <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Real-time object count stored in platform database
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={fetchHealth}
                      disabled={healthLoading}
                      className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold transition-all cursor-pointer self-start sm:self-auto"
                      title="Refresh Diagnostic Telemetry"
                    >
                      <RefreshCw className={`w-4 h-4 ${healthLoading ? 'animate-spin' : ''}`} />
                      <span>Refresh Telemetry</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 p-5 rounded-2xl text-center">
                      <Building2 className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">{healthData.counts.restaurants}</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">Restaurants</div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 p-5 rounded-2xl text-center">
                      <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">{healthData.counts.users}</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">User Accounts</div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 p-5 rounded-2xl text-center">
                      <ShoppingBag className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">{healthData.counts.orders}</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">Total Orders</div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 p-5 rounded-2xl text-center">
                      <UtensilsCrossed className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">{healthData.counts.foodItems}</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">Food Items</div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 p-5 rounded-2xl text-center">
                      <Tag className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">{healthData.counts.pricingPlans}</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">SaaS Plans</div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 p-5 rounded-2xl text-center">
                      <Sparkles className="w-6 h-6 text-pink-500 mx-auto mb-2" />
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">{healthData.counts.advertisements}</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">Banner Ads</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Maintenance Tools & Export Engine */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-10 shadow-xs space-y-8">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-lg sm:text-xl flex items-center space-x-3">
                    <Database className="w-6 h-6 text-orange-500" />
                    <span>Database Backup & Maintenance Tools</span>
                  </h3>
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Export high-fidelity JSON snapshot backups or safely clear temporary testing records.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Export Backup Card */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-white flex items-center justify-center shadow-sm">
                        <Download className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">One-Click Database Snapshot</h4>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Download complete system JSON backup</p>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      Exports all restaurants, menus, categories, plans, ads, and system parameters into an encrypted JSON file.
                    </p>
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      disabled={exportingBackup}
                      className="w-full flex items-center justify-center space-x-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 text-white py-3.5 px-6 rounded-2xl text-sm sm:text-base font-extrabold transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {exportingBackup ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                      <span>{exportingBackup ? 'Generating Backup...' : 'Download JSON Snapshot'}</span>
                    </button>
                  </div>

                  {/* Purge Test Orders Card */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-sm">
                        <Trash2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">Purge Demo & Test Orders</h4>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Clean testing data safely</p>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      Safely deletes test orders (table 99, customer names containing 'test' or guest orders) to keep your platform analytics clean.
                    </p>

                    {showPurgeConfirm ? (
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={handlePurgeTestOrders}
                          disabled={purgingOrders}
                          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-2xl text-sm sm:text-base font-extrabold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          {purgingOrders ? 'Purging...' : 'Confirm Purge'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPurgeConfirm(false)}
                          className="px-5 py-3.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-2xl text-sm sm:text-base font-extrabold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowPurgeConfirm(true)}
                        className="w-full flex items-center justify-center space-x-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 py-3.5 px-6 rounded-2xl text-sm sm:text-base font-extrabold transition-all active:scale-95 cursor-pointer"
                      >
                        <Trash2 className="w-5 h-5" />
                        <span>Clean Test Orders</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
