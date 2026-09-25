import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ProjectProvider } from './context/ProjectContext';
import { DevOpsLayout } from './layouts/DevOpsLayout';
import { LoginPage } from './pages/LoginPage';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { ClientProjectsPage } from './pages/ClientProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { MobileAppHubPage } from './pages/MobileAppHubPage';
import { WebhookStreamPage } from './pages/WebhookStreamPage';
import { DatabaseOpsPage } from './pages/DatabaseOpsPage';
import { ErrorLogsPage } from './pages/ErrorLogsPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { ApiTesterPage } from './pages/ApiTesterPage';
import { UptimeRadarPage } from './pages/UptimeRadarPage';
import { SecurityScannerPage } from './pages/SecurityScannerPage';
import { InvoicingFinOpsPage } from './pages/InvoicingFinOpsPage';
import { AiSupervisorPage } from './pages/AiSupervisorPage';
import { CyberDefensePage } from './pages/CyberDefensePage';

// Protected Developer Route Guard
const ProtectedDevRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('nexify_dev_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <ProjectProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Control Plane Routes */}
            <Route
              element={
                <ProtectedDevRoute>
                  <DevOpsLayout />
                </ProtectedDevRoute>
              }
            >
              <Route path="/" element={<OverviewDashboard />} />
              <Route path="/ai-sentinel" element={<AiSupervisorPage />} />
              <Route path="/cyber-defense" element={<CyberDefensePage />} />
              <Route path="/clients" element={<ClientProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/api-tester" element={<ApiTesterPage />} />
              <Route path="/monitoring" element={<UptimeRadarPage />} />
              <Route path="/database" element={<DatabaseOpsPage />} />
              <Route path="/webhooks" element={<WebhookStreamPage />} />
              <Route path="/mobile" element={<MobileAppHubPage />} />
              <Route path="/errors" element={<ErrorLogsPage />} />
              <Route path="/security" element={<SecurityScannerPage />} />
              <Route path="/invoicing" element={<InvoicingFinOpsPage />} />
              <Route path="/audit" element={<AuditTrailPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ProjectProvider>
    </ThemeProvider>
  );
}

export default App;
