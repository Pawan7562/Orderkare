import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { SuperAdminLayout } from './layouts/SuperAdminLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { MenuManagementPage } from './pages/MenuManagementPage';
import { OrdersPage } from './pages/OrdersPage';
import { SettingsPage } from './pages/SettingsPage';
import { CustomerMenuPage } from './pages/CustomerMenuPage';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { SuperAdminSubscriptions } from './pages/SuperAdminSubscriptions';
import { SuperAdminPlans } from './pages/SuperAdminPlans';
import { SuperAdminAnalytics } from './pages/SuperAdminAnalytics';
import { SuperAdminSettings } from './pages/SuperAdminSettings';
import { TablesPage } from './pages/TablesPage';
import { WorkersPage } from './pages/WorkersPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Public: Customer QR Menu */}
        <Route path="/menu/:slug" element={<CustomerMenuPage />} />

        {/* Protected: Restaurant Admin Dashboard */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/orders" element={<OrdersPage />} />
            <Route path="/dashboard/menu" element={<MenuManagementPage />} />
            <Route path="/dashboard/tables" element={<TablesPage />} />
            <Route path="/dashboard/workers" element={<WorkersPage />} />
            <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
            <Route path="/dashboard/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Protected: Super Admin Panel */}
        <Route element={<ProtectedRoute />}>
          <Route element={<SuperAdminLayout />}>
            <Route path="/admin" element={<SuperAdminDashboard />} />
            <Route path="/admin/subscriptions" element={<SuperAdminSubscriptions />} />
            <Route path="/admin/plans" element={<SuperAdminPlans />} />
            <Route path="/admin/analytics" element={<SuperAdminAnalytics />} />
            <Route path="/admin/settings" element={<SuperAdminSettings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
