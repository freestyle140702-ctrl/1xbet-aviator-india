import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, PublicConfig } from '../types/index.ts';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  config: PublicConfig | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshConfig: () => Promise<void>;
  isAdmin: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(curr => (curr?.message === message ? null : curr));
    }, 4500);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const refreshConfig = useCallback(async () => {
    try {
      const data = await api.getPublicConfig();
      setConfig(data);
    } catch (err) {
      console.warn('Could not load site public config:', err);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const { user: fetchedUser } = await api.auth.getMe();
      setUser(fetchedUser);
    } catch (err) {
      console.warn('Session verification failed, logging out:', err);
      clearStoredToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([refreshConfig(), refreshUser()]);
      setLoading(false);
    }
    init();
  }, [refreshConfig, refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    setStoredToken(res.token);
    setUser(res.user);
    showToast(`Welcome back, ${res.user.name}!`, 'success');
  };

  const register = async (payload: { email: string; password: string; name: string; phone?: string }) => {
    const res = await api.auth.register(payload);
    setStoredToken(res.token);
    setUser(res.user);
    showToast(`Welcome to Aviator Aero, ${res.user.name}!`, 'success');
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore network errors on logout
    }
    clearStoredToken();
    setUser(null);
    showToast('You have been logged out.', 'info');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        config,
        login,
        register,
        logout,
        refreshUser,
        refreshConfig,
        isAdmin,
        toast,
        showToast,
        hideToast,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
