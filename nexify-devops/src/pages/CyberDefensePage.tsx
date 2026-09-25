import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  AlertTriangle,
  Lock,
  Unlock,
  Radio,
  Eye,
  Terminal,
  Zap,
  CheckCircle2,
  RefreshCw,
  Bell,
  Ban,
  Filter,
  Search,
  Globe,
  Activity,
  Play,
  Check,
  X,
  ExternalLink,
  Flame,
  KeyRound,
  FileCode,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '../context/ProjectContext';

interface ThreatEvent {
  id: string;
  timestamp: string;
  targetProject: string;
  projectId: string;
  attackVector: 'SQL_INJECTION' | 'BRUTE_FORCE_AUTH' | 'DDOS_FLOOD' | 'XSS_PAYLOAD' | 'EXAM_FEED_TAMPER' | 'TOKEN_FORGERY';
  sourceIp: string;
  geoLocation: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  confidenceScore: number;
  targetedEndpoint: string;
  attackPayloadSnippet: string;
  automatedActionTaken: string;
  requiresHighImpactApproval: boolean;
  approvalActionName?: string;
  status: 'AUTO_BLOCKED' | 'PENDING_APPROVAL' | 'CONTAINED' | 'DISMISSED';
}

export const CyberDefensePage: React.FC = () => {
  const { projects } = useProjects();
  const [activeTab, setActiveTab] = useState<'live_threats' | 'ip_blacklist' | 'waf_rules' | 'alerts_config'>('live_threats');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [toast, setToast] = useState<string | null>(null);

  // Live Threat Ingestion Stream
  const [threats, setThreats] = useState<ThreatEvent[]>([
    {
      id: 'threat_901',
      timestamp: 'Just now',
      targetProject: 'PK The NexGen Exam Monitoring System',
      projectId: 'proj_pkthenexgenexam',
      attackVector: 'EXAM_FEED_TAMPER',
      sourceIp: '185.220.101.44',
      geoLocation: 'Frankfurt, Germany (Known Tor Exit Node)',
      severity: 'CRITICAL',
      confidenceScore: 99.4,
      targetedEndpoint: '/api/v1/proctoring/stream/token',
      attackPayloadSnippet: '{"candidateId": "9921", "authSignature": "tampered_jwt_signature_forgery_00x"}',
      automatedActionTaken: 'AI WAF rejected forged candidate token & quarantined exam session #sess_9921.',
      requiresHighImpactApproval: true,
      approvalActionName: 'Ban Tor Subnet (185.220.101.0/24) on Cloudflare Edge',
      status: 'PENDING_APPROVAL',
    },
    {
      id: 'threat_902',
      timestamp: '3 mins ago',
      targetProject: 'OrderKare Dining & QR SaaS',
      projectId: 'proj_orderkare',
      attackVector: 'SQL_INJECTION',
      sourceIp: '45.154.255.89',
      geoLocation: 'Amsterdam, Netherlands',
      severity: 'CRITICAL',
      confidenceScore: 99.8,
      targetedEndpoint: '/api/v1/restaurants/login',
      attackPayloadSnippet: "email=admin%27+OR+1%3D1+--&password=super_secret_bypass",
      automatedActionTaken: 'Parameterized query layer dropped payload • Source IP jailed in Cloudflare WAF for 24h.',
      requiresHighImpactApproval: false,
      status: 'AUTO_BLOCKED',
    },
    {
      id: 'threat_903',
      timestamp: '12 mins ago',
      targetProject: 'PK The NexGen Exam Monitoring System',
      projectId: 'proj_pkthenexgenexam',
      attackVector: 'DDOS_FLOOD',
      sourceIp: '103.142.12.0/24 (Botnet Pool)',
      geoLocation: 'Distributed (28 Zombie Nodes)',
      severity: 'HIGH',
      confidenceScore: 97.6,
      targetedEndpoint: '/api/v1/exam/questions/batch',
      attackPayloadSnippet: '2,400 synthetic requests/sec trying to exhaust PostgreSQL database connection pool.',
      automatedActionTaken: 'AI Adaptive Rate-Limiting engaged • Dropped 94% abnormal traffic bursts at edge.',
      requiresHighImpactApproval: true,
      approvalActionName: 'Enable Cloudflare "Under Attack" Turnstile Challenge for 1 Hour',
      status: 'PENDING_APPROVAL',
    },
    {
      id: 'threat_904',
      timestamp: '35 mins ago',
      targetProject: 'Nexus Enterprise Multi-Tenant CRM',
      projectId: 'proj_nexus_crm',
      attackVector: 'BRUTE_FORCE_AUTH',
      sourceIp: '194.26.29.112',
      geoLocation: 'Bucharest, Romania',
      severity: 'HIGH',
      confidenceScore: 98.2,
      targetedEndpoint: '/api/v1/auth/login',
      attackPayloadSnippet: '120 credential stuffing attempts against tenant accounts in 60 seconds.',
      automatedActionTaken: 'Triggered 15-minute account lock on targeted tenant • IP blacklisted.',
      requiresHighImpactApproval: false,
      status: 'AUTO_BLOCKED',
    },
  ]);

  // Blocked IP Blacklist
  const [bannedIps, setBannedIps] = useState([
    { ip: '45.154.255.89', reason: 'SQL Injection on OrderKare Login', bannedAt: '2026-09-20 02:42:00', duration: '24 Hours', threatCount: 14 },
    { ip: '194.26.29.112', reason: 'Brute Force Credential Stuffing', bannedAt: '2026-09-20 02:10:00', duration: 'Permanent', threatCount: 120 },
    { ip: '89.248.163.50', reason: 'Malicious Vulnerability Scanner (Nikto/Acunetix)', bannedAt: '2026-09-19 23:15:00', duration: '7 Days', threatCount: 450 },
  ]);

  // WAF Security Rules
  const [wafRules, setWafRules] = useState([
    { id: 'rule_1', name: 'AI SQL Injection Deep Payload Inspection', status: 'ENFORCED', layer: 'DATABASE_FIREWALL' },
    { id: 'rule_2', name: 'WebRTC Anti-Cheat Token Cryptographic Signature Verification', status: 'ENFORCED', layer: 'EXAM_PROCTORING' },
    { id: 'rule_3', name: 'Adaptive DDoS Rate-Limiting (Max 60 req/min per IP)', status: 'ENFORCED', layer: 'EDGE_NETWORK' },
    { id: 'rule_4', name: 'Tor Exit Node & Anonymizer High-Risk Challenge', status: 'ENFORCED', layer: 'ACCESS_CONTROL' },
    { id: 'rule_5', name: 'HMAC SHA256 Payment Webhook Replay Protection', status: 'ENFORCED', layer: 'FINTECH_SECURITY' },
  ]);

  const [newIpToBan, setNewIpToBan] = useState('');
  const [banReason, setBanReason] = useState('');

  const handleApproveHighImpact = (threatId: string) => {
    setThreats((prev) =>
      prev.map((t) => (t.id === threatId ? { ...t, status: 'CONTAINED' } : t))
    );
    setToast('High-Impact Defense Authorized: Edge Firewall updated & IP Subnet isolated across Cloudflare network!');
    setTimeout(() => setToast(null), 3500);
  };

  const handleDismissThreat = (threatId: string) => {
    setThreats((prev) =>
      prev.map((t) => (t.id === threatId ? { ...t, status: 'DISMISSED' } : t))
    );
    setToast('Threat dismissed.');
    setTimeout(() => setToast(null), 2500);
  };

  const handleManualBanIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpToBan.trim()) return;
    setBannedIps([
      {
        ip: newIpToBan.trim(),
        reason: banReason.trim() || 'Manual Administrator Security Ban',
        bannedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        duration: 'Permanent',
        threatCount: 1,
      },
      ...bannedIps,
    ]);
    setNewIpToBan('');
    setBanReason('');
    setToast(`IP ${newIpToBan} successfully added to Global Edge Blacklist!`);
    setTimeout(() => setToast(null), 3000);
  };

  const filteredThreats = threats.filter((t) => {
    const matchesSearch =
      t.targetProject.toLowerCase().includes(search.toLowerCase()) ||
      t.attackVector.toLowerCase().includes(search.toLowerCase()) ||
      t.sourceIp.toLowerCase().includes(search.toLowerCase()) ||
      t.targetedEndpoint.toLowerCase().includes(search.toLowerCase());
    const matchesSev = severityFilter === 'ALL' || t.severity === severityFilter;
    return matchesSearch && matchesSev;
  });

  const pendingApprovalsCount = threats.filter((t) => t.status === 'PENDING_APPROVAL').length;

  return (
    <div className="space-y-6 pb-12">
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

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-rose-500/25">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  AI Cyber Defense, WAF & SIEM Threat Radar
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3 text-rose-600" />
                  <span>Real-Time Active Shield</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                AI-assisted threat detection monitoring SQL injection, DDoS, brute-force auth, WebRTC stream tampering & automated IP quarantine
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('live_threats')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'live_threats' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Live Threat Radar</span>
            {pendingApprovalsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-[10px] font-mono font-bold">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ip_blacklist')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'ip_blacklist' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ban className="w-3.5 h-3.5 text-amber-600" />
            <span>IP Blacklist & Jail</span>
          </button>

          <button
            onClick={() => setActiveTab('waf_rules')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'waf_rules' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>WAF Rules Engine</span>
          </button>
        </div>
      </div>

      {/* ── Cyber Defense KPI Ribbon ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="enterprise-card rounded-2xl p-4 space-y-1">
          <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Fleet Shield Status</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-lg font-bold text-emerald-700 font-mono">100% Protected</span>
          </div>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1">
          <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Attacks Blocked (24h)</p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-lg font-bold text-slate-900 font-mono">148 Dropped</span>
          </div>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1">
          <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">High-Impact Approvals</p>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600" />
            <span className="text-lg font-bold text-rose-700 font-mono">{pendingApprovalsCount} Awaiting Authorization</span>
          </div>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1">
          <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Real-Time Notification Dispatch</p>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-purple-700 font-mono">Telegram/Discord/Email Active</span>
          </div>
        </div>
      </div>

      {/* ── 1. LIVE THREAT RADAR TAB ── */}
      {activeTab === 'live_threats' && (
        <div className="space-y-4">
          <div className="enterprise-card rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search threat vector, IP, project, endpoint..."
                className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 outline-none focus:border-rose-500 focus:bg-white transition-all font-medium"
              />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer focus:border-rose-500 focus:bg-white transition-all font-medium w-full sm:w-auto"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Threats</option>
              <option value="HIGH">High Severity</option>
            </select>
          </div>

          <div className="space-y-4">
            {filteredThreats.map((t) => (
              <div
                key={t.id}
                className={`enterprise-card rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm transition-all border-l-4 ${
                  t.status === 'CONTAINED'
                    ? 'border-l-emerald-500 bg-slate-50/50'
                    : t.status === 'AUTO_BLOCKED'
                    ? 'border-l-blue-500 bg-white'
                    : 'border-l-rose-500 bg-rose-50/20'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        t.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {t.severity}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                      VECTOR: {t.attackVector.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{t.targetProject}</span>
                    <span className="text-[10px] font-mono text-slate-400">• {t.timestamp}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                      AI Threat Score: {t.confidenceScore}%
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        t.status === 'AUTO_BLOCKED' || t.status === 'CONTAINED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                      }`}
                    >
                      {t.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Threat Forensic Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase">Attacker IP & Location</span>
                    <p className="font-bold text-slate-900">{t.sourceIp} ({t.geoLocation})</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase">Targeted Microservice Route</span>
                    <p className="font-bold text-rose-700">{t.targetedEndpoint}</p>
                  </div>
                </div>

                {/* Attack Forensic Payload */}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-rose-600" />
                    <span>Intercepted Malicious Forensic Payload:</span>
                  </span>
                  <pre className="p-3 bg-slate-900 text-rose-400 border border-slate-800 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
                    {t.attackPayloadSnippet}
                  </pre>
                </div>

                {/* Automated Defense Status */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-xs flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-900 block font-sans">Automated AI Defense Action:</strong>
                    <p className="text-slate-700 font-mono text-[11px] mt-0.5">{t.automatedActionTaken}</p>
                  </div>
                </div>

                {/* High-Impact Authorization Required */}
                {t.requiresHighImpactApproval && t.status === 'PENDING_APPROVAL' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-amber-600" />
                        <span>High-Impact Defense Action Awaiting Your Authorization:</span>
                      </span>
                      <span className="text-[10px] font-mono text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded">
                        Requires Administrator Signature
                      </span>
                    </div>

                    <p className="text-slate-800 font-mono text-xs bg-white p-2.5 rounded-lg border border-amber-200 font-bold">
                      {t.approvalActionName}
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleDismissThreat(t.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleApproveHighImpact(t.id)}
                        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        <span>Authorize Defense & Ban Subnet</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 2. IP BLACKLIST TAB ── */}
      {activeTab === 'ip_blacklist' && (
        <div className="space-y-6">
          {/* Add Manual Ban Form */}
          <div className="enterprise-card rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-600" />
              <span>Manually Quarantine IP Address or CIDR Subnet</span>
            </h3>

            <form onSubmit={handleManualBanIp} className="flex flex-col sm:flex-row items-stretch gap-3">
              <input
                type="text"
                required
                value={newIpToBan}
                onChange={(e) => setNewIpToBan(e.target.value)}
                placeholder="e.g. 185.220.101.44 or 185.220.0.0/16"
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 outline-none focus:border-rose-500 focus:bg-white"
              />
              <input
                type="text"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Reason for security ban..."
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-rose-500 focus:bg-white"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Enforce Edge Ban</span>
              </button>
            </form>
          </div>

          {/* Blacklisted IPs Table */}
          <div className="enterprise-card rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Active Edge Quarantine Blacklist ({bannedIps.length})</h3>
              <span className="text-[10px] font-mono text-slate-400">Synchronized across Cloudflare & AWS WAF</span>
            </div>

            <div className="divide-y divide-slate-100 font-mono text-xs">
              {bannedIps.map((b, idx) => (
                <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-700 text-sm">{b.ip}</span>
                      <span className="text-[9px] px-2 py-0.2 rounded bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                        {b.duration}
                      </span>
                    </div>
                    <p className="text-slate-600 font-sans text-xs">{b.reason}</p>
                    <p className="text-[10px] text-slate-400">Banned at: {b.bannedAt} • Intercepted Attacks: {b.threatCount}</p>
                  </div>

                  <button
                    onClick={() => {
                      setBannedIps(bannedIps.filter((_, i) => i !== idx));
                      setToast(`Unbanned IP ${b.ip}`);
                      setTimeout(() => setToast(null), 2500);
                    }}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer self-start sm:self-center"
                  >
                    Unban IP
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. WAF RULES ENGINE TAB ── */}
      {activeTab === 'waf_rules' && (
        <div className="enterprise-card rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Active Web Application Firewall (WAF) Rule Policies</span>
              </h3>
              <p className="text-xs text-slate-500">Zero-day exploit mitigation and automated perimeter defense</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              5/5 Rules Enforced
            </span>
          </div>

          <div className="space-y-3">
            {wafRules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{rule.name}</h4>
                    <span className="text-[10px] font-mono text-slate-500">Security Layer: {rule.layer}</span>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] font-mono">
                  {rule.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
