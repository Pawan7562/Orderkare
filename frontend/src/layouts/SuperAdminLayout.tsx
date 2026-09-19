import { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Building2,
  CreditCard,
  Diamond,
  BarChart3,
  Settings,
  Bell,
  Search,
  LogOut,
  ShieldCheck,
  Megaphone,
  CheckCheck,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import api from '../lib/api';

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  restaurantId?: string;
  restaurantName?: string;
  amount?: number;
  planName?: string;
  isRead: boolean;
  createdAt: string;
}

export const SuperAdminLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState<AdminNotification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { label: 'Hotels & Venues', path: '/admin', icon: Building2 },
    { label: 'Subscriptions', path: '/admin/subscriptions', icon: CreditCard },
    { label: 'SaaS Plans', path: '/admin/plans', icon: Diamond },
    { label: 'Sponsored Ads', path: '/admin/ads', icon: Megaphone },
    { label: 'Platform Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'System Settings', path: '/admin/settings', icon: Settings },
  ];

  // Fetch initial notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/admin/notifications');
      if (res.data?.notifications) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Ignore if not loaded yet
    }
  };

  useEffect(() => {
    fetchNotifications();

    const socketUrl =
      import.meta.env.VITE_WS_URL ||
      (import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '')
        : 'https://orderkare-3.onrender.com');

    const token = localStorage.getItem('token');
    const socket: Socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    const joinRoom = () => {
      socket.emit('join_super_admin');
    };

    socket.on('connect', joinRoom);
    if (socket.connected) joinRoom();

    const handleNotification = (notif: AdminNotification) => {
      setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
      setUnreadCount((prev) => prev + 1);
      setToastNotification(notif);

      // Play chime if audio supported
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.45);
      } catch {
        // AudioContext might be blocked until user interaction
      }
    };

    socket.on('admin_notification', handleNotification);
    socket.on('super_admin_notification', handleNotification);

    return () => {
      socket.disconnect();
    };
  }, []);

  // Auto-hide toast after 7s
  useEffect(() => {
    if (!toastNotification) return;
    const timer = setTimeout(() => {
      setToastNotification(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [toastNotification]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.post(`/admin/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/admin/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans">
      {/* Toast popup for live notifications */}
      <AnimatePresence>
        {toastNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-primary/20 p-4 overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-xs text-slate-900 leading-tight">
                  {toastNotification.title}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  {toastNotification.message}
                </p>
                <p className="text-[9px] text-slate-400 mt-1 font-mono">Just now</p>
              </div>
              <button
                onClick={() => setToastNotification(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col hidden md:flex h-screen sticky top-0 z-20 shadow-xs">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-100">
          <img src="/logo.jpg" alt="OrderKare Logo" className="h-10 w-auto object-contain rounded-xl shadow-xs" />
          <div>
            <h1 className="font-extrabold text-base text-slate-900 tracking-tight leading-tight">OrderKare</h1>
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full inline-block mt-0.5">
              Super Admin
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 mt-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'text-primary bg-primary/10 shadow-xs'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="superadmin-sidebar-indicator"
                    className="absolute left-0 top-2 bottom-2 w-1.5 bg-primary rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Super Admin'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'superadmin@orderkare.com'}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-8 sticky top-0 z-10 shadow-2xs">
          <div className="flex items-center space-x-3">
            <span className="text-slate-900 font-extrabold text-sm tracking-tight hidden sm:inline">
              Super Admin Console
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Bell Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl relative transition-colors"
                title="Super Admin Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown menu */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200/80 py-3 z-50 overflow-hidden"
                  >
                    <div className="px-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-extrabold text-xs text-slate-900">Notifications</h3>
                        <p className="text-[10px] text-slate-400">{unreadCount} unread activities</p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <CheckCheck className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start justify-between gap-2 ${
                              !n.isRead ? 'bg-primary/5' : ''
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs text-slate-900 leading-tight">
                                {n.title}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                {n.message}
                              </p>
                              <p className="text-[9px] text-slate-400 mt-1 font-mono">
                                {new Date(n.createdAt).toLocaleString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                            {!n.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(n.id)}
                                className="text-slate-400 hover:text-primary p-1"
                                title="Mark read"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-9 h-9 bg-primary/10 text-primary border border-primary/20 rounded-xl flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0) || 'S'}
            </div>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 p-6 md:p-8 bg-slate-50/60 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
