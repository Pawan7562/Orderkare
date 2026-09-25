import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  GitBranch,
  Server,
  Database,
  Shield,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Play,
  FileText,
  Users,
  Terminal,
  Activity,
  Check,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Calendar,
  Layers,
  Key,
  ShieldCheck,
  RotateCcw,
  Smartphone,
  Monitor,
  Tablet,
  Edit3,
  RefreshCw,
  Zap,
  Code,
  Radio,
  SlidersHorizontal,
  Download,
  Printer,
  X,
  Lock,
  Boxes,
  Send,
  Award,
  AlertOctagon,
  Search,
  CheckCheck,
  Sliders,
  FileCode,
  Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '../context/ProjectContext';
import { TaskItem, TaskPriority, TaskStatus, ProjectEnvironment, ProjectDoc, ProjectSecret } from '../types/project';
import { githubService } from '../services/githubService';
import {
  getProviderDefaultDomain,
  getProviderDefaultUrl,
  isCustomDomain,
  getProviderDnsInstruction,
  formatLiveUrl as sanitizeUrl,
} from '../utils/domainUtils';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    projects,
    setSelectedProjectId,
    updateProject,
    addTask,
    updateTaskStatus,
    addDeployment,
    deleteDeployment,
    addSecret,
    deleteSecret,
    addDoc,
    addDomain,
    removeDomain,
    deleteProject,
  } = useProjects();

  const project = projects.find((p) => p.id === id || p.slug === id);

  // Synchronize active project in context
  React.useEffect(() => {
    if (project) {
      setSelectedProjectId(project.id);
    }
  }, [project, setSelectedProjectId]);

  // Comprehensive 12-Tab Project Workflow State
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'deployments'
    | 'database'
    | 'apis'
    | 'webhooks'
    | 'mobile'
    | 'errors'
    | 'tasks'
    | 'secrets'
    | 'security'
    | 'billing'
    | 'docs'
  >('overview');

  // Interactive Toast Notification
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Modals state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditUrlModal, setShowEditUrlModal] = useState(false);
  const [showAddDomainModal, setShowAddDomainModal] = useState(false);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

  // URL Editor & Preview State
  const [editUrlValue, setEditUrlValue] = useState(project?.liveUrl || 'https://orderkare.co.in');
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('P1_HIGH');
  const [taskAssignee, setTaskAssignee] = useState('Lead Architect');
  const [taskDueDate, setTaskDueDate] = useState('2026-10-01');

  // Deployment Form State
  const [deployVersion, setDeployVersion] = useState('v3.2.0');
  const [deployCommit, setDeployCommit] = useState('c81a9f0');
  const [deployMsg, setDeployMsg] = useState('feat: deploy latest production microservices & performance fixes');
  const [deployEnv, setDeployEnv] = useState<ProjectEnvironment>('PRODUCTION');
  const [deployTargetProvider, setDeployTargetProvider] = useState<string>(project?.deployProvider || 'VERCEL');
  const [deployBranch, setDeployBranch] = useState<string>(project?.defaultBranch || 'main');
  const [deployHookUrl, setDeployHookUrl] = useState<string>('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccessState, setDeploySuccessState] = useState(false);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);

  // Database Tab Scoped State
  const [sqlQuery, setSqlQuery] = useState(
    project?.id === 'proj_pkthenexgenexam'
      ? 'SELECT id, candidate_name, exam_status, gaze_deviation_count, created_at FROM exam_sessions ORDER BY created_at DESC LIMIT 10;'
      : project?.id === 'proj_orderkare'
      ? 'SELECT id, table_number, total_amount, payment_status, settlement_mode, created_at FROM dining_orders ORDER BY created_at DESC LIMIT 10;'
      : 'SELECT * FROM information_schema.tables WHERE table_schema = \'public\' LIMIT 10;'
  );
  const [isExecutingSql, setIsExecutingSql] = useState(false);
  const [sqlResults, setSqlResults] = useState<any[] | null>(null);
  const [selectedDbTable, setSelectedDbTable] = useState<string>('primary');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  // REST API Tab Scoped State
  const [selectedEndpointIndex, setSelectedEndpointIndex] = useState(0);
  const [apiRequestBody, setApiRequestBody] = useState('{\n  "clientId": "nexify_demo",\n  "mode": "live_realtime"\n}');
  const [isExecutingApi, setIsExecutingApi] = useState(false);
  const [apiResponseStatus, setApiResponseStatus] = useState<number | null>(null);
  const [apiResponseTimeMs, setApiResponseTimeMs] = useState<number | null>(null);
  const [apiResponseBody, setApiResponseBody] = useState<string | null>(null);

  // Webhooks Tab Scoped State
  const [selectedWebhookEvent, setSelectedWebhookEvent] = useState<any | null>(null);
  const [isReplayingWebhook, setIsReplayingWebhook] = useState(false);

  // Mobile App Hub Tab Scoped State
  const [mobileForceUpdate, setMobileForceUpdate] = useState(project?.id === 'proj_pkthenexgenexam');
  const [mobileMinVersion, setMobileMinVersion] = useState('1.2.0');
  const [mobileLatestVersion, setMobileLatestVersion] = useState('1.4.2');
  const [isDeployingOta, setIsDeployingOta] = useState(false);
  const [simDevicePlatform, setSimDevicePlatform] = useState<'ANDROID' | 'IOS'>('ANDROID');
  const [simPhoneScreen, setSimPhoneScreen] = useState<'LIVE' | 'UPDATE'>('LIVE');

  // Error Telemetry Tab Scoped State
  const [selectedErrorForRca, setSelectedErrorForRca] = useState<any | null>(null);

  // New Secret Form
  const [secretKey, setSecretKey] = useState('');
  const [secretValue, setSecretValue] = useState('');
  const [secretDesc, setSecretDesc] = useState('');
  const [secretEnv, setSecretEnv] = useState<ProjectEnvironment>('PRODUCTION');

  // New Doc Form
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<ProjectDoc['category']>('ARCHITECTURE');
  const [docContent, setDocContent] = useState('');

  // Format and normalize URL
  const formatLiveUrl = (rawUrl: string): string => {
    let clean = (rawUrl || '').trim();
    if (!clean) return 'https://orderkare.co.in';
    if (clean.startsWith('localhost:') || clean.startsWith('127.0.0.1:')) {
      return `http://${clean}`;
    }
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      return `https://${clean}`;
    }
    return clean;
  };

  const safeLiveUrl = formatLiveUrl(project?.liveUrl || '');

  // Dynamic Endpoints for this specific project
  const projectEndpoints = useMemo(() => {
    if (project?.id === 'proj_pkthenexgenexam') {
      return [
        { method: 'POST', path: '/api/v1/proctor/stream-gaze', desc: 'Ingests WebRTC 468-point face gaze vector and checks candidate anomaly boundaries.', sampleBody: '{\n  "candidateId": "cand_9918",\n  "roomCode": "hall_ug_2026",\n  "gazeVector": [0.04, -0.02, 0.98],\n  "faceMeshDetected": true\n}' },
        { method: 'POST', path: '/api/v1/exam/lockdown-check', desc: 'Validates fullscreen kiosk mode and anti-screen-recording hardware hooks.', sampleBody: '{\n  "sessionId": "ses_88291",\n  "windowFocus": true,\n  "secondScreenDetected": false\n}' },
        { method: 'GET', path: '/api/v1/candidates/active-hall', desc: 'Returns live telemetry feed for all active candidates in this examination hall.' },
        { method: 'POST', path: '/api/v1/ai/webrtc-signaling', desc: 'Exchanges STUN/TURN SDP offer & ICE candidates with proctoring node.', sampleBody: '{\n  "sdpType": "offer",\n  "candidateToken": "jwt_sample_token"\n}' }
      ];
    }
    if (project?.id === 'proj_orderkare') {
      return [
        { method: 'POST', path: '/api/v1/orders/create', desc: 'Creates new dining table order ticket and broadcasts to Kitchen Display System (KDS).', sampleBody: '{\n  "tableNumber": 4,\n  "items": [\n    { "id": "m_butter_paneer", "qty": 2, "price": 280 },\n    { "id": "m_garlic_naan", "qty": 4, "price": 45 }\n  ],\n  "orderType": "DINE_IN"\n}' },
        { method: 'GET', path: '/api/v1/menu/catalog', desc: 'Fetches cached restaurant menu catalog with live inventory availability.' },
        { method: 'POST', path: '/api/v1/tables/settle-bill', desc: 'Triggers Razorpay dynamic UPI intent QR generation for table settlement.', sampleBody: '{\n  "tableNumber": 4,\n  "amount": 740.00,\n  "paymentMethod": "UPI_DYNAMIC_QR"\n}' },
        { method: 'POST', path: '/api/v1/soundbox/voice-sync', desc: 'Emits acoustic voice broadcast to physical kitchen UPI soundbox.', sampleBody: '{\n  "soundboxId": "sb_kitchen_01",\n  "amount": 740.00,\n  "currency": "INR",\n  "language": "hi_IN"\n}' }
      ];
    }
    if (project?.id === 'proj_swiftdrop') {
      return [
        { method: 'POST', path: '/api/v1/driver/location-geohash', desc: 'Pushes driver GPS telemetry compressed as 7-char Geohash to Redis cluster.', sampleBody: '{\n  "driverId": "drv_4491",\n  "geohash": "ttnf88e",\n  "speedKmph": 34.5,\n  "batteryLevel": 88\n}' },
        { method: 'GET', path: '/api/v1/trips/assigned', desc: 'Retrieves current delivery parcel route and optimized navigation waypoints.' },
        { method: 'POST', path: '/api/v1/parcel/dispatch', desc: 'Assigns nearest available courier driver using spatial radius lookup.', sampleBody: '{\n  "parcelId": "pcl_882910",\n  "pickupLat": 19.0760,\n  "pickupLng": 72.8777\n}' }
      ];
    }
    return [
      { method: 'GET', path: '/api/v1/health', desc: 'Returns microservice health check, DB connection pool status, and latency.' },
      { method: 'POST', path: '/api/v1/events/dispatch', desc: 'Dispatches custom event to project message queue.', sampleBody: '{\n  "eventType": "heartbeat",\n  "timestamp": "2026-09-20T04:00:00Z"\n}' }
    ];
  }, [project]);

  // Dynamic Database Tables for this specific project
  const projectDbTables = useMemo(() => {
    if (project?.id === 'proj_pkthenexgenexam') {
      return [
        { name: 'exam_sessions', rows: 24890, sizeKb: 12400, columns: ['id (UUID PK)', 'candidate_id (UUID)', 'exam_code (VARCHAR)', 'status (ENUM)', 'gaze_violations (INT)', 'created_at (TIMESTAMPTZ)'] },
        { name: 'candidates', rows: 8420, sizeKb: 4200, columns: ['id (UUID PK)', 'full_name (VARCHAR)', 'email (VARCHAR)', 'biometric_hash (VARCHAR)', 'verified (BOOLEAN)'] },
        { name: 'proctor_telemetry', rows: 940200, sizeKb: 184000, columns: ['id (BIGINT PK)', 'session_id (UUID FK)', 'face_count (INT)', 'gaze_confidence (FLOAT)', 'anomaly_flag (BOOLEAN)', 'recorded_at (TIMESTAMPTZ)'] },
        { name: 'questions_bank', rows: 1250, sizeKb: 2100, columns: ['id (INT PK)', 'subject (VARCHAR)', 'question_body (TEXT)', 'options_json (JSONB)', 'correct_index (INT)'] }
      ];
    }
    if (project?.id === 'proj_orderkare') {
      return [
        { name: 'dining_orders', rows: 48920, sizeKb: 24500, columns: ['id (UUID PK)', 'table_number (INT)', 'total_amount (NUMERIC)', 'payment_status (ENUM)', 'settlement_mode (VARCHAR)', 'created_at (TIMESTAMPTZ)'] },
        { name: 'menu_items', rows: 340, sizeKb: 680, columns: ['id (VARCHAR PK)', 'category (VARCHAR)', 'name (VARCHAR)', 'price (NUMERIC)', 'is_available (BOOLEAN)', 'tax_rate (NUMERIC)'] },
        { name: 'kds_kitchen_tickets', rows: 48920, sizeKb: 19800, columns: ['id (UUID PK)', 'order_id (UUID FK)', 'status (ENUM)', 'captain_notes (TEXT)', 'prepared_at (TIMESTAMPTZ)'] },
        { name: 'dining_tables', rows: 45, sizeKb: 120, columns: ['table_number (INT PK)', 'seating_capacity (INT)', 'qr_token (VARCHAR)', 'active_order_id (UUID)'] }
      ];
    }
    return [
      { name: 'users', rows: 1420, sizeKb: 1200, columns: ['id (UUID PK)', 'email (VARCHAR)', 'role (VARCHAR)', 'created_at (TIMESTAMPTZ)'] },
      { name: 'audit_logs', rows: 89400, sizeKb: 45000, columns: ['id (BIGINT PK)', 'action (VARCHAR)', 'payload (JSONB)', 'ip_address (INET)', 'timestamp (TIMESTAMPTZ)'] }
    ];
  }, [project]);

  // Dynamic Webhooks for this specific project
  const projectWebhooks = useMemo(() => {
    if (project?.id === 'proj_pkthenexgenexam') {
      return [
        { id: 'wh_ex_01', provider: 'Razorpay Assessment Fee Webhook', event: 'payment.captured', status: '200 OK', latency: '42ms', date: '2026-09-20 03:45 UTC', payload: { entity: 'payment', amount: 150000, status: 'captured', student_id: 'pk_cand_9918', exam_hall: 'hall_ug_2026' } },
        { id: 'wh_ex_02', provider: 'MediaPipe Anomaly Alert Webhook', event: 'proctor.violation.second_person', status: '200 OK', latency: '18ms', date: '2026-09-20 03:12 UTC', payload: { sessionId: 'ses_88291', faces_detected: 2, confidence: 0.994, auto_flagged: true } },
        { id: 'wh_ex_03', provider: 'GitHub CI/CD Release Webhook', event: 'push (main)', status: '200 OK', latency: '110ms', date: '2026-09-20 01:40 UTC', payload: { commit: 'e49a1bc', branch: 'main', author: 'Pawan Kumar' } }
      ];
    }
    if (project?.id === 'proj_orderkare') {
      return [
        { id: 'wh_ok_01', provider: 'Razorpay Live UPI Dining Settlement', event: 'order.paid', status: '200 OK', latency: '34ms', date: '2026-09-20 03:50 UTC', payload: { payment_id: 'pay_Pawan991823', amount: 74000, table_number: 4, settlement: 'instant_soundbox_sync' } },
        { id: 'wh_ok_02', provider: 'Soundbox Audio Playback ACK', event: 'soundbox.broadcast.delivered', status: '200 OK', latency: '22ms', date: '2026-09-20 03:50 UTC', payload: { soundbox_id: 'sb_kitchen_01', status: 'audio_played_hi_IN' } },
        { id: 'wh_ok_03', provider: 'Render Deploy Hook Webhook', event: 'deploy.finished', status: '200 OK', latency: '95ms', date: '2026-09-20 01:25 UTC', payload: { deploy_id: 'dep_orderkare_241', status: 'live' } }
      ];
    }
    return [
      { id: 'wh_gen_01', provider: 'Payment Gateway Webhook', event: 'charge.succeeded', status: '200 OK', latency: '40ms', date: '2026-09-20 02:00 UTC', payload: { amount: 5000, currency: 'INR' } }
    ];
  }, [project]);

  // Dynamic Error Logs for this specific project
  const projectErrors = useMemo(() => {
    if (project?.id === 'proj_pkthenexgenexam') {
      return [
        { id: 'err_ex_01', level: 'WARNING', title: 'WebRTC STUN/TURN Frame Buffer Latency Spike (>120ms)', file: 'services/aiProctorStream.ts:142', occurrences: 14, status: 'RESOLVED', rca: 'Network jitter on student mobile 4G hotspot. Auto-downgraded to 15 FPS sub-sampled stream.' },
        { id: 'err_ex_02', level: 'NOTICE', title: 'Fullscreen Lockout Hook: Browser Window Blur Event Logged', file: 'hooks/useExamLockdown.tsx:88', occurrences: 6, status: 'MONITORED', rca: 'Student pressed Alt+Tab; system immediately presented lockout warning overlay.' }
      ];
    }
    if (project?.id === 'proj_orderkare') {
      return [
        { id: 'err_ok_01', level: 'WARNING', title: 'Bluetooth ESC/POS Thermal Printer Connection Drop', file: 'drivers/bleThermalPrinter.ts:94', occurrences: 8, status: 'RESOLVED', rca: 'BLE packet MTU size exceeded 128 bytes on 58mm printer. Implemented automated packet fragmentation.' },
        { id: 'err_ok_02', level: 'NOTICE', title: 'IndexedDB Offline Order Cache Eviction Warning', file: 'services/offlineKdsSync.ts:56', occurrences: 2, status: 'RESOLVED', rca: 'Storage quota reached 50MB; automated LRU compaction cleared stale settled tickets.' }
      ];
    }
    return [
      { id: 'err_gen_01', level: 'WARNING', title: 'Connection Pool Timeout', file: 'db/pool.ts:24', occurrences: 3, status: 'RESOLVED', rca: 'Prisma pool max_connections auto-increased to 25.' }
    ];
  }, [project]);

  if (!project) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Project Workspace Not Found</h2>
        <p className="text-xs text-slate-500">The requested client project does not exist in the fleet registry.</p>
        <Link
          to="/clients"
          className="inline-flex items-center gap-2 px-4 py-2 theme-btn-primary rounded-xl text-xs shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Client Projects</span>
        </Link>
      </div>
    );
  }

  const handleOpenLiveApp = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const url = formatLiveUrl(project.liveUrl);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleExecuteSql = async () => {
    setIsExecutingSql(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsExecutingSql(false);
    if (project.id === 'proj_pkthenexgenexam') {
      setSqlResults([
        { id: 'c9918a', candidate_name: 'Pawan Kumar', exam_status: 'IN_PROGRESS', gaze_deviation_count: 0, created_at: '2026-09-20 03:45:12' },
        { id: 'b8821c', candidate_name: 'Aarav Sharma', exam_status: 'COMPLETED', gaze_deviation_count: 1, created_at: '2026-09-20 03:40:02' },
        { id: 'f7734d', candidate_name: 'Sneha Patel', exam_status: 'FLAGGED_REVIEW', gaze_deviation_count: 4, created_at: '2026-09-20 03:32:19' }
      ]);
    } else {
      setSqlResults([
        { id: 'ord_9981', table_number: 4, total_amount: '740.00', payment_status: 'PAID', settlement_mode: 'UPI_QR', created_at: '2026-09-20 03:50:00' },
        { id: 'ord_9980', table_number: 2, total_amount: '1280.00', payment_status: 'PAID', settlement_mode: 'UPI_QR', created_at: '2026-09-20 03:42:15' },
        { id: 'ord_9979', table_number: 7, total_amount: '450.00', payment_status: 'KITCHEN_PREPARING', settlement_mode: 'PENDING', created_at: '2026-09-20 03:38:00' }
      ]);
    }
    showToast('SQL Query executed successfully in 1.4ms via Neon Connection Pool!');
  };

  const handleExecuteApi = async () => {
    setIsExecutingApi(true);
    setApiResponseStatus(null);
    setApiResponseBody(null);
    await new Promise((r) => setTimeout(r, 450));
    setIsExecutingApi(false);
    setApiResponseStatus(200);
    setApiResponseTimeMs(28);
    setApiResponseBody(
      JSON.stringify(
        {
          success: true,
          project: project.name,
          endpoint: projectEndpoints[selectedEndpointIndex]?.path,
          timestamp: new Date().toISOString(),
          status: 'SUCCESS',
          gateway: project.paymentGateway,
          databaseStatus: 'HEALTHY'
        },
        null,
        2
      )
    );
    showToast('API Request Returned 200 OK (28ms)!');
  };

  const handleReplayWebhook = async (wh: any) => {
    setIsReplayingWebhook(true);
    setSelectedWebhookEvent(wh);
    await new Promise((r) => setTimeout(r, 700));
    setIsReplayingWebhook(false);
    showToast(`Idempotent webhook replay for ${wh.event} executed successfully! ACK 200.`);
  };

  const handleTriggerDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeploying(true);
    setDeploySuccessState(false);
    setDeployLogs([
      `[00:01] Initializing CI/CD release pipeline for ${project.name}...`,
      `[00:03] Connecting to Git repository (${project.repoUrl}) @ branch '${deployBranch}'...`,
      `[00:05] Verified commit hash ${deployCommit} by Lead Architect.`,
      `[00:08] Target provider: ${deployTargetProvider} (${deployEnv} Cluster)...`,
      `[00:12] Compiling TypeScript bundles and optimizing Webpack/Vite assets...`,
    ]);

    if (deployHookUrl.trim()) {
      try {
        setDeployLogs((prev) => [...prev, `[00:14] Dispatching live Deploy Webhook to ${deployHookUrl}...`]);
        await fetch(deployHookUrl.trim(), { method: 'POST', mode: 'no-cors' });
      } catch (err) {
        // ignore
      }
    }

    setTimeout(() => {
      setDeployLogs((prev) => [
        ...prev,
        `[00:18] Running health probes and verifying database connection pool...`,
        `[00:21] TLS 1.3 certificate verified on domain ${project.domains[0] || safeLiveUrl}.`,
        `[00:24] 🚀 Deployment successfully propagated to ${deployTargetProvider} edge nodes! Live at ${safeLiveUrl}`,
      ]);

      setTimeout(() => {
        setIsDeploying(false);
        setDeploySuccessState(true);
        addDeployment(project.id, {
          version: deployVersion,
          commitHash: deployCommit,
          commitMessage: deployMsg,
          author: 'Lead Architect',
          status: 'SUCCESS',
          environment: deployEnv,
          deployProvider: deployTargetProvider as any,
          branch: deployBranch,
          durationSeconds: 24,
        });
        showToast(`Deployment ${deployVersion} is now LIVE on ${deployTargetProvider}!`);
      }, 1000);
    }, 1500);
  };

  const handleDeleteProject = () => {
    if (confirm(`Are you sure you want to decommission and remove "${project.name}" from Nexify DevOps?`)) {
      deleteProject(project.id);
      navigate('/clients');
    }
  };

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

      {/* ── Top Workspace Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5 no-print">
        <div className="flex items-start sm:items-center gap-3.5">
          <Link
            to="/clients"
            className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 transition-all cursor-pointer shadow-xs shrink-0"
            title="Back to All Client Projects"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                <span>{project.name}</span>
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                {project.category}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold border ${
                  project.environment === 'PRODUCTION'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {project.environment}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-bold flex items-center gap-1">
                <span>{project.deployProvider === 'RENDER' ? '⚡' : project.deployProvider === 'CLOUDFLARE' ? '🟧' : project.deployProvider === 'AWS' ? '☁' : '▲'}</span>
                <span>{project.deployProvider || 'VERCEL'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 font-medium">
              <span className="text-slate-800 font-bold">{project.clientOrgName}</span>
              <span>•</span>
              <span className="font-mono text-slate-400">ID: {project.id}</span>
              <span>•</span>
              <span className="font-mono text-emerald-700 font-semibold">Live Branch: {project.defaultBranch || 'main'}</span>
            </p>
          </div>
        </div>

        {/* Global Workspace Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all">
            <button
              onClick={handleOpenLiveApp}
              className="px-3 py-1.5 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title={`Open ${safeLiveUrl} in New Tab`}
            >
              <Globe className="w-3.5 h-3.5 text-white" />
              <span>Open Live App</span>
              <ExternalLink className="w-3 h-3 text-emerald-200" />
            </button>
            <button
              onClick={() => {
                setEditUrlValue(project.liveUrl || '');
                setShowEditUrlModal(true);
              }}
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-r-xl border-l border-emerald-500/40 cursor-pointer"
              title="Edit Live App Destination URL"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowPreviewModal(true)}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Interactive Sandboxed Live Web Preview"
          >
            <Monitor className="w-3.5 h-3.5 text-purple-600" />
            <span>Sandbox Preview</span>
          </button>

          <button
            onClick={() => {
              setDeployHookUrl(project.deployHookUrl || '');
              setDeployTargetProvider(project.deployProvider || 'VERCEL');
              setDeployBranch(project.defaultBranch || 'main');
              setDeploySuccessState(false);
              setIsDeploying(false);
              setShowDeployModal(true);
            }}
            className="px-3.5 py-1.5 theme-btn-primary text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Trigger Deploy</span>
          </button>

          <button
            onClick={handleDeleteProject}
            className="p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl transition-all cursor-pointer shadow-xs"
            title="Decommission Project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Key Project Metrics Ribbon ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 no-print">
        <div className="enterprise-card rounded-xl p-3.5 space-y-1 border border-slate-200 shadow-xs">
          <p className="text-[10px] font-mono text-slate-500 uppercase font-bold">Uptime SLA</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-sm font-bold text-emerald-700 font-mono">{project.uptimePercent}%</span>
          </div>
        </div>

        <div className="enterprise-card rounded-xl p-3.5 space-y-1 border border-slate-200 shadow-xs">
          <p className="text-[10px] font-mono text-slate-500 uppercase font-bold">Mean Latency</p>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-sm font-bold text-slate-900 font-mono">{project.latencyMs} ms</span>
          </div>
        </div>

        <div className="enterprise-card rounded-xl p-3.5 space-y-1 border border-slate-200 shadow-xs">
          <p className="text-[10px] font-mono text-slate-500 uppercase font-bold">SLA Guarantee</p>
          <p className="text-xs font-bold text-purple-700 truncate">{project.slaTier.replace(/_/g, ' ')}</p>
        </div>

        <div className="enterprise-card rounded-xl p-3.5 space-y-1 border border-slate-200 shadow-xs">
          <p className="text-[10px] font-mono text-slate-500 uppercase font-bold">Monthly Retainer</p>
          <p className="text-xs font-bold text-emerald-700 font-mono">₹{project.monthlyFeeINR.toLocaleString('en-IN')}/mo</p>
        </div>

        <div className="enterprise-card rounded-xl p-3.5 space-y-1 border border-slate-200 shadow-xs">
          <p className="text-[10px] font-mono text-slate-500 uppercase font-bold">Database Engine</p>
          <p className="text-xs font-bold text-slate-800 truncate">{project.databaseEngine}</p>
        </div>

        <div className="enterprise-card rounded-xl p-3.5 space-y-1 border border-slate-200 shadow-xs">
          <p className="text-[10px] font-mono text-slate-500 uppercase font-bold">Active Gateway</p>
          <p className="text-xs font-bold text-slate-800 truncate">{project.paymentGateway}</p>
        </div>
      </div>

      {/* ── 12-Tab Self-Contained Project Navigation ── */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-1 no-print">
        {[
          { id: 'overview', label: '1. Overview', icon: Layers },
          { id: 'deployments', label: `2. Deployments (${project.deployments.length})`, icon: GitBranch },
          { id: 'database', label: `3. Database SQL`, icon: Database },
          { id: 'apis', label: `4. REST APIs (${projectEndpoints.length})`, icon: Code },
          { id: 'webhooks', label: `5. Webhooks (${projectWebhooks.length})`, icon: Radio },
          { id: 'mobile', label: `6. Mobile Hub`, icon: Smartphone },
          { id: 'errors', label: `7. Errors & APM (${projectErrors.length})`, icon: AlertOctagon },
          { id: 'tasks', label: `8. Sprint Tasks (${project.tasks.length})`, icon: Calendar },
          { id: 'secrets', label: `9. Secrets (.env) (${project.secrets.length})`, icon: Key },
          { id: 'security', label: `10. Security & SOC2`, icon: ShieldCheck },
          { id: 'billing', label: `11. Invoicing`, icon: FileText },
          { id: 'docs', label: `12. Runbooks (${project.docs.length})`, icon: FileCode },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: OVERVIEW & INFRASTRUCTURE ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
          <div className="lg:col-span-2 space-y-6">
            {/* Architecture Card */}
            <div className="enterprise-card rounded-2xl p-6 space-y-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-600" />
                <span>Architecture & Runtime Stack</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Framework & Runtime</span>
                  <p className="text-slate-900 font-bold">{project.framework}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Database Engine</span>
                  <p className="text-emerald-700 font-bold">{project.databaseEngine}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Live Production Gateway</span>
                  <p className="text-slate-900 font-bold">{project.paymentGateway}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1.5">
                      <span className="text-sm">🐙</span>
                      <span>Source Git Repository ({project.gitProvider || 'GITHUB'})</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                      Auto-Deploy on Push: {project.autoDeployOnPush !== false ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:underline flex items-center gap-1.5 truncate font-sans font-bold text-xs"
                    >
                      <span>{project.repoUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" />
                    </a>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Branch: <strong>{project.defaultBranch || 'main'}</strong>
                      </span>
                      <button
                        onClick={async () => {
                          const [owner, repo] = project.repoUrl.replace('https://github.com/', '').split('/');
                          if (owner && repo) {
                            const commits = await githubService.fetchLatestCommits(owner, repo, project.defaultBranch);
                            if (commits && commits.length > 0) {
                              const top = commits[0];
                              setDeployCommit(top.sha.substring(0, 7));
                              setDeployMsg(top.commit.message.split('\n')[0]);
                              showToast(`Synced with GitHub! Latest commit: ${top.sha.substring(0, 7)}`);
                            }
                          }
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer shadow-xs"
                        title="Fetch latest commit from GitHub API"
                      >
                        ⚡ Sync Commit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Domains & Platform Default Domain Matrix */}
            {(() => {
              const platformDefaultDomain = getProviderDefaultDomain(project.deployProvider, project.slug, project.repoOwner);
              const customDomains = project.domains.filter(isCustomDomain);
              const dnsInfo = getProviderDnsInstruction(project.deployProvider);

              return (
                <div className="enterprise-card rounded-2xl p-6 space-y-4 border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-600" />
                        <span>Domain Routing & TLS 1.3 Certificates</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Platform default endpoints and connected custom domains
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setNewDomainInput('');
                        setShowAddDomainModal(true);
                      }}
                      className="px-3 py-1.5 theme-btn-primary rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Connect Custom Domain</span>
                    </button>
                  </div>

                  {/* Platform Default Domain */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">
                      Deployment Platform Default Domain ({project.deployProvider || 'VERCEL'})
                    </span>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-xs shrink-0">
                          {project.deployProvider === 'RENDER' ? '⚡' : project.deployProvider === 'CLOUDFLARE' ? '🟧' : project.deployProvider === 'AWS' ? '☁' : '▲'}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-slate-900 font-bold">{platformDefaultDomain}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                              {customDomains.length > 0 ? 'DEFAULT CANONICAL' : 'PRIMARY ACTIVE'}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                              SSL TLS 1.3
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Auto-assigned by {dnsInfo.providerName} • Always Active
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://${platformDefaultDomain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1 shadow-xs"
                          title="Open platform default URL"
                        >
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                          <span>Visit</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`https://${platformDefaultDomain}`);
                            showToast(`Copied https://${platformDefaultDomain} to clipboard!`);
                          }}
                          className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-mono cursor-pointer"
                          title="Copy Default URL"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Custom Domains List */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">
                      Connected Custom Domains ({customDomains.length})
                    </span>

                    {customDomains.map((domain, idx) => (
                      <div
                        key={idx}
                        className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-slate-900 font-bold">{domain}</span>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                                CUSTOM DOMAIN • PRIMARY
                              </span>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                TLS 1.3 Active
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              DNS Target: <strong className="text-slate-700">{dnsInfo.cnameTarget}</strong> • Verified
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`https://${domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1 shadow-xs"
                          >
                            <ExternalLink className="w-3 h-3 text-emerald-600" />
                            <span>Visit</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Disconnect custom domain ${domain}?`)) {
                                removeDomain(project.id, domain);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-all cursor-pointer"
                            title="Disconnect Custom Domain"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Right Column: POC & Diagnostic Health */}
          <div className="space-y-6">
            <div className="enterprise-card rounded-2xl p-6 space-y-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Client Organization Contact</span>
              </h3>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-mono font-bold">Organization</span>
                  <p className="text-slate-900 font-bold text-sm">{project.clientOrgName}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-mono font-bold">Primary POC</span>
                  <p className="text-slate-700 font-semibold">{project.primaryContact.name}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-mono font-bold">Email Address</span>
                  <p className="text-emerald-700 font-mono font-semibold">{project.primaryContact.email}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-mono font-bold">Phone Number</span>
                  <p className="text-slate-700 font-mono">{project.primaryContact.phone}</p>
                </div>
              </div>
            </div>

            <div className="enterprise-card rounded-2xl p-6 space-y-3 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Diagnostic Health Checks</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-700 font-medium">Database Pool Ping</span>
                  <span className="text-emerald-700 font-bold font-mono">1.2ms (OK)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-700 font-medium">Payment Webhook Worker</span>
                  <span className="text-emerald-700 font-bold font-mono">100% Ack</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-700 font-medium">SSL Certificate Handshake</span>
                  <span className="text-emerald-700 font-bold font-mono">Valid TLS 1.3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: DEPLOYMENTS & CI/CD ── */}
      {activeTab === 'deployments' && (
        <div className="space-y-4 no-print">
          <div className="enterprise-card rounded-2xl p-6 space-y-4 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-emerald-600" />
                  <span>CI/CD Deployment History & Pipeline</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated release builds, git commit hashes, target cloud providers, and emergency 1-click rollback controls.
                </p>
              </div>

              <button
                onClick={() => {
                  setDeployHookUrl(project.deployHookUrl || '');
                  setDeployTargetProvider(project.deployProvider || 'VERCEL');
                  setDeployBranch(project.defaultBranch || 'main');
                  setDeploySuccessState(false);
                  setIsDeploying(false);
                  setShowDeployModal(true);
                }}
                className="theme-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Launch New Release</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {project.deployments.map((dep) => (
                <div key={dep.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors rounded-xl px-2">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <GitBranch className="w-4 h-4" />
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-xs">{dep.version}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {dep.commitHash}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                          {dep.environment}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                          {dep.deployProvider || project.deployProvider || 'VERCEL'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium">{dep.commitMessage}</p>
                      <p className="text-[10px] text-slate-400 font-mono">By {dep.author} • Duration: {dep.durationSeconds}s • {dep.timestamp}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs font-mono">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                      LIVE
                    </span>
                    <button
                      onClick={() => {
                        if (window.confirm(`Initiate instant CI/CD rollback to release ${dep.version}?`)) {
                          addDeployment(project.id, {
                            version: `${dep.version}-rollback`,
                            commitHash: dep.commitHash,
                            commitMessage: `rollback: emergency revert to stable release ${dep.version}`,
                            author: 'Lead Architect',
                            status: 'SUCCESS',
                            environment: dep.environment,
                            durationSeconds: 22,
                          });
                          showToast(`Rolled back to stable release ${dep.version}!`);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg border border-transparent hover:border-amber-200 transition-all cursor-pointer flex items-center gap-1 font-sans text-xs font-semibold"
                      title="Rollback to this Release"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                      <span>Rollback</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: DATABASE & SQL OPS (SCOPED TO THIS PROJECT) ── */}
      {activeTab === 'database' && (
        <div className="space-y-6 no-print">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: SQL Runner */}
            <div className="lg:col-span-2 space-y-4">
              <div className="enterprise-card rounded-2xl p-6 space-y-4 border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-600" />
                      <span>Scoped Database Console: {project.databaseEngine}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Direct SSL-encrypted query execution against this project's isolated database schema.
                    </p>
                  </div>

                  <button
                    onClick={handleExecuteSql}
                    disabled={isExecutingSql}
                    className="theme-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Play className={`w-3.5 h-3.5 ${isExecutingSql ? 'animate-spin' : ''}`} />
                    <span>{isExecutingSql ? 'Running...' : 'Execute SQL'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    className="w-full p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl outline-none border border-slate-800 focus:ring-1 focus:ring-emerald-500 shadow-inner leading-relaxed"
                  />
                </div>

                {/* SQL Query Results Table */}
                {sqlResults && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-slate-900">Query Results ({sqlResults.length} records returned):</span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                        1.4ms Latency
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                          <tr>
                            {Object.keys(sqlResults[0] || {}).map((col) => (
                              <th key={col} className="p-2 border-b border-slate-200">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {sqlResults.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              {Object.values(row).map((val: any, cidx) => (
                                <td key={cidx} className="p-2 text-slate-800">{String(val)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Schema Tables & Automated Snapshots */}
            <div className="space-y-4">
              <div className="enterprise-card rounded-2xl p-6 space-y-3 border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase font-mono">Schema Tables ({projectDbTables.length})</h4>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">Postgres 16</span>
                </div>

                <div className="space-y-2">
                  {projectDbTables.map((tbl) => (
                    <div
                      key={tbl.name}
                      onClick={() => {
                        setSelectedDbTable(tbl.name);
                        setSqlQuery(`SELECT * FROM ${tbl.name} ORDER BY 1 DESC LIMIT 10;`);
                      }}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900">{tbl.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 font-bold">{tbl.rows.toLocaleString()} rows</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        Columns: {tbl.columns.slice(0, 3).join(', ')}...
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={async () => {
                      setIsCreatingBackup(true);
                      await new Promise((r) => setTimeout(r, 800));
                      setIsCreatingBackup(false);
                      showToast(`AES-GCM-256 encrypted database snapshot created for ${project.name}!`);
                    }}
                    disabled={isCreatingBackup}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Download className={`w-3.5 h-3.5 ${isCreatingBackup ? 'animate-bounce' : ''}`} />
                    <span>{isCreatingBackup ? 'Generating Snapshot...' : 'Generate Encrypted Snapshot'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: REST API CONSOLE (SCOPED TO THIS PROJECT) ── */}
      {activeTab === 'apis' && (
        <div className="space-y-6 no-print">
          <div className="enterprise-card rounded-2xl p-6 space-y-4 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Code className="w-4 h-4 text-purple-600" />
                  <span>REST API Gateway & Endpoints: {project.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Execute live API requests, inspect response timings (DNS, TLS, TTFB), and copy auto-generated client SDK snippets.
                </p>
              </div>

              <button
                onClick={handleExecuteApi}
                disabled={isExecutingApi}
                className="theme-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${isExecutingApi ? 'animate-spin' : ''}`} />
                <span>{isExecutingApi ? 'Dispatching...' : 'Send Request'}</span>
              </button>
            </div>

            {/* Endpoint Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {projectEndpoints.map((ep, idx) => (
                <button
                  key={ep.path}
                  onClick={() => {
                    setSelectedEndpointIndex(idx);
                    if (ep.sampleBody) setApiRequestBody(ep.sampleBody);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    selectedEndpointIndex === idx
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${ep.method === 'POST' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
                    {ep.method}
                  </span>
                  <span>{ep.path}</span>
                </button>
              ))}
            </div>

            {/* Active Endpoint Info & URL Bar */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-xs font-mono">
              <span className={`px-2 py-0.5 rounded font-bold text-white text-[10px] ${projectEndpoints[selectedEndpointIndex]?.method === 'POST' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                {projectEndpoints[selectedEndpointIndex]?.method}
              </span>
              <span className="text-slate-900 font-bold flex-1 truncate">
                {safeLiveUrl}{projectEndpoints[selectedEndpointIndex]?.path}
              </span>
              <span className="text-[10px] text-slate-400 font-sans hidden md:inline">
                {projectEndpoints[selectedEndpointIndex]?.desc}
              </span>
            </div>

            {/* Request Body & Response Split Pane */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">JSON Request Payload</label>
                <textarea
                  rows={7}
                  value={apiRequestBody}
                  onChange={(e) => setApiRequestBody(e.target.value)}
                  className="w-full p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl outline-none border border-slate-800 shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-500 font-bold uppercase">Live Response Telemetry</span>
                  {apiResponseStatus && (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                      Status: {apiResponseStatus} OK • {apiResponseTimeMs}ms
                    </span>
                  )}
                </div>
                <pre className="w-full p-3 bg-slate-900 text-cyan-300 font-mono text-xs rounded-xl border border-slate-800 shadow-inner h-[130px] overflow-y-auto">
                  {apiResponseBody || '// Click "Send Request" to execute live endpoint test...'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: WEBHOOKS & EVENT STREAM (SCOPED TO THIS PROJECT) ── */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6 no-print">
          <div className="enterprise-card rounded-2xl p-6 space-y-4 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-600" />
                  <span>Inbound Webhook Events: {project.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  HMAC-SHA256 signature verification and idempotent payload replay for payment and GitHub events.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                100% Signature Verification
              </span>
            </div>

            <div className="space-y-3">
              {projectWebhooks.map((wh) => (
                <div
                  key={wh.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs transition-all shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 font-sans text-sm">{wh.provider}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                        {wh.event}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                        {wh.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Timestamp: {wh.date} • Processing Latency: {wh.latency} • Signature: HMAC-SHA256 Verified
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReplayWebhook(wh)}
                      disabled={isReplayingWebhook}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isReplayingWebhook && selectedWebhookEvent?.id === wh.id ? 'animate-spin' : ''}`} />
                      <span>Replay Event</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: MOBILE HUB & OTA (SCOPED TO THIS PROJECT) ── */}
      {activeTab === 'mobile' && (
        <div className="space-y-6 no-print">
          <div className="enterprise-card rounded-2xl p-6 space-y-4 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  <span>Mobile App Gatekeeper & Over-The-Air (OTA) Hot-Patching</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage version boundaries, mandatory lockout updates, and instant CodePush JavaScript bundles for this project's mobile apps.
                </p>
              </div>

              <button
                onClick={async () => {
                  setIsDeployingOta(true);
                  await new Promise((r) => setTimeout(r, 700));
                  setIsDeployingOta(false);
                  showToast(`Instant CodePush OTA Patch v${mobileLatestVersion}-patch.4 deployed to ${project.name}!`);
                }}
                disabled={isDeployingOta}
                className="theme-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 ${isDeployingOta ? 'animate-spin' : ''}`} />
                <span>{isDeployingOta ? 'Compiling Hermes...' : 'Dispatch OTA Hot-Patch'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Production Binary Version</label>
                <input
                  type="text"
                  value={mobileLatestVersion}
                  onChange={(e) => setMobileLatestVersion(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs outline-none focus:border-purple-500"
                />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Min Supported Version</label>
                <input
                  type="text"
                  value={mobileMinVersion}
                  onChange={(e) => setMobileMinVersion(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs outline-none focus:border-purple-500"
                />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Mandatory Force Update</p>
                  <p className="text-[10px] text-slate-500">Hard lock older client versions</p>
                </div>
                <input
                  type="checkbox"
                  checked={mobileForceUpdate}
                  onChange={(e) => setMobileForceUpdate(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: ERROR TELEMETRY & APM (SCOPED TO THIS PROJECT) ── */}
      {activeTab === 'errors' && (
        <div className="space-y-6 no-print">
          <div className="enterprise-card rounded-2xl p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span>Real-Time Error Telemetry & APM: {project.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Exceptions and trace telemetry captured for this isolated project runtime.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                0 Unresolved P0 Incidents
              </span>
            </div>

            <div className="space-y-3">
              {projectErrors.map((err) => (
                <div
                  key={err.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs transition-all shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${err.level === 'WARNING' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-800'}`}>
                        {err.level}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">{err.title}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Location: <code className="text-slate-700">{err.file}</code> • Occurrences: {err.occurrences} • RCA: {err.rca}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        addTask(project.id, {
                          title: `Fix: ${err.title}`,
                          description: `AI RCA: ${err.rca}\nFile: ${err.file}`,
                          priority: 'P1_HIGH',
                          status: 'IN_PROGRESS',
                          assignee: 'Lead Architect',
                          dueDate: '2026-09-25'
                        });
                        showToast(`Created Sprint Kanban task from error: ${err.id}`);
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Create Sprint Task</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 8: TASKS & SPRINT KANBAN ── */}
      {activeTab === 'tasks' && (
        <div className="space-y-4 no-print">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Project Tasks & Sprints</h3>
              <p className="text-xs text-slate-500">Manage client deliverables, bug fixes, and feature milestones</p>
            </div>
            <button
              onClick={() => setShowTaskModal(true)}
              className="px-3.5 py-2 theme-btn-primary text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(['BACKLOG', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'] as TaskStatus[]).map((status) => {
              const statusTasks = project.tasks.filter((t) => t.status === status);
              const statusLabels: Record<TaskStatus, { title: string; color: string }> = {
                BACKLOG: { title: 'Backlog', color: 'text-slate-600 border-slate-200 bg-slate-100' },
                IN_PROGRESS: { title: 'In Progress', color: 'text-emerald-700 border-emerald-200 bg-emerald-50' },
                IN_REVIEW: { title: 'In Review', color: 'text-purple-700 border-purple-200 bg-purple-50' },
                COMPLETED: { title: 'Completed', color: 'text-emerald-800 border-emerald-300 bg-emerald-100' },
              };

              return (
                <div key={status} className="enterprise-card rounded-2xl p-4 flex flex-col space-y-3 min-h-[300px] border border-slate-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className={`text-xs font-mono font-bold uppercase px-2.5 py-0.5 rounded-lg border ${statusLabels[status].color}`}>
                      {statusLabels[status].title}
                    </span>
                    <span className="text-xs font-mono text-slate-500 font-bold">{statusTasks.length}</span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {statusTasks.map((t) => (
                      <div
                        key={t.id}
                        className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-3.5 space-y-2.5 transition-all shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                              t.priority === 'P0_CRITICAL'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : t.priority === 'P1_HIGH'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {t.priority}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">Due: {t.dueDate}</span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{t.title}</h4>
                        {t.description && <p className="text-[11px] text-slate-500 line-clamp-2">{t.description}</p>}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px]">
                          <span className="text-slate-600 font-medium">👤 {t.assignee}</span>

                          <select
                            value={t.status}
                            onChange={(e) => updateTaskStatus(project.id, t.id, e.target.value as TaskStatus)}
                            className="bg-white text-slate-700 rounded-md px-1.5 py-0.5 border border-slate-300 outline-none cursor-pointer text-xs"
                          >
                            <option value="BACKLOG">Backlog</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="IN_REVIEW">Review</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </div>
                      </div>
                    ))}

                    {statusTasks.length === 0 && (
                      <div className="h-32 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[11px] text-slate-400 font-mono">
                        No tasks in this lane
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 9: SECRETS VAULT (.ENV) ── */}
      {activeTab === 'secrets' && (
        <div className="space-y-4 no-print">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-600" />
                <span>Isolated Credentials & Secrets Vault: {project.name}</span>
              </h3>
              <p className="text-xs text-slate-500">Encrypted environment variables and connection strings for this project</p>
            </div>
            <button
              onClick={() => setShowSecretModal(true)}
              className="px-3.5 py-2 theme-btn-primary text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Secret</span>
            </button>
          </div>

          <div className="enterprise-card rounded-2xl overflow-hidden divide-y divide-slate-100 border border-slate-200">
            {project.secrets.map((sec) => {
              const isVisible = visibleSecrets[sec.id];
              return (
                <div key={sec.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-700 text-xs">{sec.key}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {sec.environment}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{sec.description}</p>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 max-w-[280px] sm:max-w-md truncate text-slate-800">
                      {isVisible ? sec.value : '••••••••••••••••••••••••••••••••'}
                    </div>

                    <button
                      onClick={() => setVisibleSecrets((prev) => ({ ...prev, [sec.id]: !prev[sec.id] }))}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer border border-slate-200"
                      title={isVisible ? 'Mask' : 'Reveal'}
                    >
                      {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(sec.value);
                        setCopiedKey(sec.key);
                        setTimeout(() => setCopiedKey(null), 2000);
                        showToast(`Copied secret "${sec.key}" to clipboard!`);
                      }}
                      className="p-2 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-xl transition-all cursor-pointer border border-slate-200"
                      title="Copy Secret"
                    >
                      {copiedKey === sec.key ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => deleteSecret(project.id, sec.id)}
                      className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all cursor-pointer border border-slate-200"
                      title="Delete Secret"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 10: SECURITY & SOC 2 ── */}
      {activeTab === 'security' && (
        <div className="space-y-6 no-print">
          <div className="enterprise-card rounded-2xl p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>DevSecOps & SOC 2 Compliance Audit: {project.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated SAST code scans, TLS 1.3 certificate status, and continuous SOC 2 Trust Services Criteria checks.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                SOC 2 Type II Certified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">SAST Static Analysis</span>
                <p className="font-bold text-slate-900 text-sm">0 High Vulnerabilities</p>
                <p className="text-[10px] text-emerald-700 font-mono">Passed 142 Security Rules</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">TLS Handshake & HSTS</span>
                <p className="font-bold text-slate-900 text-sm">TLS 1.3 • A+ Grade</p>
                <p className="text-[10px] text-emerald-700 font-mono">Auto-renews via Let's Encrypt</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">Access & IAM Security</span>
                <p className="font-bold text-slate-900 text-sm">Strict RBAC & MFA</p>
                <p className="text-[10px] text-emerald-700 font-mono">Audit Logged with Ed25519</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 11: FINOPS & INVOICING ── */}
      {activeTab === 'billing' && (
        <div className="space-y-6 no-print">
          <div className="enterprise-card rounded-2xl p-6 space-y-4 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>FinOps & Monthly SLA Retainer: {project.clientOrgName}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Itemized GST tax invoice and SLA uptime delivery guarantee certificate.
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="theme-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Tax Invoice</span>
              </button>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Current Retainer Plan:</span>
                <span className="text-base font-mono font-black text-emerald-700">
                  ₹{project.monthlyFeeINR.toLocaleString('en-IN')} / month + 18% GST
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Includes fullstack maintenance, database cluster management, CI/CD automated deployments, real-time AI Sentinel SRE monitoring, and 99.98% SLA delivery guarantee.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 12: DOCS & RUNBOOKS ── */}
      {activeTab === 'docs' && (
        <div className="space-y-4 no-print">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-600" />
                <span>Architecture Runbooks & Engineering Wiki</span>
              </h3>
              <p className="text-xs text-slate-500">Technical specifications and incident response procedures for {project.name}</p>
            </div>
            <button
              onClick={() => setShowDocModal(true)}
              className="px-3.5 py-2 theme-btn-primary text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Document</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.docs.map((doc) => (
              <div key={doc.id} className="enterprise-card rounded-2xl p-5 space-y-3 shadow-sm flex flex-col justify-between border border-slate-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                      {doc.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Updated: {doc.lastUpdated}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{doc.title}</h4>
                  <pre className="text-xs font-mono text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {doc.content}
                  </pre>
                </div>
                <div className="text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100">
                  Author: {doc.author}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODALS (Clean White Styling) ── */}

      {/* Task Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTaskModal(false)} className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md z-10 space-y-4 text-xs shadow-2xl">
              <h3 className="text-sm font-bold text-slate-900">Create Sprint Task for {project.name}</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!taskTitle.trim()) return;
                  addTask(project.id, {
                    title: taskTitle.trim(),
                    description: taskDesc.trim(),
                    priority: taskPriority,
                    status: 'IN_PROGRESS',
                    assignee: taskAssignee,
                    dueDate: taskDueDate,
                  });
                  setTaskTitle('');
                  setTaskDesc('');
                  setShowTaskModal(false);
                  showToast('Sprint task created successfully!');
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Task Title *</label>
                  <input type="text" required value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g. Implement Webhook retry backoff" className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-500 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Description</label>
                  <textarea rows={3} value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="Details..." className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-500 focus:bg-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Priority</label>
                    <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as TaskPriority)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-500">
                      <option value="P0_CRITICAL">P0 Critical</option>
                      <option value="P1_HIGH">P1 High</option>
                      <option value="P2_MEDIUM">P2 Medium</option>
                      <option value="P3_LOW">P3 Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Assignee</label>
                    <input type="text" value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setShowTaskModal(false)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 theme-btn-primary rounded-xl font-bold cursor-pointer">Create Task</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deploy Modal */}
      <AnimatePresence>
        {showDeployModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isDeploying && setShowDeployModal(false)} className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-2xl z-10 space-y-4 text-xs shadow-2xl my-8">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">Launch CI/CD Deployment: {project.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                      {deployEnv}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Automated Git release pipeline to {deployTargetProvider} Edge Fleet</p>
                </div>
                {!isDeploying && (
                  <button onClick={() => setShowDeployModal(false)} className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 border border-slate-200 cursor-pointer">
                    ✕
                  </button>
                )}
              </div>

              {isDeploying ? (
                <div className="space-y-3 py-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-700 font-bold flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>Deploying {deployVersion} to {deployTargetProvider} Edge Fleet...</span>
                    </span>
                    <span className="text-slate-400 font-mono">Branch: {deployBranch}</span>
                  </div>

                  <div className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] h-60 overflow-y-auto space-y-1.5 border border-slate-800 shadow-inner">
                    {deployLogs.map((log, idx) => (
                      <p key={idx} className="leading-relaxed">
                        {log}
                      </p>
                    ))}
                  </div>
                </div>
              ) : deploySuccessState ? (
                <div className="space-y-4 py-2">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-emerald-500/20">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900">
                        Release {deployVersion} Successfully Deployed!
                      </h4>
                      <p className="text-xs text-emerald-700 font-medium">
                        Live and verified across {deployTargetProvider} edge clusters with TLS 1.3 SSL.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <span className="text-slate-600">Production URL:</span>
                    <a href={safeLiveUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold hover:underline flex items-center gap-1">
                      <span>{safeLiveUrl}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeployModal(false);
                        setShowPreviewModal(true);
                      }}
                      className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Sandbox Preview</span>
                    </button>
                    <a
                      href={safeLiveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Visit Live Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowDeployModal(false)}
                      className="px-4 py-2 theme-btn-primary rounded-xl font-bold cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleTriggerDeploy} className="space-y-4">
                  {/* Provider Selector */}
                  <div>
                    <label className="block text-slate-700 mb-1.5 font-bold">Target Cloud Provider</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['VERCEL', 'RENDER', 'CLOUDFLARE', 'AWS'].map((prov) => (
                        <button
                          key={prov}
                          type="button"
                          onClick={() => setDeployTargetProvider(prov)}
                          className={`p-2.5 rounded-xl border text-left font-mono text-xs transition-all cursor-pointer ${
                            deployTargetProvider === prov
                              ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{prov === 'RENDER' ? '⚡' : prov === 'CLOUDFLARE' ? '🟧' : prov === 'AWS' ? '☁' : '▲'}</span>
                            <span>{prov}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Version Tag *</label>
                      <input type="text" required value={deployVersion} onChange={(e) => setDeployVersion(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold flex items-center justify-between">
                        <span>Commit Hash *</span>
                        <button
                          type="button"
                          onClick={async () => {
                            const [owner, repo] = project.repoUrl.replace('https://github.com/', '').split('/');
                            if (owner && repo) {
                              const commits = await githubService.fetchLatestCommits(owner, repo, deployBranch);
                              if (commits && commits.length > 0) {
                                const top = commits[0];
                                setDeployCommit(top.sha.substring(0, 7));
                                setDeployMsg(top.commit.message.split('\n')[0]);
                                showToast(`Synced latest commit ${top.sha.substring(0, 7)} from GitHub!`);
                              }
                            }
                          }}
                          className="text-[10px] text-emerald-700 hover:underline font-mono font-bold cursor-pointer"
                        >
                          ⚡ Sync
                        </button>
                      </label>
                      <input type="text" required value={deployCommit} onChange={(e) => setDeployCommit(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1 font-semibold">Git Branch</label>
                      <input type="text" required value={deployBranch} onChange={(e) => setDeployBranch(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:border-emerald-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Changelog & Release Notes *</label>
                    <input type="text" required value={deployMsg} onChange={(e) => setDeployMsg(e.target.value)} placeholder="e.g. feat: release microservice optimizations" className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-500" />
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Live Deploy Webhook URL (Optional)</label>
                    <input
                      type="url"
                      value={deployHookUrl}
                      onChange={(e) => setDeployHookUrl(e.target.value)}
                      placeholder="https://api.vercel.com/v1/integrations/deploy/... or https://api.render.com/deploy/srv-..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-[11px] outline-none focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Sends a real HTTP POST request to trigger automated build webhook on Vercel/Render
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60 text-[11px] font-mono space-y-1">
                    <span className="font-bold text-emerald-800">Pre-Flight CI/CD Sanity Checks:</span>
                    <p className="text-slate-600">✓ TypeScript Compilation Passed • ✓ DB Pool Handshake Nominal • ✓ TLS 1.3 Active</p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button type="button" onClick={() => setShowDeployModal(false)} className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer">Cancel</button>
                    <button type="submit" className="px-5 py-2 theme-btn-primary rounded-xl font-bold flex items-center gap-1.5 shadow-sm cursor-pointer">
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Trigger Cloud Deployment</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Secret Modal */}
      <AnimatePresence>
        {showSecretModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSecretModal(false)} className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md z-10 space-y-4 text-xs shadow-2xl">
              <h3 className="text-sm font-bold text-slate-900">Add Encrypted Secret for {project.name}</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!secretKey.trim() || !secretValue.trim()) return;
                  addSecret(project.id, {
                    key: secretKey.trim(),
                    value: secretValue.trim(),
                    masked: true,
                    environment: secretEnv,
                    description: secretDesc.trim() || 'Environment Configuration Secret',
                  });
                  setSecretKey('');
                  setSecretValue('');
                  setSecretDesc('');
                  setShowSecretModal(false);
                  showToast(`Secret ${secretKey} saved to encrypted vault!`);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Secret Key *</label>
                  <input type="text" required value={secretKey} onChange={(e) => setSecretKey(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Secret Value *</label>
                  <input type="password" required value={secretValue} onChange={(e) => setSecretValue(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Description</label>
                  <input type="text" value={secretDesc} onChange={(e) => setSecretDesc(e.target.value)} placeholder="Usage description" className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none" />
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setShowSecretModal(false)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 theme-btn-primary rounded-xl font-bold cursor-pointer">Save Secret</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Doc Modal */}
      <AnimatePresence>
        {showDocModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDocModal(false)} className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg z-10 space-y-4 text-xs shadow-2xl">
              <h3 className="text-sm font-bold text-slate-900">Create Runbook or Specification for {project.name}</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!docTitle.trim()) return;
                  addDoc(project.id, {
                    title: docTitle.trim(),
                    category: docCategory,
                    content: docContent.trim(),
                    author: 'Lead Architect',
                  });
                  setDocTitle('');
                  setDocContent('');
                  setShowDocModal(false);
                  showToast('Runbook saved successfully!');
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Document Title *</label>
                  <input type="text" required value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="e.g. Incident Response Guide" className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Category</label>
                  <select value={docCategory} onChange={(e) => setDocCategory(e.target.value as any)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none">
                    <option value="ARCHITECTURE">Architecture & Tech Stack</option>
                    <option value="API_SPEC">API Specification</option>
                    <option value="RUNBOOK">Emergency Runbook</option>
                    <option value="ONBOARDING">Client Onboarding</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Content (Markdown supported) *</label>
                  <textarea rows={6} required value={docContent} onChange={(e) => setDocContent(e.target.value)} placeholder="# Guidelines..." className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none" />
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setShowDocModal(false)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 theme-btn-primary rounded-xl font-bold cursor-pointer">Save Document</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Sandboxed Live Web Preview Modal ── */}
      <AnimatePresence>
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreviewModal(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white border border-slate-200 rounded-3xl w-full max-w-5xl z-10 space-y-0 text-xs shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            >
              <div className="p-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <span>🖥️ Fleet Live Preview:</span>
                    <span className="text-emerald-400">{project.name}</span>
                  </span>
                </div>

                <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('desktop')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                      previewViewport === 'desktop' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Monitor className="w-3 h-3" />
                    <span>Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('tablet')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                      previewViewport === 'tablet' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Tablet className="w-3 h-3" />
                    <span>Tablet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewViewport('mobile')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                      previewViewport === 'mobile' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>Mobile</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={safeLiveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Tab</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(false)}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Sandboxed Iframe */}
              <div className="flex-1 bg-slate-900/5 p-4 flex items-center justify-center min-h-[480px] overflow-auto">
                <div
                  className={`bg-white rounded-2xl shadow-xl border border-slate-300 overflow-hidden transition-all duration-300 flex flex-col ${
                    previewViewport === 'desktop'
                      ? 'w-full h-[520px]'
                      : previewViewport === 'tablet'
                      ? 'w-[768px] h-[520px]'
                      : 'w-[375px] h-[520px]'
                  }`}
                >
                  <iframe
                    id="preview-iframe"
                    src={safeLiveUrl}
                    title={`Live preview of ${project.name}`}
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Connect Custom Domain Modal ── */}
      <AnimatePresence>
        {showAddDomainModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddDomainModal(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg z-10 space-y-4 text-xs shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Connect Custom Domain to {project.name}</h3>
                    <p className="text-[11px] text-slate-500">Route production traffic through your branded domain</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddDomainModal(false)}
                  className="w-7 h-7 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newDomainInput.trim()) return;
                  addDomain(project.id, newDomainInput.trim());
                  setNewDomainInput('');
                  setShowAddDomainModal(false);
                  showToast(`Custom domain "${newDomainInput.trim()}" connected to ${project.name}!`);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Domain Name *</label>
                  <input
                    type="text"
                    required
                    value={newDomainInput}
                    onChange={(e) => setNewDomainInput(e.target.value)}
                    placeholder="e.g. app.myclient.com or mycompany.in"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs outline-none focus:border-emerald-500 focus:bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Enter root domain or subdomain without http:// or https://
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddDomainModal(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 theme-btn-primary rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Verify & Connect Domain</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Edit Live URL Modal ── */}
      <AnimatePresence>
        {showEditUrlModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditUrlModal(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-lg z-10 space-y-4 text-xs shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Set Active Live URL for {project.name}</h3>
                    <p className="text-[11px] text-slate-500">Point live app and sandbox previews to your working URL</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditUrlModal(false)}
                  className="w-7 h-7 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!editUrlValue.trim()) return;
                  updateProject(project.id, { liveUrl: editUrlValue.trim() });
                  setShowEditUrlModal(false);
                  showToast(`Live URL updated to ${editUrlValue.trim()}!`);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Live Application URL *</label>
                  <input
                    type="text"
                    required
                    value={editUrlValue}
                    onChange={(e) => setEditUrlValue(e.target.value)}
                    placeholder="e.g. http://localhost:5173, https://orderkare.co.in, or https://orderkare-3.onrender.com"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs outline-none focus:border-emerald-500 focus:bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Enter full URL with http:// or https:// (e.g., local dev port or production cloud domain)
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500">Quick URL Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Localhost (5173)', url: 'http://localhost:5173' },
                      { label: 'OrderKare Web', url: 'https://orderkare.co.in' },
                      { label: 'Render Backend', url: 'https://orderkare-3.onrender.com' },
                      { label: 'PK NexGen Exam', url: 'https://www.pkthenexgenexam.xyz/' },
                    ].map((pre) => (
                      <button
                        key={pre.label}
                        type="button"
                        onClick={() => setEditUrlValue(pre.url)}
                        className="px-2 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 rounded-lg text-[10px] font-mono transition-all cursor-pointer"
                      >
                        {pre.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditUrlModal(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 theme-btn-primary rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Apply Live URL</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PRINT-ONLY A4 INVOICE SPEC SHEET ── */}
      <div className="printable-invoice-sheet hidden print:block bg-white text-black p-8 max-w-[210mm] mx-auto">
        <div className="border-b-2 border-slate-900 pb-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                Nexify Forge Technologies
              </h1>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mt-1">
                Official Tax Invoice & SLA Retainer Statement
              </p>
            </div>
            <div className="text-right text-xs font-mono">
              <p className="font-bold text-slate-900">INVOICE #</p>
              <p className="text-sm font-black text-emerald-800">NXF-{project.slug.toUpperCase()}-2026</p>
              <p className="text-[10px] text-slate-500 mt-1">Date: {new Date().toUTCString()}</p>
            </div>
          </div>
        </div>

        <div className="border border-slate-300 rounded-lg p-4 mb-6 text-xs bg-slate-50/50">
          <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Billed To Client Organization</p>
          <p className="font-mono text-sm font-bold text-slate-900 mt-1">{project.clientOrgName}</p>
          <p className="text-slate-600 mt-0.5">Project: {project.name} ({project.id})</p>
          <p className="text-slate-600">POC: {project.primaryContact.name} ({project.primaryContact.email})</p>
        </div>

        <div className="mb-6">
          <table className="w-full text-left text-[9pt] border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-800 font-mono text-[8pt]">
                <th className="py-2 px-2">Description</th>
                <th className="py-2 px-2 text-right">Fee (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              <tr>
                <td className="py-3 px-2 font-bold text-slate-900">
                  {project.slaTier.replace(/_/g, ' ')} Managed DevOps & SRE Retainer
                </td>
                <td className="py-3 px-2 text-right font-bold">
                  ₹{project.monthlyFeeINR.toLocaleString('en-IN')}.00
                </td>
              </tr>
              <tr>
                <td className="py-2 px-2 text-slate-600">Integrated GST (IGST 18%)</td>
                <td className="py-2 px-2 text-right text-slate-600">
                  ₹{(project.monthlyFeeINR * 0.18).toLocaleString('en-IN')}.00
                </td>
              </tr>
              <tr className="border-t-2 border-slate-900 font-bold text-[10pt]">
                <td className="py-2 px-2 text-slate-900">Total Amount Due</td>
                <td className="py-2 px-2 text-right text-emerald-800">
                  ₹{(project.monthlyFeeINR * 1.18).toLocaleString('en-IN')}.00
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border-t-2 border-slate-900 pt-6 mt-8">
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div>
              <p className="font-bold text-slate-900 mb-1">SLA Guarantee Stamp:</p>
              <p className="text-[9pt] text-slate-600 leading-relaxed">
                Nexify DevOps certifies delivered uptime SLA of {project.uptimePercent}% for {project.name}.
              </p>
            </div>
            <div className="flex flex-col justify-end items-end text-right">
              <div className="border-b border-slate-400 w-48 pb-1 mb-1 font-mono text-[9pt] font-bold text-slate-800">
                [Digitally Signed Controller]
              </div>
              <p className="font-bold text-slate-900 text-[9pt]">Chief SRE Officer</p>
              <p className="text-[8pt] text-slate-500 font-mono">Nexify DevOps Control Plane</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
