import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { SuperAdminLayout } from './layouts/SuperAdminLayout';

// High-speed route-based code splitting
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./pages/TermsOfService').then(m => ({ default: m.TermsOfService })));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy').then(m => ({ default: m.RefundPolicy })));

// Customer QR Menu Chunk (optimized for instant mobile load on QR scan)
const CustomerMenuPage = lazy(() => import('./pages/CustomerMenuPage').then(m => ({ default: m.CustomerMenuPage })));

// Restaurant Admin Pages
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const OrdersPage = lazy(() => import('./pages/OrdersPage').then(m => ({ default: m.OrdersPage })));
const MenuManagementPage = lazy(() => import('./pages/MenuManagementPage').then(m => ({ default: m.MenuManagementPage })));
const TablesPage = lazy(() => import('./pages/TablesPage').then(m => ({ default: m.TablesPage })));
const WorkersPage = lazy(() => import('./pages/WorkersPage').then(m => ({ default: m.WorkersPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage').then(m => ({ default: m.SubscriptionPage })));
const FeedbackPage = lazy(() => import('./pages/Feedback').then(m => ({ default: m.FeedbackPage })));

// Super Admin Pages
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));
const SuperAdminSubscriptions = lazy(() => import('./pages/SuperAdminSubscriptions').then(m => ({ default: m.SuperAdminSubscriptions })));
const SuperAdminPlans = lazy(() => import('./pages/SuperAdminPlans').then(m => ({ default: m.SuperAdminPlans })));
const SuperAdminAnalytics = lazy(() => import('./pages/SuperAdminAnalytics').then(m => ({ default: m.SuperAdminAnalytics })));
const SuperAdminSettings = lazy(() => import('./pages/SuperAdminSettings').then(m => ({ default: m.SuperAdminSettings })));
const SuperAdminAds = lazy(() => import('./pages/SuperAdminAds').then(m => ({ default: m.SuperAdminAds })));

// Lightweight loader for instant transitions
const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />

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
              <Route path="/dashboard/subscription" element={<SubscriptionPage />} />
              <Route path="/dashboard/feedback" element={<FeedbackPage />} />
            </Route>
          </Route>

          {/* Protected: Super Admin Panel */}
          <Route element={<ProtectedRoute />}>
            <Route element={<SuperAdminLayout />}>
              <Route path="/admin" element={<SuperAdminDashboard />} />
              <Route path="/admin/subscriptions" element={<SuperAdminSubscriptions />} />
              <Route path="/admin/plans" element={<SuperAdminPlans />} />
              <Route path="/admin/ads" element={<SuperAdminAds />} />
              <Route path="/admin/analytics" element={<SuperAdminAnalytics />} />
              <Route path="/admin/settings" element={<SuperAdminSettings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
