import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('ecotrack_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setToken(parsed.token);
        setUser({ userId: parsed.userId, email: parsed.email, role: parsed.role, name: parsed.name, phone: parsed.phone });
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = useCallback((data) => {
    const { token, userId, email, role, name, phone } = data;
    setToken(token);
    setUser({ userId, email, role, name, phone });
    localStorage.setItem('ecotrack_auth', JSON.stringify({ token, userId, email, role, name, phone }));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ecotrack_auth');
  }, []);

  const isAuthenticated = !!token;
  const role = user?.role || null;

  return (
    <AuthContext.Provider value={{ user, setUser, token, role, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

