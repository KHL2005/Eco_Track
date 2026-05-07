import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';
import { ROLE_LABELS } from '../utils/constants';
import NotificationBell from '../features/notifications/NotificationBell';
import {toast} from 'sonner';

import {
  Leaf, LayoutDashboard, AlertTriangle, Activity, FolderKanban,
  ShieldCheck, ClipboardList, FileText, Bell, User, LogOut, Menu,
  Factory, FlaskConical, Users, ScrollText, ChevronRight,
  PanelLeftClose, PanelLeftOpen, ChevronDown, Database
} from 'lucide-react';

const navByRole = {
  CITIZEN: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Report Issue', icon: AlertTriangle, to: '/issues/new' },
    { label: 'My Issues', icon: ClipboardList, to: '/issues/mine' },
    { label: 'Projects', icon: FolderKanban, to: '/projects' },
    { label: 'Notifications', icon: Bell, to: '/notifications' },
  ],
  AGENCY_OFFICER: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Issues', icon: AlertTriangle, to: '/issues' },
    { label: 'Sensors', icon: Activity, to: '/sensors' },
    { label: 'Sensor Data', icon: Database, to: '/sensor-data' },
    { label: 'Analysis', icon: FlaskConical, to: '/analysis' },
    { label: 'Projects', icon: FolderKanban, to: '/projects' },
    { label: 'Reports', icon: FileText, to: '/reports' },
    { label: 'Notifications', icon: Bell, to: '/notifications' },
  ],
  INDUSTRY: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Emissions', icon: Factory, to: '/emissions' },
    { label: 'Documents', icon: FileText, to: '/documents' },
    { label: 'Notifications', icon: Bell, to: '/notifications' },
  ],
  SCIENTIST: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Sensors', icon: Activity, to: '/sensors' },
    { label: 'Sensor Data', icon: Database, to: '/sensor-data' },
    { label: 'Analysis', icon: FlaskConical, to: '/analysis' },
    { label: 'Notifications', icon: Bell, to: '/notifications' },
  ],
  COMPLIANCE_OFFICER: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Compliance', icon: ShieldCheck, to: '/compliance' },
    { label: 'Audits', icon: ClipboardList, to: '/audits' },
    { label: 'Emissions', icon: Factory, to: '/emissions' },
    { label: 'Documents', icon: FileText, to: '/documents' },
    { label: 'Reports', icon: ScrollText, to: '/reports' },
    { label: 'Notifications', icon: Bell, to: '/notifications' },
  ],
  ADMINISTRATOR: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Issues', icon: AlertTriangle, to: '/issues' },
    { label: 'Sensors', icon: Activity, to: '/sensors' },
    { label: 'Sensor Data', icon: Database, to: '/sensor-data' },
    { label: 'Analysis', icon: FlaskConical, to: '/analysis' },
    { label: 'Emissions', icon: Factory, to: '/emissions' },
    { label: 'Documents', icon: FileText, to: '/documents' },
    { label: 'Projects', icon: FolderKanban, to: '/projects' },
    { label: 'Compliance', icon: ShieldCheck, to: '/compliance' },
    { label: 'Audits', icon: ClipboardList, to: '/audits' },
    { label: 'Reports', icon: ScrollText, to: '/reports' },
    { label: 'Users', icon: Users, to: '/admin/users' },
    { label: 'Notifications', icon: Bell, to: '/notifications' },
  ],
  SUPER_ADMIN: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    { label: 'Issues', icon: AlertTriangle, to: '/issues' },
    { label: 'Sensors', icon: Activity, to: '/sensors' },
    { label: 'Sensor Data', icon: Database, to: '/sensor-data' },
    { label: 'Analysis', icon: FlaskConical, to: '/analysis' },
    { label: 'Emissions', icon: Factory, to: '/emissions' },
    { label: 'Documents', icon: FileText, to: '/documents' },
    { label: 'Projects', icon: FolderKanban, to: '/projects' },
    { label: 'Compliance', icon: ShieldCheck, to: '/compliance' },
    { label: 'Audits', icon: ClipboardList, to: '/audits' },
    { label: 'Reports', icon: ScrollText, to: '/reports' },
    { label: 'Users', icon: Users, to: '/admin/users' },
    { label: 'Notifications', icon: Bell, to: '/notifications' },
  ],
};

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const { role } = useRole();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('ecotrack_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const navItems = navByRole[role] || navByRole.CITIZEN;

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');   // ← add this line
    navigate('/login', { replace: true });
  };

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ecotrack_sidebar_collapsed', next ? '1' : '0');
      } catch {
        // ignore storage issues
      }
      return next;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const SidebarContent = ({ collapsed = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-2 px-5'} py-5 border-b border-white/10`}>
        <div className="w-8 h-8 bg-leaf-400 rounded-lg flex items-center justify-center">
          <Leaf size={18} className="text-forest-900" />
        </div>
        {!collapsed && <span className="font-bold text-white text-lg">EcoTrack</span>}
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="px-5 py-4 border-b border-white/10">
          <div className="text-xs text-white/50 mb-0.5">Signed in as</div>
          <div className="text-sm font-medium text-white truncate">{user?.name}</div>
          <div className="text-xs text-leaf-400">{ROLE_LABELS[role] || role}</div>
        </div>
      )}

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto ${collapsed ? 'px-2 py-4' : 'px-3 py-4'} space-y-1`}>
        {navItems.map(({ label, icon: Icon, to }) => {
          const active = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${active
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
            >
              <Icon size={18} />
              {!collapsed && <>{label}{active && <ChevronRight size={14} className="ml-auto" />}</>}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
<<<<<<< Updated upstream
    <div className="flex h-screen bg-earth-100 overflow-hidden">
=======
    <div className={`flex h-screen overflow-hidden ${role === 'CITIZEN' ? 'bg-forest-900' : 'bg-earth-100'}`}>
>>>>>>> Stashed changes
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-forest-900 flex-shrink-0 transition-all duration-200 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <SidebarContent collapsed={sidebarCollapsed} />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-bark-800/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-forest-900 z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-bark-400/10 px-4 lg:px-6 h-16 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <button className="lg:hidden p-2 rounded-lg hover:bg-earth-100 text-bark-600" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <button
              className="hidden lg:inline-flex p-2 rounded-lg hover:bg-earth-100 text-bark-600"
              onClick={toggleSidebarCollapsed}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />

            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-earth-100 transition-colors"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <div className="w-8 h-8 rounded-full bg-forest-600 flex items-center justify-center text-white text-sm font-semibold">
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <span className="hidden sm:block text-sm font-medium text-bark-800 max-w-[120px] truncate">{user?.name}</span>
                <ChevronDown size={16} className="text-bark-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-bark-400/15 rounded-xl shadow-lg z-50 overflow-hidden">
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-bark-700 hover:bg-earth-100 transition-colors"
                  >
                    <User size={16} /> Profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-bark-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
