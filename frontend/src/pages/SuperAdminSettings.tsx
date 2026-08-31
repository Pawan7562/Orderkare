import { useState } from 'react';
import { Settings, ShieldCheck, Key, Globe, Database, Save, CheckCircle2 } from 'lucide-react';

export const SuperAdminSettings = () => {
  const [platformName, setPlatformName] = useState('OrderKare Technologies');
  const [supportEmail, setSupportEmail] = useState('corporate@orderkare.com');
  const [stripeLiveKey, setStripeLiveKey] = useState('pk_live_51Mxxxxxxxxxxxxxxxx');
  const [razorpayKey, setRazorpayKey] = useState('rzp_live_xxxxxxxx');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-7 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">Manage platform API gateways, payment secrets, and security rules</p>
        </div>
      </div>

      {saved && (
        <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-2xl text-xs font-bold border border-emerald-200 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>System configuration updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Platform Identity */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h2 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
            <Globe className="w-4.5 h-4.5 text-primary" />
            <span>Platform Branding & Identity</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Platform Name</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Corporate Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Gateway API Keys */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h2 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
            <Key className="w-4.5 h-4.5 text-primary" />
            <span>Payment Gateway Secrets</span>
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stripe Live Publishable Key</label>
              <input
                type="password"
                value={stripeLiveKey}
                onChange={(e) => setStripeLiveKey(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Razorpay Live Key ID</label>
              <input
                type="password"
                value={razorpayKey}
                onChange={(e) => setRazorpayKey(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Maintenance Toggle */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">System Maintenance Mode</h3>
            <p className="text-xs text-slate-400 mt-0.5">Temporarily pause new restaurant signups during platform maintenance</p>
          </div>
          <button
            type="button"
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              maintenanceMode ? 'bg-primary' : 'bg-slate-300'
            }`}
          >
            <span
              className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                maintenanceMode ? 'left-6.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        <button
          type="submit"
          className="flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-2xl text-xs font-extrabold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
        >
          <Save className="w-4 h-4" />
          <span>Save System Settings</span>
        </button>
      </form>
    </div>
  );
};
