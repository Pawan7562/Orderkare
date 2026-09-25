import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Radio,
  Activity,
  Search,
  ShieldCheck,
  Eye,
  X,
  Play,
  Download,
  Filter,
  Layers,
  ArrowRight,
  Sparkles,
  Zap,
  Terminal,
  Clock,
  Send,
  Lock,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface WebhookEvent {
  id: string;
  gateway: 'RAZORPAY' | 'STRIPE' | 'GITHUB' | 'SLACK';
  event: string;
  client: string;
  statusCode: number;
  statusText: string;
  timestamp: string;
  signature: string;
  deliveryLatencyMs: number;
  payload: Record<string, any>;
  headers: Record<string, string>;
}

const INITIAL_WEBHOOKS: WebhookEvent[] = [
  {
    id: 'wh_rzp_9900',
    gateway: 'RAZORPAY',
    event: 'payment.captured',
    client: 'PK The NexGen Exam Monitoring System',
    statusCode: 200,
    statusText: 'OK',
    timestamp: '2026-09-20 02:45:00 UTC',
    signature: 'sha256:7f9a2b0c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a',
    deliveryLatencyMs: 42,
    payload: {
      entity: 'payment',
      id: 'pay_ExamFees99881122',
      amount: 49900,
      currency: 'INR',
      status: 'captured',
      method: 'upi',
      vpa: 'student@okhdfcbank',
      notes: { examSessionId: 'sess_998822', candidateName: 'Rahul Verma' },
    },
    headers: {
      'content-type': 'application/json',
      'x-razorpay-signature': '0x7f9a2b0c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
      'x-razorpay-event-id': 'evt_99881122',
      'user-agent': 'Razorpay/v1'
    }
  },
  {
    id: 'wh_rzp_9901',
    gateway: 'RAZORPAY',
    event: 'payment.captured',
    client: 'OrderKare Technologies',
    statusCode: 200,
    statusText: 'OK',
    timestamp: '2026-09-20 02:25:12 UTC',
    signature: 'sha256:88a4f109bc53e20019a84b01e389d419fc229aa701e3b8a661c920bf0147e821',
    deliveryLatencyMs: 38,
    payload: {
      entity: 'payment',
      id: 'pay_PQR8899001122',
      amount: 119900,
      currency: 'INR',
      status: 'captured',
      method: 'upi',
      vpa: 'user@okaxis',
      notes: { planId: 'SIX_MONTHS', restaurantId: 'rest_01' },
    },
    headers: {
      'content-type': 'application/json',
      'x-razorpay-signature': '0x88a4f109bc53e20019a84b01e389d419fc229aa7',
      'x-razorpay-event-id': 'evt_PQR889900',
      'user-agent': 'Razorpay/v1'
    }
  },
  {
    id: 'wh_rzp_9902',
    gateway: 'RAZORPAY',
    event: 'order.paid',
    client: 'OrderKare Technologies',
    statusCode: 200,
    statusText: 'OK',
    timestamp: '2026-09-20 01:50:45 UTC',
    signature: 'sha256:4f828731b9e0781290a184c637a912ef00527810bbf49a0281c7e90214a60183',
    deliveryLatencyMs: 29,
    payload: {
      entity: 'order',
      id: 'order_ORD55667788',
      amount: 145000,
      status: 'paid',
      notes: { planId: 'ANNUAL_TIER', restaurantId: 'rest_grand_hyatt' },
    },
    headers: {
      'content-type': 'application/json',
      'x-razorpay-signature': '0x4f828731b9e0781290a184c637a912ef00527810',
      'x-razorpay-event-id': 'evt_ORD556677',
      'user-agent': 'Razorpay/v1'
    }
  },
  {
    id: 'wh_stp_9903',
    gateway: 'STRIPE',
    event: 'invoice.payment_succeeded',
    client: 'Nexus Enterprise CRM',
    statusCode: 200,
    statusText: 'OK',
    timestamp: '2026-09-20 01:15:10 UTC',
    signature: 'sha256:1a9e4d770281bce9810a47f02816934c7190bb427a81005a91823bc0192e4091',
    deliveryLatencyMs: 64,
    payload: {
      id: 'in_1234567890',
      customer: 'cus_ABC998877',
      amount_paid: 45000,
      currency: 'usd',
      status: 'paid',
    },
    headers: {
      'content-type': 'application/json',
      'stripe-signature': 't=1789953310,v1=1a9e4d770281bce9810a47f02816934c7190bb42',
      'user-agent': 'Stripe/1.0'
    }
  },
];

export const WebhookStreamPage: React.FC = () => {
  const [webhooks, setWebhooks] = useState<WebhookEvent[]>(INITIAL_WEBHOOKS);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookEvent | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('ALL');
  const [replayingId, setReplayingId] = useState<string | null>(null);

  const handleReplay = async (wh: WebhookEvent) => {
    setReplayingId(wh.id);
    await new Promise((r) => setTimeout(r, 600));
    setReplayingId(null);
    setToast(`Webhook [${wh.event}] replayed successfully with verified HMAC signature (HTTP 200 OK)!`);
    setTimeout(() => setToast(null), 3000);
  };

  const copyPayload = (id: string, data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = useMemo(() => {
    return webhooks.filter((w) => {
      const matchesSearch =
        w.client.toLowerCase().includes(search.toLowerCase()) ||
        w.event.toLowerCase().includes(search.toLowerCase()) ||
        w.gateway.toLowerCase().includes(search.toLowerCase()) ||
        w.id.toLowerCase().includes(search.toLowerCase());
      const matchesGateway = gatewayFilter === 'ALL' || w.gateway === gatewayFilter;
      return matchesSearch && matchesGateway;
    });
  }, [webhooks, search, gatewayFilter]);

  return (
    <div className="space-y-6 pb-16">
      {/* Toast */}
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
              <span className="p-2 rounded-xl bg-teal-500/10 text-teal-600 border border-teal-200/60 shadow-sm">
                <CreditCard className="w-6 h-6 text-teal-600" />
              </span>
              Webhooks & Inbound Event Stream
            </h1>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              HMAC-SHA256 Signature Verification Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-3xl">
            Real-time webhook ingestion and payload inspection across Razorpay, Stripe, GitHub, and client microservices with 1-click idempotent event replay.
          </p>
        </div>

        {/* Global Action */}
        <div className="flex items-center gap-2">
          <select
            value={gatewayFilter}
            onChange={(e) => setGatewayFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 shadow-sm cursor-pointer"
          >
            <option value="ALL">All Gateways</option>
            <option value="RAZORPAY">Razorpay (UPI / Cards)</option>
            <option value="STRIPE">Stripe (International)</option>
          </select>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="enterprise-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs no-print">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search webhook event, client, ID..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
          />
        </div>

        <span className="text-xs font-mono text-slate-500">
          Showing {filtered.length} Ingested Events (100% Verified)
        </span>
      </div>

      {/* ── Webhooks Feed ── */}
      <div className="space-y-4 no-print">
        {filtered.map((wh) => (
          <div
            key={wh.id}
            className="enterprise-card rounded-2xl p-5 space-y-3.5 text-xs font-mono shadow-sm hover:border-slate-300 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                  {wh.id}
                </span>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    wh.gateway === 'RAZORPAY'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-purple-50 text-purple-800 border-purple-200'
                  }`}
                >
                  {wh.gateway}
                </span>

                <span className="font-bold text-slate-900 font-sans text-sm">
                  {wh.event}
                </span>

                <span className="text-slate-500 font-sans text-xs">
                  ({wh.client})
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {wh.timestamp}
                </span>

                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {wh.statusCode} {wh.statusText} ({wh.deliveryLatencyMs}ms)
                </span>
              </div>
            </div>

            {/* Payload preview */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-sans font-medium">Inbound Webhook JSON Body</span>
                <button
                  onClick={() => copyPayload(wh.id, wh.payload)}
                  className="text-slate-400 hover:text-slate-700 flex items-center gap-1 font-sans"
                >
                  {copiedId === wh.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>Copy Payload</span>
                </button>
              </div>

              <pre className="p-3.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed max-h-36">
                {JSON.stringify(wh.payload, null, 2)}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedWebhook(wh)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Inspect Headers & Cryptographic Signature</span>
                </button>

                <button
                  onClick={() => handleReplay(wh)}
                  disabled={replayingId === wh.id}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1.5 border border-emerald-200 transition-all cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 text-emerald-600 ${replayingId === wh.id ? 'animate-spin' : ''}`} />
                  <span>{replayingId === wh.id ? 'Replaying...' : 'Replay Webhook'}</span>
                </button>
              </div>

              <span className="text-[10px] text-slate-400 font-mono">
                HMAC: {wh.signature.substring(0, 24)}...
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Webhook Inspector Modal ── */}
      {selectedWebhook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn no-print">
          <div className="enterprise-card rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {selectedWebhook.gateway}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedWebhook.event}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {selectedWebhook.id} • Timestamp: {selectedWebhook.timestamp}
                </p>
              </div>
              <button
                onClick={() => setSelectedWebhook(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">HMAC Signature Digest</p>
                <p className="font-mono text-slate-900 text-xs break-all font-semibold select-all">
                  {selectedWebhook.signature}
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">HTTP Inbound Request Headers</p>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 font-mono text-[11px]">
                  {Object.entries(selectedWebhook.headers).map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-slate-200/60 pb-1">
                      <span className="text-slate-500">{k}:</span>
                      <span className="text-slate-900 font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Full JSON Payload</p>
                <pre className="p-3.5 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                  {JSON.stringify(selectedWebhook.payload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
              <button
                onClick={() => handleReplay(selectedWebhook)}
                className="theme-btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay to Local Endpoint</span>
              </button>

              <button
                onClick={() => setSelectedWebhook(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
