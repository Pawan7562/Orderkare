import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building,
  Shield,
  Database,
  Smartphone,
  Globe,
  ExternalLink,
  Key,
  Plus,
  CheckCircle2,
  Search,
  Filter,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  Calendar,
  CreditCard,
  Sparkles,
  LayoutGrid,
  List,
  Monitor,
  Tablet,
  X,
  Copy,
  Check,
  Zap,
  Download,
  SlidersHorizontal,
  Server,
  Activity,
  Award,
  Clock,
  GitBranch
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '../context/ProjectContext';
import { AddProjectModal } from '../components/AddProjectModal';
import { ProjectCategory, ProjectEnvironment } from '../types/project';
import {
  formatLiveUrl as sanitizeUrl,
  getProviderDefaultDomain
} from '../utils/domainUtils';

export const ClientProjectsPage: React.FC = () => {
  const { projects, addProject, deleteProject } = useProjects();
  const navigate = useNavigate();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [envFilter, setEnvFilter] = useState<string>('ALL');
  const [providerFilter, setProviderFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NAME' | 'REVENUE' | 'UPTIME' | 'RECENT'>('RECENT');

  // Preview Modal State
  const [previewProject, setPreviewProject] = useState<typeof projects[0] | null>(null);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(id);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Filtered & Sorted projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.clientOrgName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.framework.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.databaseEngine.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.domains.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
        const matchesEnv = envFilter === 'ALL' || p.environment === envFilter;
        const matchesProvider = providerFilter === 'ALL' || p.deployProvider === providerFilter;

        return matchesSearch && matchesCategory && matchesEnv && matchesProvider;
      })
      .sort((a, b) => {
        if (sortBy === 'NAME') return a.name.localeCompare(b.name);
        if (sortBy === 'REVENUE') return (b.monthlyFeeINR || 0) - (a.monthlyFeeINR || 0);
        if (sortBy === 'UPTIME') return b.uptimePercent - a.uptimePercent;
        return 0; // Default order
      });
  }, [projects, searchQuery, categoryFilter, envFilter, providerFilter, sortBy]);

  // Aggregate Metrics
  const totalMonthlyINR = projects.reduce((acc, p) => acc + (p.monthlyFeeINR || 0), 0);
  const totalProductionCount = projects.filter((p) => p.environment === 'PRODUCTION').length;
  const totalTasksCount = projects.reduce((acc, p) => acc + p.tasks.length, 0);
  const totalDeploymentsCount = projects.reduce((acc, p) => acc + p.deployments.length, 0);

  // Export Fleet CSV
  const handleExportCsv = () => {
    const headers = ['Project_Name', 'Client_Org', 'Environment', 'Category', 'Deploy_Target', 'Framework', 'Database', 'Live_URL', 'Monthly_Fee_INR', 'Uptime_Percent'];
    const rows = projects.map(p => [
      `"${p.name}"`,
      `"${p.clientOrgName}"`,
      `"${p.environment}"`,
      `"${p.category}"`,
      `"${p.deployProvider || 'VERCEL'}"`,
      `"${p.framework}"`,
      `"${p.databaseEngine}"`,
      `"${sanitizeUrl(p.liveUrl)}"`,
      p.monthlyFeeINR || 0,
      p.uptimePercent
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexify-fleets-registry-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getProviderIcon = (provider?: string) => {
    switch (provider) {
      case 'RENDER':
        return '⚡';
      case 'CLOUDFLARE':
        return '🟧';
      case 'AWS':
        return '☁';
      case 'DIGITALOCEAN':
        return '🌊';
      case 'VERCEL':
      default:
        return '▲';
    }
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
                <Building className="w-6 h-6 text-emerald-600" />
              </span>
              Client Software Fleets & Workspace Management
            </h1>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {projects.length} Isolated Client Fleets Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-3xl">
            Centrally register, deploy, and monitor client software fleets with automated GitHub CI/CD pipelines, isolated PostgreSQL database clusters, custom domain DNS routing, and SLA retainer governance.
          </p>
        </div>

        {/* Global Executive Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* View Mode Toggle */}
          <div className="flex rounded-xl bg-white border border-slate-200 p-0.5 shadow-xs">
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'GRID' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'TABLE' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Dense Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Export Client Fleets CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="theme-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Client Project</span>
          </button>
        </div>
      </div>

      {/* ── Fleet KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="enterprise-card rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Total Client Fleets</span>
            <p className="text-2xl font-bold text-slate-900 font-mono">{projects.length}</p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{totalProductionCount} Live in Production</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <Building className="w-6 h-6" />
          </div>
        </div>

        <div className="enterprise-card rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Monthly SLA Revenue</span>
            <p className="text-2xl font-bold text-emerald-700 font-mono">₹{totalMonthlyINR.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-slate-500 font-medium">Retainers & SLA maintenance</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="enterprise-card rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Active Sprint Tasks</span>
            <p className="text-2xl font-bold text-slate-900 font-mono">{totalTasksCount}</p>
            <p className="text-[11px] text-purple-700 font-medium font-mono">Across client backlogs</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="enterprise-card rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Production Releases</span>
            <p className="text-2xl font-bold text-slate-900 font-mono">{totalDeploymentsCount}</p>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Zero-Downtime Edge Deploys</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── Advanced Search & Multi-Filter Bar ── */}
      <div className="enterprise-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs no-print">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, client org, database, domain..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer focus:border-emerald-500 focus:bg-white transition-all font-medium text-xs"
          >
            <option value="ALL">All Categories</option>
            <option value="SAAS">SaaS Platforms</option>
            <option value="MOBILE_APP">Mobile Apps</option>
            <option value="CRM">CRMs & ERPs</option>
            <option value="AI_AUTOMATION">AI & Proctoring</option>
            <option value="ECOMMERCE">E-Commerce</option>
            <option value="FINTECH">FinTech</option>
          </select>

          {/* Environment */}
          <select
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer focus:border-emerald-500 focus:bg-white transition-all font-medium text-xs"
          >
            <option value="ALL">All Environments</option>
            <option value="PRODUCTION">Production</option>
            <option value="STAGING">Staging</option>
            <option value="DEVELOPMENT">Development</option>
          </select>

          {/* Provider */}
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer focus:border-emerald-500 focus:bg-white transition-all font-medium text-xs"
          >
            <option value="ALL">All Cloud Providers</option>
            <option value="VERCEL">▲ Vercel Edge</option>
            <option value="RENDER">⚡ Render Cloud</option>
            <option value="CLOUDFLARE">🟧 Cloudflare Pages</option>
            <option value="AWS">☁ AWS Elastic</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer focus:border-emerald-500 focus:bg-white transition-all font-medium text-xs"
          >
            <option value="RECENT">Sort: Recent</option>
            <option value="NAME">Sort: Alphabetical</option>
            <option value="REVENUE">Sort: Highest Revenue</option>
            <option value="UPTIME">Sort: Highest Uptime</option>
          </select>

          {(searchQuery || categoryFilter !== 'ALL' || envFilter !== 'ALL' || providerFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('ALL');
                setEnvFilter('ALL');
                setProviderFilter('ALL');
              }}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-all"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── VIEW 1: SUPER-POLISHED GRID CARDS VIEW ── */}
      {viewMode === 'GRID' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
          {filteredProjects.map((p) => {
            const liveUrlSafe = sanitizeUrl(p.liveUrl || '');
            return (
              <div
                key={p.id}
                className="enterprise-card rounded-2xl p-6 flex flex-col justify-between space-y-5 shadow-sm hover:border-slate-300 hover:shadow-md transition-all group relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                          {p.category}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold border ${
                            p.environment === 'PRODUCTION'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {p.environment}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold flex items-center gap-1">
                          <span>{getProviderIcon(p.deployProvider)}</span>
                          <span>{p.deployProvider || 'VERCEL'}</span>
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base mt-2.5 group-hover:text-emerald-600 transition-colors tracking-tight">
                        <Link to={`/projects/${p.id}`}>{p.name}</Link>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">{p.clientOrgName}</p>
                    </div>

                    <div
                      className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] mt-1 shrink-0 animate-pulse"
                      title="Fleet Nominal • 99.98% SLA"
                    />
                  </div>

                  {/* Technical Specifications Matrix */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Deploy Target:</span>
                      <span className="text-purple-700 font-bold truncate max-w-[170px]">
                        {getProviderIcon(p.deployProvider)} {p.deployProvider || 'VERCEL'} Edge
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Framework:</span>
                      <span className="text-slate-800 font-bold truncate max-w-[170px]">{p.framework}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Database:</span>
                      <span className="text-emerald-700 font-bold truncate max-w-[170px]">{p.databaseEngine}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Primary Domain:</span>
                      <span className="text-slate-800 font-bold truncate max-w-[170px]" title={p.domains[0] || liveUrlSafe}>
                        {p.domains[0] || 'Auto Edge Domain'}
                      </span>
                    </div>
                  </div>

                  {/* Operational Metrics Badges */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
                      <span className="text-[10px] text-slate-500 font-mono block">Uptime</span>
                      <span className="text-xs font-bold text-emerald-700 font-mono">{p.uptimePercent}%</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
                      <span className="text-[10px] text-slate-500 font-mono block">Sprint Tasks</span>
                      <span className="text-xs font-bold text-slate-800 font-mono">{p.tasks.length}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
                      <span className="text-[10px] text-slate-500 font-mono block">Deployments</span>
                      <span className="text-xs font-bold text-slate-800 font-mono">{p.deployments.length}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] font-mono">
                    <span className="text-slate-500">SLA: </span>
                    <span className="text-emerald-700 font-bold">₹{(p.monthlyFeeINR || 0).toLocaleString('en-IN')}/mo</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Live Preview Button */}
                    <button
                      onClick={() => setPreviewProject(p)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      title="Open Sandboxed Live Preview Modal"
                    >
                      <Monitor className="w-3.5 h-3.5 text-slate-600" />
                      <span>Preview</span>
                    </button>

                    {/* Direct Live App Link */}
                    <a
                      href={liveUrlSafe}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer border border-emerald-200 shadow-xs"
                      title={`Open ${liveUrlSafe} in New Tab`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Open App</span>
                      <ExternalLink className="w-2.5 h-2.5 text-emerald-500" />
                    </a>

                    {/* Manage Fleet Workspace Link */}
                    <Link
                      to={`/projects/${p.id}`}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>Fleet</span>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── VIEW 2: DENSE EXECUTIVE DATA TABLE VIEW ── */}
      {viewMode === 'TABLE' && (
        <div className="enterprise-card rounded-2xl p-5 shadow-sm overflow-x-auto no-print">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                <th className="p-3 font-bold uppercase text-[10px]">Fleet Project</th>
                <th className="p-3 font-bold uppercase text-[10px]">Client Organization</th>
                <th className="p-3 font-bold uppercase text-[10px]">Environment</th>
                <th className="p-3 font-bold uppercase text-[10px]">Deploy Target</th>
                <th className="p-3 font-bold uppercase text-[10px]">Database</th>
                <th className="p-3 font-bold uppercase text-[10px]">Primary Domain</th>
                <th className="p-3 font-bold uppercase text-[10px]">Uptime SLA</th>
                <th className="p-3 font-bold uppercase text-[10px]">Retainer Fee</th>
                <th className="p-3 font-bold uppercase text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredProjects.map((p) => {
                const liveUrlSafe = sanitizeUrl(p.liveUrl || '');
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      <Link to={`/projects/${p.id}`} className="hover:text-emerald-600 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span>{p.name}</span>
                      </Link>
                    </td>

                    <td className="p-3 text-slate-600 font-medium">
                      {p.clientOrgName}
                    </td>

                    <td className="p-3 font-mono">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          p.environment === 'PRODUCTION'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {p.environment}
                      </span>
                    </td>

                    <td className="p-3 font-mono text-purple-700 font-semibold">
                      {getProviderIcon(p.deployProvider)} {p.deployProvider || 'VERCEL'}
                    </td>

                    <td className="p-3 font-mono text-emerald-700 font-medium">
                      {p.databaseEngine}
                    </td>

                    <td className="p-3 font-mono text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[150px]">{p.domains[0] || liveUrlSafe}</span>
                        <button
                          onClick={() => copyToClipboard(p.domains[0] || liveUrlSafe, p.id)}
                          className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700"
                          title="Copy URL"
                        >
                          {copiedUrl === p.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>

                    <td className="p-3 font-mono text-emerald-700 font-bold">
                      {p.uptimePercent}%
                    </td>

                    <td className="p-3 font-mono text-slate-900 font-semibold">
                      ₹{(p.monthlyFeeINR || 0).toLocaleString('en-IN')}/mo
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewProject(p)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                          title="Sandboxed Preview"
                        >
                          <Monitor className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={liveUrlSafe}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                          title="Open Live URL"
                        >
                          <Globe className="w-3.5 h-3.5" />
                        </a>
                        <Link
                          to={`/projects/${p.id}`}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-1"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3 h-3 text-emerald-400" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty Filter State */}
      {filteredProjects.length === 0 && (
        <div className="enterprise-card rounded-2xl p-12 text-center space-y-4 no-print">
          <Building className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Client Projects Match Filter</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No registered client systems match the selected filter criteria. You can register a new client project or reset filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('ALL');
              setEnvFilter('ALL');
              setProviderFilter('ALL');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all border border-slate-200 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* ── Interactive Sandboxed Live Preview Modal ── */}
      {previewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn no-print">
          <div className="enterprise-card rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Top Bar */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-bold text-slate-900 text-sm">{previewProject.name}</h3>
                <span className="text-[11px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                  {sanitizeUrl(previewProject.liveUrl)}
                </span>
              </div>

              {/* Viewport Switcher */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
                <button
                  onClick={() => setPreviewViewport('desktop')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    previewViewport === 'desktop' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
                <button
                  onClick={() => setPreviewViewport('tablet')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    previewViewport === 'tablet' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tablet</span>
                </button>
                <button
                  onClick={() => setPreviewViewport('mobile')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    previewViewport === 'mobile' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
              </div>

              {/* External Link & Close */}
              <div className="flex items-center gap-2">
                <a
                  href={sanitizeUrl(previewProject.liveUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all flex items-center gap-1 text-xs font-semibold"
                >
                  <span>Open Full Tab</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
                <button
                  onClick={() => setPreviewProject(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sandboxed Iframe Container */}
            <div className="flex-1 bg-slate-950 flex items-center justify-center p-3 overflow-hidden relative">
              <div
                className={`h-full transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-white ${
                  previewViewport === 'desktop'
                    ? 'w-full'
                    : previewViewport === 'tablet'
                    ? 'w-[768px]'
                    : 'w-[375px]'
                }`}
              >
                <iframe
                  src={sanitizeUrl(previewProject.liveUrl)}
                  title={`${previewProject.name} Live Sandbox Preview`}
                  className="w-full h-full border-none"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Dynamic Project Registration & GitHub Import Modal ── */}
      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addProject}
      />
    </div>
  );
};
