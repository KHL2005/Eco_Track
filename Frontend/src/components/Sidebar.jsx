import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ items, activeKey, onSelect, collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onToggle} />
      )}

      <aside className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out
        ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-64'}
        bg-primary-dark text-white`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L3 23l2-1c1.56-.89 3.26-1.53 5-2 2.08-.56 4.37-.87 6.6-.33 2.56.62 4.78 2.13 5.88 4.33"/>
              <path d="M7 16c1-2 2.5-3.5 4-4.5"/>
            </svg>
          </div>
          {!collapsed && <span className="text-lg font-bold tracking-tight">EcoTrack</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
          {items.map((item) => {
            const active = activeKey === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelect(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer
                  ${active
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 border-l-4 border-accent'
                    : 'text-white/70 hover:bg-white/10 hover:text-white border-l-4 border-transparent'
                  }`}
              >
                <span className="text-lg shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User card */}
        <div className="border-t border-white/10 p-4">
          {!collapsed && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-accent/30 flex items-center justify-center text-sm font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-white/50">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

