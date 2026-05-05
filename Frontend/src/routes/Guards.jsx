import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export function GuestRoute({ children }) {
  const { isAuthenticated, loading, role } = useAuth();
  if (loading) return null;
  if (isAuthenticated) {
    // Redirect citizens to their specific dashboard
    if (role === 'CITIZEN') {
      return <Navigate to="/citizen/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export function CitizenGuard({ children }) {
  const { isAuthenticated, loading, role } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== 'CITIZEN') return <Navigate to="/dashboard" replace />;
  return children;
}
