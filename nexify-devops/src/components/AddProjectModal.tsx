import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  Globe,
  Server,
  Database,
  CreditCard,
  Shield,
  Plus,
  Sparkles,
  Check,
  GitBranch,
  Zap,
  Cloud,
  Cpu,
  ArrowUpRight,
  Search,
  FolderGit2,
  Lock,
  RefreshCw,
  Star,
  GitFork,
  AlertCircle,
  Key,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectCategory, ProjectEnvironment, ClientProject, DeployProvider, GitProvider } from '../types/project';
import { githubService, GitHubRepoItem } from '../services/githubService';
import { getProviderDefaultDomain, getProviderDefaultUrl, isCustomDomain, formatLiveUrl as sanitizeUrl } from '../utils/domainUtils';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (project: Omit<ClientProject, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'deployments' | 'docs' | 'secrets' | 'team'>) => void;
}

const DEPLOY_PROVIDERS: {
  id: DeployProvider;
  name: string;
  badge: string;
  desc: string;
  bestFor: string;
  iconBg: string;
}[] = [
  {
    id: 'VERCEL',
    name: 'Vercel Edge Cloud',
    badge: '▲ Next.js & Edge SSR',
    desc: 'Instant global CDN, zero-config SSR, preview URLs, and serverless Edge compute.',
    bestFor: 'Next.js, Remix, React Vite, SvelteKit',
    iconBg: 'bg-black text-white',
  },
  {
    id: 'RENDER',
    name: 'Render Cloud Platform',
    badge: '⚡ Node & WebSockets',
    desc: 'Fully managed web services, continuous Docker deployments, persistent disks, and WebSockets.',
    bestFor: 'Node Express, Python FastAPI, Socket.IO, Cron Workers',
    iconBg: 'bg-teal-500 text-white',
  },
  {
    id: 'CLOUDFLARE',
    name: 'Cloudflare Pages & Workers',
    badge: '🟧 Global Edge & WAF',
    desc: 'Ultra-fast global 300+ city edge network with built-in WAF security and unlimited bandwidth.',
    bestFor: 'High-traffic SPAs, Static React, Edge Functions',
    iconBg: 'bg-amber-500 text-white',
  },
  {
    id: 'AWS',
    name: 'AWS Elastic Beanstalk / ECS',
    badge: '☁️ Enterprise VPC',
    desc: 'Industrial-scale AWS VPC infrastructure, automated autoscaling, and RDS integration.',
    bestFor: 'Dockerized microservices, High-compliance banks',
    iconBg: 'bg-orange-500 text-white',
  },
  {
    id: 'DIGITALOCEAN',
    name: 'DigitalOcean App Platform',
    badge: '🌊 Scalable Droplets',
    desc: 'Simple predictable billing, integrated PostgreSQL clusters, and single-click scaling.',
    bestFor: 'Independent SaaS apps, MVP prototypes',
    iconBg: 'bg-blue-500 text-white',
  },
  {
    id: 'GITHUB_ACTIONS',
    name: 'GitHub Actions / Custom',
    badge: '🐙 GitOps Webhook',
    desc: 'Trigger custom build runners and deploy webhooks directly from repository commits.',
    bestFor: 'Self-hosted VPS, Kubernetes clusters',
    iconBg: 'bg-slate-800 text-white',
  },
];

export const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose, onAdd }) => {
  // Git Source State
  const [gitProvider, setGitProvider] = useState<GitProvider>('GITHUB');
  const [githubAccount, setGithubAccount] = useState<string>('Pawan7562');
  const [githubToken, setGithubToken] = useState<string>(() => localStorage.getItem('nexify_github_token') || '');
  const [showTokenInput, setShowTokenInput] = useState<boolean>(false);
  const [isFetchingRepos, setIsFetchingRepos] = useState<boolean>(false);
  const [reposList, setReposList] = useState<GitHubRepoItem[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [repoSearch, setRepoSearch] = useState('');
  const [selectedRepoFullName, setSelectedRepoFullName] = useState<string>('Pawan7562/Orderkare');
  const [customRepoUrl, setCustomRepoUrl] = useState('https://github.com/Pawan7562/Orderkare');
  const [availableBranches, setAvailableBranches] = useState<string[]>(['main', 'master']);
  const [rootDirectory, setRootDirectory] = useState('./');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [autoDeployOnPush, setAutoDeployOnPush] = useState(true);
  const [isDetectingStack, setIsDetectingStack] = useState(false);

  // Project Details State
  const [name, setName] = useState('OrderKare Dining & QR SaaS');
  const [slug, setSlug] = useState('orderkare');
  const [category, setCategory] = useState<ProjectCategory>('SAAS');
  const [clientOrgName, setClientOrgName] = useState('OrderKare Technologies Pvt Ltd');
  const [contactName, setContactName] = useState('Pawan Kumar');
  const [contactEmail, setContactEmail] = useState('admin@orderkare.com');
  const [contactPhone, setContactPhone] = useState('+91 98765 43210');
  const [slaTier, setSlaTier] = useState<ClientProject['slaTier']>('ENTERPRISE_PLATINUM');
  const [monthlyFeeINR, setMonthlyFeeINR] = useState<number>(45000);
  const [environment, setEnvironment] = useState<ProjectEnvironment>('PRODUCTION');
  const [framework, setFramework] = useState('React 19 / Node.js Express / Socket.IO');
  const [databaseEngine, setDatabaseEngine] = useState('PostgreSQL 16 (Neon Serverless)');
  const [paymentGateway, setPaymentGateway] = useState('Razorpay Live (India UPI & Cards)');
  const [liveUrl, setLiveUrl] = useState('https://orderkare.co.in');
  const [domainInput, setDomainInput] = useState('orderkare.co.in, www.orderkare.co.in');

  // Deploy Target State
  const [deployProvider, setDeployProvider] = useState<DeployProvider>('RENDER');
  const [deployHookUrl, setDeployHookUrl] = useState('');

  // Fetch repositories from GitHub API
  const handleFetchGitHubRepos = async (accountName: string, tokenVal?: string) => {
    if (!accountName.trim()) return;
    setIsFetchingRepos(true);
    setFetchError(null);

    const result = await githubService.fetchUserOrOrgRepos(accountName.trim(), tokenVal || githubToken);
    setIsFetchingRepos(false);

    if (result.error) {
      setFetchError(result.error);
    } else {
      setReposList(result.repos);
      // If we got repos and none selected yet, pick the first one
      if (result.repos.length > 0 && !result.repos.some((r) => r.full_name === selectedRepoFullName)) {
        handleSelectRealRepo(result.repos[0]);
      }
    }
  };

  // Fetch on mount or when modal opens
  useEffect(() => {
    if (isOpen && reposList.length === 0) {
      handleFetchGitHubRepos(githubAccount);
    }
  }, [isOpen]);

  // Handle selecting a real repository from GitHub
  const handleSelectRealRepo = async (repo: GitHubRepoItem) => {
    setSelectedRepoFullName(repo.full_name);
    setCustomRepoUrl(repo.html_url);
    setDefaultBranch(repo.default_branch || 'main');

    // Humanize project name
    const cleanName = repo.name
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    setName(repo.name.toLowerCase() === 'orderkare' ? 'OrderKare Dining & QR SaaS' : repo.name.toLowerCase() === 'pkthenexgenexam' ? 'PK The NexGen Exam Monitoring System' : cleanName);
    setSlug(repo.name.toLowerCase());

    if (repo.description) {
      setClientOrgName(`${cleanName} Organization`);
    }

    // Fetch live branches
    const branches = await githubService.fetchBranches(repo.owner.login, repo.name, githubToken);
    setAvailableBranches(branches);

    // Auto-detect tech stack from package.json
    setIsDetectingStack(true);
    const detected = await githubService.detectRepositoryStack(repo.owner.login, repo.name, repo.default_branch, githubToken);
    setIsDetectingStack(false);

    setFramework(detected.framework);
    setDatabaseEngine(detected.database);
    setPaymentGateway(detected.paymentGateway);
    setDeployProvider(detected.recommendedDeploy);
    setCategory(detected.category);

    if (repo.name.toLowerCase() === 'orderkare') {
      setLiveUrl('https://orderkare.co.in');
      setDomainInput('orderkare.co.in, www.orderkare.co.in');
      setClientOrgName('OrderKare Technologies Pvt Ltd');
    } else if (repo.name.toLowerCase() === 'pkthenexgenexam') {
      setLiveUrl('https://www.pkthenexgenexam.xyz/');
      setDomainInput('www.pkthenexgenexam.xyz, pkthenexgenexam.xyz');
      setClientOrgName('PK The NexGen Education & Exam Labs');
    } else {
      const defaultPlatformUrl = getProviderDefaultUrl(detected.recommendedDeploy, repo.name.toLowerCase(), repo.owner.login);
      setLiveUrl(defaultPlatformUrl);
      setDomainInput('');
    }
  };

  const handleProviderChange = (newProvider: DeployProvider) => {
    setDeployProvider(newProvider);
    const curSlug = slug || name.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    // If no custom domain is entered, update liveUrl to match the newly selected provider default
    if (!domainInput.trim() || !isCustomDomain(domainInput.split(',')[0])) {
      setLiveUrl(getProviderDefaultUrl(newProvider, curSlug, githubAccount));
    }
  };

  const handleSaveToken = (val: string) => {
    setGithubToken(val);
    if (val.trim()) {
      localStorage.setItem('nexify_github_token', val.trim());
    } else {
      localStorage.removeItem('nexify_github_token');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientOrgName.trim()) return;

    const autoSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const customDomains = domainInput
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    const resolvedRepoUrl = customRepoUrl.trim() || `https://github.com/${selectedRepoFullName}`;
    const [repoOwner, repoName] = selectedRepoFullName.includes('/')
      ? selectedRepoFullName.split('/')
      : [githubAccount, selectedRepoFullName];

    // If no custom domain provided, use platform default domain (e.g. slug.vercel.app or slug.onrender.com)
    const platformDefaultDomain = getProviderDefaultDomain(deployProvider, autoSlug, repoOwner);
    const finalDomains = customDomains.length > 0 ? customDomains : [platformDefaultDomain];
    const safeLiveUrl = liveUrl.trim()
      ? sanitizeUrl(liveUrl, autoSlug, deployProvider, repoOwner)
      : getProviderDefaultUrl(deployProvider, autoSlug, repoOwner);

    onAdd({
      name: name.trim(),
      slug: autoSlug,
      category,
      clientOrgName: clientOrgName.trim(),
      primaryContact: {
        name: contactName.trim() || 'Client Admin',
        email: contactEmail.trim() || 'admin@client.com',
        phone: contactPhone.trim() || '+91 98765 00000',
      },
      slaTier,
      monthlyFeeINR: Number(monthlyFeeINR) || 0,
      environment,
      health: 'HEALTHY',
      uptimePercent: 100.0,
      latencyMs: 30,
      liveUrl: safeLiveUrl,
      repoUrl: resolvedRepoUrl,
      gitProvider,
      repoOwner,
      repoName,
      rootDirectory: rootDirectory.trim() || './',
      autoDeployOnPush,
      framework: framework.trim(),
      databaseEngine: databaseEngine.trim(),
      paymentGateway: paymentGateway.trim(),
      domains: finalDomains,
      deployProvider,
      deployHookUrl: deployHookUrl.trim() || undefined,
      defaultBranch: defaultBranch.trim() || 'main',
    });

    onClose();
  };

  const filteredRepos = reposList.filter(
    (r) =>
      r.full_name.toLowerCase().includes(repoSearch.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(repoSearch.toLowerCase())) ||
      (r.language && r.language.toLowerCase().includes(repoSearch.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="relative bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden z-10 my-8 text-slate-900"
      >
        {/* Modal Header */}
        <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Import Live GitHub Repository & Deploy
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  Live GitHub API Active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Directly fetch real repositories from GitHub, auto-inspect package.json, and launch multi-cloud deployments
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all cursor-pointer border border-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto text-xs">
          {/* ── STEP 1: CHOOSE WHERE THE PROJECT COMES FROM (GIT SOURCE) ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-mono font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>1. Where Does the Project Come From? (Source Code Provider)</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-medium">Real-time GitHub REST API</span>
            </div>

            {/* Provider Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              {[
                { id: 'GITHUB', label: 'GitHub (Live API)', icon: '🐙', sub: 'Real Repositories & Commits' },
                { id: 'GITLAB', label: 'GitLab', icon: '🦊', sub: 'GitLab CI/CD' },
                { id: 'BITBUCKET', label: 'Bitbucket', icon: '🔷', sub: 'Atlassian' },
                { id: 'CUSTOM_GIT', label: 'Custom Git Clone URL', icon: '🔗', sub: 'Public / Private URL' },
              ].map((prov) => {
                const isActive = gitProvider === prov.id;
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => setGitProvider(prov.id as GitProvider)}
                    className={`flex-1 py-2 px-3 rounded-xl transition-all text-left flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm font-bold border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <span className="text-base">{prov.icon}</span>
                    <div className="truncate">
                      <p className="leading-tight text-xs">{prov.label}</p>
                      <p className="text-[9px] text-slate-400 font-mono truncate">{prov.sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* GitHub Account Connect & Live Repo Browser */}
            {gitProvider === 'GITHUB' && (
              <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                {/* Account Fetcher Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2 flex-1 w-full">
                    <span className="text-slate-600 font-bold whitespace-nowrap text-xs">GitHub Account / Org:</span>
                    <input
                      type="text"
                      value={githubAccount}
                      onChange={(e) => setGithubAccount(e.target.value)}
                      placeholder="e.g. Pawan7562 or nexifyforge"
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-xs outline-none focus:border-emerald-500 w-44"
                    />
                    <button
                      type="button"
                      onClick={() => handleFetchGitHubRepos(githubAccount)}
                      disabled={isFetchingRepos}
                      className="px-3 py-1.5 theme-btn-primary rounded-xl text-xs flex items-center gap-1.5 cursor-pointer font-bold shadow-sm shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isFetchingRepos ? 'animate-spin' : ''}`} />
                      <span>{isFetchingRepos ? 'Fetching...' : 'Fetch Live Repos'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowTokenInput(!showTokenInput)}
                    className="text-[11px] text-slate-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer font-mono"
                  >
                    <Key className="w-3 h-3" />
                    <span>{githubToken ? 'Token Configured ✓' : 'Add Token (Private Repos)'}</span>
                  </button>
                </div>

                {/* Optional GitHub Token */}
                <AnimatePresence>
                  {showTokenInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5"
                    >
                      <label className="block text-[11px] text-slate-600 font-semibold">
                        GitHub Personal Access Token (PAT) for Private Repositories:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={githubToken}
                          onChange={(e) => handleSaveToken(e.target.value)}
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                          className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleFetchGitHubRepos(githubAccount, githubToken)}
                          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold"
                        >
                          Apply & Refresh
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Banner */}
                {fetchError && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>{fetchError}</span>
                  </div>
                )}

                {/* Filter / Search within fetched repos */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={repoSearch}
                    onChange={(e) => setRepoSearch(e.target.value)}
                    placeholder={`Search within ${reposList.length} repositories of ${githubAccount}...`}
                    className="w-full pl-9 pr-3.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                {/* Live Repos Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto">
                  {filteredRepos.map((repo) => {
                    const isSelected = selectedRepoFullName === repo.full_name;
                    return (
                      <div
                        key={repo.id}
                        onClick={() => handleSelectRealRepo(repo)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 shadow-sm'
                            : 'bg-white hover:bg-slate-100/70 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-bold text-slate-900 font-mono text-xs truncate">
                              {repo.full_name}
                            </span>
                            {repo.private && (
                              <span title="Private Repository">
                                <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                              </span>
                            )}
                          </div>
                          {isSelected ? (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white font-mono text-[9px] font-bold">
                              SELECTED
                            </span>
                          ) : (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                              <Star className="w-3 h-3 text-amber-500" />
                              <span>{repo.stargazers_count}</span>
                            </div>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {repo.description || 'No description provided.'}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                          <span className="text-emerald-700 font-semibold">
                            {repo.language || 'JavaScript/TypeScript'}
                          </span>
                          <span>Branch: {repo.default_branch}</span>
                        </div>
                      </div>
                    );
                  })}

                  {filteredRepos.length === 0 && !isFetchingRepos && (
                    <div className="col-span-2 p-6 text-center text-xs text-slate-400 font-mono bg-white rounded-xl border border-dashed border-slate-200">
                      No repositories found for "{githubAccount}". Try checking spelling or fetching again.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Custom Git URL */}
            {gitProvider !== 'GITHUB' && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Git Clone URL (HTTPS or SSH) *
                  </label>
                  <input
                    type="text"
                    required
                    value={customRepoUrl}
                    onChange={(e) => setCustomRepoUrl(e.target.value)}
                    placeholder="https://gitlab.com/org/project.git or https://github.com/..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Git Branch & Monorepo Root Directory */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Production Branch</label>
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-slate-400" />
                  <select
                    value={defaultBranch}
                    onChange={(e) => setDefaultBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:border-emerald-500 text-xs font-semibold cursor-pointer"
                  >
                    {availableBranches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Root Directory</label>
                <input
                  type="text"
                  value={rootDirectory}
                  onChange={(e) => setRootDirectory(e.target.value)}
                  placeholder="./ (or frontend / backend)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={autoDeployOnPush}
                    onChange={(e) => setAutoDeployOnPush(e.target.checked)}
                    className="accent-emerald-600 rounded"
                  />
                  <span className="text-slate-800 font-semibold text-xs">Auto-deploy on Git push</span>
                </label>
              </div>
            </div>
          </div>

          {/* ── STEP 2: WHERE SHOULD WE DEPLOY IT? (DEPLOYMENT TARGET) ── */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-mono font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>2. Where Should We Deploy It? (Deployment Target)</span>
              </h4>
              {isDetectingStack && (
                <span className="text-[10px] text-emerald-700 font-mono animate-pulse">
                  Inspecting package.json & auto-recommending target...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {DEPLOY_PROVIDERS.map((prov) => {
                const isSelected = deployProvider === prov.id;
                return (
                  <div
                    key={prov.id}
                    onClick={() => handleProviderChange(prov.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 text-left relative ${
                      isSelected
                        ? 'bg-emerald-50/60 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                        : 'bg-slate-50/60 hover:bg-slate-100/60 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${prov.iconBg}`}>
                          {prov.id === 'VERCEL' ? '▲' : prov.id === 'RENDER' ? '⚡' : prov.id === 'CLOUDFLARE' ? '🟧' : prov.id === 'AWS' ? '☁' : prov.id === 'DIGITALOCEAN' ? '🌊' : '🐙'}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{prov.name}</span>
                      </div>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug">{prov.desc}</p>

                    <div className="pt-2 border-t border-slate-200/80 text-[10px]">
                      <span className="text-slate-400 font-mono block">Default Domain:</span>
                      <span className="text-emerald-700 font-mono font-semibold">
                        {getProviderDefaultDomain(prov.id, slug || 'my-app', githubAccount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Deploy Hook Configuration */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Deploy Webhook / Integration URL <span className="text-slate-400 font-normal">(Optional Render/Vercel/Cloudflare deploy hook)</span>
              </label>
              <input
                type="url"
                value={deployHookUrl}
                onChange={(e) => setDeployHookUrl(e.target.value)}
                placeholder={
                  deployProvider === 'VERCEL'
                    ? 'https://api.vercel.com/v1/integrations/deploy/prj_xxx/yyy'
                    : deployProvider === 'RENDER'
                    ? 'https://api.render.com/deploy/srv-xxx?key=yyy'
                    : 'https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hook/...'
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>

          {/* ── STEP 3: PROJECT & CLIENT DETAILS ── */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="text-[11px] font-mono font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              <span>3. Project & Organization Details</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Project Display Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. PK Exam Monitoring / OrderKare"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Client Organization Name *</label>
                <input
                  type="text"
                  required
                  value={clientOrgName}
                  onChange={(e) => setClientOrgName(e.target.value)}
                  placeholder="e.g. OrderKare Technologies Pvt Ltd"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-500 cursor-pointer font-medium"
                >
                  <option value="SAAS">SaaS Platform</option>
                  <option value="AI_AUTOMATION">AI Agent & Proctoring</option>
                  <option value="MOBILE_APP">Mobile Application (iOS/Android)</option>
                  <option value="CRM">Custom CRM & ERP</option>
                  <option value="ECOMMERCE">E-Commerce & Delivery</option>
                  <option value="FINTECH">FinTech & Payments</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Environment</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as ProjectEnvironment)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-500 cursor-pointer font-medium"
                >
                  <option value="PRODUCTION">Production (Live Webapp)</option>
                  <option value="STAGING">Staging (Pre-Release Testing)</option>
                  <option value="DEVELOPMENT">Development Build</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── STEP 4: RUNTIME & DATABASE SPECS ── */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="text-[11px] font-mono font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" />
              <span>4. Runtime Stack & Domain Routing</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tech Framework</label>
                <input
                  type="text"
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  placeholder="e.g. Next.js 15 / React 19 / Node Express"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Database Engine</label>
                <input
                  type="text"
                  value={databaseEngine}
                  onChange={(e) => setDatabaseEngine(e.target.value)}
                  placeholder="e.g. PostgreSQL 16 (Neon / AWS RDS)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-semibold">Live Endpoint URL</label>
                  <span className="text-[10px] text-slate-400 font-mono">Auto-prefixes http/https</span>
                </div>
                <input
                  type="text"
                  value={liveUrl}
                  onChange={(e) => setLiveUrl(e.target.value)}
                  placeholder={getProviderDefaultUrl(deployProvider, slug || 'my-app', githubAccount)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:border-emerald-500 text-xs"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setLiveUrl(getProviderDefaultUrl(deployProvider, slug || 'my-app', githubAccount))}
                    className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-mono cursor-pointer transition-all border border-emerald-200 font-bold"
                    title="Use Platform Default Domain"
                  >
                    ▲ Default: {getProviderDefaultDomain(deployProvider, slug || 'my-app', githubAccount)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLiveUrl('http://localhost:5173/')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-mono cursor-pointer transition-all border border-slate-200"
                  >
                    ⚡ Localhost:5173
                  </button>
                  <button
                    type="button"
                    onClick={() => setLiveUrl('https://orderkare.co.in')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-mono cursor-pointer transition-all border border-slate-200"
                  >
                    🌐 orderkare.co.in
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-semibold">Custom Domain (Optional)</label>
                  <span className="text-[10px] text-emerald-700 font-mono font-semibold">
                    Default: {getProviderDefaultDomain(deployProvider, slug || 'my-app', githubAccount)}
                  </span>
                </div>
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder={`e.g. clientdomain.com (Leave blank to use ${getProviderDefaultDomain(deployProvider, slug || 'my-app', githubAccount)})`}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:border-emerald-500 text-xs"
                />
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Until a custom domain is added, the website is accessible via <strong>{getProviderDefaultDomain(deployProvider, slug || 'my-app', githubAccount)}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* ── STEP 5: CLIENT CONTACT & SLA ── */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="text-[11px] font-mono font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              <span>5. Client Primary Contact & Maintenance SLA</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Contact Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Client Owner / PM"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="owner@client.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Maintenance Fee (₹/mo)</label>
                <input
                  type="number"
                  value={monthlyFeeINR}
                  onChange={(e) => setMonthlyFeeINR(Number(e.target.value))}
                  placeholder="45000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Importing from <strong className="text-slate-900 font-mono">{selectedRepoFullName}</strong> ➔ Deploying to <strong className="text-slate-900">{deployProvider}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 theme-btn-primary rounded-xl cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Import & Configure Fleet</span>
              </button>
            </div>
          </div>
        </form>

      </motion.div>
    </div>
  );
};



