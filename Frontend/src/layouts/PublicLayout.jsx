import { Link, useLocation } from 'react-router-dom';
import { Leaf, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PublicLayout({ children }) {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const isLogin = location.pathname === '/login';
  const isRegister = location.pathname === '/register';
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-earth-100 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md border-b border-bark-400/10 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-forest-600 rounded-lg flex items-center justify-center">
              <Leaf size={18} className="text-white" />
            </div>
            <span className="font-bold text-forest-900 text-lg">EcoTrack</span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              /* Logged in — show Dashboard shortcut */
              <Link to="/dashboard"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-forest-600 hover:text-forest-700 transition-colors">
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            ) : (
              /* Logged out — show context-appropriate link */
              isHome ? (
                /* Home page — login form is inline on the page itself */
                null
              ) : isRegister ? (
                <Link to="/login" className="text-sm font-medium text-forest-600 hover:text-forest-700 transition-colors">
                  Sign in
                </Link>
              ) : isLogin ? (
                <Link to="/register" className="text-sm font-medium text-forest-600 hover:text-forest-700 transition-colors">
                  Create citizen account
                </Link>
              ) : (
                /* Other public pages */
                <>
                  <Link to="/login" className="text-sm font-medium text-bark-600 hover:text-bark-800 transition-colors">
                    Sign in
                  </Link>
                  <Link to="/register"
                    className="text-sm font-medium bg-forest-600 text-white px-4 py-1.5 rounded-lg hover:bg-forest-700 transition-colors">
                    Register
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
      <footer className="bg-forest-900 text-white/60 py-6 text-center text-sm">
        © {new Date().getFullYear()} EcoTrack — Environmental Monitoring & Sustainability Management
      </footer>
    </div>
  );
}

