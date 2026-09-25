import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Activity,
  Layers,
  Globe,
  Smartphone,
  Server,
  Cpu,
  Database,
  Shield,
  CreditCard,
  AlertOctagon,
  GitBranch,
  Sliders,
  ShieldCheck,
  Search,
  ExternalLink,
  RefreshCw,
  Terminal,
  Zap,
  ArrowUpRight,
  Bell,
  Code2,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DevOpsLayout: React.FC = () => {
  const location = useLocation();
  const [selectedFleet, setSelectedFleet] = useState('All Fleets (6 Services)');
  const [fleetDropdown, setFleetDropdown] = useState(false);

  const fleetOptions = [
    'All Fleets (6 Services)',
    'OrderKare Core API (Backend)',
    'OrderKare Web (Customer & Admin)',
    'Waiter & Staff App (Mobile/RN)',
    'Kitchen KDS Tablet (Mobile/Flutter)',
    'AI Menu OCR Agent (Python/FastAPI)',
    'Nexify CRM Portal (Next.js 15)',
  ];

  return (
    <div className="min-h-screen bg-[#070A13] text-slate-100 font-sans antialiased flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* ── Top Header Command Bar ── */}
      <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Brand & Fleet Selector */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/devops" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-black font-black text-base group-hover:scale-105 transition-all">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                  NEXIFY DEVOPS
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.2 rounded-sm bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Control Plane
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block">Nexify Forge Technologies</p>
            </div>
          </Link>

          {/* Fleet Dropdown */}
          <div className="relative">
            <button
              onClick={() => setFleetDropdown(!fleetDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800/90 border border-slate-700/70 rounded-xl text-xs font-bold text-slate-200 transition-all cursor-pointer shadow-inner"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="truncate max-w-[150px] sm:max-w-[200px]">{selectedFleet}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <AnimatePresence>
              {fleetDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute left-0 mt-2 w-64 bg-[#0F172A] border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 text-xs font-medium space-y-0.5 backdrop-blur-xl"
                >
                  {fleetOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setSelectedFleet(opt);
                        setFleetDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                        selectedFleet === opt ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{opt}</span>
                      {selectedFleet === opt && <span className="text-cyan-400">✓</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Telemetry Indicators & Quick Actions */}
        <div className="flex items-center gap-3">
          {/* Cluster Status Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ap-south-1 (99.98% Live)</span>
          </div>

          {/* Shortcut to OrderKare Super Admin */}
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all"
            title="Switch to OrderKare Super Admin"
          >
            <span className="hidden sm:inline">OrderKare Admin</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800/80 bg-[#0B0F19] py-4 px-6 text-center text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>Nexify DevOps v3.2.0 • Enterprise Fleet Control Plane</span>
        </div>
        <div className="text-slate-400">
          Managed by <strong className="text-white">Nexify Forge Technologies</strong>
        </div>
      </footer>
    </div>
  );
};
