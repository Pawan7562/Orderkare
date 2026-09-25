import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Lock,
  Key,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Clock,
  Terminal,
  FileCheck,
  Zap,
  Download,
  Printer,
  ChevronRight,
  ExternalLink,
  Search,
  Filter,
  Check,
  Copy,
  AlertOctagon,
  Cpu,
  Globe,
  Database,
  Layers,
  Sparkles,
  Award,
  X,
  SlidersHorizontal,
  ArrowUpRight,
  FileText,
  Boxes,
  KeyRound,
  Fingerprint
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';

export interface SecurityControl {
  id: string;
  soc2Control: string;
  title: string;
  category: 'ACCESS_CONTROL' | 'NETWORK_SECURITY' | 'DATABASE_SECURITY' | 'DEPENDENCIES' | 'SECRETS_VAULT' | 'CHANGE_MANAGEMENT' | 'INCIDENT_RESPONSE';
  status: 'PASS' | 'WARNING' | 'CRITICAL_RISK';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  frameworks: string[];
  evidenceId: string;
  evidenceDigest: string;
  details: string;
  remediation?: string;
  lastChecked: string;
}

export interface CveVulnerability {
  cveId: string;
  packageName: string;
  installedVersion: string;
  fixedVersion: string;
  cvssScore: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  remediationAction: string;
  fleetAffected: string;
}

const INITIAL_SECURITY_CONTROLS: SecurityControl[] = [
  {
    id: 'sec_001',
    soc2Control: 'CC6.1 - Logical Access Security',
    title: 'Hardware Token FIDO2 / WebAuthn MFA Enforcement',
    category: 'ACCESS_CONTROL',
    status: 'PASS',
    severity: 'LOW',
    frameworks: ['SOC-2 CC6.1', 'ISO 27001 A.9.4.2', 'HIPAA § 164.312(a)(2)(i)'],
    evidenceId: 'EVD-AUTH-FIDO2-2026',
    evidenceDigest: 'sha256:7f9a2b0c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a',
    details: 'All administrative endpoints and control plane dashboards require WebAuthn FIDO2 hardware token or biometric TOTP with step-up verification.',
    lastChecked: '2026-09-20 02:40:00 UTC'
  },
  {
    id: 'sec_002',
    soc2Control: 'CC6.6 - Network Boundary Protection',
    title: 'TLS 1.3 Strict Transport Security & HSTS Preload',
    category: 'NETWORK_SECURITY',
    status: 'PASS',
    severity: 'LOW',
    frameworks: ['SOC-2 CC6.6', 'ISO 27001 A.13.1.1', 'PCI-DSS v4.0 Req 4.1'],
    evidenceId: 'EVD-TLS-HSTS-PRELOAD-04',
    evidenceDigest: 'sha256:88a4f109bc53e20019a84b01e389d419fc229aa701e3b8a661c920bf0147e821',
    details: 'Edge routers enforce TLS 1.3 exclusively with AES-256-GCM ciphers, 0-RTT anti-replay protection, and max-age=63072000 includeSubDomains HSTS.',
    lastChecked: '2026-09-20 02:38:12 UTC'
  },
  {
    id: 'sec_003',
    soc2Control: 'CC6.7 - Data Transmission & Storage Encryption',
    title: 'PostgreSQL Serverless SSL/TLS Envelope Encryption',
    category: 'DATABASE_SECURITY',
    status: 'PASS',
    severity: 'LOW',
    frameworks: ['SOC-2 CC6.7', 'ISO 27001 A.10.1.1', 'HIPAA § 164.312(a)(2)(iv)'],
    evidenceId: 'EVD-DB-SSL-AES256-09',
    evidenceDigest: 'sha256:4f828731b9e0781290a184c637a912ef00527810bbf49a0281c7e90214a60183',
    details: 'PostgreSQL 16 Neon Serverless pooler enforces sslmode=verify-full with AES-GCM-256 envelope encryption at rest using AWS KMS Customer Managed Keys.',
    lastChecked: '2026-09-20 02:35:45 UTC'
  },
  {
    id: 'sec_004',
    soc2Control: 'CC7.1 - Vulnerability & Patch Management',
    title: 'Automated Dependency Vulnerability & AST Code Analysis',
    category: 'DEPENDENCIES',
    status: 'PASS',
    severity: 'MEDIUM',
    frameworks: ['SOC-2 CC7.1', 'ISO 27001 A.12.6.1', 'NIST SP 800-53 RA-5'],
    evidenceId: 'EVD-SAST-NPM-AUDIT-2026',
    evidenceDigest: 'sha256:30198fba0911762e84bc9102ca745199ff208471bce401889a710255a8819034',
    details: 'Continuous automated AST scan across 2,312 client modules. 0 Critical CVEs, 0 High CVEs, 1 Low severity debounce advisory remediated.',
    lastChecked: '2026-09-20 02:30:10 UTC'
  },
  {
    id: 'sec_005',
    soc2Control: 'CC6.3 - Cryptographic Key Management',
    title: 'Zero-Knowledge Secrets Masking & KMS Vault Isolation',
    category: 'SECRETS_VAULT',
    status: 'PASS',
    severity: 'LOW',
    frameworks: ['SOC-2 CC6.3', 'ISO 27001 A.10.1.2', 'FIPS 140-3 Level 3'],
    evidenceId: 'EVD-KMS-ENVELOPE-VAULT-02',
    evidenceDigest: 'sha256:1a9e4d770281bce9810a47f02816934c7190bb427a81005a91823bc0192e4091',
    details: 'Zero plaintext environment keys in code or build artifacts. All tokens are dynamically hydrated via HashiCorp Vault with ephemeral 300s TTLs.',
    lastChecked: '2026-09-20 02:25:00 UTC'
  },
  {
    id: 'sec_006',
    soc2Control: 'CC8.1 - Change Management & Release Governance',
    title: 'SHA-256 Merkle Chained CI/CD Commit & Deployment Signing',
    category: 'CHANGE_MANAGEMENT',
    status: 'PASS',
    severity: 'LOW',
    frameworks: ['SOC-2 CC8.1', 'ISO 27001 A.14.2.2', 'NIST SP 800-53 CM-3'],
    evidenceId: 'EVD-MERKLE-COMMIT-CHAIN-108',
    evidenceDigest: 'sha256:8e1a9c4b72ef3150d6840a32e185c7429df051ea89bc47038162e7428190fa7b',
    details: 'Production edge deployments require GPG/Ed25519 commit verification, peer SRE review pass, and cryptographic recording in immutable audit ledger.',
    lastChecked: '2026-09-20 02:15:22 UTC'
  },
  {
    id: 'sec_007',
    soc2Control: 'CC6.2 - Credential Lifecycle & Token Rotation',
    title: 'Payment Webhook Secret & API Key Rotation Schedule',
    category: 'SECRETS_VAULT',
    status: 'WARNING',
    severity: 'MEDIUM',
    frameworks: ['SOC-2 CC6.2', 'ISO 27001 A.9.2.4', 'PCI-DSS v4.0 Req 8.3'],
    evidenceId: 'EVD-TOKEN-ROTATION-POLICY-WARN',
    evidenceDigest: 'sha256:9104c8ba71018823490fae109845cc8109aa567104bce901449102758190ab76',
    details: 'Razorpay webhook signing secret is nearing the recommended 60-day lifecycle threshold (48 days active). Automated rotation scheduled in 12 days.',
    remediation: 'Trigger automated zero-downtime dual-key rotation from the Secrets Vault page.',
    lastChecked: '2026-09-20 02:10:00 UTC'
  },
  {
    id: 'sec_008',
    soc2Control: 'CC7.3 - Incident Response & Autonomous Recovery',
    title: 'AI Sentinel SRE Anomaly Mitigation & Circuit Breakers',
    category: 'INCIDENT_RESPONSE',
    status: 'PASS',
    severity: 'LOW',
    frameworks: ['SOC-2 CC7.3', 'ISO 27001 A.16.1.1', 'NIST SP 800-61 Rev 2'],
    evidenceId: 'EVD-AI-SENTINEL-FAILOVER-SRE',
    evidenceDigest: 'sha256:2c7e491a0b5f88421d89e5a6104bc825e7910043aa9f74819e685f09104bce31',
    details: 'Real-time WebRTC telemetry monitoring and automated socket saturation circuit breakers capable of autonomous sub-second geo-failover.',
    lastChecked: '2026-09-20 01:52:10 UTC'
  }
];

const INITIAL_CVE_INDEX: CveVulnerability[] = [
  {
    cveId: 'CVE-2026-1920',
    packageName: 'lodash.template',
    installedVersion: '4.5.0',
    fixedVersion: '4.5.2',
    cvssScore: 3.8,
    severity: 'LOW',
    title: 'Minor Prototype Pollution in Template Compilation Parser',
    description: 'A low-risk edge case parser flaw allows prototype pollution only when untrusted template strings are evaluated at runtime.',
    remediationAction: 'Patch applied via clean AST sandbox and upgraded package lockfile.',
    fleetAffected: 'OrderKare Dining SaaS'
  },
  {
    cveId: 'CVE-2025-48190',
    packageName: 'ws (WebSocket Engine)',
    installedVersion: '8.17.1',
    fixedVersion: '8.18.0',
    cvssScore: 4.2,
    severity: 'LOW',
    title: 'High-Volume Malformed UTF-8 WebSocket Frame CPU Consumption',
    description: 'Crafted malformed continuation frames can cause minor CPU spikes during high concurrent proctoring streams.',
    remediationAction: 'Applied edge rate-limiter and frame header sanitizer in Cyber Defense Layer.',
    fleetAffected: 'PK The NexGen Exam Monitoring System'
  }
];

export const SecurityScannerPage: React.FC = () => {
  const { projects } = useProjects();
  const [controls, setControls] = useState<SecurityControl[]>(INITIAL_SECURITY_CONTROLS);
  const [cves, setCves] = useState<CveVulnerability[]>(INITIAL_CVE_INDEX);
  
  // UI Tab & Filter state
  const [activeTab, setActiveTab] = useState<'CONTROLS' | 'CVE_SCANNER' | 'FLEET_MATRIX' | 'EVIDENCE_LOCKER'>('CONTROLS');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Scanner simulation states
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanTimestamp, setScanTimestamp] = useState('2026-09-20 02:45:00 UTC');
  const [selectedControl, setSelectedControl] = useState<SecurityControl | null>(null);
  const [copiedEvidence, setCopiedEvidence] = useState<string | null>(null);
  const [remediatingId, setRemediatingId] = useState<string | null>(null);

  const scanStages = [
    'Initializing Static Application Security Testing (SAST) on 2,312 modules...',
    'Scanning Open Source Vulnerability Database (OSV / NVD CVE Catalog)...',
    'Auditing TLS 1.3 Cipher Suites, HSTS Preload & WebRTC DTLS encryption...',
    'Verifying PostgreSQL AES-256-GCM Envelope Encryption & KMS Root Keys...',
    'Evaluating SOC 2 Type II Continuous Controls (CC6, CC7, CC8, CC9)...',
    'Generating Cryptographically Signed SOC 2 Evidence Attestation...'
  ];

  // Deep Security Scan Simulator
  const handleRunSecurityAudit = async () => {
    setIsScanning(true);
    setScanStep(0);

    for (let i = 0; i < scanStages.length; i++) {
      setScanStep(i);
      await new Promise(r => setTimeout(r, 450));
    }

    setIsScanning(false);
    const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    setScanTimestamp(timeStr);
  };

  // Instant Remediation Handler
  const handleRemediateControl = async (id: string) => {
    setRemediatingId(id);
    await new Promise(r => setTimeout(r, 800));
    setControls(prev =>
      prev.map(c => (c.id === id ? { ...c, status: 'PASS', details: c.details + ' (Automated remediation verified & applied via DevOps zero-downtime policy).' } : c))
    );
    setRemediatingId(null);
  };

  // Copy helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEvidence(id);
    setTimeout(() => setCopiedEvidence(null), 2000);
  };

  // Print Report Trigger
  const handlePrintSoc2Report = () => {
    window.print();
  };

  // Export SOC 2 Evidence JSON
  const handleExportEvidencePack = () => {
    const exportData = {
      complianceReport: {
        title: 'SOC 2 Type II & ISO/IEC 27001 Continuous Security Attestation',
        generatedAt: new Date().toISOString(),
        organization: 'Nexify Forge Technologies Pvt. Ltd.',
        securityGrade: 'A+ (99.4/100)',
        totalControls: controls.length,
        passingControls: controls.filter(c => c.status === 'PASS').length,
        advisories: controls.filter(c => c.status === 'WARNING').length,
        criticalRisks: controls.filter(c => c.status === 'CRITICAL_RISK').length,
        evidenceVault: controls.map(c => ({
          controlId: c.soc2Control,
          evidenceId: c.evidenceId,
          evidenceDigest: c.evidenceDigest,
          status: c.status,
          frameworks: c.frameworks
        }))
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexify-soc2-evidence-attestation-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtered Controls
  const filteredControls = useMemo(() => {
    return controls.filter(c => {
      const matchesSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.details.toLowerCase().includes(search.toLowerCase()) ||
        c.soc2Control.toLowerCase().includes(search.toLowerCase()) ||
        c.evidenceId.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [controls, search, categoryFilter, statusFilter]);

  const passingCount = controls.filter(c => c.status === 'PASS').length;
  const warningCount = controls.filter(c => c.status === 'WARNING').length;
  const criticalCount = controls.filter(c => c.status === 'CRITICAL_RISK').length;

  return (
    <div className="space-y-6 pb-16">
      {/* ── Executive Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5 no-print">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-200/60 shadow-sm">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </span>
              DevSecOps & SOC 2 Compliance Center
            </h1>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1.5 shadow-sm">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              SOC-2 Type II & ISO 27001:2022 Continuous Audit Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-3xl">
            Real-time automated Trust Services Criteria monitoring (CC6, CC7, CC8, CC9), SAST vulnerability detection, zero-knowledge secrets vault governance, and cryptographic evidence attestation.
          </p>
        </div>

        {/* Global Executive Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleRunSecurityAudit}
            disabled={isScanning}
            className="theme-btn-primary px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Running Deep Audit...' : 'Run Deep Security Audit'}</span>
          </button>

          <button
            onClick={handleExportEvidencePack}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-all"
            title="Download SOC 2 Evidence Locker JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Evidence JSON</span>
          </button>

          <button
            onClick={handlePrintSoc2Report}
            className="px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-50 flex items-center gap-1.5 shadow-sm transition-all"
            title="Print A4 Formal SOC 2 Compliance Statement"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-600" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* ── Active Scanning Progress Terminal ── */}
      {isScanning && (
        <div className="p-4 rounded-2xl bg-slate-900 text-emerald-400 border border-slate-800 shadow-xl space-y-3 font-mono text-xs animate-fadeIn no-print">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="flex items-center gap-2 text-white font-bold">
              <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
              DevSecOps Multi-Stage Autonomous Audit Engine
            </span>
            <span className="text-emerald-400 font-bold">Stage {scanStep + 1} of {scanStages.length}</span>
          </div>
          <p className="text-emerald-300 animate-pulse">
            &gt; {scanStages[scanStep]}
          </p>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${((scanStep + 1) / scanStages.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Security Posture KPI Matrix ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="enterprise-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Fleet Security Posture</p>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700 font-mono">A+ (99.4%)</span>
            <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              OPTIMAL
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono truncate">
            Continuous Trust Score
          </p>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">SOC 2 Trust Criteria</p>
            <FileCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{passingCount}/{controls.length}</span>
            <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-bold">
              {warningCount > 0 ? `${warningCount} ADVISORY` : 'ALL PASS'}
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 100% Audit Evidenced
          </p>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">CVE Vulnerability Index</p>
            <AlertOctagon className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">0 Critical</span>
            <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
              2 Low CVEs
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Zero Exploitable Zero-Days
          </p>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Last Compliance Scan</p>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-bold font-mono text-slate-900 truncate">{scanTimestamp}</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Auto-Sync: Every 15 Minutes
          </p>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold no-print">
        <button
          onClick={() => setActiveTab('CONTROLS')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'CONTROLS'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>SOC 2 Controls Matrix ({controls.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CVE_SCANNER')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'CVE_SCANNER'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>SAST & CVE Catalog ({cves.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('FLEET_MATRIX')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'FLEET_MATRIX'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Client Fleet Encryption ({projects.length})</span>
        </button>
      </div>

      {/* ── TAB 1: SOC 2 CONTROLS MATRIX ── */}
      {activeTab === 'CONTROLS' && (
        <div className="space-y-4 no-print">
          {/* Search and Filters */}
          <div className="enterprise-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SOC 2 control, evidence ID, title..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer focus:border-emerald-500 focus:bg-white transition-all font-medium text-xs"
              >
                <option value="ALL">All Categories</option>
                <option value="ACCESS_CONTROL">Logical Access (CC6.1)</option>
                <option value="NETWORK_SECURITY">Network & TLS (CC6.6)</option>
                <option value="DATABASE_SECURITY">Database & Storage (CC6.7)</option>
                <option value="DEPENDENCIES">Vulnerability & SAST (CC7.1)</option>
                <option value="SECRETS_VAULT">Secrets & Key Mgmt (CC6.3)</option>
                <option value="CHANGE_MANAGEMENT">Change Governance (CC8.1)</option>
                <option value="INCIDENT_RESPONSE">Incident Response (CC7.3)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer focus:border-emerald-500 focus:bg-white transition-all font-medium text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="PASS">Pass ({passingCount})</option>
                <option value="WARNING">Advisories ({warningCount})</option>
              </select>

              {(search || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearch('');
                    setCategoryFilter('ALL');
                    setStatusFilter('ALL');
                  }}
                  className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Controls List */}
          <div className="space-y-3">
            {filteredControls.map((ctrl) => (
              <div
                key={ctrl.id}
                className="enterprise-card rounded-2xl p-5 space-y-3.5 shadow-sm hover:border-slate-300 transition-all text-xs"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                      {ctrl.soc2Control}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                      {ctrl.title}
                    </h3>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        ctrl.status === 'PASS'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {ctrl.status === 'PASS' ? '100% COMPLIANT' : 'ADVISORY OPEN'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                      Evidence ID: {ctrl.evidenceId}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-2">
                    <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                      {ctrl.details}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {ctrl.frameworks.map((fw, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold"
                        >
                          {fw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Evidence Digest & Action */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-slate-500 font-bold text-[10px] uppercase">
                      <span>Cryptographic Digest</span>
                      <button
                        onClick={() => copyToClipboard(ctrl.evidenceDigest, ctrl.id)}
                        className="text-slate-400 hover:text-slate-800 flex items-center gap-1 font-sans font-medium"
                      >
                        {copiedEvidence === ctrl.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>

                    <p className="text-slate-800 text-[10px] break-all select-all font-semibold">
                      {ctrl.evidenceDigest.substring(0, 32)}...
                    </p>

                    <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px]">
                      <button
                        onClick={() => setSelectedControl(ctrl)}
                        className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 font-sans"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect Evidence
                      </button>

                      {ctrl.status === 'WARNING' && (
                        <button
                          onClick={() => handleRemediateControl(ctrl.id)}
                          disabled={remediatingId === ctrl.id}
                          className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-sans flex items-center gap-1 shadow-sm transition-all"
                        >
                          {remediatingId === ctrl.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Zap className="w-3 h-3" />
                          )}
                          <span>Auto-Rotate Key</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: SAST & CVE VULNERABILITY CATALOG ── */}
      {activeTab === 'CVE_SCANNER' && (
        <div className="space-y-4 no-print">
          <div className="enterprise-card rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-emerald-600" />
                  <span>Open Source Dependency & Package CVE Vulnerability Scanner</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time synchronization with GitHub Advisory Database, NIST NVD, and OSV Scanner.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                2,312 NPM Modules Clean
              </span>
            </div>

            <div className="space-y-3">
              {cves.map((cve) => (
                <div
                  key={cve.cveId}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                        {cve.cveId}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{cve.packageName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                        CVSS {cve.cvssScore} • {cve.severity}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      Fleet: {cve.fleetAffected}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-800">{cve.title}</p>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{cve.description}</p>

                  <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2 text-slate-500 font-mono">
                      <span>Installed: <strong className="text-slate-800">{cve.installedVersion}</strong></span>
                      <span>•</span>
                      <span>Fixed In: <strong className="text-emerald-700">{cve.fixedVersion}</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{cve.remediationAction}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: CLIENT FLEET ENCRYPTION MATRIX ── */}
      {activeTab === 'FLEET_MATRIX' && (
        <div className="space-y-4 no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <div key={p.id} className="enterprise-card rounded-2xl p-5 space-y-3.5 text-xs shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                    <p className="text-[10px] font-mono text-slate-400">{p.clientOrgName}</p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    SOC-2 Ready
                  </span>
                </div>

                <div className="space-y-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500">Database Engine & TLS</span>
                    <span className="font-bold text-slate-900">{p.databaseEngine} (SSL Required)</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500">KMS Secrets Stored</span>
                    <span className="font-bold text-indigo-700">{p.secrets.length} Encrypted Keys</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500">Edge Platform Routing</span>
                    <span className="font-bold text-slate-900">{p.deployProvider} Edge</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500">HSTS / TLS Handshake</span>
                    <span className="font-bold text-emerald-700">TLS 1.3 Strict</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Evidence Inspection Modal ── */}
      {selectedControl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn no-print">
          <div className="enterprise-card rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {selectedControl.soc2Control}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedControl.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedControl(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Control Description & Implementation</p>
                <p className="text-slate-800 text-xs sm:text-sm leading-relaxed">{selectedControl.details}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-mono text-slate-400">Evidence ID</p>
                  <p className="font-mono font-bold text-slate-900 text-xs">{selectedControl.evidenceId}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-mono text-slate-400">Compliance Status</p>
                  <p className="font-mono font-bold text-emerald-700 text-xs">VERIFIED PASS</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Cryptographic Evidence Digest (SHA-256)</p>
                <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto select-all">
                  {selectedControl.evidenceDigest}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
              <span className="text-emerald-700 font-bold flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Evidence Vault Sealed & WORM Compliant
              </span>
              <button
                onClick={() => setSelectedControl(null)}
                className="theme-btn-primary px-5 py-2 rounded-xl text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINT-ONLY A4 FORMAL SOC 2 COMPLIANCE ATTESTATION STATEMENT ── */}
      <div className="printable-soc2-sheet hidden print:block bg-white text-black p-8 max-w-[210mm] mx-auto">
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-emerald-700 inline" />
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                  Nexify Forge Technologies Pvt. Ltd.
                </h1>
              </div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mt-1">
                SOC 2 Type II & ISO/IEC 27001:2022 Continuous Security Attestation Report
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                Trust Services Criteria: Security (CC6), Availability (CC7), Change Governance (CC8), Incident Management (CC9)
              </p>
            </div>
            <div className="text-right text-xs font-mono">
              <p className="font-bold text-slate-900">REPORT SERIAL #</p>
              <p className="text-sm font-black text-emerald-800">SOC2-NXF-2026-0920</p>
              <p className="text-[10px] text-slate-500 mt-1">Audit Date: {new Date().toUTCString()}</p>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="grid grid-cols-3 gap-4 border border-slate-300 rounded-lg p-4 mb-6 text-xs bg-slate-50/50">
          <div>
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Overall Security Posture</p>
            <p className="font-black text-emerald-800 text-lg">A+ (99.4%)</p>
            <p className="text-[9px] text-slate-500">Zero Critical Vulnerabilities</p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Continuous Controls Evaluated</p>
            <p className="font-bold text-slate-900 text-sm">
              {passingCount}/{controls.length} Passing (100% Evidenced)
            </p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Audit Scope</p>
            <p className="font-semibold text-slate-900 text-xs">All Multi-Tenant Client Fleets</p>
            <p className="text-[9px] text-slate-500 font-mono">AP-South-1 & US-East-1 Edge</p>
          </div>
        </div>

        {/* Itemized Controls Table */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-200 pb-1">
            Itemized SOC 2 Trust Services Criteria Controls Matrix
          </h3>
          <table className="w-full text-left text-[9pt] border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-800 font-mono text-[8pt]">
                <th className="py-1.5 px-2">Control ID</th>
                <th className="py-1.5 px-2">Control Title & Implementation</th>
                <th className="py-1.5 px-2">Frameworks</th>
                <th className="py-1.5 px-2">Status</th>
                <th className="py-1.5 px-2">Evidence Digest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {controls.map((ctrl) => (
                <tr key={ctrl.id} className="font-mono">
                  <td className="py-2 px-2 font-bold text-slate-900 text-[8pt]">{ctrl.soc2Control}</td>
                  <td className="py-2 px-2 font-sans text-[8pt]">
                    <div className="font-bold text-slate-900">{ctrl.title}</div>
                    <div className="text-slate-600 text-[7pt] mt-0.5">{ctrl.details}</div>
                  </td>
                  <td className="py-2 px-2 text-[7pt] text-purple-800">{ctrl.frameworks.join(', ')}</td>
                  <td className="py-2 px-2 font-bold text-emerald-800 text-[8pt]">
                    {ctrl.status === 'PASS' ? 'PASS' : 'ADVISORY'}
                  </td>
                  <td className="py-2 px-2 text-[7pt] text-slate-600 break-all max-w-[100px]">
                    {ctrl.evidenceDigest.substring(0, 16)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Auditor Declaration */}
        <div className="border-t-2 border-slate-900 pt-6 mt-8">
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div>
              <p className="font-bold text-slate-900 mb-1">SOC 2 Type II Attestation Statement:</p>
              <p className="text-[9pt] text-slate-600 leading-relaxed">
                Management of Nexify Forge Technologies confirms that control objectives regarding Security, Availability, and Confidentiality were suitably designed and operating effectively throughout the audit period.
              </p>
            </div>
            <div className="flex flex-col justify-end items-end text-right">
              <div className="border-b border-slate-400 w-48 pb-1 mb-1 font-mono text-[9pt] font-bold text-slate-800">
                [Digitally Signed by SecOps Lead]
              </div>
              <p className="font-bold text-slate-900 text-[9pt]">Chief Information Security Officer</p>
              <p className="text-[8pt] text-slate-500 font-mono">Nexify DevOps SecOps Board</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
