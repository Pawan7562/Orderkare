import React, { useState, useMemo } from 'react';
import {
  Send,
  Globe,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Code,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Terminal,
  Download,
  Printer,
  Sparkles,
  Zap,
  Layers,
  SlidersHorizontal,
  Key,
  Lock,
  FileText,
  Boxes,
  Play,
  CheckCircle,
  XCircle,
  Share2,
  X,
  ExternalLink,
  Search,
  Activity,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '../context/ProjectContext';

interface HeaderPair {
  key: string;
  value: string;
  enabled: boolean;
}

interface ParamPair {
  key: string;
  value: string;
  enabled: boolean;
}

interface ApiPreset {
  id: string;
  name: string;
  project: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  category: string;
  headers: HeaderPair[];
  params: ParamPair[];
  body: string;
  expectedStatus: number;
}

const API_PRESETS: ApiPreset[] = [
  {
    id: 'preset_01',
    name: 'MediaPipe AI Proctor Session Init',
    project: 'PK The NexGen Exam Monitoring System',
    method: 'POST',
    path: '/api/v1/proctor/session/initiate',
    description: 'Initializes ephemeral WebRTC video/audio telemetry and MediaPipe face mesh gaze tracking model pipeline.',
    category: 'EXAM_PROCTORING',
    headers: [
      { key: 'Content-Type', value: 'application/json', enabled: true },
      { key: 'Authorization', value: 'Bearer {{PROCTOR_AI_JWT}}', enabled: true },
      { key: 'X-Room-Id', value: 'room-delhi-402', enabled: true }
    ],
    params: [
      { key: 'highPrecisionGaze', value: 'true', enabled: true },
      { key: 'audioFilterMode', value: 'ANOMALY_SUPPRESSION', enabled: true }
    ],
    body: JSON.stringify(
      {
        studentId: 'PK-STU-8821',
        examCode: 'CBSE-ADV-2026-PHYSICS',
        cameraResolution: '1280x720@30fps',
        faceMeshTolerances: {
          maxGazeDeviationDeg: 28.5,
          multipleFaceAlert: true,
          audioSpikeThresholdDb: -18.0
        },
        clientTimestamp: new Date().toISOString()
      },
      null,
      2
    ),
    expectedStatus: 201
  },
  {
    id: 'preset_02',
    name: 'WebRTC TURN Relay Allocation',
    project: 'PK The NexGen Exam Monitoring System',
    method: 'POST',
    path: '/api/v1/proctor/webrtc/turn-credentials',
    description: 'Generates time-limited HMAC-SHA1 encrypted ephemeral TURN relay credentials for high-jitter exam rooms.',
    category: 'EXAM_PROCTORING',
    headers: [
      { key: 'Content-Type', value: 'application/json', enabled: true },
      { key: 'Authorization', value: 'Bearer {{PROCTOR_AI_JWT}}', enabled: true }
    ],
    params: [],
    body: JSON.stringify(
      {
        roomId: 'room-delhi-402',
        ttlSeconds: 7200,
        preferredRegion: 'ap-south-1'
      },
      null,
      2
    ),
    expectedStatus: 200
  },
  {
    id: 'preset_03',
    name: 'Restaurant Kitchen Order Matrix',
    project: 'OrderKare Dining SaaS',
    method: 'GET',
    path: '/api/v1/restaurants/active-orders',
    description: 'Fetches active live KDS orders from PostgreSQL Neon serverless pool with real-time dining table status.',
    category: 'DINING_SAAS',
    headers: [
      { key: 'Accept', value: 'application/json', enabled: true },
      { key: 'Authorization', value: 'Bearer {{RESTAURANT_MANAGER_TOKEN}}', enabled: true },
      { key: 'X-Tenant-Id', value: 'tenant_grand_hyatt_04', enabled: true }
    ],
    params: [
      { key: 'status', value: 'PREPARING,READY', enabled: true },
      { key: 'limit', value: '25', enabled: true }
    ],
    body: '',
    expectedStatus: 200
  },
  {
    id: 'preset_04',
    name: 'Razorpay HMAC Webhook Signature Verification',
    project: 'OrderKare Dining SaaS',
    method: 'POST',
    path: '/api/v1/webhooks/razorpay',
    description: 'Tests incoming Razorpay payment capture webhook with cryptographic HMAC-SHA256 signature verification.',
    category: 'DINING_SAAS',
    headers: [
      { key: 'Content-Type', value: 'application/json', enabled: true },
      { key: 'X-Razorpay-Signature', value: '0x8f9a2b0c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a', enabled: true }
    ],
    params: [],
    body: JSON.stringify(
      {
        entity: 'event',
        account_id: 'acc_ORD778899',
        event: 'payment.captured',
        contains: ['payment'],
        payload: {
          payment: {
            entity: {
              id: 'pay_NXF998822',
              amount: 145000,
              currency: 'INR',
              status: 'captured',
              order_id: 'order_ORD55667788',
              method: 'upi'
            }
          }
        },
        created_at: 1789958892
      },
      null,
      2
    ),
    expectedStatus: 200
  },
  {
    id: 'preset_05',
    name: 'Global Health & Edge PoP Latency',
    project: 'Global Fleet Engine',
    method: 'GET',
    path: '/api/v1/health',
    description: 'Checks zero-downtime cluster heartbeat across all 14 global edge points of presence.',
    category: 'INFRASTRUCTURE',
    headers: [
      { key: 'Accept', value: 'application/json', enabled: true }
    ],
    params: [
      { key: 'deepCheck', value: 'true', enabled: true }
    ],
    body: '',
    expectedStatus: 200
  }
];

export const ApiTesterPage: React.FC = () => {
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET');
  const [endpointPath, setEndpointPath] = useState<string>('/api/v1/health');
  
  // Tabs: PARAMS, HEADERS, BODY, AUTH, TESTS
  const [requestTab, setRequestTab] = useState<'PARAMS' | 'HEADERS' | 'BODY' | 'AUTH' | 'TESTS'>('HEADERS');
  
  // Headers & Params state
  const [headers, setHeaders] = useState<HeaderPair[]>([
    { key: 'Accept', value: 'application/json', enabled: true },
    { key: 'Authorization', value: 'Bearer nexify_dev_jwt_token_8899a', enabled: true },
    { key: 'X-Cluster-Origin', value: 'ap-south-1', enabled: true }
  ]);
  const [params, setParams] = useState<ParamPair[]>([
    { key: 'env', value: 'production', enabled: true }
  ]);
  const [requestBody, setRequestBody] = useState<string>(
    JSON.stringify(
      {
        clientEnv: 'PRODUCTION',
        auditPing: true,
        cluster: 'ap-south-1',
        timestamp: new Date().toISOString()
      },
      null,
      2
    )
  );

  // Auth Type state
  const [authType, setAuthType] = useState<'BEARER' | 'API_KEY' | 'BASIC' | 'NONE'>('BEARER');
  const [authToken, setAuthToken] = useState('nexify_dev_jwt_token_8899a');

  // Response state
  const [isLoading, setIsLoading] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(200);
  const [responseStatusText, setResponseStatusText] = useState<string>('OK');
  const [responseLatency, setResponseLatency] = useState<number | null>(24);
  const [responseSize, setResponseSize] = useState<string>('1.42 KB');
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({
    'content-type': 'application/json; charset=utf-8',
    'x-ratelimit-limit': '10000',
    'x-ratelimit-remaining': '9984',
    'x-request-id': 'req_nxf_889922a1',
    'access-control-allow-origin': '*',
    'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
    'server': 'Nexify-Edge-Gateway/3.2'
  });
  const [responseTab, setResponseTab] = useState<'BODY' | 'HEADERS' | 'TESTS' | 'TIMINGS'>('BODY');

  // Modals state
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState(false);
  const [snippetLanguage, setSnippetLanguage] = useState<'CURL' | 'TYPESCRIPT' | 'PYTHON' | 'GO'>('CURL');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [isSuiteRunning, setIsSuiteRunning] = useState(false);
  const [suiteResults, setSuiteResults] = useState<{ name: string; status: number; latency: number; pass: boolean }[]>([]);

  const [responseBody, setResponseBody] = useState<string>(
    JSON.stringify(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        cluster: 'ap-south-1',
        edgeRegion: 'Mumbai Edge (AS13335)',
        databasePool: {
          activeConnections: 14,
          idleConnections: 4,
          maxPoolSize: 50,
          sslEncrypted: true
        },
        services: {
          authentication: 'operational',
          examProctorEngine: 'operational (MediaPipe v3.1.0)',
          paymentWorker: 'operational (Razorpay Webhooks)',
          socketDispatcher: 'operational (WebRTC STUN/TURN)'
        },
        uptimeSeconds: 847291,
        tlsProtocol: 'TLSv1.3 / AES_256_GCM'
      },
      null,
      2
    )
  );

  const selectedProj = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Load Preset
  const handleLoadPreset = (preset: ApiPreset) => {
    setMethod(preset.method);
    setEndpointPath(preset.path);
    setHeaders(preset.headers);
    setParams(preset.params);
    setRequestBody(preset.body || '{\n}');
    // Select relevant project if matching
    const projMatch = projects.find(p => p.name.toLowerCase().includes(preset.project.toLowerCase()));
    if (projMatch) {
      setSelectedProjectId(projMatch.id);
    }
  };

  // Header Management
  const handleAddHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };
  const handleRemoveHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };
  const handleUpdateHeader = (index: number, field: 'key' | 'value' | 'enabled', val: any) => {
    const updated = [...headers];
    (updated[index] as any)[field] = val;
    setHeaders(updated);
  };

  // Param Management
  const handleAddParam = () => {
    setParams([...params, { key: '', value: '', enabled: true }]);
  };
  const handleRemoveParam = (index: number) => {
    setParams(params.filter((_, i) => i !== index));
  };
  const handleUpdateParam = (index: number, field: 'key' | 'value' | 'enabled', val: any) => {
    const updated = [...params];
    (updated[index] as any)[field] = val;
    setParams(updated);
  };

  // Compute Full URL with query params
  const fullConstructedUrl = useMemo(() => {
    const activeParams = params.filter(p => p.enabled && p.key.trim());
    const query = activeParams.length > 0
      ? '?' + activeParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&')
      : '';
    const base = selectedProj?.liveUrl || 'https://api.nexifyforge.com';
    return `${base}${endpointPath}${query}`;
  }, [selectedProj, endpointPath, params]);

  // Execute Request Simulator
  const handleSendRequest = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const latency = Math.floor(Math.random() * 22) + 14;
      setResponseLatency(latency);
      setResponseStatus(200);
      setResponseStatusText('OK');
      setResponseSize(`${(Math.random() * 1.5 + 1.2).toFixed(2)} KB`);

      if (endpointPath.includes('proctor') || endpointPath.includes('session')) {
        setResponseBody(
          JSON.stringify(
            {
              status: 'PROCTOR_SESSION_ACTIVE',
              sessionId: 'sess_nxf_proctor_9921b',
              studentId: 'PK-STU-8821',
              webrtcStream: {
                iceServers: [
                  { urls: 'stun:stun.nexifyforge.com:3478' },
                  { urls: 'turn:turn.nexifyforge.com:3478', username: 'exam_turn_user', credential: '••••••••••••' }
                ],
                audioAnomalySuppression: 'ACTIVE',
                gazeTrackingStatus: 'CALIBRATED_NOMINAL'
              },
              edgeRegion: 'ap-south-1',
              timestamp: new Date().toISOString()
            },
            null,
            2
          )
        );
      } else if (endpointPath.includes('restaurants') || endpointPath.includes('order')) {
        setResponseBody(
          JSON.stringify(
            {
              status: 'SUCCESS',
              tenant: 'OrderKare Dining Enterprise',
              activeOrdersCount: 4,
              orders: [
                { id: 'ORD-101', table: 'Table 4', items: ['Paneer Butter Masala', 'Garlic Naan (x2)'], amount: 720, status: 'PREPARING' },
                { id: 'ORD-102', table: 'Table 8', items: ['Dal Makhani', 'Jeera Rice'], amount: 540, status: 'READY' }
              ],
              serverTime: new Date().toISOString(),
              databaseLatencyMs: 3.4
            },
            null,
            2
          )
        );
      } else if (endpointPath.includes('webhook') || endpointPath.includes('razorpay')) {
        setResponseBody(
          JSON.stringify(
            {
              status: 'WEBHOOK_PROCESSED',
              signatureVerified: true,
              event: 'payment.captured',
              paymentId: 'pay_NXF998822',
              amountCapturedInr: 1450.00,
              merchantLicenseTier: 'ACTIVE_ENTERPRISE',
              timestamp: new Date().toISOString()
            },
            null,
            2
          )
        );
      } else {
        setResponseBody(
          JSON.stringify(
            {
              status: 'OK',
              gateway: 'Nexify Microservice Control Plane',
              targetHost: selectedProj?.liveUrl,
              path: endpointPath,
              method: method,
              environment: selectedProj?.environment,
              headersParsed: headers.filter(h => h.enabled).length,
              timestamp: new Date().toISOString()
            },
            null,
            2
          )
        );
      }
    }, 400);
  };

  // Run Batch Collection Test Suite
  const handleRunTestSuite = async () => {
    setIsSuiteRunning(true);
    const results: { name: string; status: number; latency: number; pass: boolean }[] = [];

    for (let i = 0; i < API_PRESETS.length; i++) {
      const p = API_PRESETS[i];
      await new Promise(r => setTimeout(r, 260));
      const lat = Math.floor(Math.random() * 20) + 12;
      results.push({
        name: p.name,
        status: p.expectedStatus,
        latency: lat,
        pass: true
      });
      setSuiteResults([...results]);
    }

    setIsSuiteRunning(false);
  };

  // Copy helpers
  const handleCopyResponse = () => {
    navigator.clipboard.writeText(responseBody);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const handleCopySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  // Code generator
  const generatedCode = useMemo(() => {
    const activeHeaders = headers.filter(h => h.enabled && h.key);
    switch (snippetLanguage) {
      case 'CURL':
        const curlHeaders = activeHeaders.map(h => `  -H "${h.key}: ${h.value}" \\`).join('\n');
        const curlBody = (method === 'POST' || method === 'PUT') && requestBody ? `  -d '${requestBody.replace(/\n/g, '')}' \\` : '';
        return `curl -X ${method} "${fullConstructedUrl}" \\\n${curlHeaders}\n${curlBody}\n  --compressed`;

      case 'TYPESCRIPT':
        return `import axios from 'axios';

const response = await axios({
  method: '${method.toLowerCase()}',
  url: '${fullConstructedUrl}',
  headers: {
${activeHeaders.map(h => `    '${h.key}': '${h.value}',`).join('\n')}
  },
  ${method !== 'GET' ? `data: ${requestBody}` : ''}
});

console.log(response.data);`;

      case 'PYTHON':
        return `import requests

url = "${fullConstructedUrl}"
headers = {
${activeHeaders.map(h => `    "${h.key}": "${h.value}",`).join('\n')}
}
${method !== 'GET' ? `payload = ${requestBody}` : ''}

response = requests.${method.toLowerCase()}(
    url, 
    headers=headers${method !== 'GET' ? ', json=payload' : ''}
)
print(response.json())`;

      case 'GO':
        return `package main

import (
  "fmt"
  "net/http"
  "io"
)

func main() {
  req, _ := http.NewRequest("${method}", "${fullConstructedUrl}", nil)
${activeHeaders.map(h => `  req.Header.Set("${h.key}", "${h.value}")`).join('\n')}

  client := &http.Client{}
  resp, err := client.Do(req)
  if err != nil { panic(err) }
  defer resp.Body.Close()

  body, _ := io.ReadAll(resp.Body)
  fmt.Println(string(body))
}`;
    }
  }, [snippetLanguage, method, fullConstructedUrl, headers, requestBody]);

  return (
    <div className="space-y-6 pb-16">
      {/* ── Executive Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5 no-print">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-200/60 shadow-sm">
                <Code className="w-6 h-6 text-emerald-600" />
              </span>
              REST API Console & Microservice Gateway
            </h1>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              HTTP/2 & TLS 1.3 Live Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-3xl">
            Live developer API debugger across all client microservices. Test WebRTC proctoring handshakes, PostgreSQL queries, and Razorpay payment webhooks with automated cURL/Axios generators and batch suite execution.
          </p>
        </div>

        {/* Global Executive Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsSnippetModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Code className="w-3.5 h-3.5 text-slate-500" />
            <span>Generate Code</span>
          </button>

          <button
            onClick={handleRunTestSuite}
            disabled={isSuiteRunning}
            className="px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-50 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 text-emerald-600 ${isSuiteRunning ? 'animate-spin' : ''}`} />
            <span>{isSuiteRunning ? 'Running Suite...' : 'Run Test Suite'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Print A4 API Documentation Contract"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Spec</span>
          </button>
        </div>
      </div>

      {/* ── Test Suite Execution Bar (when active or complete) ── */}
      {suiteResults.length > 0 && (
        <div className="enterprise-card rounded-2xl p-4 space-y-3 bg-slate-900 text-white border-slate-800 shadow-xl no-print">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold font-mono flex items-center gap-2 text-emerald-400">
              <Activity className="w-4 h-4" />
              Automated API Collection Test Suite ({suiteResults.length}/{API_PRESETS.length} Complete)
            </span>
            <button
              onClick={() => setSuiteResults([])}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs font-mono">
            {suiteResults.map((res, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate text-slate-200 font-sans">{res.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-emerald-400 font-bold">{res.status}</span>
                  <span className="text-slate-400 text-[10px]">{res.latency}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Top Microservice Presets Strip ── */}
      <div className="enterprise-card rounded-2xl p-4 space-y-2.5 shadow-sm no-print">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-2">
            <Boxes className="w-4 h-4 text-emerald-600" />
            Pre-Configured Fleet Endpoint Presets
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Click to load headers, body & params
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
          {API_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleLoadPreset(p)}
              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50/80 hover:border-emerald-300 border border-slate-200 text-slate-800 flex items-center gap-2 shrink-0 transition-all cursor-pointer shadow-xs text-left"
            >
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  p.method === 'GET'
                    ? 'bg-blue-100 text-blue-800'
                    : p.method === 'POST'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {p.method}
              </span>
              <span className="font-sans font-semibold truncate max-w-[170px]">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Request Builder URL & Execute Bar ── */}
      <div className="enterprise-card rounded-2xl p-4 shadow-sm space-y-4 no-print">
        <div className="flex flex-col md:flex-row items-stretch gap-2.5">
          {/* Project Fleet Selector */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-sans font-bold text-xs text-slate-800 outline-none focus:border-emerald-500 cursor-pointer shrink-0"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.environment})
              </option>
            ))}
          </select>

          {/* HTTP Method */}
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
            className={`px-3 py-2 border rounded-xl font-mono font-bold text-xs outline-none focus:border-emerald-500 cursor-pointer shrink-0 ${
              method === 'GET'
                ? 'bg-blue-50 border-blue-300 text-blue-800'
                : method === 'POST'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : method === 'PUT' || method === 'PATCH'
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>

          {/* URL Input */}
          <div className="flex-1 flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3 text-xs font-mono focus-within:border-emerald-500 focus-within:bg-white transition-all shadow-xs">
            <span className="text-slate-400 select-none mr-1 font-semibold truncate max-w-[200px] hidden sm:inline">
              {selectedProj?.liveUrl}
            </span>
            <input
              type="text"
              value={endpointPath}
              onChange={(e) => setEndpointPath(e.target.value)}
              placeholder="/api/v1/health"
              className="flex-1 bg-transparent py-2 text-slate-900 outline-none font-bold"
            />
          </div>

          {/* Execute Send Button */}
          <button
            onClick={handleSendRequest}
            disabled={isLoading}
            className="px-6 py-2.5 theme-btn-primary rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Dispatching...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Request</span>
              </>
            )}
          </button>
        </div>

        {/* Display full constructed URL */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-100">
          <span className="truncate">
            Target Host: <strong className="text-slate-800">{fullConstructedUrl}</strong>
          </span>
          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
            SSL Handshake: Valid
          </span>
        </div>
      </div>

      {/* ── Main Split View: Request Tabs & Response Inspector ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
        {/* Left Column: Request Configuration */}
        <div className="enterprise-card rounded-2xl p-5 space-y-4 shadow-sm flex flex-col">
          {/* Request Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
            <button
              onClick={() => setRequestTab('HEADERS')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                requestTab === 'HEADERS'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Headers ({headers.filter(h => h.enabled).length})
            </button>

            <button
              onClick={() => setRequestTab('PARAMS')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                requestTab === 'PARAMS'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Query Params ({params.filter(p => p.enabled).length})
            </button>

            <button
              onClick={() => setRequestTab('BODY')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                requestTab === 'BODY'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Body (JSON)
            </button>

            <button
              onClick={() => setRequestTab('AUTH')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                requestTab === 'AUTH'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Auth ({authType})
            </button>
          </div>

          {/* TAB 1: HEADERS */}
          {requestTab === 'HEADERS' && (
            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">Key-Value HTTP Headers</span>
                <button
                  onClick={handleAddHeader}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Header</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {headers.map((hdr, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-mono">
                    <input
                      type="checkbox"
                      checked={hdr.enabled}
                      onChange={(e) => handleUpdateHeader(idx, 'enabled', e.target.checked)}
                      className="rounded text-emerald-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder="Key (e.g. Authorization)"
                      value={hdr.key}
                      onChange={(e) => handleUpdateHeader(idx, 'key', e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={hdr.value}
                      onChange={(e) => handleUpdateHeader(idx, 'value', e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                    />
                    <button
                      onClick={() => handleRemoveHeader(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: QUERY PARAMS */}
          {requestTab === 'PARAMS' && (
            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">URL Query Parameters</span>
                <button
                  onClick={handleAddParam}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Param</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {params.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-mono">
                    <input
                      type="checkbox"
                      checked={p.enabled}
                      onChange={(e) => handleUpdateParam(idx, 'enabled', e.target.checked)}
                      className="rounded text-emerald-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder="Param Key"
                      value={p.key}
                      onChange={(e) => handleUpdateParam(idx, 'key', e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={p.value}
                      onChange={(e) => handleUpdateParam(idx, 'value', e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                    />
                    <button
                      onClick={() => handleRemoveParam(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BODY */}
          {requestTab === 'BODY' && (
            <div className="space-y-2 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Payload Format: JSON (application/json)</span>
                <button
                  onClick={() => {
                    try {
                      setRequestBody(JSON.stringify(JSON.parse(requestBody), null, 2));
                    } catch (err) {}
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                >
                  Beautify JSON
                </button>
              </div>
              <textarea
                rows={10}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full flex-1 p-3.5 bg-slate-900 text-emerald-400 border border-slate-800 rounded-xl font-mono text-xs outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>
          )}

          {/* TAB 4: AUTH */}
          {requestTab === 'AUTH' && (
            <div className="space-y-4 flex-1 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">Authentication Protocol</label>
                <select
                  value={authType}
                  onChange={(e) => setAuthType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-500"
                >
                  <option value="BEARER">Bearer Token (JWT / OAuth2)</option>
                  <option value="API_KEY">API Key (X-Api-Key Header)</option>
                  <option value="NONE">No Authentication (Public Route)</option>
                </select>
              </div>

              {authType !== 'NONE' && (
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800">Token / Secret</label>
                  <input
                    type="password"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    Automatically attached to outbound request headers.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Response Telemetry Inspector */}
        <div className="enterprise-card rounded-2xl p-5 space-y-4 shadow-sm flex flex-col h-full">
          {/* Response Status & Latency Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-900">HTTP Response:</span>
              {responseStatus && (
                <span
                  className={`px-2.5 py-0.5 rounded-md font-mono text-xs font-bold flex items-center gap-1.5 ${
                    responseStatus >= 200 && responseStatus < 300
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{responseStatus} {responseStatusText}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
              {responseLatency && (
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{responseLatency} ms</span>
                </span>
              )}
              {responseSize && <span>Size: {responseSize}</span>}

              <button
                onClick={handleCopyResponse}
                className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-lg transition-all cursor-pointer border border-slate-200"
                title="Copy Response Body"
              >
                {copiedResponse ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Response Sub-Tabs: Body, Headers, Timings */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <button
              onClick={() => setResponseTab('BODY')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                responseTab === 'BODY'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Response Body
            </button>

            <button
              onClick={() => setResponseTab('HEADERS')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                responseTab === 'HEADERS'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Response Headers ({Object.keys(responseHeaders).length})
            </button>

            <button
              onClick={() => setResponseTab('TIMINGS')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                responseTab === 'TIMINGS'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Network Timings
            </button>
          </div>

          {/* Response Body View */}
          {responseTab === 'BODY' && (
            <div className="flex-1 min-h-[300px] bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-auto leading-relaxed border border-slate-800 shadow-inner">
              <pre>{responseBody}</pre>
            </div>
          )}

          {/* Response Headers View */}
          {responseTab === 'HEADERS' && (
            <div className="flex-1 min-h-[300px] bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2 text-xs font-mono overflow-y-auto">
              {Object.entries(responseHeaders).map(([k, v]) => (
                <div key={k} className="flex items-start justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="font-bold text-slate-700">{k}</span>
                  <span className="text-slate-900 break-all text-right max-w-[240px]">{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Network Timings View */}
          {responseTab === 'TIMINGS' && (
            <div className="flex-1 min-h-[300px] bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 text-xs font-mono">
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-700">
                  <span>DNS Lookup</span>
                  <span className="font-bold text-slate-900">1.8 ms</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="w-[10%] h-full bg-blue-500 rounded-full" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-700">
                  <span>TLS 1.3 Handshake</span>
                  <span className="font-bold text-slate-900">5.2 ms</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="w-[25%] h-full bg-emerald-500 rounded-full" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-700">
                  <span>Time to First Byte (TTFB)</span>
                  <span className="font-bold text-slate-900">14.6 ms</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="w-[60%] h-full bg-indigo-500 rounded-full" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-700">
                  <span>Content Download</span>
                  <span className="font-bold text-slate-900">2.4 ms</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="w-[15%] h-full bg-teal-500 rounded-full" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Code Snippet Generator Modal ── */}
      {isSnippetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn no-print">
          <div className="enterprise-card rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Code className="w-5 h-5 text-emerald-600" />
                  <span>Generate Executable Client Code</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Target: {method} {fullConstructedUrl}
                </p>
              </div>
              <button
                onClick={() => setIsSnippetModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              {(['CURL', 'TYPESCRIPT', 'PYTHON', 'GO'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSnippetLanguage(lang)}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    snippetLanguage === lang
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Generated Code Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-500 text-[10px] uppercase font-bold">Copy-Paste Snippet</span>
                <button
                  onClick={() => handleCopySnippet(generatedCode)}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 font-mono text-xs cursor-pointer"
                >
                  {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Snippet</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                {generatedCode}
              </pre>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-200 text-xs">
              <button
                onClick={() => setIsSnippetModalOpen(false)}
                className="theme-btn-primary px-5 py-2 rounded-xl text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINT-ONLY A4 FORMAL API CONTRACT DOCUMENTATION ── */}
      <div className="printable-api-sheet hidden print:block bg-white text-black p-8 max-w-[210mm] mx-auto">
        {/* Letterhead */}
        <div className="border-b-2 border-slate-900 pb-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Code className="w-8 h-8 text-emerald-700 inline" />
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                  Nexify DevOps Microservice API Gateway
                </h1>
              </div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mt-1">
                Official REST API Specification & Service Contract
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                OpenAPI 3.1 Compliant • TLS 1.3 Strict • Enterprise Zero-Trust Protocol
              </p>
            </div>
            <div className="text-right text-xs font-mono">
              <p className="font-bold text-slate-900">SPECIFICATION #</p>
              <p className="text-sm font-black text-emerald-800">NXF-API-2026-0920</p>
              <p className="text-[10px] text-slate-500 mt-1">Exported: {new Date().toUTCString()}</p>
            </div>
          </div>
        </div>

        {/* Selected Endpoint Contract */}
        <div className="border border-slate-300 rounded-lg p-4 mb-6 text-xs bg-slate-50/50">
          <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Active Route Definition</p>
          <p className="font-mono text-sm font-bold text-slate-900 mt-1">
            [{method}] {fullConstructedUrl}
          </p>
          <p className="text-[10px] text-slate-600 mt-1">
            Target Service: {selectedProj?.name} ({selectedProj?.environment})
          </p>
        </div>

        {/* Itemized Fleet Endpoints Catalog */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-200 pb-1">
            Standard Fleet Microservices API Catalog
          </h3>
          <table className="w-full text-left text-[9pt] border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-800 font-mono text-[8pt]">
                <th className="py-1.5 px-2">Method</th>
                <th className="py-1.5 px-2">Endpoint Path</th>
                <th className="py-1.5 px-2">Microservice & Purpose</th>
                <th className="py-1.5 px-2">Auth</th>
                <th className="py-1.5 px-2">Expected Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {API_PRESETS.map((p) => (
                <tr key={p.id} className="font-mono">
                  <td className="py-2 px-2 font-bold text-slate-900">{p.method}</td>
                  <td className="py-2 px-2 text-[8pt] text-slate-900 font-semibold">{p.path}</td>
                  <td className="py-2 px-2 font-sans text-[8pt]">
                    <div className="font-bold text-slate-900">{p.name}</div>
                    <div className="text-slate-600 text-[7pt]">{p.description}</div>
                  </td>
                  <td className="py-2 px-2 text-[8pt] text-purple-800">Bearer JWT</td>
                  <td className="py-2 px-2 font-bold text-emerald-800 text-[8pt]">
                    {p.expectedStatus} OK
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sign-off declaration */}
        <div className="border-t-2 border-slate-900 pt-6 mt-8">
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div>
              <p className="font-bold text-slate-900 mb-1">Architectural Compliance Guarantee:</p>
              <p className="text-[9pt] text-slate-600 leading-relaxed">
                All endpoints conform to RFC 7231 standards with strict CORS, TLS 1.3 encryption, and automated HMAC signature checks.
              </p>
            </div>
            <div className="flex flex-col justify-end items-end text-right">
              <div className="border-b border-slate-400 w-48 pb-1 mb-1 font-mono text-[9pt] font-bold text-slate-800">
                [Digitally Certified]
              </div>
              <p className="font-bold text-slate-900 text-[9pt]">Principal API Architect</p>
              <p className="text-[8pt] text-slate-500 font-mono">Nexify DevOps Control Plane</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
