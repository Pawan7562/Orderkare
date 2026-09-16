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
  Layers,
  Sparkles,
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
        if (s.razorpayKeySecret !== undefined) setRazorpayKeySecret(s.razorpayKeySecret || '');
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

  // Fetch Live System Health
  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await api.get('/settings/health');
      if (res.data?.health) {
        setHealthData(res.data.health);
      }
    } catch (err) {
      console.error('Failed to load system health:', err);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    if (user) {
      setAdminName(user.name || 'Super Admin');
      setAdminEmail(user.email || 'superadmin@orderkare.com');
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'health') {
      fetchHealth();
    }
  }, [activeTab]);

  // Save General System Settings
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        platformName,
        supportEmail: supportEmail.trim(),
        supportPhone: supportPhone.trim(),
        platformUrl,
        currencySymbol,
        defaultCurrency,
        freeTrialDays: Number(freeTrialDays) || 14,
        paymentMode,
        stripePublishableKey,
        stripeSecretKey,
        razorpayKeyId,
        razorpayKeySecret,
        defaultUpiId,
        maintenanceMode,
        maintenanceMessage,
        autoApproveRestaurants,
        enableCustomerFeedback,
        enableAudioAlerts,
      };

      const res = await api.put('/settings', payload);
      triggerToast('success', res.data?.message || 'Platform settings updated successfully!');
      
      // Update local values from returned response if present
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
    { id: 'platform', label: 'Platform & Branding', icon: Globe, badge: 'Core' },
    { id: 'payments', label: 'Payment Gateways', icon: Key, badge: paymentMode === 'live' ? 'Live' : 'Test' },
    { id: 'security', label: 'Super Admin Access', icon: ShieldCheck, badge: 'Admin' },
    { id: 'policies', label: 'System Controls', icon: Sliders, badge: maintenanceMode ? 'Maintenance' : 'Active' },
    { id: 'health', label: 'Database & Health', icon: Database, badge: 'Diagnostic' },
  ];

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 rounded-3xl text-white shadow-xl shadow-slate-900/10 border border-slate-700/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full text-[11px] font-bold tracking-wide uppercase text-orange-400 mb-2 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Master System Control Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">System Settings & Infrastructure</h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl font-medium">
            Configure global platform identity, API keys, security protocols, system rules, and database diagnostics.
          </p>
        </div>

        <div className="relative z-10 flex items-center space-x-3">
          <button
            type="button"
            onClick={() => handleSaveSettings()}
            disabled={saving || loading}
            className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-5 py-3 rounded-2xl text-xs font-black transition-all shadow-lg shadow-orange-500/25 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Floating Alert Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`p-4 rounded-2xl text-xs font-bold border flex items-center space-x-3 shadow-xl ${
              toast.type === 'success'
                ? 'bg-emerald-500 text-white border-emerald-400'
                : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-white" />
            )}
            <span className="flex-1">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Tab Bar */}
      <div className="flex items-center space-x-2 border-b border-slate-200/80 overflow-x-auto pb-1 no-scrollbar">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center space-x-2.5 px-4 py-3 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center space-y-4 shadow-sm">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-600">Loading system parameters and security keys...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: Platform & Branding */}
          {activeTab === 'platform' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-orange-500" />
                    <span>Global Platform Branding & Communication</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    These branding variables appear on invoices, customer digital menus, support footers, and live portals.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Platform Name / Brand Title
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={platformName}
                        onChange={(e) => setPlatformName(e.target.value)}
                        placeholder="e.g. OrderKare Technologies"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Live Platform Web URL
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="url"
                        value={platformUrl}
                        onChange={(e) => setPlatformUrl(e.target.value)}
                        placeholder="https://orderkare.co.in"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Corporate Support Email (Customer Inquiries)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        placeholder="support@orderkare.com"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">
                      Current active support email: <span className="font-bold text-orange-600">{supportEmail || 'Not configured'}</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Helpline / WhatsApp Support Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={supportPhone}
                        onChange={(e) => setSupportPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Currency & Trial Rules */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-orange-500" />
                    <span>Currency & Free Trial Setup</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Define default billing currency, symbols, and automatic free trial duration for newly registered restaurants.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Currency Symbol
                    </label>
                    <input
                      type="text"
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      placeholder="₹"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      ISO Currency Code
                    </label>
                    <input
                      type="text"
                      value={defaultCurrency}
                      onChange={(e) => setDefaultCurrency(e.target.value.toUpperCase())}
                      placeholder="INR"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Free Trial Duration (Days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="365"
                      value={freeTrialDays}
                      onChange={(e) => setFreeTrialDays(Number(e.target.value))}
                      placeholder="14"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{saving ? 'Saving Platform Info...' : 'Save Platform & Branding'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: Payment Gateways */}
          {activeTab === 'payments' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Environment Switcher */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
                    <Key className="w-4.5 h-4.5 text-orange-500" />
                    <span>Payment Gateway Environment</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Toggle between Live Production processing and Test Sandbox mode.
                  </p>
                </div>
                <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('live')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      paymentMode === 'live'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ⚡ Live Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('test')}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      paymentMode === 'test'
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🧪 Sandbox / Test
                  </button>
                </div>
              </div>

              {/* Razorpay Gateway */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center font-black text-blue-600 text-sm">
                      RZP
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Razorpay Integration (India UPI & Cards)</h3>
                      <p className="text-xs text-slate-400">Used for QR payments, UPI intent, and Indian Rupee billing</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    Primary Gateway
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Razorpay Key ID
                    </label>
                    <input
                      type="text"
                      value={razorpayKeyId}
                      onChange={(e) => setRazorpayKeyId(e.target.value)}
                      placeholder="rzp_live_xxxxxxxxxxxxxx"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Razorpay Key Secret
                    </label>
                    <div className="relative">
                      <input
                        type={showRazorpaySecret ? 'text' : 'password'}
                        value={razorpayKeySecret}
                        onChange={(e) => setRazorpayKeySecret(e.target.value)}
                        placeholder="••••••••••••••••••••••••••••••••"
                        className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRazorpaySecret(!showRazorpaySecret)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showRazorpaySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Default Platform UPI VPA ID
                  </label>
                  <input
                    type="text"
                    value={defaultUpiId}
                    onChange={(e) => setDefaultUpiId(e.target.value)}
                    placeholder="orderkare@icici"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Stripe Gateway */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-black text-indigo-600 text-sm">
                      STP
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">Stripe Gateway (International & Subscriptions)</h3>
                      <p className="text-xs text-slate-400">Used for global multi-currency checkout & recurring SaaS subscriptions</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    International
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Stripe Publishable Key
                    </label>
                    <input
                      type="text"
                      value={stripePublishableKey}
                      onChange={(e) => setStripePublishableKey(e.target.value)}
                      placeholder="pk_live_51Mxxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Stripe Secret Key
                    </label>
                    <div className="relative">
                      <input
                        type={showStripeSecret ? 'text' : 'password'}
                        value={stripeSecretKey}
                        onChange={(e) => setStripeSecretKey(e.target.value)}
                        placeholder="••••••••••••••••••••••••••••••••"
                        className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStripeSecret(!showStripeSecret)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showStripeSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{saving ? 'Saving Keys...' : 'Save Payment Gateways'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: Super Admin Security & Access */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-orange-500" />
                    <span>Super Admin Master Profile & Credentials</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage your administrator login credentials, root security level, and master password.
                  </p>
                </div>

                <form onSubmit={handleUpdateAdminAccount} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Super Admin Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          required
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Super Admin Email (Login Username)
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="email"
                          required
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Change Sub-section */}
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                      Change Master Password (Optional)
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Current root password"
                            className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                          >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          New Master Password
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min. 6 characters"
                            className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
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
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-type new password"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={updatingAuth}
                      className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl text-xs font-extrabold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {updatingAuth ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      <span>{updatingAuth ? 'Updating Security...' : 'Update Admin Credentials'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: Operational Policies & Controls */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              {/* Maintenance Mode Box */}
              <div
                className={`rounded-3xl border p-6 md:p-8 shadow-sm transition-all ${
                  maintenanceMode
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                    : 'bg-white border-slate-200/80 text-slate-900'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        maintenanceMode ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Power className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm">Emergency System Maintenance Mode</h3>
                      <p className="text-xs text-slate-500 mt-0.5 max-w-xl font-medium">
                        When enabled, a broadcast banner will be displayed to all public visitors, and new signups will be temporarily paused for upgrades.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMaintenanceMode(!maintenanceMode);
                    }}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-sm ${
                      maintenanceMode
                        ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/30'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {maintenanceMode ? '🚨 Maintenance ACTIVE' : 'Inactive (Normal)'}
                  </button>
                </div>

                {maintenanceMode && (
                  <div className="mt-5 pt-5 border-t border-rose-200 space-y-2">
                    <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider">
                      Broadcast Maintenance Announcement
                    </label>
                    <textarea
                      rows={2}
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      placeholder="Enter the broadcast message visible to all restaurant clients..."
                      className="w-full px-4 py-3 bg-white border border-rose-200 rounded-2xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    />
                  </div>
                )}
              </div>

              {/* System Policies Grid */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                    <Sliders className="w-5 h-5 text-orange-500" />
                    <span>Operational Feature Toggles</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Control automated onboarding rules, customer feedback collection, and live kitchen audio alerts.
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {/* Auto Approve */}
                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Auto-Approve New Restaurant Registrations</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Instantly activate newly registered restaurants without requiring manual Super Admin approval.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoApproveRestaurants(!autoApproveRestaurants)}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        autoApproveRestaurants ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${
                          autoApproveRestaurants ? 'left-6.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Enable Feedback */}
                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Enable Customer Post-Order Feedback</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Allow diners to submit 5-star ratings and food feedback on the live menu after payment.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnableCustomerFeedback(!enableCustomerFeedback)}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        enableCustomerFeedback ? 'bg-orange-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${
                          enableCustomerFeedback ? 'left-6.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Audio Alerts */}
                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Enable Kitchen & Waiter Audio Chimes</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Play auditory alert bells when new live orders are placed or table assistance is requested.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnableAudioAlerts(!enableAudioAlerts)}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        enableAudioAlerts ? 'bg-orange-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${
                          enableAudioAlerts ? 'left-6.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSaveSettings()}
                    disabled={saving}
                    className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{saving ? 'Saving...' : 'Save System Rules'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Database & Diagnostics */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              {/* Live Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Database Status</span>
                    <Database className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-lg font-black text-slate-900 flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>{healthData?.dbConnected ? 'Neon DB Online' : 'Connecting...'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold">PostgreSQL Serverless Engine</p>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Database Latency</span>
                    <Activity className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="text-lg font-black text-slate-900">
                    {healthData?.latencyMs !== undefined ? `${healthData.latencyMs} ms` : '—'}
                  </div>
                  <p className="text-[10px] text-emerald-600 font-semibold">High-Speed Cloud Response</p>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Platform Uptime</span>
                    <Power className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-lg font-black text-slate-900">
                    {healthData?.uptimeSeconds
                      ? `${Math.floor(healthData.uptimeSeconds / 3600)}h ${Math.floor(
                          (healthData.uptimeSeconds % 3600) / 60
                        )}m`
                      : 'Active'}
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold">Node.js {healthData?.nodeVersion || 'v20'}</p>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Memory Allocation</span>
                    <Layers className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-lg font-black text-slate-900">
                    {healthData?.memoryUsageMb ? `${healthData.memoryUsageMb} MB` : '—'}
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    Total: {healthData?.totalMemoryMb || 128} MB
                  </p>
                </div>
              </div>

              {/* Data Entity Metrics */}
              {healthData?.counts && (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
                        <Activity className="w-4.5 h-4.5 text-orange-500" />
                        <span>Platform Entity Volume & Records</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Real-time object count stored in database</p>
                    </div>
                    <button
                      type="button"
                      onClick={fetchHealth}
                      disabled={healthLoading}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${healthLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-center">
                      <Building2 className="w-5 h-5 text-orange-500 mx-auto mb-1.5" />
                      <div className="text-lg font-black text-slate-900">{healthData.counts.restaurants}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Restaurants</div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-center">
                      <Users className="w-5 h-5 text-blue-500 mx-auto mb-1.5" />
                      <div className="text-lg font-black text-slate-900">{healthData.counts.users}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">User Accounts</div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-center">
                      <ShoppingBag className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                      <div className="text-lg font-black text-slate-900">{healthData.counts.orders}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Total Orders</div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-center">
                      <UtensilsCrossed className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
                      <div className="text-lg font-black text-slate-900">{healthData.counts.foodItems}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Food Items</div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-center">
                      <Tag className="w-5 h-5 text-purple-500 mx-auto mb-1.5" />
                      <div className="text-lg font-black text-slate-900">{healthData.counts.pricingPlans}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">SaaS Plans</div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-center">
                      <Sparkles className="w-5 h-5 text-pink-500 mx-auto mb-1.5" />
                      <div className="text-lg font-black text-slate-900">{healthData.counts.advertisements}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Banner Ads</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Maintenance Tools & Export Engine */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm space-y-6">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                    <Database className="w-5 h-5 text-orange-500" />
                    <span>Database Backup & Maintenance Tools</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Export high-fidelity JSON snapshot backups or clean temporary testing records safely.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Export Backup Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-orange-50/40 border border-slate-200 space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                        <Download className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">One-Click Database Snapshot</h4>
                        <p className="text-[11px] text-slate-500">Download complete system JSON backup</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Exports all restaurants, menus, categories, plans, ads, and system parameters into an encrypted JSON file.
                    </p>
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      disabled={exportingBackup}
                      className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {exportingBackup ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      <span>{exportingBackup ? 'Generating Backup...' : 'Download JSON Snapshot'}</span>
                    </button>
                  </div>

                  {/* Purge Test Orders Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-rose-50/40 border border-slate-200 space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                        <Trash2 className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">Purge Demo / Test Orders</h4>
                        <p className="text-[11px] text-slate-500">Clean testing data safely</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Safely deletes test orders (table 99, customer names containing 'test' or guest orders) to keep your analytics clean.
                    </p>

                    {showPurgeConfirm ? (
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={handlePurgeTestOrders}
                          disabled={purgingOrders}
                          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          {purgingOrders ? 'Purging...' : 'Confirm Purge'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPurgeConfirm(false)}
                          className="px-3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-extrabold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowPurgeConfirm(true)}
                        className="w-full flex items-center justify-center space-x-2 bg-rose-100 hover:bg-rose-200 text-rose-700 py-2.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
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
