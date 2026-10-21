import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

const persist = (data) => {
  localStorage.setItem('teammatch_token', data.token);
  localStorage.setItem('teammatch_user', JSON.stringify(data));
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('teammatch_user');
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('teammatch_token'));
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      persist(data);
      setUser(data);
      setToken(data.token);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true);
    try {
      const data = await authApi.register(payload);
      persist(data);
      setUser(data);
      setToken(data.token);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await authApi.me();
      setUser((prev) => {
        const merged = { ...prev, ...data };
        localStorage.setItem('teammatch_user', JSON.stringify(merged));
        return merged;
      });
      return data;
    } catch {
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('teammatch_token');
    localStorage.removeItem('teammatch_user');
    setUser(null);
    setToken(null);
  }, []);

  useEffect(() => {
    const handler = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('teammatch:unauthorized', handler);
    return () => window.removeEventListener('teammatch:unauthorized', handler);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, register, refresh, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
