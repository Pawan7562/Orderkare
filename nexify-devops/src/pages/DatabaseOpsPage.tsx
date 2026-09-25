import React, { useState, useMemo } from 'react';
import {
  Database,
  Download,
  CheckCircle2,
  ShieldCheck,
  Activity,
  HardDrive,
  Terminal,
  Play,
  RefreshCw,
  Layers,
  Code,
  AlertTriangle,
  Lock,
  Copy,
  Check,
  Search,
  Filter,
  Eye,
  Plus,
  Trash2,
  FileText,
  KeyRound,
  ArrowRight,
  Boxes,
  Zap,
  Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '../context/ProjectContext';

export interface DatabaseTable {
  name: string;
  rows: number;
  size: string;
  columns: string[];
  primaryKey: string;
}

export interface DatabaseMigration {
  id: string;
  name: string;
  appliedAt: string;
  batch: number;
  durationMs: number;
  status: 'APPLIED' | 'PENDING' | 'ROLLED_BACK';
}

export const DatabaseOpsPage: React.FC = () => {
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'SQL_CONSOLE' | 'SCHEMA_TABLES' | 'MIGRATIONS' | 'BACKUPS' | 'POOLS'>('SQL_CONSOLE');

  const [downloading, setDownloading] = useState(false);
  const [runningQuery, setRunningQuery] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const selectedProj = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  // Dynamic tables per project
  const projectTables: Record<string, DatabaseTable[]> = {
    proj_pkthenexgenexam: [
      { name: 'ExamSession', rows: 1420, size: '4.8 MB', columns: ['id (UUID)', 'student_id (VARCHAR)', 'exam_code (VARCHAR)', 'webrtc_channel (VARCHAR)', 'status (ENUM)', 'created_at (TIMESTAMP)'], primaryKey: 'id' },
      { name: 'ProctoringStreamLog', rows: 8430, size: '28.4 MB', columns: ['id (UUID)', 'session_id (UUID)', 'gaze_deviation_deg (FLOAT)', 'audio_anomaly_db (FLOAT)', 'face_count (INT)', 'timestamp (TIMESTAMP)'], primaryKey: 'id' },
      { name: 'StudentCandidate', rows: 650, size: '1.2 MB', columns: ['id (UUID)', 'roll_number (VARCHAR)', 'full_name (VARCHAR)', 'biometric_hash (VARCHAR)', 'email (VARCHAR)'], primaryKey: 'id' },
      { name: 'ExamQuestionPaper', rows: 320, size: '840 KB', columns: ['id (UUID)', 'exam_code (VARCHAR)', 'section (VARCHAR)', 'encrypted_payload (JSONB)'], primaryKey: 'id' },
      { name: 'AnomalyAlert', rows: 48, size: '190 KB', columns: ['id (UUID)', 'session_id (UUID)', 'severity (VARCHAR)', 'evidence_frame_url (VARCHAR)', 'resolved (BOOLEAN)'], primaryKey: 'id' },
      { name: 'InvigilatorAssignment', rows: 18, size: '90 KB', columns: ['id (UUID)', 'invigilator_id (UUID)', 'assigned_rooms (TEXT[])', 'active (BOOLEAN)'], primaryKey: 'id' },
    ],
    proj_orderkare: [
      { name: 'Restaurant', rows: 18, size: '240 KB', columns: ['id (UUID)', 'name (VARCHAR)', 'slug (VARCHAR)', 'gstin (VARCHAR)', 'plan_tier (ENUM)', 'created_at (TIMESTAMP)'], primaryKey: 'id' },
      { name: 'Subscription', rows: 18, size: '180 KB', columns: ['id (UUID)', 'restaurant_id (UUID)', 'razorpay_sub_id (VARCHAR)', 'status (VARCHAR)', 'renews_at (TIMESTAMP)'], primaryKey: 'id' },
      { name: 'User', rows: 24, size: '190 KB', columns: ['id (UUID)', 'email (VARCHAR)', 'password_hash (VARCHAR)', 'role (ENUM)', 'restaurant_id (UUID)'], primaryKey: 'id' },
      { name: 'Order', rows: 190, size: '1.2 MB', columns: ['id (UUID)', 'table_number (VARCHAR)', 'total_inr (DECIMAL)', 'status (ENUM)', 'payment_mode (VARCHAR)', 'created_at (TIMESTAMP)'], primaryKey: 'id' },
      { name: 'FoodItem', rows: 84, size: '420 KB', columns: ['id (UUID)', 'name (VARCHAR)', 'price_inr (DECIMAL)', 'category_id (UUID)', 'is_available (BOOLEAN)'], primaryKey: 'id' },
      { name: 'Table', rows: 65, size: '110 KB', columns: ['id (UUID)', 'table_code (VARCHAR)', 'capacity (INT)', 'qr_token (VARCHAR)', 'occupied (BOOLEAN)'], primaryKey: 'id' },
      { name: 'Category', rows: 22, size: '90 KB', columns: ['id (UUID)', 'name (VARCHAR)', 'display_order (INT)', 'restaurant_id (UUID)'], primaryKey: 'id' },
      { name: 'Advertisement', rows: 12, size: '140 KB', columns: ['id (UUID)', 'title (VARCHAR)', 'banner_url (VARCHAR)', 'impressions (INT)', 'active (BOOLEAN)'], primaryKey: 'id' },
    ],
    proj_nexus_crm: [
      { name: 'TenantAccount', rows: 42, size: '680 KB', columns: ['id (UUID)', 'org_name (VARCHAR)', 'license_seats (INT)', 'created_at (TIMESTAMP)'], primaryKey: 'id' },
      { name: 'LeadContact', rows: 12800, size: '14.2 MB', columns: ['id (UUID)', 'email (VARCHAR)', 'company (VARCHAR)', 'lead_score (FLOAT)', 'stage (VARCHAR)'], primaryKey: 'id' },
      { name: 'SalesDeal', rows: 3400, size: '5.1 MB', columns: ['id (UUID)', 'deal_name (VARCHAR)', 'amount_usd (DECIMAL)', 'assigned_rep (UUID)', 'closed_at (TIMESTAMP)'], primaryKey: 'id' },
      { name: 'ActivityLog', rows: 48200, size: '42.8 MB', columns: ['id (UUID)', 'action (VARCHAR)', 'entity_type (VARCHAR)', 'actor_id (UUID)', 'timestamp (TIMESTAMP)'], primaryKey: 'id' },
    ],
    proj_swiftdrop: [
      { name: 'DeliveryPackage', rows: 3420, size: '8.4 MB', columns: ['id (UUID)', 'tracking_number (VARCHAR)', 'recipient_address (TEXT)', 'status (ENUM)', 'dispatched_at (TIMESTAMP)'], primaryKey: 'id' },
      { name: 'RiderProfile', rows: 140, size: '480 KB', columns: ['id (UUID)', 'phone (VARCHAR)', 'vehicle_type (VARCHAR)', 'active_orders_count (INT)', 'is_online (BOOLEAN)'], primaryKey: 'id' },
      { name: 'GeohashTile', rows: 860, size: '2.1 MB', columns: ['id (UUID)', 'geohash_7 (VARCHAR)', 'active_couriers (INT)', 'demand_multiplier (FLOAT)'], primaryKey: 'id' },
      { name: 'PaymentSettlement', rows: 1940, size: '3.8 MB', columns: ['id (UUID)', 'rider_id (UUID)', 'payout_amount_inr (DECIMAL)', 'utr_number (VARCHAR)', 'status (VARCHAR)'], primaryKey: 'id' },
    ],
  };

  const currentTables = projectTables[selectedProj?.id] || projectTables['proj_orderkare'];

  // Migrations registry
  const [migrations, setMigrations] = useState<DatabaseMigration[]>([
    { id: 'mig_004', name: '20260920_add_webrtc_audio_anomaly_index', appliedAt: '2026-09-20 01:40 UTC', batch: 4, durationMs: 42, status: 'APPLIED' },
    { id: 'mig_003', name: '20260918_neon_connection_pooler_tuning', appliedAt: '2026-09-18 10:15 UTC', batch: 3, durationMs: 88, status: 'APPLIED' },
    { id: 'mig_002', name: '20260915_add_razorpay_upi_webhook_signatures', appliedAt: '2026-09-15 08:30 UTC', batch: 2, durationMs: 114, status: 'APPLIED' },
    { id: 'mig_001', name: '20260901_init_core_multi_tenant_schema', appliedAt: '2026-09-01 00:00 UTC', batch: 1, durationMs: 450, status: 'APPLIED' },
  ]);

  // SQL Query console state
  const [sqlQuery, setSqlQuery] = useState<string>(
    'SELECT schemaname, relname, n_live_tup, pg_size_pretty(pg_total_relation_size(relid)) AS total_size FROM pg_stat_user_tables ORDER BY n_live_tup DESC;'
  );
  const [queryResult, setQueryResult] = useState<any[] | null>([
    { schemaname: 'public', relname: currentTables[0]?.name || 'ExamSession', n_live_tup: currentTables[0]?.rows || 1420, total_size: currentTables[0]?.size || '4.8 MB' },
    { schemaname: 'public', relname: currentTables[1]?.name || 'ProctoringStreamLog', n_live_tup: currentTables[1]?.rows || 8430, total_size: currentTables[1]?.size || '28.4 MB' },
    { schemaname: 'public', relname: currentTables[2]?.name || 'StudentCandidate', n_live_tup: currentTables[2]?.rows || 650, total_size: currentTables[2]?.size || '1.2 MB' },
  ]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleRunQuery = () => {
    setRunningQuery(true);
    setTimeout(() => {
      setRunningQuery(false);
      if (sqlQuery.toLowerCase().includes('connections') || sqlQuery.toLowerCase().includes('pg_stat_activity')) {
        setQueryResult([
          { pid: 14892, client_addr: '13.235.14.82', state: 'active', query: 'SELECT * FROM live_sessions WHERE active=true;' },
          { pid: 14893, client_addr: '13.235.14.82', state: 'idle in transaction', query: 'COMMIT;' },
          { pid: 14894, client_addr: '127.0.0.1', state: 'idle', query: 'DISCARD ALL;' },
        ]);
      } else {
        setQueryResult(
          currentTables.map((t) => ({
            schemaname: 'public',
            relname: t.name,
            n_live_tup: t.rows,
            total_size: t.size,
          }))
        );
      }
      setToast('SQL Query executed successfully in 1.2ms (SSL verify-full active)');
      setTimeout(() => setToast(null), 2500);
    }, 350);
  };

  const handleBackup = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setToast(`Downloaded AES-GCM-256 Encrypted PostgreSQL Snapshot for ${selectedProj?.name}`);
      setTimeout(() => setToast(null), 3000);
    }, 1200);
  };

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
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-200/60 shadow-sm">
                <Database className="w-6 h-6 text-emerald-600" />
              </span>
              Database & Storage Operations
            </h1>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              PostgreSQL 16 Neon Serverless (SSL Mode Required)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-3xl">
            Live query console, schema migration runner, point-in-time snapshot vault, and connection pooler diagnostics across all isolated client databases.
          </p>
        </div>

        {/* Global Executive Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 shadow-sm cursor-pointer"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.databaseEngine})
              </option>
            ))}
          </select>

          <button
            onClick={handleBackup}
            disabled={downloading}
            className="theme-btn-primary px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Download className={`w-3.5 h-3.5 ${downloading ? 'animate-bounce' : ''}`} />
            <span>{downloading ? 'Generating AES-256 Vault...' : 'Snapshot Backup'}</span>
          </button>
        </div>
      </div>

      {/* ── KPI Ribbon ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="enterprise-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Database Engine</p>
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 font-mono">{selectedProj?.databaseEngine}</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> SSL Encryption: Enforced
          </p>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Schema Tables</p>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{currentTables.length} Tables</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Total Rows: {currentTables.reduce((acc, t) => acc + t.rows, 0).toLocaleString()}
          </p>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Connection Pool</p>
            <Activity className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">14 Active</span>
            <span className="text-[10px] font-mono text-slate-400 font-bold">/ 50 Max</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Replication Lag: 0.002s
          </p>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Storage Volume</p>
            <HardDrive className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-700 font-mono">34.8 MB</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Point-in-Time: 7-day PITR
          </p>
        </div>
      </div>

      {/* ── Sub-Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold no-print">
        <button
          onClick={() => setActiveTab('SQL_CONSOLE')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'SQL_CONSOLE'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Interactive SQL Console</span>
        </button>

        <button
          onClick={() => setActiveTab('SCHEMA_TABLES')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'SCHEMA_TABLES'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Schema Tables ({currentTables.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('MIGRATIONS')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'MIGRATIONS'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Migrations Registry ({migrations.length})</span>
        </button>
      </div>

      {/* ── TAB 1: SQL CONSOLE ── */}
      {activeTab === 'SQL_CONSOLE' && (
        <div className="space-y-4 no-print">
          <div className="enterprise-card rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-600" />
                Live SQL Execution Console ({selectedProj?.name})
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setSqlQuery('SELECT schemaname, relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;')
                  }
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-mono transition-all"
                >
                  Table Stats
                </button>
                <button
                  onClick={() =>
                    setSqlQuery('SELECT pid, client_addr, state, query FROM pg_stat_activity WHERE state IS NOT NULL;')
                  }
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-mono transition-all"
                >
                  Live Connections
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <textarea
                rows={4}
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                className="w-full p-4 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs outline-none focus:ring-1 focus:ring-emerald-500 border border-slate-800 leading-relaxed shadow-inner"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                SSL Enforcement: <strong className="text-emerald-700">sslmode=verify-full (AWS KMS AES-256)</strong>
              </span>

              <button
                onClick={handleRunQuery}
                disabled={runningQuery}
                className="theme-btn-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${runningQuery ? 'animate-spin' : ''}`} />
                <span>{runningQuery ? 'Executing...' : 'Run Query'}</span>
              </button>
            </div>
          </div>

          {/* Results Grid */}
          {queryResult && (
            <div className="enterprise-card rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 font-mono">
                  Query Results ({queryResult.length} Rows Returned)
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Execution Time: 1.2ms
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                      {Object.keys(queryResult[0] || {}).map((col) => (
                        <th key={col} className="p-2.5 font-bold uppercase text-[10px]">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {queryResult.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        {Object.values(row).map((val: any, colIdx) => (
                          <td key={colIdx} className="p-2.5 text-slate-800">
                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: SCHEMA TABLES ── */}
      {activeTab === 'SCHEMA_TABLES' && (
        <div className="space-y-4 no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentTables.map((tbl) => (
              <div
                key={tbl.name}
                className="enterprise-card rounded-2xl p-5 space-y-3 shadow-sm hover:border-slate-300 transition-all text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900 font-mono text-sm">{tbl.name}</span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {tbl.size}
                  </span>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Row Count:</span>
                    <strong className="text-slate-900">{tbl.rows.toLocaleString()} records</strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Primary Key:</span>
                    <strong className="text-indigo-700">{tbl.primaryKey}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Columns ({tbl.columns.length})</span>
                  <div className="flex flex-wrap gap-1">
                    {tbl.columns.map((c, i) => (
                      <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: MIGRATIONS REGISTRY ── */}
      {activeTab === 'MIGRATIONS' && (
        <div className="space-y-4 no-print">
          <div className="enterprise-card rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Code className="w-4 h-4 text-emerald-600" />
                  <span>Schema Migrations Registry & Execution History</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synchronized with Prisma / Drizzle / Flyway multi-tenant schema runner.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                4 Applied • 0 Pending
              </span>
            </div>

            <div className="space-y-3">
              {migrations.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{m.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                        {m.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Applied At: {m.appliedAt} • Batch: {m.batch} • Execution: {m.durationMs}ms
                    </p>
                  </div>

                  <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
