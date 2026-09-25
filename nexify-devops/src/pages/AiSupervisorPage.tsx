import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCcw,
  Zap,
  Terminal,
  Activity,
  Send,
  Clock,
  Check,
  X,
  RefreshCw,
  Cpu,
  Bot,
  Database,
  Lock,
  ArrowRight,
  Code,
  FileCode,
  Layers,
  Wrench,
  Globe,
  Radio,
  Server,
  Download,
  Key,
  Sliders,
  TrendingUp,
  Flame,
  Bug,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  ExternalLink,
  ShieldAlert,
  HardDrive,
  Copy,
  ChevronRight,
  FileText,
  AlertOctagon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '../context/ProjectContext';

type LlmEngine = 'claude-3-5-sonnet' | 'gpt-4o' | 'gemini-1-5-pro' | 'deepseek-v3' | 'llama-3-3-ollama';

interface AnomalyIncident {
  id: string;
  timestamp: string;
  projectId: string;
  projectName: string;
  layer: 'FRONTEND' | 'BACKEND' | 'DATABASE' | 'CI_CD_DEVOPS' | 'SECURITY' | 'WAF';
  title: string;
  severity: 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM';
  confidenceScore: number;
  rootCause: string;
  proposedFix: string;
  executableCodeOrSQL: string;
  actionType: 'SQL_MIGRATION' | 'RESTART_POOL' | 'ROLLBACK_RELEASE' | 'REPLAY_WEBHOOK' | 'FLUSH_CACHE' | 'ROTATE_SECRET' | 'WAF_RATE_LIMIT';
  status: 'PENDING_APPROVAL' | 'DRY_RUNNING' | 'EXECUTING' | 'RESOLVED' | 'REJECTED';
  safetyImpact: string;
  blastRadius: 'ISOLATED_TABLE' | 'SINGLE_POD' | 'REGION_EDGE' | 'ZERO_IMPACT';
  executionLogs?: string[];
  merkleAuditHash?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  toolCall?: {
    toolName: string;
    command: string;
    result: string;
    status: 'success' | 'running';
  };
  suggestedActions?: { label: string; action: () => void }[];
}

interface AgentWorker {
  id: string;
  name: string;
  role: string;
  icon: string;
  status: 'ACTIVE_SUPERVISING' | 'REMEDIATING' | 'STANDBY';
  tasksProcessed: number;
  lastAction: string;
  uptime: string;
  safetyScore: string;
}

export const AiSupervisorPage: React.FC = () => {
  const { projects, addDeployment, addTask } = useProjects();
  const [activeTab, setActiveTab] = useState<'radar' | 'chat' | 'db_optimizer' | 'pre_flight' | 'agent_swarm'>('radar');
  const [selectedEngine, setSelectedEngine] = useState<LlmEngine>('claude-3-5-sonnet');
  const [temperature, setTemperature] = useState(0.2);
  const [chatInput, setChatInput] = useState('');
  const [isChatThinking, setIsChatThinking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── Multi-Layer Anomalies State ──
  const [anomalies, setAnomalies] = useState<AnomalyIncident[]>([
    {
      id: 'ai_anom_01',
      timestamp: '2 mins ago',
      projectId: 'proj_pkthenexgenexam',
      projectName: 'PK The NexGen Exam Monitoring System',
      layer: 'DATABASE',
      title: 'Missing Composite Index on High-Frequency Table "ExamSession"',
      severity: 'P1_HIGH',
      confidenceScore: 99.4,
      rootCause:
        'Sequential scan detected on table ExamSession during 140+ concurrent candidate token validations. Query execution latency spiked to 480ms.',
      proposedFix:
        'Apply zero-downtime CONCURRENT index on (student_id, exam_id, status) and trigger statistical vacuuming.',
      executableCodeOrSQL:
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_examsession_student_status ON "ExamSession" (student_id, exam_id, status);\nANALYZE "ExamSession";',
      actionType: 'SQL_MIGRATION',
      status: 'PENDING_APPROVAL',
      safetyImpact: 'Safe • Executed CONCURRENTLY with zero table locking or downtime',
      blastRadius: 'ZERO_IMPACT',
      executionLogs: [],
      merkleAuditHash: '0x8f2a91c7820bbd342817349ab902ef10b9918a29',
    },
    {
      id: 'ai_anom_02',
      timestamp: '8 mins ago',
      projectId: 'proj_pkthenexgenexam',
      projectName: 'PK The NexGen Exam Monitoring System',
      layer: 'FRONTEND',
      title: 'WebRTC Video Stream WebSocket Jitter Buffer Saturation',
      severity: 'P1_HIGH',
      confidenceScore: 98.8,
      rootCause:
        'MediaStream binary frame queue buffer size exceeded browser memory threshold under concurrent invigilator multi-feed grid.',
      proposedFix:
        'Apply socket queue backpressure buffer, purge dead STUN descriptors, and enable client-side 15 FPS frame throttling.',
      executableCodeOrSQL:
        'socket.io.setBackpressureThreshold({ maxBufferSize: "512MB", dropStrategy: "oldest_unacked_frame" });\nwebrtcRelay.flushOrphanedDescriptors();',
      actionType: 'FLUSH_CACHE',
      status: 'PENDING_APPROVAL',
      safetyImpact: 'Safe • Live hotfix applying dynamic frame rate buffer in ~1.1s',
      blastRadius: 'SINGLE_POD',
      executionLogs: [],
      merkleAuditHash: '0x3c719e84bfa1098ec921a97d8164098bc1982631',
    },
    {
      id: 'ai_anom_03',
      timestamp: '15 mins ago',
      projectId: 'proj_orderkare',
      projectName: 'OrderKare Dining & QR SaaS',
      layer: 'BACKEND',
      title: 'PostgreSQL Serverless Connection Pool Saturation (88%)',
      severity: 'P1_HIGH',
      confidenceScore: 97.2,
      rootCause:
        'Kitchen audio soundbox worker maintained 4 idle-in-transaction connections past 60-second timeout threshold.',
      proposedFix:
        'Terminate idle-in-transaction sockets older than 60s and adjust Knex connection pool reaper settings.',
      executableCodeOrSQL:
        'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = \'idle in transaction\' AND state_change < current_timestamp - INTERVAL \'60 seconds\';',
      actionType: 'RESTART_POOL',
      status: 'PENDING_APPROVAL',
      safetyImpact: 'Safe • Reclaims 4 hung idle pool connections with zero active dining order disruption',
      blastRadius: 'ZERO_IMPACT',
      executionLogs: [],
      merkleAuditHash: '0x10b784a9e2837bc901a8c983427189fa98231764',
    },
    {
      id: 'ai_anom_04',
      timestamp: '45 mins ago',
      projectId: 'proj_swiftdrop',
      projectName: 'SwiftDrop Courier & Hyperlocal Logistics',
      layer: 'WAF',
      title: 'Suspicious Geohash GPS Replay Flood Detected on Edge PoP (Mumbai)',
      severity: 'P1_HIGH',
      confidenceScore: 99.1,
      rootCause:
        'Single IP subnet in AS13335 attempted 420 unauthorized geohash telemetry pushes/sec without valid JWT driver session nonce.',
      proposedFix:
        'Apply Cloudflare Layer-7 WAF dynamic rate limit rule & challenge suspicious ASN with JS proof-of-work.',
      executableCodeOrSQL:
        'cloudflare.rulesets.createRule({ action: "managed_challenge", expression: "ip.geoip.asnum eq 13335 and http.request.uri.path contains \'/driver/telemetry\'" });',
      actionType: 'WAF_RATE_LIMIT',
      status: 'PENDING_APPROVAL',
      safetyImpact: 'High Protection • Mitigates 420 RPS flood without blocking legitimate driver apps',
      blastRadius: 'REGION_EDGE',
      executionLogs: [],
      merkleAuditHash: '0x55d918c72839ba01f8934091c8901237a8910247',
    },
    {
      id: 'ai_anom_05',
      timestamp: '1 hour ago',
      projectId: 'proj_nexus_crm',
      projectName: 'Nexus Enterprise Multi-Tenant CRM',
      layer: 'DATABASE',
      title: 'Redis Geohash Spatial Index Memory Overhead Notice',
      severity: 'P2_MEDIUM',
      confidenceScore: 95.0,
      rootCause: 'Expired courier location geohash TTL keys were accumulating in Redis cluster.',
      proposedFix: 'Trigger automated lazy TTL eviction on expired rider coordinates.',
      executableCodeOrSQL: 'redis-cli EVAL "return redis.call(\'del\', unpack(redis.call(\'keys\', \'rider:geo:expired:*\')))" 0',
      actionType: 'FLUSH_CACHE',
      status: 'RESOLVED',
      safetyImpact: 'Completed • 14.2 MB RAM reclaimed',
      blastRadius: 'ZERO_IMPACT',
      executionLogs: [
        '[00:01] Connecting to Redis 7 Cluster (ap-south-1)...',
        '[00:02] Scanned 1,840 expired spatial keys.',
        '[00:03] Eviction complete. Reclaimed 14.2 MB memory.',
        '[00:04] Merkle Hash: 0x90a1827c19b02938a918237bca01928371982736',
      ],
      merkleAuditHash: '0x90a1827c19b02938a918237bca01928371982736',
    },
  ]);

  // ── Multi-Agent Swarm Registry ──
  const [agents, setAgents] = useState<AgentWorker[]>([
    {
      id: 'agent_sentinel',
      name: 'Sentinel SRE Agent',
      role: 'Telemetry Ingestion & Anomaly Detector',
      icon: '🛡️',
      status: 'ACTIVE_SUPERVISING',
      tasksProcessed: 1429,
      lastAction: 'Analyzed 12,400 logs in 14ms (0 alerts)',
      uptime: '99.99%',
      safetyScore: '99.8%',
    },
    {
      id: 'agent_dba',
      name: 'PostgreSQL & Redis DBA Agent',
      role: 'Index Synthesizer & Pool Optimizer',
      icon: '⚡',
      status: 'ACTIVE_SUPERVISING',
      tasksProcessed: 382,
      lastAction: 'Synthesized concurrent index for table ExamSession',
      uptime: '100%',
      safetyScore: '99.9%',
    },
    {
      id: 'agent_cyber',
      name: 'Cyber Threat & WAF Agent',
      role: 'Zero-Day Vulnerability & Rate Limiter',
      icon: '🔐',
      status: 'ACTIVE_SUPERVISING',
      tasksProcessed: 891,
      lastAction: 'Blocked 420 RPS flood on Mumbai Edge PoP',
      uptime: '100%',
      safetyScore: '100%',
    },
    {
      id: 'agent_pilot',
      name: 'Release & Canary Pilot Agent',
      role: 'Zero-Downtime Staged Deployment Gatekeeper',
      icon: '🚀',
      status: 'ACTIVE_SUPERVISING',
      tasksProcessed: 147,
      lastAction: 'Verified health probe across 4 Vercel Edge PoPs',
      uptime: '99.98%',
      safetyScore: '99.7%',
    },
    {
      id: 'agent_incident',
      name: 'Incident Commander Agent',
      role: 'Post-Mortem RCA & Task Dispatcher',
      icon: '📋',
      status: 'STANDBY',
      tasksProcessed: 94,
      lastAction: 'Generated cryptographic audit seal for hotfix #18',
      uptime: '100%',
      safetyScore: '100%',
    },
  ]);

  // ── AI Chat Conversation History ──
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_01',
      sender: 'ai',
      text: `🤖 **Greetings! I am the Nexify Autonomous Full-Stack AI SRE & Platform Engineer.**\n\nI operate with direct, authorized control plane access across:\n- **PostgreSQL 16 & Redis 7**: Execution plans, concurrent indexes, connection reapers.\n- **Backend Microservices**: Express, FastAPI, WebSockets, Celery workers.\n- **Frontend Edge**: Next.js 15, React 19, WebRTC MediaStream pipelines.\n- **CI/CD & Cloud Infrastructure**: Vercel Edge, Render, Docker containers, Cloudflare WAF.\n\nSelect any quick directive below or ask me to inspect, remediate, or scale any subsystem.`,
      timestamp: 'Just now',
    },
  ]);

  // ── Database Optimizations ──
  const [dbOptimizations, setDbOptimizations] = useState([
    {
      id: 'opt_1',
      project: 'PK The NexGen Exam Monitoring System',
      table: 'ExamSession',
      recommendation: 'Add Composite B-Tree Index on (student_id, exam_id, status)',
      speedup: '~4.8x faster query execution',
      costReduction: 'Estimated -38% CPU IOPS',
      sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_examsession_student_status ON "ExamSession"(student_id, exam_id, status);\nANALYZE "ExamSession";',
      status: 'READY',
      planAnalysis: 'Seq Scan cost=0.00..412.00 rows=142 width=84 -> Index Scan cost=0.28..8.30',
    },
    {
      id: 'opt_2',
      project: 'OrderKare Dining & QR SaaS',
      table: 'Order',
      recommendation: 'Partition orders by billing_month to accelerate analytics aggregations',
      speedup: '~3.2x faster dashboard queries',
      costReduction: 'Estimated -24% Memory Heap',
      sql: 'VACUUM ANALYZE "Order";\nREINDEX TABLE CONCURRENTLY "Order";',
      status: 'READY',
      planAnalysis: 'Dead tuples: 12.4% -> Reclaimed after vacuuming',
    },
    {
      id: 'opt_3',
      project: 'Nexus Enterprise Multi-Tenant CRM',
      table: 'ActivityLog',
      recommendation: 'Vacuum dead tuples and update PostgreSQL query planner statistics',
      speedup: '~2.1x lower memory overhead',
      costReduction: 'Estimated -15MB RAM',
      sql: 'VACUUM (VERBOSE, ANALYZE) "ActivityLog";',
      status: 'READY',
      planAnalysis: 'Planner stats updated: 100% accurate cardinality',
    },
  ]);

  // ── Pre-Flight Sanity Checks ──
  const [preFlightChecks, setPreFlightChecks] = useState([
    { name: 'TypeScript Strict Compilation & Null Checks', status: 'PASSED', latency: '0.4s', details: '0 type errors found across 2,410 modules' },
    { name: 'PostgreSQL Serverless Connection Pool SSL Handshake', status: 'PASSED', latency: '1.2ms', details: 'TLS 1.3 encrypted • 4 active / 30 max connections' },
    { name: 'TLS 1.3 Let\'s Encrypt SSL Expiration Radar', status: 'PASSED', latency: '68 days remaining', details: 'Auto-renewal configured via ACME Certbot' },
    { name: 'HMAC-SHA256 Webhook Signature Gatekeeper', status: 'PASSED', latency: '100% Verified', details: 'Razorpay, Stripe & WhatsApp webhooks verified' },
    { name: 'WebRTC MediaStream STUN/TURN Server Latency Probe', status: 'PASSED', latency: '18ms', details: 'ap-south-1 TURN relay nominal (0% packet drop)' },
    { name: 'Dependency Vulnerability CVE & Secret Exposure Scanner', status: 'PASSED', latency: '0.2s', details: '0 High/Critical CVEs • 0 exposed .env secrets' },
  ]);

  // ── Handlers ──
  const handleDryRunFix = (anomId: string) => {
    setAnomalies((prev) =>
      prev.map((a) =>
        a.id === anomId
          ? {
              ...a,
              status: 'DRY_RUNNING',
              executionLogs: [
                '[00:01] 🧪 Initializing Ephemeral Sandboxed Dry-Run Container...',
                `[00:02] Target schema snapshot: ${a.projectName}`,
                `[00:03] Parsing AST & SQL syntax: "${a.executableCodeOrSQL.split('\n')[0]}"`,
                '[00:04] Simulating concurrent read/write locks: 0 Lock Contention detected.',
                '[00:05] Blast radius verification: ZERO_IMPACT confirmed.',
                '[00:06] ✅ Dry-Run Simulation Passed with 100% Safety Score. Safe for production execution.',
              ],
            }
          : a
      )
    );
    showToast('Dry-run simulation completed in sandbox with 100% safety score!');
  };

  const handleApproveFix = (anomId: string) => {
    setAnomalies((prev) =>
      prev.map((a) =>
        a.id === anomId
          ? {
              ...a,
              status: 'EXECUTING',
              executionLogs: [
                ...(a.executionLogs || []),
                '[00:01] 🚀 Lead Developer authorization received. Initializing Production Runner...',
                `[00:02] Target cluster: ${a.projectName}`,
                `[00:03] Executing safe patch: ${a.executableCodeOrSQL.split('\n')[0]}`,
              ],
            }
          : a
      )
    );

    setTimeout(() => {
      setAnomalies((prev) =>
        prev.map((a) =>
          a.id === anomId
            ? {
                ...a,
                status: 'RESOLVED',
                executionLogs: [
                  ...(a.executionLogs || []),
                  '[00:05] Execution finished in 184ms with 0 downtime.',
                  '[00:06] Verified edge health probe (HTTP 200 OK • 22ms).',
                  `[00:07] Sealed action to Merkle Cryptographic Audit Trail (Hash: ${a.merkleAuditHash}).`,
                  '[00:08] 🎉 Hotfix successfully applied and confirmed on production cluster!',
                ],
              }
            : a
        )
      );
      showToast('AI Remediation Fix successfully applied & verified with 0 downtime!');
    }, 1800);
  };

  const handleRejectFix = (anomId: string) => {
    setAnomalies((prev) =>
      prev.map((a) => (a.id === anomId ? { ...a, status: 'REJECTED' } : a))
    );
    showToast('Remediation action dismissed.');
  };

  const handleApplyDbOptimization = (optId: string) => {
    setDbOptimizations((prev) =>
      prev.map((opt) => (opt.id === optId ? { ...opt, status: 'EXECUTING' } : opt))
    );
    setTimeout(() => {
      setDbOptimizations((prev) =>
        prev.map((opt) => (opt.id === optId ? { ...opt, status: 'APPLIED' } : opt))
      );
      showToast('SQL Optimization script executed successfully on database cluster!');
    }, 1400);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatInput('');
    setIsChatThinking(true);

    setTimeout(() => {
      setIsChatThinking(false);
      let aiReply = '';
      let toolCallData: ChatMessage['toolCall'] | undefined;
      const lower = userText.toLowerCase();

      if (lower.includes('exam') || lower.includes('webrtc') || lower.includes('pk')) {
        toolCallData = {
          toolName: 'diagnostics.analyzeSystem',
          command: 'inspectCluster("proj_pkthenexgenexam", { inspectDb: true, inspectWebRTC: true })',
          result: 'Status: 200 OK • 24ms • 142 Active WebRTC Streams • DB Pool: 4/30 Connections • SSL: 68 Days',
          status: 'success',
        };
        aiReply = `📊 **PK The NexGen Exam Monitoring System Deep Inspection**:
- **Frontend / Next.js 15**: Live at https://www.pkthenexgenexam.xyz/ (Status: 200 OK)
- **WebRTC AI Vision Engine**: 142 Active candidate proctoring sessions connected. Frame jitter nominal @ 16ms.
- **Database (Neon PostgreSQL 16)**: Memory heap stable at 48MB. 1 Missing composite index is ready for 0-downtime execution.
- **CI/CD Pipeline**: Vercel production edge synchronized @ commit hash \`e49a1bc\`.`;
      } else if (lower.includes('orderkare') || lower.includes('restaurant') || lower.includes('dining')) {
        toolCallData = {
          toolName: 'db.inspectConnectionPool',
          command: 'inspectPool("proj_orderkare")',
          result: 'Pool Size: 12/30 • Idle in transaction: 0 • Mean query latency: 18.4ms',
          status: 'success',
        };
        aiReply = `🍽️ **OrderKare Dining & QR SaaS Status**:
- **Production API**: Live on Render (\`https://orderkare-3.onrender.com/api/health\`) • 38ms
- **Customer Web**: Live on Vercel (\`https://orderkare.co.in\`) • 24ms
- **PostgreSQL Database**: 12 active pools, 0 deadlocks. Kitchen audio soundbox event bus is nominal.`;
      } else if (lower.includes('fix') || lower.includes('database') || lower.includes('sql') || lower.includes('index')) {
        toolCallData = {
          toolName: 'db.executeConcurrentPatch',
          command: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_examsession_student_status ON "ExamSession"(student_id, exam_id, status);',
          result: 'Index created concurrently in 184ms with zero table locking.',
          status: 'success',
        };
        aiReply = `🛠️ **Database Remediation Plan Formulated & Executed**:
I have executed the missing composite index patch on table \`ExamSession\`. Query execution time has dropped from **480ms** to **24ms** with zero lock contention.`;
      } else if (lower.includes('deploy') || lower.includes('vercel') || lower.includes('render')) {
        toolCallData = {
          toolName: 'cicd.triggerCloudRelease',
          command: 'dispatchDeployWebhook({ target: "VERCEL", project: "PK The NexGen Exam", version: "v3.2.0" })',
          result: 'Vercel Deployment Build Initiated. Live Edge verification probe: Passed (200 OK).',
          status: 'success',
        };
        aiReply = `🚀 **CI/CD Cloud Release Dispatched**:
- **Target**: Vercel Production Edge
- **Commit**: \`c81a9f0\` (Lead Architect)
- **Status**: Live & Verified across 4 edge regions in 24 seconds.`;
      } else if (lower.includes('security') || lower.includes('soc2') || lower.includes('waf') || lower.includes('cve')) {
        toolCallData = {
          toolName: 'security.runFullAuditor',
          command: 'scanVulnerabilitiesAndWaf()',
          result: '0 High/Critical CVEs • Cloudflare WAF active • SOC 2 Trust Services Score: 98.4%',
          status: 'success',
        };
        aiReply = `🛡️ **Security & SOC 2 Full-Spectrum Audit Complete**:
- **Cloudflare Layer-7 WAF**: Active. 420 RPS replay flood challenged on Mumbai Edge PoP.
- **HMAC Signatures**: 100% verified on all inbound webhooks.
- **Secrets Vault**: All 24 keys encrypted with AES-256-GCM. 0 exposed tokens.`;
      } else {
        toolCallData = {
          toolName: 'system.globalSanityCheck',
          command: 'auditAllFleets()',
          result: 'All 4 Client Fleets Healthy • Global Uptime: 99.98% • 0 Critical Outages',
          status: 'success',
        };
        aiReply = `🤖 **Full-Stack Fleet Inspection**:
All 4 client workspaces (*PK The NexGen Exam*, *OrderKare*, *Nexus CRM*, *SwiftDrop*) are operating nominally. Database connection pools, SSL certificates, and edge caching are synchronized.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now() + 1}`,
          sender: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          toolCall: toolCallData,
        },
      ]);
    }, 750);
  };

  const pendingCount = anomalies.filter((a) => a.status === 'PENDING_APPROVAL').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white border border-slate-700 text-xs font-semibold shadow-2xl flex items-center gap-3"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Page Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-slate-900">
                  Autonomous AI Developer & Site Reliability Engineer (AI SRE)
                </h1>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-black flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Production Grade v4.2</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Multi-agent autonomous supervisor diagnosing, sandboxing, and hotfixing Database, Microservices, WebRTC, and CI/CD pipelines
              </p>
            </div>
          </div>
        </div>

        {/* LLM Engine Selector & Parameter Controls */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 px-2">
            <Cpu className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-[11px] font-bold text-slate-700">Model:</span>
          </div>
          <select
            value={selectedEngine}
            onChange={(e) => setSelectedEngine(e.target.value as LlmEngine)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-slate-800 outline-none cursor-pointer focus:border-purple-500"
          >
            <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (SRE Specialist)</option>
            <option value="gpt-4o">GPT-4o (Real-Time Function Calling)</option>
            <option value="gemini-1-5-pro">Gemini 1.5 Pro (1M Token Context)</option>
            <option value="deepseek-v3">DeepSeek-V3 (Reasoning & Code)</option>
            <option value="llama-3-3-ollama">Llama 3.3 (Local On-Premises)</option>
          </select>
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 text-[10px] font-mono text-slate-500">
            <span>Latency: <strong className="text-emerald-700 font-bold">218ms</strong></span>
            <span>Cache: <strong className="text-purple-700 font-bold">92.4%</strong></span>
          </div>
        </div>
      </div>

      {/* ── Top Metric Ribbon ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="enterprise-card rounded-2xl p-4 space-y-1">
          <p className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center justify-between">
            <span>Autonomous Engine</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-slate-900 font-mono">5 Active Swarms</span>
          </div>
          <p className="text-[10px] text-emerald-700 font-semibold font-mono">Zero Unresolved Outages</p>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1">
          <p className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center justify-between">
            <span>Approval Queue</span>
            <Lock className="w-3.5 h-3.5 text-amber-600" />
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-slate-900 font-mono">{pendingCount} Actionable</span>
          </div>
          <p className="text-[10px] text-amber-700 font-semibold font-mono">Human Gate Required</p>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1">
          <p className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center justify-between">
            <span>Hotfixes Deployed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-emerald-800 font-mono">24 Applied</span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold font-mono">0 Rollbacks • 100% SLA</p>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1">
          <p className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center justify-between">
            <span>Mean Time To Remediate</span>
            <Zap className="w-3.5 h-3.5 text-purple-600" />
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-black text-purple-800 font-mono">1.18s</span>
          </div>
          <p className="text-[10px] text-purple-700 font-semibold font-mono">Sandbox Verified</p>
        </div>
      </div>

      {/* ── Tab Switcher Bar ── */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-semibold overflow-x-auto shadow-inner">
        <button
          onClick={() => setActiveTab('radar')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'radar' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-600" />
          <span>Autonomous Anomaly Radar</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'chat' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4 text-purple-600" />
          <span>AI SRE Terminal Copilot</span>
        </button>

        <button
          onClick={() => setActiveTab('db_optimizer')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'db_optimizer' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4 text-blue-600" />
          <span>PostgreSQL 16 & Redis Optimizer</span>
        </button>

        <button
          onClick={() => setActiveTab('pre_flight')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'pre_flight' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>CI/CD Pre-Flight Gatekeeper</span>
        </button>

        <button
          onClick={() => setActiveTab('agent_swarm')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'agent_swarm' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Agent Swarm Orchestrator</span>
        </button>
      </div>

      {/* ── 1. ANOMALY RADAR TAB ── */}
      {activeTab === 'radar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <span>Active Neural Anomaly Detection & Sandbox Dry-Run Fixes</span>
              </h3>
              <p className="text-xs text-slate-500">
                Inspect AI diagnoses across Database, Backend, Frontend, and Cloud WAF with full SQL/code patch previews and sandbox execution
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {anomalies.map((anom) => (
              <div
                key={anom.id}
                className={`enterprise-card rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm transition-all border-l-4 ${
                  anom.status === 'RESOLVED'
                    ? 'border-l-emerald-500 bg-slate-50/50'
                    : anom.status === 'EXECUTING'
                    ? 'border-l-purple-500 bg-purple-50/20'
                    : anom.status === 'DRY_RUNNING'
                    ? 'border-l-blue-500 bg-blue-50/20'
                    : 'border-l-amber-500 bg-white'
                }`}
              >
                {/* Anomaly Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        anom.severity === 'P0_CRITICAL'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : anom.severity === 'P1_HIGH'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {anom.severity}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      LAYER: {anom.layer}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{anom.projectName}</span>
                    <span className="text-[10px] font-mono text-slate-400">• {anom.timestamp}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                      AI Confidence: {anom.confidenceScore}%
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        anom.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : anom.status === 'EXECUTING'
                          ? 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse'
                          : anom.status === 'DRY_RUNNING'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {anom.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Root Cause Analysis */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">{anom.title}</h4>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-sans text-slate-700 leading-relaxed">
                    <strong className="text-slate-900 font-mono uppercase text-[10px] block mb-1">
                      🔍 AI Root Cause Analysis (RCA):
                    </strong>
                    {anom.rootCause}
                  </div>
                </div>

                {/* Proposed Code / SQL Diff */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Proposed Remediation Script / SQL Patch:</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Blast Radius: {anom.blastRadius}</span>
                  </div>
                  <pre className="p-3.5 bg-slate-900 text-emerald-400 border border-slate-800 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed shadow-inner">
                    {anom.executableCodeOrSQL}
                  </pre>
                  <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                    <span className="text-emerald-700 font-bold">Safety: {anom.safetyImpact}</span>
                    {anom.merkleAuditHash && (
                      <span className="text-slate-400">Merkle Hash: {anom.merkleAuditHash.substring(0, 14)}...</span>
                    )}
                  </div>
                </div>

                {/* Execution Terminal */}
                {anom.executionLogs && anom.executionLogs.length > 0 && (
                  <div className="bg-slate-950 text-slate-300 p-4 rounded-xl font-mono text-[11px] space-y-1 border border-slate-800">
                    <span className="text-slate-500 uppercase text-[9px] block mb-1">Live Execution Trace:</span>
                    {anom.executionLogs.map((log, lidx) => (
                      <p key={lidx} className="leading-relaxed">
                        {log}
                      </p>
                    ))}
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {anom.status === 'PENDING_APPROVAL'
                      ? '🔒 Permission Gate: Requires Lead Developer approval to dispatch'
                      : anom.status === 'DRY_RUNNING'
                      ? '🧪 Sandbox container verifying 0 table lock risk...'
                      : anom.status === 'RESOLVED'
                      ? '✅ Hotfix applied and sealed to Immutable Audit Trail'
                      : '⚙️ Executing hotfix on production cluster...'}
                  </span>

                  {(anom.status === 'PENDING_APPROVAL' || anom.status === 'DRY_RUNNING') && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRejectFix(anom.id)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDryRunFix(anom.id)}
                        className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        <span>Sandbox Dry-Run</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveFix(anom.id)}
                        className="px-4 py-2 theme-btn-primary rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        <span>Authorize & Execute Fix</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 2. AI SRE COPILOT TERMINAL TAB ── */}
      {activeTab === 'chat' && (
        <div className="enterprise-card rounded-2xl p-5 shadow-sm space-y-4 flex flex-col h-[640px]">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-600" />
              <span className="font-bold text-xs text-slate-900">Nexify AI SRE Terminal Copilot</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold">
                Function Calling Active (PostgreSQL, Redis, Vercel, Render)
              </span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-3 text-xs ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center shrink-0 font-black text-xs shadow-md">
                    AI
                  </div>
                )}
                <div
                  className={`p-4 rounded-2xl max-w-[85%] sm:max-w-[78%] leading-relaxed space-y-2.5 ${
                    m.sender === 'user' ? 'bg-slate-900 text-white font-medium shadow-md' : 'bg-slate-50 border border-slate-200 text-slate-800'
                  }`}
                >
                  {/* Tool Call Output Box */}
                  {m.toolCall && (
                    <div className="bg-slate-950 text-emerald-400 p-3 rounded-xl font-mono text-[10px] space-y-1.5 border border-slate-800 mb-2">
                      <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1">
                        <span className="font-bold text-slate-300">TOOL_CALL: {m.toolCall.toolName}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          SUCCESS
                        </span>
                      </div>
                      <p className="text-slate-300 font-semibold">{m.toolCall.command}</p>
                      <p className="text-emerald-400 pt-1 text-[10px]">{m.toolCall.result}</p>
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <span className={`text-[9px] font-mono block text-right mt-1 ${m.sender === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isChatThinking && (
              <div className="flex gap-2.5 items-center text-xs font-mono text-purple-700 bg-purple-50 p-3.5 rounded-2xl border border-purple-200 max-w-sm">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                <span>AI SRE synthesizing AST execution trace & logs...</span>
              </div>
            )}
          </div>

          {/* Quick Directives */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-400 font-mono text-[10px]">Directives:</span>
            {[
              'Diagnose PK The NexGen Exam WebRTC streams',
              'Inspect OrderKare PostgreSQL connection pool',
              'Fix slow database queries and add missing indexes',
              'Run full-spectrum SOC 2 & WAF security audit',
              'Deploy latest release to Vercel and probe health',
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setChatInput(p)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 rounded-lg text-[11px] font-medium transition-all cursor-pointer border border-slate-200"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Give natural language commands (e.g., 'Check database deadlocks on OrderKare' or 'Verify SOC2 readiness')..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-purple-500 focus:bg-white transition-all font-medium"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Execute</span>
            </button>
          </form>
        </div>
      )}

      {/* ── 3. DATABASE OPTIMIZER TAB ── */}
      {activeTab === 'db_optimizer' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span>Automated PostgreSQL 16 & Redis Query Optimizer</span>
              </h3>
              <p className="text-xs text-slate-500">
                AI computes EXPLAIN ANALYZE cost matrices, estimates CPU savings, and generates concurrent zero-downtime indexes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dbOptimizations.map((opt) => (
              <div key={opt.id} className="enterprise-card rounded-2xl p-5 flex flex-col justify-between space-y-3 shadow-sm">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                      Table: {opt.table}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold">{opt.speedup}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{opt.project}</h4>
                  <p className="text-[11px] text-slate-600">{opt.recommendation}</p>
                  
                  <div className="p-2.5 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[10px] space-y-1 overflow-x-auto">
                    <p className="text-slate-400 text-[9px]">EXPLAIN PLAN:</p>
                    <p>{opt.planAnalysis}</p>
                    <div className="h-px bg-slate-800 my-1" />
                    <p className="text-emerald-300">{opt.sql}</p>
                  </div>
                  <p className="text-[10px] font-mono text-purple-700 font-semibold">{opt.costReduction}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">Zero Table Locking</span>
                  <button
                    type="button"
                    onClick={() => handleApplyDbOptimization(opt.id)}
                    disabled={opt.status === 'APPLIED' || opt.status === 'EXECUTING'}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      opt.status === 'APPLIED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : opt.status === 'EXECUTING'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200 animate-pulse'
                        : 'theme-btn-primary'
                    }`}
                  >
                    {opt.status === 'APPLIED' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Applied</span>
                      </>
                    ) : opt.status === 'EXECUTING' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Executing...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Apply Optimization</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. PRE-FLIGHT SANITY CHECKER TAB ── */}
      {activeTab === 'pre_flight' && (
        <div className="enterprise-card rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Automated Pre-Deployment Flight Verification</span>
              </h3>
              <p className="text-xs text-slate-500">
                Verifies AST breaking changes, connection pool encryption, Let's Encrypt certificates, and CVE exposure before cloud releases
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              6/6 Pre-Flight Checks Passed
            </span>
          </div>

          <div className="space-y-3">
            {preFlightChecks.map((chk, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">{chk.name}</span>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{chk.details}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 font-mono text-xs shrink-0 self-end sm:self-center">
                  <span className="text-slate-500">{chk.latency}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {chk.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. AGENT SWARM ORCHESTRATOR TAB ── */}
      {activeTab === 'agent_swarm' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Autonomous Multi-Agent Swarm Orchestrator</span>
              </h3>
              <p className="text-xs text-slate-500">
                5 specialized autonomous agents cooperating in real-time across observability, database optimization, WAF security, and canary releases
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div key={agent.id} className="enterprise-card rounded-2xl p-5 space-y-3 shadow-sm flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{agent.icon}</span>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{agent.name}</h4>
                        <p className="text-[10px] text-slate-500 font-mono">{agent.role}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {agent.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-1">
                    <p className="text-slate-400 text-[10px]">LAST AUTONOMOUS ACTION:</p>
                    <p className="text-slate-800 font-semibold">{agent.lastAction}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-500">Processed: <strong className="text-slate-800">{agent.tasksProcessed}</strong></span>
                  <span className="text-emerald-700 font-bold">Safety: {agent.safetyScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
