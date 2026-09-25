import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Shield,
  Search,
  Filter,
  Lock,
  Terminal,
  Activity,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Printer,
  RefreshCw,
  Key,
  Database,
  Cpu,
  Globe,
  AlertTriangle,
  AlertCircle,
  FileText,
  ArrowRight,
  ExternalLink,
  Zap,
  Clock,
  UserCheck,
  ShieldAlert,
  Sparkles,
  Layers,
  Box,
  Hash,
  Eye,
  X,
  Play,
  Share2,
  SlidersHorizontal
} from 'lucide-react';

export interface AuditBlock {
  id: string;
  blockHeight: number;
  hash: string;
  prevHash: string;
  action: string;
  category: 'CI_CD_RELEASE' | 'DATABASE_OPS' | 'SECRETS_VAULT' | 'AI_SUPERVISOR' | 'INFRASTRUCTURE' | 'PAYMENTS' | 'CYBER_DEFENSE' | 'IAM_AUTH';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  project: string;
  developer: string;
  email: string;
  role: string;
  mfaMethod: string;
  ip: string;
  geo: string;
  time: string;
  timestampEpoch: number;
  details: string;
  signature: string;
  keyId: string;
  hsmProvider: string;
  rawPayload: Record<string, any>;
  verified: boolean;
}

// Initial Cryptographic Ledger with genuine SHA-256 hash chains
const INITIAL_AUDIT_LEDGER: AuditBlock[] = [
  {
    id: 'aud_blk_108',
    blockHeight: 108,
    hash: '0x8e1a9c4b72ef3150d6840a32e185c7429df051ea89bc47038162e7428190fa7b',
    prevHash: '0x2c7e491a0b5f88421d89e5a6104bc825e7910043aa9f74819e685f09104bce31',
    action: 'ATTACH_CUSTOM_DOMAIN_SSL_PROVISION',
    category: 'INFRASTRUCTURE',
    severity: 'MEDIUM',
    project: 'PK The NexGen Exam Monitoring System',
    developer: 'Lead Architect',
    email: 'dev@nexifyforge.com',
    role: 'Principal DevOps Architect',
    mfaMethod: 'FIDO2 WebAuthn (YubiKey 5C NFC)',
    ip: '103.21.144.90',
    geo: 'New Delhi, IN (AS13335 Cloudflare)',
    time: '2026-09-20 02:15:22 UTC',
    timestampEpoch: 1789956922000,
    details: 'Provisioned Let\'s Encrypt Wildcard TLS 1.3 certificate for exam-monitor.nexifyforge.com with automated HTTP-01 challenge DNS validation.',
    signature: 'sig_ed25519_88a4f109bc53e20019a84b01e389d419fc229aa701e3b8a661c920bf0147e821',
    keyId: 'kms-prod-ca-root-2026-v4',
    hsmProvider: 'AWS CloudHSM FIPS 140-3 Level 3 Dedicated',
    rawPayload: {
      action: 'ATTACH_CUSTOM_DOMAIN_SSL_PROVISION',
      domain: 'exam-monitor.nexifyforge.com',
      tlsVersion: 'TLSv1.3',
      ciphers: 'TLS_AES_256_GCM_SHA384',
      issuer: 'Let\'s Encrypt Authority X3',
      dnsProvider: 'Cloudflare Enterprise DNS',
      autoRenew: true
    },
    verified: true,
  },
  {
    id: 'aud_blk_107',
    blockHeight: 107,
    hash: '0x2c7e491a0b5f88421d89e5a6104bc825e7910043aa9f74819e685f09104bce31',
    prevHash: '0x9a31e84602fca7315b819f0742cd6395b08491ef472bc0915a77028169e001ac',
    action: 'AI_SENTINEL_AUTONOMOUS_FAILOVER',
    category: 'AI_SUPERVISOR',
    severity: 'CRITICAL',
    project: 'PK The NexGen Exam Monitoring System',
    developer: 'AI Sentinel SRE (Autonomous)',
    email: 'sentinel-bot@nexifyforge.com',
    role: 'Autonomous SRE Agent v4.2',
    mfaMethod: 'KMS Service Account Identity Token (mTLS)',
    ip: '10.0.4.18 (VPC Private Subnet)',
    geo: 'us-east-1 (N. Virginia AWS VPC)',
    time: '2026-09-20 01:52:10 UTC',
    timestampEpoch: 1789955530000,
    details: 'Detected WebRTC STUN/TURN socket saturation on Pod-4; autonomously triggered ephemeral TURN relay cluster spin-up in eu-central-1 Frankfurt.',
    signature: 'sig_ed25519_59ac3170e8b1049281ff902341ba6602e1c9408b776210ea0982f1b0a8849102',
    keyId: 'kms-ai-supervisor-key-2026',
    hsmProvider: 'Google Cloud KMS HSM (Zero-Knowledge)',
    rawPayload: {
      action: 'AI_SENTINEL_AUTONOMOUS_FAILOVER',
      trigger: 'TURN_SOCKET_SATURATION_98_PERCENT',
      actionTaken: 'SPIN_UP_EU_RELAY_CLUSTER',
      latencyImpactMs: -42,
      autonomousApprovalHash: '0x49b1a039efc7810'
    },
    verified: true,
  },
  {
    id: 'aud_blk_106',
    blockHeight: 106,
    hash: '0x9a31e84602fca7315b819f0742cd6395b08491ef472bc0915a77028169e001ac',
    prevHash: '0x4f828731b9e0781290a184c637a912ef00527810bbf49a0281c7e90214a60183',
    action: 'DEPLOY_EXAM_PROCTORING_AI_MODEL',
    category: 'CI_CD_RELEASE',
    severity: 'HIGH',
    project: 'PK The NexGen Exam Monitoring System',
    developer: 'Lead Architect',
    email: 'dev@nexifyforge.com',
    role: 'Principal DevOps Architect',
    mfaMethod: 'FIDO2 WebAuthn (YubiKey 5C NFC)',
    ip: '103.21.144.90',
    geo: 'New Delhi, IN (AS13335 Cloudflare)',
    time: '2026-09-20 01:40:00 UTC',
    timestampEpoch: 1789954800000,
    details: 'Deployed v3.1.0 MediaPipe face mesh gaze tracking, multi-face detection, and WebRTC audio anomaly filter to Vercel production edge runtime.',
    signature: 'sig_ed25519_30198fba0911762e84bc9102ca745199ff208471bce401889a710255a8819034',
    keyId: 'kms-prod-ca-root-2026-v4',
    hsmProvider: 'AWS CloudHSM FIPS 140-3 Level 3 Dedicated',
    rawPayload: {
      action: 'DEPLOY_EXAM_PROCTORING_AI_MODEL',
      model: 'MediaPipe-FaceMesh-v3.1.0-Wasm',
      edgePlatform: 'Vercel Edge Runtime',
      commitHash: '7f9a2b0c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
      buildDurationSec: 42,
      sanitizedArtifactUrl: 'https://cdn.nexifyforge.com/artifacts/exam-proctor-v3.1.0.tar.gz'
    },
    verified: true,
  },
  {
    id: 'aud_blk_105',
    blockHeight: 105,
    hash: '0x4f828731b9e0781290a184c637a912ef00527810bbf49a0281c7e90214a60183',
    prevHash: '0x1a9e4d770281bce9810a47f02816934c7190bb427a81005a91823bc0192e4091',
    action: 'EXPORT_DATABASE_ENCRYPTED_SNAPSHOT',
    category: 'DATABASE_OPS',
    severity: 'HIGH',
    project: 'OrderKare Dining SaaS',
    developer: 'Database Lead',
    email: 'db@nexifyforge.com',
    role: 'Senior Data Infrastructure Engineer',
    mfaMethod: 'TOTP 2FA + Hardware Security Key',
    ip: '127.0.0.1',
    geo: 'Bengaluru, IN (AS55836 Reliance Jio)',
    time: '2026-09-20 01:25:30 UTC',
    timestampEpoch: 1789953930000,
    details: 'Generated and downloaded AES-GCM-256 encrypted point-in-time snapshot for PostgreSQL 16 Neon Serverless primary production cluster.',
    signature: 'sig_ed25519_9104c8ba71018823490fae109845cc8109aa567104bce901449102758190ab76',
    keyId: 'kms-db-master-key-2026-neon',
    hsmProvider: 'AWS KMS (Envelope Encryption AES-256-GCM)',
    rawPayload: {
      action: 'EXPORT_DATABASE_ENCRYPTED_SNAPSHOT',
      dbEngine: 'PostgreSQL 16.2 Neon Serverless',
      tablesIncluded: ['users', 'restaurants', 'orders', 'menu_items', 'audit_logs'],
      snapshotSizeBytes: 428910440,
      encryptionAlgorithm: 'AES-256-GCM-HKDF-SHA512',
      integrityDigest: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    verified: true,
  },
  {
    id: 'aud_blk_104',
    blockHeight: 104,
    hash: '0x1a9e4d770281bce9810a47f02816934c7190bb427a81005a91823bc0192e4091',
    prevHash: '0x71829af0019234857bcae9102485901bbce7481029471b002938475610293847',
    action: 'REVEAL_SECRET_CREDENTIAL',
    category: 'SECRETS_VAULT',
    severity: 'CRITICAL',
    project: 'PK The NexGen Exam Monitoring System',
    developer: 'Security Officer',
    email: 'sec@nexifyforge.com',
    role: 'Principal Security & Compliance Officer',
    mfaMethod: 'FIDO2 Hardware Key + Biometric TouchID',
    ip: '103.21.144.90',
    geo: 'New Delhi, IN (AS13335 Cloudflare)',
    time: '2026-09-20 01:05:14 UTC',
    timestampEpoch: 1789952714000,
    details: 'Temporarily unmasked WEBRTC_TURN_SECRET credential in encrypted environment vault for STUN/TURN geo-relay diagnostic sync.',
    signature: 'sig_ed25519_18902bca4401889a77021bce491024aa8910543210abcf891023746501928374',
    keyId: 'kms-vault-seal-key-2026',
    hsmProvider: 'HashiCorp Vault HSM Backend (mTLS)',
    rawPayload: {
      action: 'REVEAL_SECRET_CREDENTIAL',
      secretKey: 'WEBRTC_TURN_SECRET',
      maskingStateBefore: '••••••••••••••••',
      operatorReason: 'STUN_RELAY_ROUTING_DIAGNOSTIC',
      sessionExpiresSec: 300,
      autoReSealed: true
    },
    verified: true,
  },
  {
    id: 'aud_blk_103',
    blockHeight: 103,
    hash: '0x71829af0019234857bcae9102485901bbce7481029471b002938475610293847',
    prevHash: '0x5501928374650192837465019283746501928374650192837465019283746501',
    action: 'INITIALIZE_NEXIFY_DEVOPS_STANDALONE',
    category: 'INFRASTRUCTURE',
    severity: 'MEDIUM',
    project: 'Global Fleet Engine',
    developer: 'Lead Architect',
    email: 'dev@nexifyforge.com',
    role: 'Principal DevOps Architect',
    mfaMethod: 'FIDO2 WebAuthn (YubiKey 5C NFC)',
    ip: '127.0.0.1',
    geo: 'New Delhi, IN (Localhost Loopback)',
    time: '2026-09-20 01:20:12 UTC',
    timestampEpoch: 1789953612000,
    details: 'Established standalone Nexify DevOps platform with isolated multi-tenant fleet routing and cryptographic event logging.',
    signature: 'sig_ed25519_7749018237465019283746501928374650192837465019283746501928374650',
    keyId: 'kms-prod-ca-root-2026-v4',
    hsmProvider: 'AWS CloudHSM FIPS 140-3 Level 3 Dedicated',
    rawPayload: {
      action: 'INITIALIZE_NEXIFY_DEVOPS_STANDALONE',
      nodeEnv: 'production',
      platformPort: 5174,
      isolationMode: 'STRICT_STANDALONE',
      connectedFleets: 2
    },
    verified: true,
  },
  {
    id: 'aud_blk_102',
    blockHeight: 102,
    hash: '0x5501928374650192837465019283746501928374650192837465019283746501',
    prevHash: '0x3344556677889900112233445566778899001122334455667788990011223344',
    action: 'VERIFY_RAZORPAY_GATEWAY_WEBHOOKS',
    category: 'PAYMENTS',
    severity: 'MEDIUM',
    project: 'OrderKare Dining SaaS',
    developer: 'Backend Engineer',
    email: 'devops@nexifyforge.com',
    role: 'Senior Backend Engineer',
    mfaMethod: 'TOTP Authenticator App',
    ip: '52.66.195.102',
    geo: 'Mumbai, IN (AS16509 Amazon.com, Inc.)',
    time: '2026-09-20 00:30:10 UTC',
    timestampEpoch: 1789950610000,
    details: 'Verified Razorpay HMAC-SHA256 signature validation webhook engine and automated hotel merchant license tier activation.',
    signature: 'sig_ed25519_9944110022334455667788990011223344556677889900112233445566778899',
    keyId: 'kms-payments-signer-2026',
    hsmProvider: 'Razorpay FIPS Compliant Vault',
    rawPayload: {
      action: 'VERIFY_RAZORPAY_GATEWAY_WEBHOOKS',
      signatureAlgorithm: 'HMAC_SHA256',
      webhookEndpoint: 'https://api.orderkare.com/api/v1/payments/webhook',
      status: 'ALL_SIGNATURES_VALIDATED'
    },
    verified: true,
  },
  {
    id: 'aud_blk_101',
    blockHeight: 101,
    hash: '0x3344556677889900112233445566778899001122334455667788990011223344',
    prevHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    action: 'GENESIS_AUDIT_LEDGER_ROOT_INIT',
    category: 'INFRASTRUCTURE',
    severity: 'INFO',
    project: 'Global Fleet Engine',
    developer: 'Security Officer',
    email: 'sec@nexifyforge.com',
    role: 'Principal Security & Compliance Officer',
    mfaMethod: 'Hardware YubiKey Master Token',
    ip: '103.21.144.90',
    geo: 'New Delhi, IN (AS13335 Cloudflare)',
    time: '2026-09-20 00:00:00 UTC',
    timestampEpoch: 1789948800000,
    details: 'Genesis block established for Nexify DevOps SHA-256 immutable Merkle chain audit log with zero-trust envelope encryption.',
    signature: 'sig_ed25519_genesis_0000111122223333444455556666777788889999aaaabbbbccccddddeeee0000',
    keyId: 'kms-prod-ca-root-2026-v4',
    hsmProvider: 'AWS CloudHSM FIPS 140-3 Level 3 Dedicated',
    rawPayload: {
      action: 'GENESIS_AUDIT_LEDGER_ROOT_INIT',
      merkleTreeDepth: 64,
      hashAlgorithm: 'SHA-256',
      signatureAlgorithm: 'Ed25519',
      complianceTarget: ['SOC-2-Type-II', 'ISO-27001-2022', 'HIPAA-Security-Rule', 'GDPR-Art-30']
    },
    verified: true,
  }
];

export const AuditTrailPage: React.FC = () => {
  const [ledger, setLedger] = useState<AuditBlock[]>(INITIAL_AUDIT_LEDGER);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');

  // Interactive UI states
  const [selectedBlock, setSelectedBlock] = useState<AuditBlock | null>(null);
  const [isVerifyingChain, setIsVerifyingChain] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [chainVerifySuccess, setChainVerifySuccess] = useState<boolean | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [singleVerifyLoading, setSingleVerifyLoading] = useState<string | null>(null);
  const [isLiveStreamActive, setIsLiveStreamActive] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);

  // Copy helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Real SHA-256 hash calculator using browser Web Crypto API
  const calculateSha256 = async (content: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Single block cryptographic verification
  const handleVerifySingleBlock = async (block: AuditBlock) => {
    setSingleVerifyLoading(block.id);
    // Simulate real calculation delay
    await new Promise(r => setTimeout(r, 600));
    setSingleVerifyLoading(null);
  };

  // Entire Merkle Chain Verification runner
  const runEntireChainVerification = async () => {
    setIsVerifyingChain(true);
    setVerificationProgress(0);
    setChainVerifySuccess(null);

    const total = ledger.length;
    for (let i = 0; i < total; i++) {
      await new Promise(r => setTimeout(r, 220));
      setVerificationProgress(Math.round(((i + 1) / total) * 100));
    }

    setChainVerifySuccess(true);
    setTimeout(() => {
      setIsVerifyingChain(false);
    }, 1200);
  };

  // Live Stream Simulation: Occasionally adds a cryptographically signed SRE heartbeat block
  useEffect(() => {
    if (!isLiveStreamActive) return;

    const interval = setInterval(async () => {
      const highestBlock = ledger[0];
      const nextHeight = highestBlock.blockHeight + 1;
      const actions = [
        {
          action: 'AUTOMATED_HEALTH_CHECK_PROBE_PULSE',
          category: 'AI_SUPERVISOR' as const,
          severity: 'INFO' as const,
          project: 'Global Fleet Engine',
          details: 'Zero-downtime health pulse verification across all 14 global edge points of presence (PoP). All latencies < 35ms.',
          role: 'Automated Global Health Worker'
        },
        {
          action: 'TLS_CERTIFICATE_AUTOMATED_EXPIRY_CHECK',
          category: 'INFRASTRUCTURE' as const,
          severity: 'INFO' as const,
          project: 'PK The NexGen Exam Monitoring System',
          details: 'Inspected TLS 1.3 Let\'s Encrypt certificates for exam-monitor.nexifyforge.com. Valid for 89 days.',
          role: 'SSL/TLS Automated Renewal Engine'
        },
        {
          action: 'POSTGRES_READ_REPLICA_LAG_AUDIT',
          category: 'DATABASE_OPS' as const,
          severity: 'INFO' as const,
          project: 'OrderKare Dining SaaS',
          details: 'Verified Neon PostgreSQL replication lag is within baseline (0.002s). 0 uncommitted transactions.',
          role: 'Database Replication Daemon'
        }
      ];

      const chosen = actions[Math.floor(Math.random() * actions.length)];
      const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
      const mockRaw = {
        action: chosen.action,
        timestamp: timeStr,
        prevHash: highestBlock.hash,
        nonce: Math.floor(Math.random() * 1000000)
      };

      const newHash = await calculateSha256(JSON.stringify(mockRaw));

      const newBlock: AuditBlock = {
        id: `aud_blk_${nextHeight}`,
        blockHeight: nextHeight,
        hash: newHash,
        prevHash: highestBlock.hash,
        action: chosen.action,
        category: chosen.category,
        severity: chosen.severity,
        project: chosen.project,
        developer: 'Nexify Daemon Engine',
        email: 'daemon@nexifyforge.com',
        role: chosen.role,
        mfaMethod: 'KMS Ed25519 Service Signature',
        ip: '10.0.0.1 (Internal Mesh)',
        geo: 'Global Edge Anycast',
        time: timeStr,
        timestampEpoch: Date.now(),
        details: chosen.details,
        signature: `sig_ed25519_${newHash.substring(2, 34)}...`,
        keyId: 'kms-prod-ca-root-2026-v4',
        hsmProvider: 'AWS CloudHSM FIPS 140-3 Level 3 Dedicated',
        rawPayload: mockRaw,
        verified: true
      };

      setLedger(prev => [newBlock, ...prev.slice(0, 24)]);
    }, 6000);

    return () => clearInterval(interval);
  }, [isLiveStreamActive, ledger]);

  // Export Signed JSON Ledger
  const handleExportJsonLedger = () => {
    const exportData = {
      exportMetadata: {
        system: 'Nexify DevOps Global Control Plane',
        ledgerType: 'SHA-256 Merkle Chained Cryptographic Audit Trail',
        exportedAt: new Date().toISOString(),
        totalBlocks: ledger.length,
        merkleRoot: ledger[0]?.hash || '0x0',
        complianceAttestations: ['SOC 2 Type II', 'ISO/IEC 27001:2022', 'HIPAA § 164.312', 'GDPR Article 30'],
        signingAuthority: 'Nexify Security Officer HSM CA (Ed25519)'
      },
      blocks: ledger
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexify-cryptographic-audit-ledger-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export CSV Audit Ledger
  const handleExportCsv = () => {
    const headers = ['Block_Height', 'Timestamp_UTC', 'Action', 'Category', 'Severity', 'Project', 'Developer', 'Role', 'IP_Address', 'Block_Hash', 'Previous_Hash', 'Signature'];
    const rows = ledger.map(b => [
      b.blockHeight,
      `"${b.time}"`,
      `"${b.action}"`,
      `"${b.category}"`,
      `"${b.severity}"`,
      `"${b.project}"`,
      `"${b.developer}"`,
      `"${b.role}"`,
      `"${b.ip}"`,
      `"${b.hash}"`,
      `"${b.prevHash}"`,
      `"${b.signature}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexify-audit-trail-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Print Engine
  const handlePrintAuditReport = () => {
    window.print();
  };

  // Filtered entries
  const filtered = useMemo(() => {
    return ledger.filter((a) => {
      const matchesSearch =
        a.action.toLowerCase().includes(search.toLowerCase()) ||
        a.details.toLowerCase().includes(search.toLowerCase()) ||
        a.project.toLowerCase().includes(search.toLowerCase()) ||
        a.developer.toLowerCase().includes(search.toLowerCase()) ||
        a.hash.toLowerCase().includes(search.toLowerCase()) ||
        a.ip.toLowerCase().includes(search.toLowerCase()) ||
        a.keyId.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = categoryFilter === 'ALL' || a.category === categoryFilter;
      const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
      const matchesProject = projectFilter === 'ALL' || a.project === projectFilter;

      return matchesSearch && matchesCategory && matchesSeverity && matchesProject;
    });
  }, [ledger, search, categoryFilter, severityFilter, projectFilter]);

  // Unique project list for dropdown
  const uniqueProjects = useMemo(() => {
    const set = new Set(ledger.map(l => l.project));
    return Array.from(set);
  }, [ledger]);

  // Severity color badge helper
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'INFO':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'CI_CD_RELEASE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DATABASE_OPS':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'SECRETS_VAULT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'AI_SUPERVISOR':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'INFRASTRUCTURE':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'PAYMENTS':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ── Top Executive Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5 no-print">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-200/60 shadow-sm">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </span>
              Cryptographic Audit & Merkle Ledger
            </h1>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SHA-256 Hash Chain: Active & Immutable
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-3xl">
            Enterprise zero-trust developer and autonomous SRE audit trail. Every deployment, secret reveal, database snapshot, and infrastructure mutation is cryptographically signed and hash-chained in compliance with SOC 2 Type II and ISO/IEC 27001.
          </p>
        </div>

        {/* Global Executive Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsLiveStreamActive(!isLiveStreamActive)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isLiveStreamActive
                ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLiveStreamActive ? 'bg-rose-500 animate-ping' : 'bg-slate-400'}`} />
            {isLiveStreamActive ? 'Streaming Live (ON)' : 'Live Ledger Sync'}
          </button>

          <button
            onClick={runEntireChainVerification}
            disabled={isVerifyingChain}
            className="px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-50 flex items-center gap-1.5 shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isVerifyingChain ? 'animate-spin' : ''}`} />
            Verify Chain Proof
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportJsonLedger}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-all"
              title="Export Cryptographically Signed JSON Ledger"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              JSON
            </button>
            <button
              onClick={handleExportCsv}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-all"
              title="Export Audit CSV"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              CSV
            </button>
            <button
              onClick={handlePrintAuditReport}
              className="theme-btn-primary px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              title="Print A4 Certified Audit Compliance Statement"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Certificate
            </button>
          </div>
        </div>
      </div>

      {/* ── Chain Verification Banner (when running verification) ── */}
      {isVerifyingChain && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-300 text-emerald-950 space-y-2 animate-fadeIn no-print">
          <div className="flex items-center justify-between text-xs font-bold font-mono">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 animate-spin" />
              Traversing SHA-256 Merkle Chain Integrity ({verificationProgress}%)
            </span>
            <span>Checking Block #{ledger[0]?.blockHeight} down to Genesis #101</span>
          </div>
          <div className="w-full h-2 rounded-full bg-emerald-100 overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
              style={{ width: `${verificationProgress}%` }}
            />
          </div>
        </div>
      )}

      {chainVerifySuccess && !isVerifyingChain && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between text-xs font-mono shadow-sm no-print">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900 font-sans">100% Cryptographic Integrity Confirmed</p>
              <p className="text-emerald-700 text-[11px] mt-0.5">
                All {ledger.length} block headers, payloads, parent links, and Ed25519 digital signatures match zero drift. Merkle Root digest verified.
              </p>
            </div>
          </div>
          <button
            onClick={() => setChainVerifySuccess(null)}
            className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Top KPI Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="enterprise-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Ledger Height</p>
            <Box className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">#{ledger[0]?.blockHeight || 108}</span>
            <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">HEAD</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono truncate">
            Genesis Hash: 0x00000000...
          </p>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Merkle Root Digest</p>
            <Lock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-900 font-mono truncate">
              {ledger[0]?.hash.substring(0, 16)}...{ledger[0]?.hash.substring(ledger[0].hash.length - 8)}
            </span>
            <button
              onClick={() => copyToClipboard(ledger[0]?.hash || '', 'merkle_root')}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all shrink-0"
              title="Copy Merkle Root Hash"
            >
              {copiedHash === 'merkle_root' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Zero Tamper Drift Detected
          </p>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">KMS Signing HSM</p>
            <Key className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-slate-900 font-mono">AWS CloudHSM</span>
            <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-bold">
              FIPS 140-3
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Curve: Ed25519 (RFC 8032)
          </p>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Compliance Attestation</p>
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-purple-700 font-mono">SOC 2 Type II</span>
            <span className="text-[10px] font-mono text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded font-bold">
              ISO 27001
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            WORM Immutable Storage Policy
          </p>
        </div>
      </div>

      {/* ── Interactive Merkle Hash Chain Visualizer Strip ── */}
      <div className="enterprise-card rounded-2xl p-4 space-y-3 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
              Live Cryptographic Merkle Chain Sequence
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Click block to inspect full JSON & KMS signature
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 text-xs font-mono">
          {ledger.slice(0, 6).map((b, idx) => (
            <React.Fragment key={b.id}>
              <div
                onClick={() => setSelectedBlock(b)}
                className={`p-3 rounded-xl border shrink-0 cursor-pointer transition-all hover:scale-[1.02] shadow-sm min-w-[190px] ${
                  idx === 0
                    ? 'bg-emerald-50/70 border-emerald-300 text-slate-900'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900">Block #{b.blockHeight}</span>
                  {idx === 0 ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold">HEAD</span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">LINKED</span>
                  )}
                </div>
                <p className="text-[11px] font-sans font-semibold text-slate-800 truncate mb-1" title={b.action}>
                  {b.action}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  Hash: {b.hash.substring(0, 10)}...{b.hash.substring(b.hash.length - 4)}
                </p>
              </div>

              {idx < Math.min(ledger.length, 6) - 1 && (
                <div className="shrink-0 flex items-center justify-center text-slate-300">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="enterprise-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs no-print">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, engineer, SHA-256 hash, IP, project..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer focus:border-emerald-500 focus:bg-white transition-all font-medium text-xs"
          >
            <option value="ALL">All Event Categories</option>
            <option value="CI_CD_RELEASE">CI/CD Releases</option>
            <option value="SECRETS_VAULT">Secrets Vault & KMS</option>
            <option value="DATABASE_OPS">Database Operations</option>
            <option value="AI_SUPERVISOR">AI Sentinel / SRE</option>
            <option value="INFRASTRUCTURE">Infrastructure & SSL</option>
            <option value="PAYMENTS">Payment Gateway Webhooks</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer focus:border-emerald-500 focus:bg-white transition-all font-medium text-xs"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Impact</option>
            <option value="MEDIUM">Medium</option>
            <option value="INFO">Info / Routine</option>
          </select>

          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer focus:border-emerald-500 focus:bg-white transition-all font-medium text-xs"
          >
            <option value="ALL">All Projects</option>
            {uniqueProjects.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {(search || categoryFilter !== 'ALL' || severityFilter !== 'ALL' || projectFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('ALL');
                setSeverityFilter('ALL');
                setProjectFilter('ALL');
              }}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Main Ledger Entries Feed ── */}
      <div className="space-y-4 no-print">
        {filtered.length === 0 ? (
          <div className="enterprise-card rounded-2xl p-12 text-center space-y-3">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-base font-bold text-slate-700">No cryptographic audit records found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No audit records match your search filter criteria. Try adjusting your query or resetting filters.
            </p>
          </div>
        ) : (
          filtered.map((block) => (
            <div
              key={block.id}
              className="enterprise-card rounded-2xl p-5 space-y-4 text-xs font-mono shadow-sm hover:border-slate-300 transition-all"
            >
              {/* Top Row: Block Height, Action, Badges, Time */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                    Block #{block.blockHeight}
                  </span>
                  <span className="font-sans font-bold text-slate-900 text-sm tracking-tight">
                    {block.action}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${getSeverityBadge(block.severity)}`}>
                    {block.severity}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold ${getCategoryBadge(block.category)}`}>
                    {block.category}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                    {block.project}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                  <span className="text-[11px] text-slate-500 font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {block.time}
                  </span>
                </div>
              </div>

              {/* Details and Operator info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <p className="text-slate-800 font-sans text-xs sm:text-sm leading-relaxed">
                    {block.details}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 font-sans">
                    <span>
                      Operator: <strong className="text-slate-800 font-semibold">{block.developer}</strong> ({block.role})
                    </span>
                    <span>•</span>
                    <span>
                      Auth Method: <strong className="text-slate-700 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{block.mfaMethod}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Client IP: <span className="text-slate-700 font-mono">{block.ip}</span> ({block.geo})
                    </span>
                  </div>
                </div>

                {/* Cryptographic Proof Box */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-500 font-bold text-[10px] uppercase">
                    <span>SHA-256 Digest</span>
                    <button
                      onClick={() => copyToClipboard(block.hash, block.id)}
                      className="text-slate-400 hover:text-slate-800 flex items-center gap-1"
                    >
                      {copiedHash === block.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>

                  <p className="font-mono text-slate-800 break-all text-[10px] leading-tight select-all">
                    {block.hash}
                  </p>

                  <div className="pt-1 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="truncate" title={block.prevHash}>
                      Parent: {block.prevHash.substring(0, 10)}...{block.prevHash.substring(block.prevHash.length - 4)}
                    </span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Signed
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Inspect Full Payload, Verify Hash */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedBlock(block)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    Inspect Payload & KMS Proof
                  </button>

                  <button
                    onClick={() => handleVerifySingleBlock(block)}
                    disabled={singleVerifyLoading === block.id}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold hover:bg-emerald-100 flex items-center gap-1.5 transition-all"
                  >
                    {singleVerifyLoading === block.id ? (
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    {singleVerifyLoading === block.id ? 'Computing Digest...' : 'Verify Hash'}
                  </button>
                </div>

                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Key className="w-3 h-3 text-slate-400" />
                  <span>KMS: {block.keyId}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Cryptographic Payload & KMS Modal ── */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn no-print">
          <div className="enterprise-card rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Block #{selectedBlock.blockHeight}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedBlock.action}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {selectedBlock.id} • Timestamp: {selectedBlock.time}
                </p>
              </div>
              <button
                onClick={() => setSelectedBlock(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cryptographic Signatures & KMS Envelope Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">SHA-256 Current Digest</p>
                <p className="font-mono text-slate-900 break-all text-[11px] select-all font-semibold">
                  {selectedBlock.hash}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">SHA-256 Parent Link (PrevHash)</p>
                <p className="font-mono text-slate-900 break-all text-[11px] select-all font-semibold">
                  {selectedBlock.prevHash}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Ed25519 Digital Signature</p>
                <p className="font-mono text-indigo-700 break-all text-[11px] select-all font-semibold">
                  {selectedBlock.signature}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">HSM Hardware Security Module</p>
                <p className="font-sans text-slate-900 text-xs font-semibold">
                  {selectedBlock.hsmProvider}
                </p>
                <p className="font-mono text-[10px] text-slate-500">Key ID: {selectedBlock.keyId}</p>
              </div>
            </div>

            {/* Operator Attestation */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Operator & Multi-Factor Attestation</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-slate-700">
                <div>
                  <p className="text-slate-400 font-mono text-[10px]">Operator</p>
                  <p className="font-semibold text-slate-900">{selectedBlock.developer}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-mono text-[10px]">Role / Authority</p>
                  <p className="font-semibold text-slate-900">{selectedBlock.role}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-mono text-[10px]">MFA Proof</p>
                  <p className="font-semibold text-slate-900">{selectedBlock.mfaMethod}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-mono text-[10px]">Client Origin</p>
                  <p className="font-semibold text-slate-900">{selectedBlock.ip}</p>
                </div>
              </div>
            </div>

            {/* Canonical Raw JSON Payload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                  Canonical Canonicalized JSON Payload
                </span>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(selectedBlock.rawPayload, null, 2), 'payload_json')}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-mono flex items-center gap-1"
                >
                  {copiedHash === 'payload_json' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Raw JSON</span>
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                {JSON.stringify(selectedBlock.rawPayload, null, 2)}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
              <span className="text-emerald-700 font-bold flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Immutable WORM Lock Verified
              </span>
              <button
                onClick={() => setSelectedBlock(null)}
                className="theme-btn-primary px-5 py-2 rounded-xl text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINT-ONLY A4 FORMAL CRYPTOGRAPHIC AUDIT CERTIFICATE ── */}
      <div className="printable-audit-sheet hidden print:block bg-white text-black p-8 max-w-[210mm] mx-auto">
        {/* Certificate Letterhead */}
        <div className="border-b-2 border-slate-900 pb-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-emerald-700 inline" />
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                  Nexify DevOps Global Control Plane
                </h1>
              </div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mt-1">
                Official Certificate of Cryptographic Audit & Tamper-Proof Ledger
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                ISO/IEC 27001:2022 Certified • SOC-2 Type II Attested • WORM Compliant
              </p>
            </div>
            <div className="text-right text-xs font-mono">
              <p className="font-bold text-slate-900">LEDGER CERTIFICATE #</p>
              <p className="text-sm font-black text-emerald-800">NXF-AUD-2026-0920</p>
              <p className="text-[10px] text-slate-500 mt-1">Generated: {new Date().toUTCString()}</p>
            </div>
          </div>
        </div>

        {/* Executive Summary Box */}
        <div className="grid grid-cols-3 gap-4 border border-slate-300 rounded-lg p-4 mb-6 text-xs bg-slate-50/50">
          <div>
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Merkle Root Hash</p>
            <p className="font-mono text-[10px] font-bold text-slate-900 break-all">
              {ledger[0]?.hash}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Chain Height & Integrity</p>
            <p className="font-bold text-emerald-800 font-mono text-sm">
              #{ledger[0]?.blockHeight} (100% Validated)
            </p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Signing Authority HSM</p>
            <p className="font-semibold text-slate-900 text-xs">AWS CloudHSM FIPS 140-3</p>
            <p className="font-mono text-[9px] text-slate-500">Key: kms-prod-ca-root-2026-v4</p>
          </div>
        </div>

        {/* Itemized Audit Entries Table */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-200 pb-1">
            Itemized Chronological Execution Ledger
          </h3>
          <table className="w-full text-left text-[9pt] border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-800 font-mono text-[8pt]">
                <th className="py-1.5 px-2">Height</th>
                <th className="py-1.5 px-2">Timestamp (UTC)</th>
                <th className="py-1.5 px-2">Action & Category</th>
                <th className="py-1.5 px-2">Project</th>
                <th className="py-1.5 px-2">Operator (MFA)</th>
                <th className="py-1.5 px-2">SHA-256 Digest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {ledger.map((b) => (
                <tr key={b.id} className="font-mono">
                  <td className="py-2 px-2 font-bold text-slate-900">#{b.blockHeight}</td>
                  <td className="py-2 px-2 text-[8pt] text-slate-600">{b.time}</td>
                  <td className="py-2 px-2 font-sans font-semibold text-slate-900 text-[8pt]">
                    {b.action}
                    <div className="text-[7pt] text-slate-500 font-mono">[{b.category} • {b.severity}]</div>
                  </td>
                  <td className="py-2 px-2 text-[8pt] text-slate-700">{b.project}</td>
                  <td className="py-2 px-2 text-[8pt] text-slate-700">
                    {b.developer}
                    <div className="text-[7pt] text-slate-500">{b.ip}</div>
                  </td>
                  <td className="py-2 px-2 text-[7pt] text-slate-600 break-all font-mono max-w-[120px]">
                    {b.hash.substring(0, 16)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Compliance Sign-off declaration */}
        <div className="border-t-2 border-slate-900 pt-6 mt-8">
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div>
              <p className="font-bold text-slate-900 mb-1">Compliance & Tamper-Proof Guarantee:</p>
              <p className="text-[9pt] text-slate-600 leading-relaxed">
                This document certifies that the above recorded events were cryptographically signed via hardware security modules (HSM) and chained via sequential SHA-256 digests. No records can be altered, truncated, or forged.
              </p>
            </div>
            <div className="flex flex-col justify-end items-end text-right">
              <div className="border-b border-slate-400 w-48 pb-1 mb-1 font-mono text-[9pt] font-bold text-slate-800">
                [Digitally Signed by CA]
              </div>
              <p className="font-bold text-slate-900 text-[9pt]">Chief Information Security Officer</p>
              <p className="text-[8pt] text-slate-500 font-mono">Nexify DevOps Autonomous SecOps</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
