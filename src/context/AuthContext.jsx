import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { resetDemoData } from '../services/demoData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('pharmadesk_user');
    const storedToken = localStorage.getItem('pharmadesk_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    window.__GENPHARMA_DEMO_MODE__ = false;
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('pharmadesk_token', data.token);
    localStorage.setItem('pharmadesk_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const enterDemoMode = () => {
    localStorage.removeItem('pharmadesk_token');
    localStorage.removeItem('pharmadesk_user');
    resetDemoData();
    window.__GENPHARMA_DEMO_MODE__ = true;
    setIsDemoMode(true);
    setUser({ username: 'Demo User', role: 'Demo Pharmacist' });
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    const userData = data?.data || data?.user || null;
    if (userData) {
      const loginResponse = await login({ username: payload.username, password: payload.password });
      localStorage.setItem('pharmadesk_user', JSON.stringify(userData));
      setUser(userData);
      return { ...data, token: loginResponse.token, user: userData };
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('pharmadesk_token');
    localStorage.removeItem('pharmadesk_user');
    resetDemoData();
    window.__GENPHARMA_DEMO_MODE__ = false;
    setIsDemoMode(false);
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, isDemoMode, login, enterDemoMode, register, logout }), [user, loading, isDemoMode]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
