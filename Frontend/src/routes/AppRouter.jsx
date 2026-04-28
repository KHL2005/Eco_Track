import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GuestRoute, ProtectedRoute, RoleRoute } from './Guards';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPlaceholder from '../pages/DashboardPlaceholder';
import IndustryDashboard from '../pages/IndustryDashboard';
import OfficerDashboard from '../pages/OfficerDashboard';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        {/* Role-specific dashboards */}
        <Route path="/dashboard/industry" element={<RoleRoute allowed={['INDUSTRY']}><IndustryDashboard /></RoleRoute>} />
        <Route path="/dashboard/officer" element={<RoleRoute allowed={['OFFICER']}><OfficerDashboard /></RoleRoute>} />

        {/* Placeholder dashboards for other roles */}
        {['super-admin', 'admin', 'scientist', 'citizen'].map((r) => (
          <Route key={r} path={`/dashboard/${r}`} element={<ProtectedRoute><DashboardPlaceholder /></ProtectedRoute>} />
        ))}

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

