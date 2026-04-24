import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const loginUser = (authResponse) => {
    // authResponse = { token, userId, email, role, name }
    localStorage.setItem('token', authResponse.token);
    localStorage.setItem('user', JSON.stringify({
      userId: authResponse.userId,
      email: authResponse.email,
      role: authResponse.role,
      name: authResponse.name,
    }));
    setUser({
      userId: authResponse.userId,
      email: authResponse.email,
      role: authResponse.role,
      name: authResponse.name,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

