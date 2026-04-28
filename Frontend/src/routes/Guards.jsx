import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardPath } from '../utils/rolePaths';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export function GuestRoute({ children }) {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to={getDashboardPath(role)} replace />;
  return children;
}

