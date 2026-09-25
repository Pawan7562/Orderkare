import React, { useState } from 'react';
import {
  Activity,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  ShieldCheck,
  Radio,
  ExternalLink,
  Plus,
  AlertOctagon,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '../context/ProjectContext';

interface SyntheticResult {
  projectId: string;
  url: string;
  status: 'ONLINE' | 'DEGRADED' | 'OUTAGE';
  httpCode: number;
  latencyMs: number;
  sslDaysRemaining: number;
  dnsResolvedIp: string;
  lastChecked: string;
}

interface IncidentItem {
  id: string;
  title: string;
  project: string;
  severity: 'P0_CRITICAL' | 'P1_MAJOR' | 'P2_MINOR';
  status: 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';
  impact: string;
  startedAt: string;
  resolvedAt?: string;
}

export const UptimeRadarPage: React.FC = () => {
  const { projects } = useProjects();
  const [isPingingAll, setIsPingingAll] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  // Synthetic pings state
  const [syntheticResults, setSyntheticResults] = useState<SyntheticResult[]>([
    {
      projectId: 'proj_pkthenexgenexam',
      url: 'https://www.pkthenexgenexam.xyz/',
      status: 'ONLINE',
      httpCode: 200,
      latencyMs: 24,
      sslDaysRemaining: 68,
      dnsResolvedIp: '172.67.149.208 (Cloudflare Proxy)',
      lastChecked: 'Just now',
    },
    {
      projectId: 'proj_orderkare',
      url: 'https://orderkare.co.in',
      status: 'ONLINE',
      httpCode: 200,
      latencyMs: 28,
      sslDaysRemaining: 74,
      dnsResolvedIp: '104.21.49.192 (Cloudflare Edge)',
      lastChecked: 'Just now',
    },
    {
      projectId: 'proj_nexus_crm',
      url: 'https://crm-staging.nexifyforge.com',
      status: 'ONLINE',
      httpCode: 200,
      latencyMs: 52,
      sslDaysRemaining: 45,
      dnsResolvedIp: '13.235.12.88 (AWS ap-south-1)',
      lastChecked: '1 min ago',
    },
    {
      projectId: 'proj_swiftdrop',
      url: 'https://swiftdrop.in',
      status: 'ONLINE',
      httpCode: 200,
      latencyMs: 34,
      sslDaysRemaining: 82,
      dnsResolvedIp: '76.76.21.21 (Vercel Edge)',
      lastChecked: '2 mins ago',
    },
  ]);

  // Incidents
  const [incidents, setIncidents] = useState<IncidentItem[]>([
    {
      id: 'inc_01',
      title: 'WebSocket Connection Pool Spike under Concurrent Batch Submission',
      project: 'PK The NexGen Exam Monitoring System',
      severity: 'P1_MAJOR',
      status: 'RESOLVED',
      impact: 'Invigilator video frame streaming experienced 80ms latency jitter for 4 minutes.',
      startedAt: '2026-09-19 22:15:00',
      resolvedAt: '2026-09-19 22:19:30',
    },
  ]);

  // New incident form
  const [incTitle, setIncTitle] = useState('');
  const [incProject, setIncProject] = useState(projects[0]?.name || 'PK The NexGen Exam Monitoring System');
  const [incSeverity, setIncSeverity] = useState<IncidentItem['severity']>('P1_MAJOR');
  const [incImpact, setIncImpact] = useState('');

  const handleRunSyntheticCheck = () => {
    setIsPingingAll(true);
    setTimeout(() => {
      setIsPingingAll(false);
      setSyntheticResults((prev) =>
        prev.map((r) => ({
          ...r,
          latencyMs: Math.floor(Math.random() * 20) + 18,
          lastChecked: 'Just now',
        }))
      );
    }, 600);
  };

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incTitle.trim()) return;
    const newInc: IncidentItem = {
      id: `inc_${Date.now()}`,
      title: incTitle.trim(),
      project: incProject,
      severity: incSeverity,
      status: 'INVESTIGATING',
      impact: incImpact.trim() || 'Minor degradation across edge nodes.',
      startedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    setIncidents([newInc, ...incidents]);
    setIncTitle('');
    setIncImpact('');
    setShowIncidentModal(false);
  };

  const handleResolveIncident = (id: string) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id
          ? {
              ...inc,
              status: 'RESOLVED',
              resolvedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
            }
          : inc
      )
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Uptime Radar & Incident War-Room</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              Global Synthetic Edge
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated 60-second synthetic health pings, SSL certificate countdown, and active incident response
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunSyntheticCheck}
            disabled={isPingingAll}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPingingAll ? 'animate-spin text-emerald-600' : 'text-slate-600'}`} />
            <span>{isPingingAll ? 'Pinging Nodes...' : 'Run Global Edge Ping'}</span>
          </button>

          <button
            onClick={() => setShowIncidentModal(true)}
            className="px-3.5 py-1.5 theme-btn-primary text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Declare Incident</span>
          </button>
        </div>
      </div>

      {/* ── Key SLA & Cluster Vitals Ribbon ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="enterprise-card rounded-2xl p-4 space-y-1">
          <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Fleet Global Uptime</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-lg font-bold text-emerald-700 font-mono">99.98%</span>
          </div>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1">
          <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Mean Response Time</p>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span className="text-lg font-bold text-slate-900 font-mono">28.5 ms</span>
          </div>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1">
          <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Active Probes</p>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-600" />
            <span className="text-lg font-bold text-purple-700 font-mono">4 Edge Regions</span>
          </div>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1">
          <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Open Incidents</p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-900 font-mono">
              {incidents.filter((i) => i.status !== 'RESOLVED').length} Active
            </span>
          </div>
        </div>
      </div>

      {/* ── Synthetic Health Radar (Live Client Probes) ── */}
      <div className="enterprise-card rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Synthetic Probe Network Status</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Pinging every 60s from AWS Mumbai (ap-south-1)</span>
        </div>

        <div className="space-y-3">
          {syntheticResults.map((r, idx) => {
            const proj = projects.find((p) => p.id === r.projectId);
            return (
              <div
                key={idx}
                className="p-4 bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-start md:items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-900">{proj?.name || r.projectId}</h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">
                        HTTP {r.httpCode} OK
                      </span>
                    </div>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-500 hover:text-emerald-700 font-mono flex items-center gap-1 mt-0.5"
                    >
                      <span>{r.url}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Latency</span>
                    <span className="text-emerald-700 font-bold">{r.latencyMs} ms</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">SSL Expiry</span>
                    <span className="text-slate-800 font-bold">{r.sslDaysRemaining} days</span>
                  </div>

                  <div className="hidden lg:block">
                    <span className="text-[10px] text-slate-400 uppercase block">DNS Edge IP</span>
                    <span className="text-slate-600 text-[11px]">{r.dnsResolvedIp}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block">Checked</span>
                    <span className="text-slate-500">{r.lastChecked}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Active Incident War-Room Timeline ── */}
      <div className="enterprise-card rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-emerald-600" />
            <span>Incident Response & Status Broadcasts</span>
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
            All Systems Operational
          </span>
        </div>

        <div className="space-y-3">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3 text-xs shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                      inc.severity === 'P0_CRITICAL'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {inc.severity}
                  </span>
                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                      inc.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                    }`}
                  >
                    {inc.status}
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs">{inc.title}</h4>
                </div>

                <div className="text-[10px] font-mono text-slate-400">
                  Started: {inc.startedAt} {inc.resolvedAt && `• Resolved: ${inc.resolvedAt}`}
                </div>
              </div>

              <p className="text-slate-600 bg-white p-3 rounded-lg border border-slate-200 font-sans leading-relaxed">
                <strong className="text-slate-800">Target System:</strong> {inc.project}
                <br />
                <strong className="text-slate-800">Impact Assessment:</strong> {inc.impact}
              </p>

              {inc.status !== 'RESOLVED' && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleResolveIncident(inc.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all cursor-pointer text-[11px]"
                  >
                    Mark as Resolved & Publish RCA
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Incident Modal ── */}
      <AnimatePresence>
        {showIncidentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIncidentModal(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md z-10 space-y-4 text-xs shadow-2xl"
            >
              <h3 className="text-sm font-bold text-slate-900">Declare Incident & Open War-Room</h3>
              <form onSubmit={handleCreateIncident} className="space-y-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Incident Title *</label>
                  <input
                    type="text"
                    required
                    value={incTitle}
                    onChange={(e) => setIncTitle(e.target.value)}
                    placeholder="e.g. Neon Database Pool Latency Elevation"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Target System</label>
                  <select
                    value={incProject}
                    onChange={(e) => setIncProject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Severity</label>
                  <select
                    value={incSeverity}
                    onChange={(e) => setIncSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none"
                  >
                    <option value="P0_CRITICAL">P0 Critical (Full Outage)</option>
                    <option value="P1_MAJOR">P1 Major (Degraded Latency)</option>
                    <option value="P2_MINOR">P2 Minor (Edge Feature Issue)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Impact Details</label>
                  <textarea
                    rows={3}
                    value={incImpact}
                    onChange={(e) => setIncImpact(e.target.value)}
                    placeholder="Describe impact to client end-users..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowIncidentModal(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold">
                    Broadcast Incident
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
