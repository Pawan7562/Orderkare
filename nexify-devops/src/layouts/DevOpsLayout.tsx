import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Layers,
  Smartphone,
  CreditCard,
  Database,
  AlertOctagon,
  ShieldCheck,
  Building,
  ChevronDown,
  LogOut,
  Sparkles,
  Command,
  Radio,
  FileText,
  Code,
  Bot,
  ShieldAlert,
  Menu,
  X,
  ChevronRight,
  Activity,
  Zap,
  ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '../context/ProjectContext';

interface NavGroup {
  groupTitle: string;
  items: {
    path: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
    count?: number;
    exact?: boolean;
  }[];
}

export const DevOpsLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { projects, selectedProjectId, setSelectedProjectId } = useProjects();
  const [clientDropdown, setClientDropdown] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navGroups: NavGroup[] = [
    {
      groupTitle: '1. Fleet & Workspaces',
      items: [
        { path: '/clients', label: 'Client Fleets & Setup', icon: Building, count: projects.length },
        { path: '/', label: 'Global Overview', icon: Layers, exact: true },
        { path: '/mobile', label: 'Mobile App Hub & OTA', icon: Smartphone, badge: 'v1.4', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
      ],
    },
    {
      groupTitle: '2. Data & Integration',
      items: [
        { path: '/database', label: 'Database & Storage Ops', icon: Database },
        { path: '/api-tester', label: 'REST API Console', icon: Code },
        { path: '/webhooks', label: 'Webhooks & Events', icon: CreditCard },
      ],
    },
    {
      groupTitle: '3. Observability & SRE',
      items: [
        { path: '/ai-sentinel', label: 'AI Sentinel SRE', icon: Bot, badge: 'AI SRE', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { path: '/monitoring', label: 'Uptime Radar & Edge', icon: Radio, badge: '99.98%', badgeColor: 'bg-teal-50 text-teal-700 border-teal-200' },
        { path: '/errors', label: 'Error Telemetry & APM', icon: AlertOctagon },
      ],
    },
    {
      groupTitle: '4. Security & Governance',
      items: [
        { path: '/cyber-defense', label: 'Cyber Defense & WAF', icon: ShieldAlert, badge: 'Active WAF', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
        { path: '/security', label: 'DevSecOps & SOC 2', icon: ShieldCheck },
        { path: '/audit', label: 'Cryptographic Audit', icon: Command },
        { path: '/invoicing', label: 'FinOps & Billing', icon: FileText },
      ],
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('nexify_dev_token');
    navigate('/login');
  };

  const currentSelectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedLabel = currentSelectedProject
    ? currentSelectedProject.name
    : `All Fleets (${projects.length})`;

  // Find active page label for header breadcrumb
  const isInsideProject = location.pathname.startsWith('/projects/');
  let activePageTitle = 'Overview';
  if (isInsideProject && currentSelectedProject) {
    activePageTitle = `${currentSelectedProject.name} Workspace`;
  } else {
    for (const group of navGroups) {
      for (const item of group.items) {
        if (item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)) {
          activePageTitle = item.label;
          break;
        }
      }
    }
  }

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group" onClick={() => setMobileSidebarOpen(false)}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-all">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
                NEXIFY
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                DEVOPS
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Enterprise Control Plane</p>
          </div>
        </Link>
      </div>

      {/* Client Fleet Switcher Pill */}
      <div className="p-3 border-b border-slate-100 relative">
        <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
          Active Workspace
        </label>
        <button
          onClick={() => setClientDropdown(!clientDropdown)}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] shrink-0" />
            <span className="truncate text-left font-bold">{selectedLabel}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0 transition-transform" />
        </button>

        <AnimatePresence>
          {clientDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              className="absolute left-3 right-3 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 text-xs font-medium space-y-1"
            >
              <button
                onClick={() => {
                  setSelectedProjectId('all');
                  setClientDropdown(false);
                  navigate('/clients');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl transition-all flex flex-col cursor-pointer ${
                  selectedProjectId === 'all'
                    ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">All Client Fleets ({projects.length} Total)</span>
                <span className="text-[10px] text-slate-500 font-mono">Global Telemetry Matrix</span>
              </button>

              <div className="h-px bg-slate-100 my-1" />

              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProjectId(p.id);
                    setClientDropdown(false);
                    navigate(`/projects/${p.id}`);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-all flex flex-col cursor-pointer ${
                    selectedProjectId === p.id
                      ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate font-semibold">{p.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{p.clientOrgName}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {isInsideProject && currentSelectedProject && (
          <div className="mt-2 p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" /> Isolated Workspace
              </span>
              <span className="text-[9px] font-mono font-bold text-emerald-700 bg-white px-1.5 py-0.2 rounded border border-emerald-200">
                12 Tabs
              </span>
            </div>
            <p className="font-bold text-slate-900 truncate">{currentSelectedProject.name}</p>
            <Link
              to="/clients"
              onClick={() => setMobileSidebarOpen(false)}
              className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 shadow-2xs transition-colors"
            >
              <ArrowLeft className="w-3 h-3 text-slate-400" />
              <span>← All Client Fleets</span>
            </Link>
          </div>
        )}
      </div>

      {/* Nav List with Group Headers */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 scrollbar-thin scrollbar-thumb-slate-200">
        {navGroups.map((group) => (
          <div key={group.groupTitle} className="space-y-1">
            <h3 className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              {group.groupTitle}
            </h3>
            <div className="space-y-0.5 pt-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.count !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono border font-bold ${
                            isActive
                              ? 'bg-white/20 text-white border-white/30'
                              : item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Profile / Cluster Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
        <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-white border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-slate-700">ap-south-1</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            99.98% SLA
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Console</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased flex selection:bg-emerald-100 selection:text-emerald-900">
      {/* ── Desktop Left Sidebar (Fixed 260px) ── */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 z-30">
        {renderSidebarContent()}
      </aside>

      {/* ── Mobile Sidebar Drawer with Backdrop ── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden shadow-2xl"
            >
              {renderSidebarContent()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Layout (Header + Canvas + Footer) ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 transition-all shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
          {/* Left: Mobile Trigger & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 lg:hidden cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs">
              <Link to="/" className="text-slate-500 hover:text-slate-800 font-medium">
                Nexify DevOps
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">
                {activePageTitle}
              </span>
            </div>
          </div>

          {/* Right: Cloud Status & Direct Quick Action */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Fleet Health: Nominal</span>
            </div>

            <Link
              to="/ai-sentinel"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Copilot</span>
            </Link>
          </div>
        </header>

        {/* Canvas Body */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl w-full mx-auto">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-slate-800 font-medium">Nexify DevOps Platform</span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-700 font-semibold">Fleet Engine v3.2</span>
          </div>
          <div className="text-slate-600">
            Internal Control Plane • <strong className="text-slate-900 font-semibold">Nexify Forge Technologies</strong>
          </div>
        </footer>
      </div>
    </div>
  );
};
