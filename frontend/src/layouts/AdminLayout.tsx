import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LayoutDashboard, ShoppingBag, Menu, Grid2X2, Users, BarChart3, Settings, Bell, Search, LogOut } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOrderNotifications } from '../hooks/useOrderNotifications';
import { OrderNotificationToast } from '../components/OrderNotificationToast';

export const AdminLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { notifications, dismiss, dismissAll } = useOrderNotifications();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Orders', path: '/dashboard/orders', icon: ShoppingBag },
    { label: 'Menu', path: '/dashboard/menu', icon: Menu },
    { label: 'Tables', path: '/dashboard/tables', icon: Grid2X2 },
    { label: 'Workers', path: '/dashboard/workers', icon: Users },
    { label: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
    { label: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Order Notification Toast Overlay */}
      <OrderNotificationToast
        notifications={notifications}
        onDismiss={dismiss}
        onDismissAll={dismissAll}
      />

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200/60 flex flex-col hidden md:flex h-screen sticky top-0">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-100">
          <img src="/logo.jpg" alt="OrderKare Logo" className="h-10 w-auto object-contain rounded-xl shadow-xs" />
          <div>
            <h1 className="font-extrabold text-base text-slate-900 leading-tight">OrderKare</h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Hotel Dashboard</p>
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
                className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all relative ${
                  isActive
                    ? 'bg-primary/5 text-primary font-bold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-650'}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-accent"
                    className="w-1 h-6 bg-primary rounded-full absolute right-0"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={logout}
            className="flex items-center space-x-3 px-4 py-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-2xl w-full transition-all group"
          >
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
            <span className="text-sm font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/60 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex-1 flex items-center">
            <div className="relative w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search orders, tables..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Bell icon with notification badge */}
            <button
              onClick={() => { if (notifications.length > 0) dismissAll(); }}
              className="relative p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-500/30"
                >
                  {notifications.length > 9 ? '9+' : notifications.length}
                </motion.span>
              )}
            </button>
            <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-extrabold text-sm border border-primary/20">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* Page Content with Transitions */}
        <main className="flex-1 p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
