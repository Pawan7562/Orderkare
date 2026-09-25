import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  Shield,
  Search,
  Plus,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Zap,
  Activity,
  Filter,
  Check,
  Copy,
  Clock,
  Printer,
  Download,
  Terminal,
  Bug,
  ChevronDown,
  ChevronRight,
  Eye,
  X,
  Code,
  AlertTriangle,
  Play,
  RotateCcw,
  Cpu,
  Globe,
  SlidersHorizontal,
  FileText,
  Boxes,
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '../context/ProjectContext';

export interface TelemetryError {
  id: string;
  projectId: string;
  service: string;
  client: string;
  severity: 'CRITICAL' | 'WARN' | 'INFO';
  category: 'WEBRTC' | 'DATABASE' | 'PAYMENTS' | 'NETWORK' | 'AUTH' | 'API';
  message: string;
  stack: string;
  occurrences: number;
  impactedUsers: number;
  time: string;
  timestampEpoch: number;
  resolved: boolean;
  spanId: string;
  traceId: string;
  breadcrumbs: { time: string; action: string; category: string }[];
  aiDiagnosis?: {
    rootCause: string;
    suggestedFix: string;
    diffSnippet: string;
    riskScore: string;
  };
}

const INITIAL_ERRORS: TelemetryError[] = [
  {
    id: 'err_901',
    projectId: 'proj_pkthenexgenexam',
    service: 'PK The NexGen Exam - WebRTC AI Worker',
    client: 'PK The NexGen Education & Exam Labs',
    severity: 'WARN',
    category: 'WEBRTC',
    message: 'WebRTC MediaStream audio packet drop rate > 2.4% (auto-buffered)',
    stack: `AudioContext.onframeloss at webrtc.stream.ts:182:14
  at SocketEmitter.dispatch (socket.io-client.js:42:19)
  at MediaPipeFaceMeshProcessor.processAudioFrame (proctor.engine.ts:94:8)
  at async WebRTCWorker.handleInboundStream (worker.runtime.ts:210:12)`,
    occurrences: 38,
    impactedUsers: 14,
    time: '2026-09-20 02:48:12 UTC',
    timestampEpoch: 1789958892000,
    resolved: false,
    spanId: 'span_9f82a10c3b',
    traceId: 'trace_049182374650192837465',
    breadcrumbs: [
      { time: '02:47:58', action: 'User connected to Exam Room #402 (Student ID: PK-8821)', category: 'AUTH' },
      { time: '02:48:02', action: 'MediaStream initialized: Video 720p @ 30fps + Audio 48kHz', category: 'WEBRTC' },
      { time: '02:48:10', action: 'Client network jitter spiked to 84ms on local Wi-Fi', category: 'NETWORK' },
      { time: '02:48:12', action: 'Audio packet drop detected; triggered adaptive jitter buffer', category: 'AI_SRE' }
    ],
    aiDiagnosis: {
      rootCause: 'Transient Wi-Fi uplink packet congestion on client network caused WebRTC RTP buffer underrun. System automatically enlarged jitter buffer from 40ms to 90ms.',
      suggestedFix: 'Enable Opus forward error correction (FEC) and dynamically reduce audio bitrate from 48kbps to 24kbps upon packet loss detection > 2%.',
      diffSnippet: `- const audioConstraints = { sampleRate: 48000, channelCount: 2, echoCancellation: true };
+ const audioConstraints = { 
+   sampleRate: 48000, 
+   channelCount: 1, 
+   echoCancellation: true,
+   autoGainControl: true,
+   opusFec: true /* Adaptive packet loss concealment */
+ };`,
      riskScore: 'Low (Auto-Mitigated)'
    }
  },
  {
    id: 'err_902',
    projectId: 'proj_orderkare',
    service: 'OrderKare Core API - Neon Pooler',
    client: 'OrderKare Technologies',
    severity: 'WARN',
    category: 'DATABASE',
    message: 'PostgreSQL Neon serverless connection pool reset (auto-reconnected in 120ms)',
    stack: `Connection terminated unexpectedly at Connection.parseE (/node_modules/pg/lib/connection.js:614:11)
  at Query.handleError (/node_modules/pg/lib/query.js:142:10)
  at Pool.query (/node_modules/pg-pool/index.js:372:22)
  at async RestaurantService.getLiveOrders (restaurant.service.ts:88:15)`,
    occurrences: 12,
    impactedUsers: 3,
    time: '2026-09-20 02:15:30 UTC',
    timestampEpoch: 1789956930000,
    resolved: true,
    spanId: 'span_4b1a039efc',
    traceId: 'trace_192837465019283746502',
    breadcrumbs: [
      { time: '02:15:20', action: 'Incoming GET /api/v1/restaurants/active-orders', category: 'API' },
      { time: '02:15:25', action: 'Neon Serverless scale-to-zero wake up initiated', category: 'DATABASE' },
      { time: '02:15:30', action: 'Pool connection reset; fallback retry succeeded in 120ms', category: 'DATABASE' }
    ],
    aiDiagnosis: {
      rootCause: 'Neon serverless compute suspended during idle window; first query caused cold-start pool recreation with seamless client retry.',
      suggestedFix: 'Configure pool min idle connections = 2 or activate Neon warm pool keep-alive ping.',
      diffSnippet: `- const pool = new Pool({ connectionString, max: 20 });
+ const pool = new Pool({ 
+   connectionString, 
+   max: 20, 
+   min: 2, 
+   idleTimeoutMillis: 30000 
+ });`,
      riskScore: 'Zero User Impact'
    }
  },
  {
    id: 'err_903',
    projectId: 'proj_orderkare',
    service: 'Customer Web Menu - Razorpay SDK',
    client: 'OrderKare Technologies',
    severity: 'INFO',
    category: 'PAYMENTS',
    message: 'Razorpay SDK prefill notice (Mobile UPI intent auto-invoked)',
    stack: `Razorpay.open() initiated with order_id order_ORD55667788
  at RazorpayGateway.initiatePayment (razorpay.service.ts:112:10)
  at OrderCheckoutModal.handlePayNow (CheckoutModal.tsx:64:18)`,
    occurrences: 84,
    impactedUsers: 84,
    time: '2026-09-20 01:52:10 UTC',
    timestampEpoch: 1789955530000,
    resolved: true,
    spanId: 'span_2c7e491a0b',
    traceId: 'trace_384756102938475610293',
    breadcrumbs: [
      { time: '01:52:00', action: 'Customer finalized dining cart (Amount: ₹1,450.00)', category: 'API' },
      { time: '01:52:05', action: 'Generated Razorpay order_ORD55667788', category: 'PAYMENTS' },
      { time: '01:52:10', action: 'UPI intent app switch triggered on mobile browser', category: 'PAYMENTS' }
    ],
    aiDiagnosis: {
      rootCause: 'Standard payment gateway telemetry event. User successfully dispatched UPI intent flow.',
      suggestedFix: 'No remediation required. Informational metric event.',
      diffSnippet: `// Standard Razorpay Payment Telemetry: Nominal`,
      riskScore: 'None (Informational)'
    }
  },
  {
    id: 'err_904',
    projectId: 'proj_swiftdrop',
    service: 'SwiftDrop Geohash Dispatcher',
    client: 'SwiftDrop Express Logistics',
    severity: 'INFO',
    category: 'NETWORK',
    message: 'Driver location WebSocket ping timeout (reconnected in 1.1s)',
    stack: `WebSocket connection closed with code 1006 abnormal closure
  at WebSocket.onclose (geohash.client.ts:74:12)
  at ReconnectManager.scheduleRetry (reconnect.ts:33:8)`,
    occurrences: 19,
    impactedUsers: 8,
    time: '2026-09-20 01:20:15 UTC',
    timestampEpoch: 1789953615000,
    resolved: true,
    spanId: 'span_71829af001',
    traceId: 'trace_561029384756102938475',
    breadcrumbs: [
      { time: '01:20:00', action: 'Driver GPS location stream active on route R-109', category: 'NETWORK' },
      { time: '01:20:10', action: 'Driver entered subway transit underpass (signal loss)', category: 'NETWORK' },
      { time: '01:20:15', action: 'WebSocket 1006 code caught; automatic exponential backoff reconnected', category: 'NETWORK' }
    ],
    aiDiagnosis: {
      rootCause: 'Cellular dead-zone in transit tunnel triggered temporary socket close. Built-in exponential backoff re-established socket.',
      suggestedFix: 'Queue offline GPS coordinates in local SQLite/IndexedDB cache and bulk-flush upon reconnection.',
      diffSnippet: `+ if (!navigator.onLine) {
+   offlineGpsQueue.push(currentCoord);
+ }`,
      riskScore: 'Low (Auto-Healed)'
    }
  }
];

export const ErrorLogsPage: React.FC = () => {
  const { projects, addTask } = useProjects();
  const [errors, setErrors] = useState<TelemetryError[]>(INITIAL_ERRORS);
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterProject, setFilterProject] = useState<string>('ALL');
  
  // Interactive UI Modals & Stream state
  const [toast, setToast] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<TelemetryError | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);
  const [expandedStackId, setExpandedStackId] = useState<string | null>(null);
  const [isLiveTelemetryActive, setIsLiveTelemetryActive] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live Telemetry Stream Simulator
  useEffect(() => {
    if (!isLiveTelemetryActive) return;

    const interval = setInterval(() => {
      const mockServices = [
        {
          service: 'PK The NexGen Exam - Face Mesh Worker',
          client: 'PK The NexGen Education & Exam Labs',
          category: 'WEBRTC' as const,
          severity: 'INFO' as const,
          message: 'Gaze tracking confidence jitter 0.08 (auto-smoothed via Kalman filter)',
          stack: `KalmanFilter.smooth at face.mesh.ts:42:11\nat async ProctorEngine.tick (proctor.ts:118:9)`
        },
        {
          service: 'OrderKare Core API - Redis Cache',
          client: 'OrderKare Technologies',
          category: 'DATABASE' as const,
          severity: 'INFO' as const,
          message: 'Menu item cache miss (re-cached in 12ms from PostgreSQL)',
          stack: `RedisClient.get (nil) at cache.service.ts:31:8\nat RestaurantService.fetchMenu (menu.ts:54:14)`
        }
      ];

      const chosen = mockServices[Math.floor(Math.random() * mockServices.length)];
      const nextId = `err_${Date.now().toString().slice(-4)}`;
      const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

      const newError: TelemetryError = {
        id: nextId,
        projectId: 'proj_pkthenexgenexam',
        service: chosen.service,
        client: chosen.client,
        severity: chosen.severity,
        category: chosen.category,
        message: chosen.message,
        stack: chosen.stack,
        occurrences: 1,
        impactedUsers: 1,
        time: timeStr,
        timestampEpoch: Date.now(),
        resolved: true,
        spanId: `span_${nextId}`,
        traceId: `trace_${Date.now()}`,
        breadcrumbs: [
          { time: timeStr.slice(11, 19), action: 'Telemetry stream ping received', category: 'API' }
        ]
      };

      setErrors(prev => [newError, ...prev.slice(0, 20)]);
    }, 7000);

    return () => clearInterval(interval);
  }, [isLiveTelemetryActive]);

  // Copy helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resolveError = (id: string) => {
    setErrors(errors.map((e) => (e.id === id ? { ...e, resolved: true } : e)));
    setToast('Exception marked as resolved in APM registry');
    setTimeout(() => setToast(null), 2500);
  };

  const reopenError = (id: string) => {
    setErrors(errors.map((e) => (e.id === id ? { ...e, resolved: false } : e)));
    setToast('Exception reopened for investigation');
    setTimeout(() => setToast(null), 2500);
  };

  const handleConvertToTask = (err: TelemetryError) => {
    const targetProjId = err.projectId || projects[0]?.id;
    addTask(targetProjId, {
      title: `[Bug Fix] ${err.service}: ${err.message.substring(0, 60)}...`,
      description: `Auto-generated from Error Telemetry Exception ID: ${err.id}\nOccurrences: ${err.occurrences}\nImpacted Users: ${err.impactedUsers}\n\nStack Trace:\n${err.stack}\n\nTrace ID: ${err.traceId}`,
      priority: err.severity === 'CRITICAL' ? 'P0_CRITICAL' : 'P1_HIGH',
      status: 'BACKLOG',
      assignee: 'Lead Architect',
      dueDate: '2026-09-28',
    });
    setToast(`Created Sprint Task in ${err.client}`);
    setTimeout(() => setToast(null), 3000);
  };

  const handlePrintPostMortem = () => {
    window.print();
  };

  const handleExportJson = () => {
    const exportData = {
      apmReport: {
        title: 'Nexify Centralized APM & Error Telemetry Export',
        exportedAt: new Date().toISOString(),
        totalRecorded: errors.length,
        unresolvedCount: errors.filter(e => !e.resolved).length,
        fleetErrorRate: '0.012%',
        errors
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexify-apm-telemetry-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredErrors = useMemo(() => {
    return errors.filter((e) => {
      const matchesSearch =
        e.service.toLowerCase().includes(search.toLowerCase()) ||
        e.message.toLowerCase().includes(search.toLowerCase()) ||
        e.client.toLowerCase().includes(search.toLowerCase()) ||
        e.stack.toLowerCase().includes(search.toLowerCase()) ||
        e.id.toLowerCase().includes(search.toLowerCase());

      const matchesSeverity =
        filterSeverity === 'ALL'
          ? true
          : filterSeverity === 'UNRESOLVED'
          ? !e.resolved
          : e.severity === filterSeverity;

      const matchesCategory = filterCategory === 'ALL' || e.category === filterCategory;
      const matchesProject = filterProject === 'ALL' || e.projectId === filterProject;

      return matchesSearch && matchesSeverity && matchesCategory && matchesProject;
    });
  }, [errors, search, filterSeverity, filterCategory, filterProject]);

  const activeUnresolvedCount = errors.filter((e) => !e.resolved).length;
  const criticalCount = errors.filter((e) => e.severity === 'CRITICAL' && !e.resolved).length;

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl bg-white text-slate-900 border border-emerald-200 text-xs font-semibold shadow-xl flex items-center gap-3"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Executive Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5 no-print">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-200/60 shadow-sm">
                <AlertOctagon className="w-6 h-6 text-rose-600" />
              </span>
              Centralized Error Telemetry & APM Observability
            </h1>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {activeUnresolvedCount === 0 ? 'Zero Unresolved Crashes' : `${activeUnresolvedCount} Unresolved Incidents`}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-3xl">
            Real-time exception ingestion across WebRTC proctoring workers, PostgreSQL serverless pools, and client APIs with AI root cause analysis and 1-click sprint Kanban task dispatch.
          </p>
        </div>

        {/* Global Executive Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsLiveTelemetryActive(!isLiveTelemetryActive)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isLiveTelemetryActive
                ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLiveTelemetryActive ? 'bg-rose-500 animate-ping' : 'bg-slate-400'}`} />
            {isLiveTelemetryActive ? 'Live Ingestion (ON)' : 'Live APM Stream'}
          </button>

          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-all"
            title="Export Telemetry JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrintPostMortem}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-all"
            title="Print A4 Incident Post-Mortem Statement"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print RCA Report</span>
          </button>
        </div>
      </div>

      {/* ── APM Metric KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="enterprise-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Fleet Error Rate (P99)</p>
            <TrendingDown className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">0.012%</span>
            <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              NOMINAL
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono truncate">
            99.988% Success Ratio
          </p>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Unresolved Incidents</p>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{activeUnresolvedCount}</span>
            <span className="text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
              {criticalCount > 0 ? `${criticalCount} CRITICAL` : '0 P0 FATAL'}
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Auto-Buffering Active
          </p>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Mean Time to Detect (MTTD)</p>
            <Zap className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">420ms</span>
            <span className="text-[10px] font-mono text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded font-bold">
              EDGE APM
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            OpenTelemetry Ingestion
          </p>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Mean Time to Heal (MTTR)</p>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-700 font-mono">4.2 min</span>
            <span className="text-[10px] font-mono text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded font-bold">
              AI SRE
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Automated Circuit Recovery
          </p>
        </div>
      </div>

      {/* ── Search & Multi-Dimensional Filters ── */}
      <div className="enterprise-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs no-print">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search service, error message, stack trace, ID..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Severity Filter */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer focus:border-emerald-500 focus:bg-white transition-all font-medium text-xs"
          >
            <option value="ALL">All Exceptions</option>
            <option value="UNRESOLVED">Unresolved Active Only ({activeUnresolvedCount})</option>
            <option value="CRITICAL">Critical (P0)</option>
            <option value="WARN">Warnings (P1/P2)</option>
            <option value="INFO">Info / Pre-fill (P3)</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer focus:border-emerald-500 focus:bg-white transition-all font-medium text-xs"
          >
            <option value="ALL">All Subsystems</option>
            <option value="WEBRTC">WebRTC & AI Workers</option>
            <option value="DATABASE">PostgreSQL & Redis</option>
            <option value="PAYMENTS">Payment Gateway (Razorpay)</option>
            <option value="NETWORK">WebSocket & Geohash</option>
            <option value="API">REST Endpoints</option>
          </select>

          {/* Project Filter */}
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer focus:border-emerald-500 focus:bg-white transition-all font-medium text-xs"
          >
            <option value="ALL">All Fleets</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {(search || filterSeverity !== 'ALL' || filterCategory !== 'ALL' || filterProject !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setFilterSeverity('ALL');
                setFilterCategory('ALL');
                setFilterProject('ALL');
              }}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Error Feeds & Exception Stream ── */}
      <div className="space-y-4 no-print">
        {filteredErrors.length === 0 ? (
          <div className="enterprise-card rounded-2xl p-12 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-base font-bold text-slate-800">Clean Telemetry Feed</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No runtime exceptions match your active filter parameters.
            </p>
          </div>
        ) : (
          filteredErrors.map((e) => (
            <div
              key={e.id}
              className={`enterprise-card rounded-2xl p-5 space-y-4 text-xs shadow-sm hover:border-slate-300 transition-all ${
                !e.resolved ? 'border-amber-300/80 bg-amber-50/10' : ''
              }`}
            >
              {/* Top Row: Service, Severity, Category, Occurrences, Time */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800">
                    {e.id}
                  </span>

                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                      e.severity === 'CRITICAL'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : e.severity === 'WARN'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    {e.severity}
                  </span>

                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                    {e.category}
                  </span>

                  <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                    {e.service}
                  </h3>

                  <span className="text-slate-500 text-xs hidden sm:inline">
                    ({e.client})
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                    {e.occurrences} events • {e.impactedUsers} impacted
                  </span>

                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {e.time}
                  </span>
                </div>
              </div>

              {/* Message & Exception details */}
              <div className="space-y-2">
                <p className="text-xs sm:text-sm font-mono font-semibold text-rose-900 leading-snug">
                  {e.message}
                </p>

                {/* Stack Trace Box */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <button
                      onClick={() => setExpandedStackId(expandedStackId === e.id ? null : e.id)}
                      className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {expandedStackId === e.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      <span>{expandedStackId === e.id ? 'Collapse Stack Trace' : 'Expand Full Stack Frame'}</span>
                    </button>

                    <button
                      onClick={() => copyToClipboard(e.stack, `stack_${e.id}`)}
                      className="text-slate-400 hover:text-slate-700 flex items-center gap-1"
                    >
                      {copiedId === `stack_${e.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Stack</span>
                    </button>
                  </div>

                  <pre
                    className={`p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto border border-slate-800 leading-relaxed transition-all ${
                      expandedStackId === e.id ? 'max-h-96' : 'max-h-24'
                    }`}
                  >
                    {e.stack}
                  </pre>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {/* AI Root Cause Button */}
                  {e.aiDiagnosis && (
                    <button
                      onClick={() => {
                        setSelectedError(e);
                        setIsAiModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Root Cause & Fix</span>
                    </button>
                  )}

                  {/* Distributed Trace Button */}
                  <button
                    onClick={() => {
                      setSelectedError(e);
                      setIsTraceModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>Distributed Trace</span>
                  </button>

                  {/* Convert to Kanban Task */}
                  <button
                    onClick={() => handleConvertToTask(e)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    title="Convert this exception into a Sprint Task in the project's Kanban board"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Create Sprint Task</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {!e.resolved ? (
                    <button
                      onClick={() => resolveError(e.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all cursor-pointer shadow-sm"
                    >
                      Mark Resolved
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Resolved
                      </span>
                      <button
                        onClick={() => reopenError(e.id)}
                        className="text-[10px] font-semibold text-slate-400 hover:text-slate-700 underline cursor-pointer"
                      >
                        Reopen
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── AI Root Cause & Code Fix Modal ── */}
      {isAiModalOpen && selectedError && selectedError.aiDiagnosis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn no-print">
          <div className="enterprise-card rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    AI SRE Diagnostic Assistant • {selectedError.id}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedError.service}
                </h3>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Root Cause */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Identified Root Cause</p>
                <p className="text-slate-800 text-xs sm:text-sm leading-relaxed font-sans">
                  {selectedError.aiDiagnosis.rootCause}
                </p>
              </div>

              {/* Recommended Fix */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
                <p className="text-[10px] font-mono uppercase text-emerald-800 font-bold">Suggested Remediation Strategy</p>
                <p className="text-emerald-950 text-xs sm:text-sm leading-relaxed font-sans">
                  {selectedError.aiDiagnosis.suggestedFix}
                </p>
              </div>

              {/* Code Unified Diff */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 font-bold uppercase">
                  <span>Proposed Code Patch Diff</span>
                  <button
                    onClick={() => copyToClipboard(selectedError.aiDiagnosis?.diffSnippet || '', 'diff_code')}
                    className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-sans font-medium"
                  >
                    {copiedId === 'diff_code' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>Copy Patch</span>
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                  {selectedError.aiDiagnosis.diffSnippet}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
              <span className="text-[11px] font-mono text-slate-500">
                Risk Rating: <strong className="text-slate-800">{selectedError.aiDiagnosis.riskScore}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleConvertToTask(selectedError);
                    setIsAiModalOpen(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                >
                  Create Task with Patch
                </button>
                <button
                  onClick={() => {
                    resolveError(selectedError.id);
                    setIsAiModalOpen(false);
                  }}
                  className="theme-btn-primary px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Apply & Resolve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── OpenTelemetry Distributed Trace Modal ── */}
      {isTraceModalOpen && selectedError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn no-print">
          <div className="enterprise-card rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-sky-100 text-sky-700">
                    <Layers className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    OpenTelemetry Distributed Trace & Waterfall Spans
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Trace ID: {selectedError.traceId}
                </h3>
              </div>
              <button
                onClick={() => setIsTraceModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Breadcrumb Sequence */}
              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Chronological Request Breadcrumbs</p>
                <div className="space-y-2">
                  {selectedError.breadcrumbs.map((b, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-mono text-slate-400">{b.time}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                          {b.category}
                        </span>
                        <span className="text-slate-800 font-medium">{b.action}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Span ID details */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] text-slate-400">Span ID</p>
                  <p className="font-bold text-slate-900">{selectedError.spanId}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] text-slate-400">Protocol</p>
                  <p className="font-bold text-sky-700">OTLP / gRPC (HTTP/2)</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-200 text-xs">
              <button
                onClick={() => setIsTraceModalOpen(false)}
                className="theme-btn-primary px-5 py-2 rounded-xl text-xs font-semibold"
              >
                Close Trace View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINT-ONLY A4 FORMAL INCIDENT POST-MORTEM REPORT ── */}
      <div className="printable-incident-sheet hidden print:block bg-white text-black p-8 max-w-[210mm] mx-auto">
        {/* Letterhead */}
        <div className="border-b-2 border-slate-900 pb-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-8 h-8 text-rose-700 inline" />
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                  Nexify DevOps Site Reliability Engineering
                </h1>
              </div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mt-1">
                Formal Root Cause Analysis (RCA) & Incident Telemetry Report
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                Centralized APM • OpenTelemetry Distributed Traces • SLA Availability Review
              </p>
            </div>
            <div className="text-right text-xs font-mono">
              <p className="font-bold text-slate-900">INCIDENT RCA #</p>
              <p className="text-sm font-black text-rose-800">RCA-NXF-2026-0920</p>
              <p className="text-[10px] text-slate-500 mt-1">Date: {new Date().toUTCString()}</p>
            </div>
          </div>
        </div>

        {/* Executive Incident KPI Summary */}
        <div className="grid grid-cols-4 gap-4 border border-slate-300 rounded-lg p-4 mb-6 text-xs bg-slate-50/50">
          <div>
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Fleet Error Rate</p>
            <p className="font-black text-slate-900 text-base">0.012% (Nominal)</p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Total Exceptions</p>
            <p className="font-bold text-slate-900 text-sm">{errors.length} Ingested</p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Mean Time to Detect</p>
            <p className="font-bold text-sky-800 text-sm">420 ms</p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Mean Time to Heal</p>
            <p className="font-bold text-emerald-800 text-sm">4.2 Minutes</p>
          </div>
        </div>

        {/* Itemized Exceptions Table */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-200 pb-1">
            Itemized Incident & Exception Registry
          </h3>
          <table className="w-full text-left text-[9pt] border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-800 font-mono text-[8pt]">
                <th className="py-1.5 px-2">ID</th>
                <th className="py-1.5 px-2">Microservice & Client</th>
                <th className="py-1.5 px-2">Severity</th>
                <th className="py-1.5 px-2">Exception Summary</th>
                <th className="py-1.5 px-2">Impact</th>
                <th className="py-1.5 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {errors.map((e) => (
                <tr key={e.id} className="font-mono">
                  <td className="py-2 px-2 font-bold text-slate-900">{e.id}</td>
                  <td className="py-2 px-2 font-sans text-[8pt]">
                    <div className="font-semibold text-slate-900">{e.service}</div>
                    <div className="text-slate-500 text-[7pt]">{e.client}</div>
                  </td>
                  <td className="py-2 px-2 font-bold text-[8pt]">
                    {e.severity}
                  </td>
                  <td className="py-2 px-2 text-[8pt] text-slate-700 max-w-[200px]">
                    {e.message}
                  </td>
                  <td className="py-2 px-2 text-[8pt] text-slate-600">
                    {e.occurrences} events ({e.impactedUsers} users)
                  </td>
                  <td className="py-2 px-2 font-bold text-[8pt]">
                    {e.resolved ? 'RESOLVED' : 'ACTIVE'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RCA Sign-Off */}
        <div className="border-t-2 border-slate-900 pt-6 mt-8">
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div>
              <p className="font-bold text-slate-900 mb-1">Preventative Action Plan:</p>
              <p className="text-[9pt] text-slate-600 leading-relaxed">
                All high-priority exceptions are mapped to sprint remediation backlog tickets. Automated circuit breakers and jitter buffers have been permanently activated to safeguard client SLA guarantees.
              </p>
            </div>
            <div className="flex flex-col justify-end items-end text-right">
              <div className="border-b border-slate-400 w-48 pb-1 mb-1 font-mono text-[9pt] font-bold text-slate-800">
                [Digitally Signed SRE Lead]
              </div>
              <p className="font-bold text-slate-900 text-[9pt]">Principal Site Reliability Engineer</p>
              <p className="text-[8pt] text-slate-500 font-mono">Nexify DevOps Control Plane</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
