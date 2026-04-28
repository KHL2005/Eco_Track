import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from './Guards';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPlaceholder from '../pages/DashboardPlaceholder';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        {/* All dashboard routes — protected */}
        {['super-admin', 'admin', 'officer', 'scientist', 'industry', 'citizen'].map((r) => (
          <Route key={r} path={`/dashboard/${r}`} element={<ProtectedRoute><DashboardPlaceholder /></ProtectedRoute>} />
        ))}

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

