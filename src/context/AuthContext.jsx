import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
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
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('pharmadesk_token', data.token);
    localStorage.setItem('pharmadesk_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
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
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
