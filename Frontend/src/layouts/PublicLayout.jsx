import { Link, useLocation } from 'react-router-dom';
import { Leaf, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const team = [
  { id: '2480195', name: 'Aditya S M' },
  { id: '2480287', name: 'Sanjay S' },
  { id: '2479411', name: 'Harshita Lakshmi Kancharla' },
  { id: '2479746', name: 'Chandreish S' },
  { id: '2478774', name: 'Anukruthika Ganesan' },
  { id: '2480192', name: 'Praveenkumar S' },
];

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

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="relative bg-gradient-to-br from-forest-900 via-forest-800 to-forest-900 text-white/70 overflow-hidden">
        {/* Decorative blobs */}
        <div aria-hidden="true" className="absolute -top-20 -left-20 w-80 h-80 bg-leaf-400/10 rounded-full blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-20 -right-20 w-72 h-72 bg-leaf-400/5 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
            {/* Brand column */}
            <div className="lg:col-span-1">
              <Link to="/" className="inline-flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-leaf-400 rounded-lg flex items-center justify-center shadow-lg shadow-leaf-400/30">
                  <Leaf size={20} className="text-forest-900" />
                </div>
                <span className="font-bold text-white text-xl">EcoTrack</span>
              </Link>
              <p className="text-sm leading-relaxed text-white/60">
                Empowering citizens, agencies, and industries to monitor, report,
                and sustain a healthier planet — together. 🌿
              </p>
            </div>

            {/* Platform links */}
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <span aria-hidden="true">🌍</span> Platform
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/" className="hover:text-leaf-400 transition-colors">Home</Link></li>
                {isAuthenticated ? (
                  <li><Link to="/dashboard" className="hover:text-leaf-400 transition-colors">Dashboard</Link></li>
                ) : (
                  <>
                    <li><Link to="/login" className="hover:text-leaf-400 transition-colors">Sign in</Link></li>
                    <li><Link to="/register" className="hover:text-leaf-400 transition-colors">Register as Citizen</Link></li>
                  </>
                )}
              </ul>
            </div>

            {/* Team */}
            <div className="lg:col-span-2">
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <span aria-hidden="true">👥</span> Team
              </h4>
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                {team.map(({ id, name }) => (
                  <li key={id} className="flex items-baseline gap-3">
                    <span className="font-mono text-[11px] text-leaf-400 tracking-wider shrink-0">{id}</span>
                    <span className="text-white/80">{name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Divider + bottom bar */}
          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
            <p>© {new Date().getFullYear()} EcoTrack — Environmental Monitoring & Sustainability Management</p>
            <p className="flex items-center gap-1.5">
              <span aria-hidden="true">🌱</span>
              Built with care for a greener tomorrow.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

