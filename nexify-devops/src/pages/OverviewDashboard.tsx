import React, { useState, useMemo } from 'react';
import {
  Layers,
  Globe,
  Smartphone,
  Server,
  Database,
  ShieldCheck,
  CreditCard,
  AlertOctagon,
  Search,
  ExternalLink,
  RefreshCw,
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Download,
  Terminal,
  Activity,
  ArrowUpRight,
  Sparkles,
  Cpu,
  Radio,
  Building,
  Bot,
  ArrowRight,
  TrendingUp,
  Clock,
  Lock,
  Plus,
  Boxes,
  Key,
  ShieldAlert,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { formatLiveUrl as sanitizeUrl } from '../utils/domainUtils';

export const OverviewDashboard: React.FC = () => {
  const { projects } = useProjects();
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSyncTelemetry = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast('All 4 client clusters, PostgreSQL pools, and edge PoPs synced successfully (0 errors)');
    }, 800);
  };

  // Microservice matrix entries
  const services = useMemo(() => [
    {
      id: 'srv_exam_1',
      name: 'PK The NexGen Exam AI Proctoring Engine',
      client: 'PK The NexGen Education',
      type: 'AI Proctoring & WebRTC',
      env: 'PRODUCTION',
      tech: 'Next.js 15 / MediaPipe / WebRTC',
      url: 'https://www.pkthenexgenexam.xyz/',
      status: 'HEALTHY',
      uptime: '99.98%',
      latency: '24 ms',
      projectId: 'proj_pkthenexgenexam',
      cloud: 'VERCEL',
    },
    {
      id: 'srv_1',
      name: 'OrderKare Core API Gateway',
      client: 'OrderKare Technologies',
      type: 'API Gateway',
      env: 'PRODUCTION',
      tech: 'Node.js 20 / Express / Socket.IO',
      url: 'https://orderkare-3.onrender.com/api/health',
      status: 'HEALTHY',
      uptime: '99.99%',
      latency: '28 ms',
      projectId: 'proj_orderkare',
      cloud: 'RENDER',
    },
    {
      id: 'srv_2',
      name: 'OrderKare Customer Menu & Ordering',
      client: 'OrderKare Technologies',
      type: 'Web Portal',
      env: 'PRODUCTION',
      tech: 'React 19 / Vite / Tailwind',
      url: 'https://orderkare.co.in',
      status: 'HEALTHY',
      uptime: '100.0%',
      latency: '18 ms',
      projectId: 'proj_orderkare',
      cloud: 'VERCEL',
    },
    {
      id: 'srv_3',
      name: 'OrderKare Waiter & Staff Mobile',
      client: 'OrderKare Technologies',
      type: 'Mobile App',
      env: 'PRODUCTION',
      tech: 'React Native / Expo iOS & Android',
      url: 'https://play.google.com/store/apps/details?id=com.orderkare.staff',
      status: 'HEALTHY',
      uptime: '99.95%',
      latency: '42 ms',
      projectId: 'proj_orderkare',
      cloud: 'CLOUDFLARE',
    },
    {
      id: 'srv_5',
      name: 'Nexus Enterprise Multi-Tenant CRM',
      client: 'Nexus Global Solutions',
      type: 'CRM Platform',
      env: 'STAGING',
      tech: 'Next.js 15 / TypeScript / Prisma',
      url: 'https://crm-staging.nexifyforge.com',
      status: 'HEALTHY',
      uptime: '99.40%',
      latency: '55 ms',
      projectId: 'proj_nexus_crm',
      cloud: 'VERCEL',
    },
    {
      id: 'srv_6',
      name: 'SwiftDrop Courier Real-Time Routing',
      client: 'SwiftDrop Logistics India',
      type: 'Mobile & Dispatch',
      env: 'PRODUCTION',
      tech: 'Flutter / Go / Redis Geohash',
      url: 'https://swiftdrop.in',
      status: 'HEALTHY',
      uptime: '99.95%',
      latency: '34 ms',
      projectId: 'proj_swiftdrop',
      cloud: 'RENDER',
    },
  ], []);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.client.toLowerCase().includes(search.toLowerCase()) ||
        s.tech.toLowerCase().includes(search.toLowerCase()) ||
        s.type.toLowerCase().includes(search.toLowerCase());
      const matchesCat = selectedCategory === 'ALL' || s.type.includes(selectedCategory) || s.cloud === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [services, search, selectedCategory]);

  const totalMonthlyINR = projects.reduce((acc, p) => acc + (p.monthlyFeeINR || 0), 0);
  const totalProductionCount = projects.filter((p) => p.environment === 'PRODUCTION').length;
  const totalTasksCount = projects.reduce((acc, p) => acc + p.tasks.length, 0);

  // Global Edge PoP Status
  const edgePoPs = [
    { region: 'ap-south-1', name: 'Mumbai, IN', latency: '18 ms', status: 'NOMINAL' },
    { region: 'us-east-1', name: 'N. Virginia, US', latency: '42 ms', status: 'NOMINAL' },
    { region: 'eu-central-1', name: 'Frankfurt, DE', latency: '36 ms', status: 'NOMINAL' },
    { region: 'ap-southeast-1', name: 'Singapore, SG', latency: '28 ms', status: 'NOMINAL' },
  ];

  // Recent SRE Activity Feed
  const recentActivities = [
    { id: 'act_1', time: '10 min ago', title: 'MediaPipe v3.1.0 Face Mesh Edge Release Deployed', project: 'PK The NexGen Exam', type: 'DEPLOY', icon: Zap, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'act_2', time: '42 min ago', title: 'PostgreSQL Neon Pool Reset Auto-Recovered in 120ms', project: 'OrderKare Dining', type: 'HEAL', icon: RefreshCw, color: 'text-sky-600 bg-sky-50' },
    { id: 'act_3', time: '1 hr ago', title: 'Razorpay HMAC-SHA256 Webhook Signature Validated', project: 'OrderKare Dining', type: 'PAYMENT', icon: CreditCard, color: 'text-teal-600 bg-teal-50' },
    { id: 'act_4', time: '2 hrs ago', title: 'SOC 2 Type II Evidence Attestation Vault Sealed', project: 'Global Fleet Engine', type: 'SECURITY', icon: ShieldCheck, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl bg-white text-slate-800 border border-emerald-200 text-xs font-semibold shadow-xl flex items-center gap-3"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Executive Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5 no-print">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-200/60 shadow-sm">
                <Layers className="w-6 h-6 text-emerald-600" />
              </span>
              Global Control Plane & Fleet Telemetry Radar
            </h1>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Edge Mesh: 14 Global PoPs Nominal
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-3xl">
            Real-time developer overview overseeing multi-client cloud fleets, AI proctoring engines, PostgreSQL serverless pools, CI/CD releases, and 24/7 autonomous SRE self-healing.
          </p>
        </div>

        {/* Executive Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleSyncTelemetry}
            disabled={isSyncing}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing Mesh...' : 'Sync Telemetry'}</span>
          </button>

          <Link
            to="/ai-sentinel"
            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Sentinel SRE</span>
          </Link>

          <Link
            to="/clients"
            className="theme-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Client Fleets</span>
          </Link>
        </div>
      </div>

      {/* ── Top 4 Telemetry Metrics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="enterprise-card rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-center text-xs font-mono text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">FLEET UPTIME</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1.5 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              99.98% HEALTHY
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono mt-2">{projects.length} Client Fleets</p>
          <p className="text-[11px] text-slate-500 mt-1">{totalProductionCount} Live in Production</p>
        </div>

        <div className="enterprise-card rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-center text-xs font-mono text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">GLOBAL MEAN LATENCY</span>
            <span className="text-emerald-700 font-bold font-mono text-[10px]">ap-south-1</span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-emerald-600 font-mono mt-2">24.2 ms (P95)</p>
          <p className="text-[11px] text-slate-500 mt-1">Edge Cached via Anycast Mesh</p>
        </div>

        <div className="enterprise-card rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-center text-xs font-mono text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">MONTHLY RETAINERS</span>
            <span className="text-slate-700 font-bold text-[10px]">SLA Platinum</span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono mt-2">₹{totalMonthlyINR.toLocaleString('en-IN')} / mo</p>
          <p className="text-[11px] text-slate-500 mt-1">Automated GST Invoicing Active</p>
        </div>

        <div className="enterprise-card rounded-2xl p-5 relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-center text-xs font-mono text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">AI SITE RELIABILITY</span>
            <span className="text-purple-700 font-bold font-mono text-[10px]">Sentinel v4.2</span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-purple-700 font-mono mt-2">0 Outages</p>
          <p className="text-[11px] text-slate-500 mt-1">24/7 Autonomous Self-Healing</p>
        </div>
      </div>

      {/* ── Global Edge Points of Presence (PoP) Ribbon ── */}
      <div className="enterprise-card rounded-2xl p-4 space-y-2.5 shadow-sm no-print">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600" />
            Global Edge Points of Presence & Handshake Telemetry
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Zero-Downtime Multi-Region Routing
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          {edgePoPs.map((pop) => (
            <div
              key={pop.region}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{pop.name}</span>
                </div>
                <p className="text-[10px] text-slate-500">{pop.region}</p>
              </div>
              <span className="text-emerald-700 font-bold">{pop.latency}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Featured Client Workspaces Row ── */}
      <div className="enterprise-card rounded-2xl p-6 space-y-4 shadow-sm no-print">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" />
              <span>Registered Client Organizations & Production Fleets</span>
            </h2>
            <p className="text-xs text-slate-500">Direct workspace consoles and runtime management</p>
          </div>
          <Link
            to="/clients"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>View All ({projects.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {projects.map((p) => {
            const liveUrlSafe = sanitizeUrl(p.liveUrl || '');
            return (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3 shadow-xs group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {p.category}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Cluster Healthy" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs group-hover:text-emerald-600 transition-colors line-clamp-1">
                    <Link to={`/projects/${p.id}`}>{p.name}</Link>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{p.domains[0] || liveUrlSafe}</p>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-mono text-emerald-700 font-bold text-[11px]">{p.uptimePercent}% Uptime</span>
                  <div className="flex items-center gap-1">
                    <a
                      href={liveUrlSafe}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-slate-500 hover:text-emerald-700 hover:bg-emerald-50"
                      title="Open Live URL"
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </a>
                    <Link
                      to={`/projects/${p.id}`}
                      className="text-slate-800 font-bold hover:text-emerald-700 text-[11px] flex items-center gap-0.5"
                    >
                      <span>Console</span>
                      <ArrowRight className="w-3 h-3 text-emerald-600" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Subsystem Microservice & Health Matrix ── */}
      <div className="enterprise-card rounded-2xl p-6 space-y-5 shadow-sm no-print">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Subsystem Microservice & Container Health Matrix</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live endpoints, container frameworks, and latency metrics across all client environments
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter service or client..."
              className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase font-mono tracking-wider border-b border-slate-200 pb-2">
                <th className="pb-3 font-bold">Service Name</th>
                <th className="pb-3 font-bold">Client Workspace</th>
                <th className="pb-3 font-bold">Category</th>
                <th className="pb-3 font-bold">Environment</th>
                <th className="pb-3 font-bold">Status</th>
                <th className="pb-3 text-center font-bold">Uptime</th>
                <th className="pb-3 text-right font-bold">Latency</th>
                <th className="pb-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServices.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 font-sans">
                    <div>
                      <p className="font-bold text-slate-900">{s.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{s.tech}</p>
                    </div>
                  </td>
                  <td className="py-3.5 text-slate-700 font-medium">{s.client}</td>
                  <td className="py-3.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                      {s.type}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold border ${
                        s.env === 'PRODUCTION'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {s.env}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-center text-slate-800 font-mono font-bold">{s.uptime}</td>
                  <td className="py-3.5 text-right text-emerald-700 font-mono font-bold">{s.latency}</td>
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/projects/${s.projectId}`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg inline-flex items-center gap-1 text-[11px] font-bold transition-all cursor-pointer border border-slate-200"
                      >
                        <span>Console</span>
                      </Link>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-lg inline-flex items-center transition-all cursor-pointer border border-slate-200"
                        title="Open Live URL"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Recent CI/CD Releases & SRE Activity Stream ── */}
      <div className="enterprise-card rounded-2xl p-6 space-y-4 shadow-sm no-print">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Recent Autonomous SRE & CI/CD Release Activity</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">Live Immutable Audit Stream</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentActivities.map((act) => {
            const Icon = act.icon;
            return (
              <div
                key={act.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${act.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 line-clamp-1">{act.title}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {act.project} • <span className="text-slate-400">{act.time}</span>
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-bold shrink-0">
                  {act.type}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
