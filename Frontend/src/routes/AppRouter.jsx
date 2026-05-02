import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from './Guards';

// Public
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import NotFoundPage from '../pages/NotFoundPage';

// Dashboard & Shared
import DashboardPage from '../pages/DashboardPage';
import ProfilePage from '../pages/ProfilePage';
import NotificationsPage from '../pages/NotificationsPage';
import ReportsPage from '../pages/ReportsPage';
import ProjectsPage from '../pages/ProjectsPage';
import ProjectDetailPage from '../pages/ProjectDetailPage';

// Issues
import IssuesPage from '../pages/IssuesPage';
import IssueDetailPage from '../pages/IssueDetailPage';
import CreateIssuePage from '../pages/CreateIssuePage';

// Sensors & Analysis
import SensorsPage from '../pages/SensorsPage';
import SensorDetailPage from '../pages/SensorDetailPage';
import SensorDataPage from '../pages/SensorDataPage';
import AnalysisPage from '../pages/AnalysisPage';

// Emissions & Documents
import EmissionsPage from '../pages/EmissionsPage';
import DocumentsPage from '../pages/DocumentsPage';

// Compliance & Audits
import CompliancePage from '../pages/CompliancePage';
import AuditsPage from '../pages/AuditsPage';

// Admin
import AdminUsersPage from '../pages/AdminUsersPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

        {/* Issues */}
        <Route path="/issues" element={<ProtectedRoute><IssuesPage /></ProtectedRoute>} />
        <Route path="/issues/mine" element={<ProtectedRoute><IssuesPage mine /></ProtectedRoute>} />
        <Route path="/issues/new" element={<ProtectedRoute><CreateIssuePage /></ProtectedRoute>} />
        <Route path="/issues/:id" element={<ProtectedRoute><IssueDetailPage /></ProtectedRoute>} />

        {/* Sensors */}
        <Route path="/sensors" element={<ProtectedRoute><SensorsPage /></ProtectedRoute>} />
        <Route path="/sensors/:id" element={<ProtectedRoute><SensorDetailPage /></ProtectedRoute>} />
        <Route path="/sensor-data" element={<ProtectedRoute><SensorDataPage /></ProtectedRoute>} />
        <Route path="/analysis" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />

        {/* Emissions & Docs */}
        <Route path="/emissions" element={<ProtectedRoute><EmissionsPage /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />

        {/* Projects */}
        <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />

        {/* Compliance */}
        <Route path="/compliance" element={<ProtectedRoute><CompliancePage /></ProtectedRoute>} />
        <Route path="/audits" element={<ProtectedRoute><AuditsPage /></ProtectedRoute>} />

        {/* Reports */}
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/users" element={<ProtectedRoute><AdminUsersPage /></ProtectedRoute>} />

        {/* Legacy dashboard paths → redirect to /dashboard */}
        {['super-admin', 'admin', 'officer', 'scientist', 'industry', 'citizen'].map((r) => (
          <Route key={r} path={`/dashboard/${r}`} element={<Navigate to="/dashboard" replace />} />
        ))}

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
