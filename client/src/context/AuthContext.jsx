import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── Load from localStorage on mount ───
  useEffect(() => {
    const savedToken = localStorage.getItem('ps9_token');
    const savedUser = localStorage.getItem('ps9_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('ps9_token');
        localStorage.removeItem('ps9_user');
      }
    }
    setLoading(false);
  }, []);

  // ─── Login ───
  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    const { token: newToken, user: newUser } = data.data;

    localStorage.setItem('ps9_token', newToken);
    localStorage.setItem('ps9_user', JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);

    return newUser;
  }, []);

  // ─── Register ───
  const register = useCallback(async (payload) => {
    const { data } = await authAPI.register(payload);
    const { token: newToken, user: newUser } = data.data;

    localStorage.setItem('ps9_token', newToken);
    localStorage.setItem('ps9_user', JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);

    return newUser;
  }, []);

  // ─── Logout ───
  const logout = useCallback(() => {
    localStorage.removeItem('ps9_token');
    localStorage.removeItem('ps9_user');
    setToken(null);
    setUser(null);
  }, []);

  // ─── Role helpers ───
  const hasRole = useCallback(
    (...roles) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ───
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};