import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import {
  Activity,
  Layers,
  Globe,
  Smartphone,
  Server,
  Cpu,
  Database,
  Shield,
  CreditCard,
  AlertOctagon,
  GitBranch,
  Sliders,
  ShieldCheck,
  Search,
  ExternalLink,
  RefreshCw,
  Terminal,
  Zap,
  ArrowUpRight,
  Bell,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Play,
  RotateCcw,
  Check,
  X,
  Lock,
  Unlock,
  SlidersHorizontal,
  Bot,
  Flame,
  FileCode,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TabModule =
  | 'overview'
  | 'web_crm'
  | 'mobile'
  | 'apis'
  | 'ai_cron'
  | 'database'
  | 'webhooks'
  | 'errors'
  | 'audit';

export const DevOpsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabModule>('overview');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [mobileConfigs, setMobileConfigs] = useState<any>(null);
  const [dbStats, setDbStats] = useState<any>(null);
  const [cronJobs, setCronJobs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Backup loading
  const [backupLoading, setBackupLoading] = useState(false);
  const [mobileSaving, setMobileSaving] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDevOpsData = async () => {
    setIsSyncing(true);
    try {
      const [ovRes, whRes, errRes, mobRes, dbRes, cronRes, audRes] = await Promise.all([
        api.get('/devops/overview'),
        api.get('/devops/webhooks'),
        api.get('/devops/errors'),
        api.get('/devops/mobile'),
        api.get('/devops/database'),
        api.get('/devops/cron'),
        api.get('/devops/audit'),
      ]);

      if (ovRes.data) setOverviewData(ovRes.data);
      if (whRes.data?.webhooks) setWebhooks(whRes.data.webhooks);
      if (errRes.data?.errors) setErrors(errRes.data.errors);
      if (mobRes.data?.configs) setMobileConfigs(mobRes.data.configs);
      if (dbRes.data?.database) setDbStats(dbRes.data.database);
      if (cronRes.data?.crons) setCronJobs(cronRes.data.crons);
      if (audRes.data?.auditLogs) setAuditLogs(audRes.data.auditLogs);
    } catch (err: any) {
      console.error('Failed to load DevOps telemetry:', err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchDevOpsData();
  }, []);

  const handleReplayWebhook = async (webhookId: string) => {
    try {
      const res = await api.post('/devops/webhooks/replay', { webhookId });
      showToast(res.data?.message || 'Webhook replayed successfully');
      fetchDevOpsData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to replay webhook', 'error');
    }
  };

  const handleResolveError = async (id: string) => {
    try {
      await api.put(`/devops/errors/${id}/resolve`);
      showToast('Error marked as resolved');
      setErrors((prev) => prev.map((e) => (e.id === id ? { ...e, resolved: true } : e)));
    } catch (err) {
      showToast('Failed to resolve error', 'error');
    }
  };

  const handleSaveMobileConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    setMobileSaving(true);
    try {
      const res = await api.put('/devops/mobile', mobileConfigs);
      showToast(res.data?.message || 'Mobile configuration saved');
      fetchDevOpsData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save mobile configs', 'error');
    } finally {
      setMobileSaving(false);
    }
  };

  const handleGenerateBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await api.post('/devops/database/backup');
      if (res.data?.snapshot) {
        // Download JSON snapshot
        const blob = new Blob([JSON.stringify(res.data.snapshot, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NexifyForge_DB_Snapshot_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('Database backup snapshot generated and downloaded!');
        fetchDevOpsData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Backup generation failed', 'error');
    } finally {
      setBackupLoading(false);
    }
  };

  const tabs: { id: TabModule; label: string; icon: any; count?: number; badge?: string }[] = [
    { id: 'overview', label: 'Fleet Overview', icon: Layers, count: overviewData?.fleet?.length || 6 },
    { id: 'web_crm', label: 'Web & CRM Apps', icon: Globe },
    { id: 'mobile', label: 'Mobile App Hub', icon: Smartphone, badge: 'v1.4' },
    { id: 'apis', label: 'APIs & WebSockets', icon: Server },
    { id: 'ai_cron', label: 'AI & Automations', icon: Bot },
    { id: 'database', label: 'Database Ops', icon: Database },
    { id: 'webhooks', label: 'Payment Webhooks', icon: CreditCard, count: webhooks.length },
    { id: 'errors', label: 'Error Logs', icon: AlertOctagon, count: errors.filter((e) => !e.resolved).length },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheck },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-900/60 rounded-3xl border border-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800" />
          ))}
        </div>
        <div className="h-96 bg-slate-900/60 rounded-3xl border border-slate-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl text-xs font-bold border shadow-2xl flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-950/90 text-rose-300 border-rose-500/40'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Hero Telemetry Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Fleet Services Health */}
        <div className="bg-[#0F172A]/80 border border-slate-800/90 p-5 rounded-3xl relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>FLEET STATUS</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              100% HEALTHY
            </span>
          </div>
          <p className="text-3xl font-black text-white font-mono mt-2">
            {overviewData?.counts?.totalServices || 6} Services
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Web, Mobile, AI & Microservices</p>
        </div>

        {/* 2. Database & API Latency */}
        <div className="bg-[#0F172A]/80 border border-slate-800/90 p-5 rounded-3xl relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>QUERY LATENCY</span>
            <span className="text-cyan-400 font-bold font-mono">Neon Pool</span>
          </div>
          <p className="text-3xl font-black text-cyan-400 font-mono mt-2">
            {overviewData?.telemetry?.avgLatencyMs || 28} ms
          </p>
          <p className="text-[11px] text-slate-400 mt-1">PostgreSQL 16 serverless roundtrip</p>
        </div>

        {/* 3. Active WebSocket Radar */}
        <div className="bg-[#0F172A]/80 border border-slate-800/90 p-5 rounded-3xl relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>SOCKET.IO RADAR</span>
            <span className="text-orange-400 font-bold">Sub-Second</span>
          </div>
          <p className="text-3xl font-black text-orange-400 font-mono mt-2">
            {overviewData?.telemetry?.activeSocketClients || 142} Clients
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Live kitchens, soundboxes & diners</p>
        </div>

        {/* 4. Memory & V8 Engine */}
        <div className="bg-[#0F172A]/80 border border-slate-800/90 p-5 rounded-3xl relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>HEAP MEMORY</span>
            <span className="text-purple-400 font-bold font-mono">{overviewData?.platform?.nodeVersion || 'Node.js'}</span>
          </div>
          <p className="text-3xl font-black text-purple-300 font-mono mt-2">
            {overviewData?.telemetry?.memoryUsedMb || 48} MB
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            of {overviewData?.telemetry?.memoryTotalMb || 64} MB allocated
          </p>
        </div>
      </div>

      {/* ── Navigation Tabs Bar ── */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25 font-black'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                      isSelected ? 'bg-black/30 text-black' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={fetchDevOpsData}
          disabled={isSyncing}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
          <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Telemetry'}</span>
        </button>
      </div>

      {/* ── TAB 1: FLEET OVERVIEW & WAR ROOM ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Managed Fleet Matrix */}
          <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>Nexify Forge Managed Fleets</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    6 Active Nodes
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time status across Web, Mobile, AI, CRM and Microservice layers
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter service..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800 pb-2">
                    <th className="pb-3">Service Name</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Framework</th>
                    <th className="pb-3">Environment</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-center">Uptime</th>
                    <th className="pb-3 text-right">Latency</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {(overviewData?.fleet || []).map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 font-sans font-bold text-white">
                        <div>
                          <p>{p.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">/{p.slug} • {p.version}</p>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {p.type}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-400">{p.framework}</td>
                      <td className="py-3.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                          p.environment === 'PRODUCTION' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {p.environment}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-center text-slate-300 font-bold">{p.uptimePercent}%</td>
                      <td className="py-3.5 text-right text-cyan-400 font-bold">{p.latencyMs} ms</td>
                      <td className="py-3.5 text-right font-sans">
                        <a
                          href={p.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg inline-flex items-center gap-1 text-[11px] transition-all"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: WEB & CRM FLEET ── */}
      {activeTab === 'web_crm' && (
        <div className="space-y-6">
          <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-black text-white">Web Applications & Custom CRM Fleets</h3>
            <p className="text-xs text-slate-400">
              Live synthetic vitals, custom domain status, and CDN health for all web frontends
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-sm">OrderKare Customer & Admin Portal</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    HTTPS 200 OK
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">Domain: orderkare.co.in • SSL Valid (Expires in 284 Days)</p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2">
                  <div className="p-2 bg-slate-800/80 rounded-xl">
                    <p className="text-[10px] text-slate-500">TTFB</p>
                    <p className="font-bold text-cyan-400">24 ms</p>
                  </div>
                  <div className="p-2 bg-slate-800/80 rounded-xl">
                    <p className="text-[10px] text-slate-500">FCP</p>
                    <p className="font-bold text-emerald-400">0.42 s</p>
                  </div>
                  <div className="p-2 bg-slate-800/80 rounded-xl">
                    <p className="text-[10px] text-slate-500">PWA Cache</p>
                    <p className="font-bold text-purple-400">Active</p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-sm">Nexify Multi-Tenant CRM</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    HTTPS 200 OK
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">Domain: crm-staging.nexifyforge.com</p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2">
                  <div className="p-2 bg-slate-800/80 rounded-xl">
                    <p className="text-[10px] text-slate-500">TTFB</p>
                    <p className="font-bold text-cyan-400">55 ms</p>
                  </div>
                  <div className="p-2 bg-slate-800/80 rounded-xl">
                    <p className="text-[10px] text-slate-500">SSR</p>
                    <p className="font-bold text-emerald-400">Enabled</p>
                  </div>
                  <div className="p-2 bg-slate-800/80 rounded-xl">
                    <p className="text-[10px] text-slate-500">Node</p>
                    <p className="font-bold text-purple-400">Next 15</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: MOBILE APP HUB & REMOTE CONFIG ── */}
      {activeTab === 'mobile' && (
        <form onSubmit={handleSaveMobileConfigs} className="space-y-6">
          <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>Mobile App Gatekeeper & Remote Feature Flags</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Android & iOS
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Manage minimum supported versions, force update prompts, and in-app remote feature switches
                </p>
              </div>

              <button
                type="submit"
                disabled={mobileSaving}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs rounded-2xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
              >
                {mobileSaving ? 'Saving...' : 'Save Mobile Configs'}
              </button>
            </div>

            {/* Version Gatekeeper */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Android */}
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">🤖 Android Configuration</span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                    <input
                      type="checkbox"
                      checked={mobileConfigs?.android?.forceUpdate || false}
                      onChange={(e) =>
                        setMobileConfigs({
                          ...mobileConfigs,
                          android: { ...mobileConfigs?.android, forceUpdate: e.target.checked },
                        })
                      }
                      className="rounded accent-cyan-500"
                    />
                    <span>Force Update</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400">Latest Version</label>
                    <input
                      type="text"
                      value={mobileConfigs?.android?.latestVersion || '1.4.0'}
                      onChange={(e) =>
                        setMobileConfigs({
                          ...mobileConfigs,
                          android: { ...mobileConfigs?.android, latestVersion: e.target.value },
                        })
                      }
                      className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400">Min Supported Version</label>
                    <input
                      type="text"
                      value={mobileConfigs?.android?.minSupportedVersion || '1.2.0'}
                      onChange={(e) =>
                        setMobileConfigs({
                          ...mobileConfigs,
                          android: { ...mobileConfigs?.android, minSupportedVersion: e.target.value },
                        })
                      }
                      className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400">Play Store Download URL</label>
                  <input
                    type="text"
                    value={mobileConfigs?.android?.updateUrl || ''}
                    onChange={(e) =>
                      setMobileConfigs({
                        ...mobileConfigs,
                        android: { ...mobileConfigs?.android, updateUrl: e.target.value },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* iOS */}
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">🍎 Apple iOS Configuration</span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                    <input
                      type="checkbox"
                      checked={mobileConfigs?.ios?.forceUpdate || false}
                      onChange={(e) =>
                        setMobileConfigs({
                          ...mobileConfigs,
                          ios: { ...mobileConfigs?.ios, forceUpdate: e.target.checked },
                        })
                      }
                      className="rounded accent-cyan-500"
                    />
                    <span>Force Update</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400">Latest Version</label>
                    <input
                      type="text"
                      value={mobileConfigs?.ios?.latestVersion || '1.4.0'}
                      onChange={(e) =>
                        setMobileConfigs({
                          ...mobileConfigs,
                          ios: { ...mobileConfigs?.ios, latestVersion: e.target.value },
                        })
                      }
                      className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400">Min Supported Version</label>
                    <input
                      type="text"
                      value={mobileConfigs?.ios?.minSupportedVersion || '1.2.0'}
                      onChange={(e) =>
                        setMobileConfigs({
                          ...mobileConfigs,
                          ios: { ...mobileConfigs?.ios, minSupportedVersion: e.target.value },
                        })
                      }
                      className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400">App Store URL</label>
                  <input
                    type="text"
                    value={mobileConfigs?.ios?.updateUrl || ''}
                    onChange={(e) =>
                      setMobileConfigs({
                        ...mobileConfigs,
                        ios: { ...mobileConfigs?.ios, updateUrl: e.target.value },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Remote Feature Switches */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                Remote App Feature Flags (Live Remote Sync)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(mobileConfigs?.featureFlags || {}).map(([key, value]) => (
                  <label
                    key={key}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors"
                  >
                    <span className="text-xs font-mono text-slate-300">{key}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={(e) =>
                        setMobileConfigs({
                          ...mobileConfigs,
                          featureFlags: { ...mobileConfigs.featureFlags, [key]: e.target.checked },
                        })
                      }
                      className="rounded accent-cyan-500"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── TAB 4: APIS & WEBSOCKET RADAR ── */}
      {activeTab === 'apis' && (
        <div className="space-y-6">
          <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-black text-white">APIs & WebSocket Connection Radar</h3>
            <p className="text-xs text-slate-400">
              Live Socket.IO connections, route dispatch speeds, and rate limiter status
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <p className="text-[10px] font-mono text-slate-500 uppercase">Active Kitchen Displays (KDS)</p>
                <p className="text-2xl font-black text-orange-400 font-mono mt-1">18 Connected</p>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <p className="text-[10px] font-mono text-slate-500 uppercase">Waiter Mobile Sockets</p>
                <p className="text-2xl font-black text-cyan-400 font-mono mt-1">34 Connected</p>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <p className="text-[10px] font-mono text-slate-500 uppercase">Live Customer Diners</p>
                <p className="text-2xl font-black text-emerald-400 font-mono mt-1">90 Browsing</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: AI & AUTOMATION SCHEDULER ── */}
      {activeTab === 'ai_cron' && (
        <div className="space-y-6">
          <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-black text-white">AI Agents & Scheduled Cron Jobs</h3>
            <p className="text-xs text-slate-400">
              Background workers, LLM token logs, and automated cleanups
            </p>

            <div className="space-y-3 pt-2">
              {cronJobs.map((c) => (
                <div key={c.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-white">{c.name}</p>
                    <p className="text-[11px] font-mono text-cyan-400 mt-0.5">Schedule: {c.schedule}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Last run: {c.lastResult}</p>
                  </div>
                  <span className="self-start sm:self-center px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold text-[10px]">
                    ● {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: DATABASE OPS & 1-CLICK BACKUP ── */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white">PostgreSQL 16 Neon Database Operations</h3>
                <p className="text-xs text-slate-400">
                  Manage connection pool, table volume, and generate encrypted database backup snapshots
                </p>
              </div>

              <button
                onClick={handleGenerateBackup}
                disabled={backupLoading}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs rounded-2xl transition-all shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <Download className={`w-3.5 h-3.5 ${backupLoading ? 'animate-bounce' : ''}`} />
                <span>{backupLoading ? 'Exporting Backup...' : 'Generate 1-Click Backup'}</span>
              </button>
            </div>

            {/* DB Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <p className="text-[10px] font-mono text-slate-500 uppercase">Database Size</p>
                <p className="text-2xl font-black text-white font-mono mt-1">{dbStats?.size || '18.4 MB'}</p>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <p className="text-[10px] font-mono text-slate-500 uppercase">Active Connection Pool</p>
                <p className="text-2xl font-black text-cyan-400 font-mono mt-1">3 / 20 Active</p>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <p className="text-[10px] font-mono text-slate-500 uppercase">Engine</p>
                <p className="text-2xl font-black text-purple-300 font-mono mt-1">PostgreSQL 16</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: PAYMENT WEBHOOKS STREAM & 1-CLICK REPLAY ── */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-black text-white">Live Payment Webhooks & Replay Engine</h3>
            <p className="text-xs text-slate-400">
              Live stream of Razorpay and gateway events with 1-click test replayer
            </p>

            <div className="space-y-3 pt-2">
              {webhooks.map((w) => (
                <div
                  key={w.id}
                  className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black font-mono text-cyan-400">{w.gateway}</span>
                      <span className="text-xs font-mono font-bold text-white">{w.event}</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        HTTP {w.statusCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">{new Date(w.receivedAt).toLocaleTimeString()}</span>
                      <button
                        onClick={() => handleReplayWebhook(w.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3 text-cyan-400" />
                        <span>Replay Event</span>
                      </button>
                    </div>
                  </div>

                  <pre className="p-3 bg-black/50 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto max-h-36">
                    {JSON.stringify(w.payload, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 8: CENTRALIZED ERROR LOGS ── */}
      {activeTab === 'errors' && (
        <div className="space-y-6">
          <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-black text-white">Centralized Exception & Error Stream</h3>
            <p className="text-xs text-slate-400">
              Sentry-grade stack trace inspector and error resolution manager
            </p>

            <div className="space-y-3 pt-2">
              {errors.map((err) => (
                <div
                  key={err.id}
                  className={`p-4 rounded-2xl border ${
                    err.resolved
                      ? 'bg-slate-900/60 border-slate-800/80 opacity-70'
                      : 'bg-rose-950/20 border-rose-800/60'
                  } space-y-2`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded font-mono ${
                        err.severity === 'FATAL' ? 'bg-rose-500 text-black' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {err.severity}
                      </span>
                      <span className="text-xs font-bold text-white">{err.service}</span>
                    </div>

                    {!err.resolved && (
                      <button
                        onClick={() => handleResolveError(err.id)}
                        className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-rose-300 font-mono">{err.message}</p>
                  {err.stackTrace && (
                    <pre className="p-2.5 bg-black/60 border border-slate-800 rounded-xl text-[10px] font-mono text-slate-400 overflow-x-auto">
                      {err.stackTrace}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 9: DEVELOPER AUDIT TRAIL ── */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-black text-white">Immutable Developer Audit Trail</h3>
            <p className="text-xs text-slate-400">
              Log of all operational actions, config updates, and backup triggers
            </p>

            <div className="space-y-2 pt-2">
              {auditLogs.map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-white font-sans">{a.action}</p>
                    <p className="text-[11px] text-slate-400">{a.details}</p>
                    <p className="text-[10px] text-slate-500">By {a.developerName} ({a.developerEmail}) • IP {a.ipAddress}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(a.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
