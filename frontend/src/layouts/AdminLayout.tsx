import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LayoutDashboard, ShoppingBag, Menu, Grid2X2, Users, BarChart3, Settings, Bell, Search, LogOut, CreditCard } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { GlobalOrderNotifier } from '../components/GlobalOrderNotifier';
import { ThemeToggle } from '../components/ThemeToggle'; // 👈 Theme Toggle Import kiya

export const AdminLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Orders', path: '/dashboard/orders', icon: ShoppingBag },
    { label: 'Menu', path: '/dashboard/menu', icon: Menu },
    { label: 'Tables', path: '/dashboard/tables', icon: Grid2X2 },
    { label: 'Workers', path: '/dashboard/workers', icon: Users },
    { label: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
    { label: 'Settings', path: '/dashboard/settings', icon: Settings },
    { label: 'Subscription', path: '/dashboard/subscription', icon: CreditCard },
    { label: 'Feedback', path: '/dashboard/feedback', icon: Bell }
  ];

  return (
    <div className="min-h-screen bg-[#fafbfe] dark:bg-slate-950 flex font-sans transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-68 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col hidden md:flex h-screen sticky top-0 transition-colors duration-300">
        <div className="p-6 flex items-center space-x-3.5 border-b border-slate-100 dark:border-slate-800">
          <img src="/logo.jpg" alt="OrderKare" className="h-10 w-10 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs" />
          <div>
            <h1 className="font-black text-lg text-slate-900 dark:text-white leading-tight">
              Order<span className="text-orange-600">Kare</span>
            </h1>
            <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Restaurant Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-3.5 mt-5 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all relative ${
                  isActive
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-semibold'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-accent"
                    className="w-1.5 h-6 bg-orange-600 dark:bg-orange-500 rounded-full absolute right-0"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={logout}
            className="flex items-center space-x-3.5 px-4 py-3 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 rounded-xl w-full transition-all group font-semibold text-sm"
          >
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-17 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-20 transition-colors duration-300">
          <div className="flex-1 flex items-center">
            <div className="relative w-80 max-w-full">
              <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search orders, tables, dishes..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3.5">
            <ThemeToggle />

            <Link
              to="/dashboard/tables"
              className="hidden sm:inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>QR Standee</span>
            </Link>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-rose-500 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* Global Real-time Order Popup and Audio Bell */}
        <GlobalOrderNotifier />

        {/* Page Content with Transitions */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto">
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