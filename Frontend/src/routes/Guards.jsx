import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';

// Define allowed routes for each role
const routesByRole = {
  CITIZEN: ['/dashboard', '/issues/new', '/issues/mine', '/issues/:id', '/notifications', '/profile'],
  AGENCY_OFFICER: ['/dashboard', '/issues', '/issues/mine', '/issues/new', '/issues/:id', '/analysis', '/projects', '/projects/dashboard', '/projects/:id', '/reports', '/notifications', '/profile'],
  INDUSTRY: ['/dashboard', '/emissions', '/documents', '/notifications', '/profile'],
  SCIENTIST: ['/dashboard', '/sensors', '/sensors/:id', '/sensor-data', '/analysis', '/notifications', '/profile'],
  COMPLIANCE_OFFICER: ['/dashboard', '/compliance', '/audits', '/emissions', '/documents', '/reports', '/notifications', '/profile'],
  ADMINISTRATOR: ['/dashboard', '/issues', '/issues/mine', '/issues/new', '/issues/:id', '/sensors', '/sensors/:id', '/sensor-data', '/analysis', '/emissions', '/documents', '/projects', '/projects/dashboard', '/projects/:id', '/compliance', '/audits', '/reports', '/admin/users', '/notifications', '/profile'],
  SUPER_ADMIN: ['/dashboard', '/issues', '/issues/mine', '/issues/new', '/issues/:id', '/sensors', '/sensors/:id', '/sensor-data', '/analysis', '/emissions', '/documents', '/projects', '/projects/dashboard', '/projects/:id', '/compliance', '/audits', '/reports', '/admin/users', '/notifications', '/profile'],
};

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const { role } = useRole();
  const location = useLocation();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  // Check if current path is allowed for the user's role
  const allowedRoutes = routesByRole[role] || routesByRole.CITIZEN;
  const currentPath = location.pathname;

  // Check exact matches and pattern matches
  const isAllowed = allowedRoutes.some(route => {
    if (route.includes(':')) {
      // Handle dynamic routes like /issues/:id
      const pattern = route.replace(/:\w+/g, '\\w+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(currentPath);
    }
    return currentPath === route || currentPath.startsWith(route + '/');
  });

  if (!isAllowed) {
    // For AGENCY_OFFICER, redirect unauthorized routes to /analysis
    if (role === 'AGENCY_OFFICER') {
      return <Navigate to="/analysis" replace />;
    }
    // For other roles, redirect to dashboard (fallback)
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}
