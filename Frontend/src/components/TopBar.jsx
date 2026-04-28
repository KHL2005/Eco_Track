import { useAuth } from '../context/AuthContext';

export default function TopBar({ title, onMenuToggle }) {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="lg:hidden p-2 rounded-lg hover:bg-bg transition-colors cursor-pointer">
          <svg className="w-5 h-5 text-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <h1 className="text-lg font-bold text-text">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-block px-2.5 py-1 bg-accent/10 text-primary text-xs font-semibold rounded-full">
          {user?.role?.replace('_', ' ')}
        </span>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
          {user?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      </div>
    </header>
  );
}

