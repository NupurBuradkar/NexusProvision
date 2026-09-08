import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api } from '../api/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('seqa_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('seqa_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await api.auth.getMe();
      setUser(profile);
      localStorage.setItem('seqa_user', JSON.stringify(profile));
    } catch {
      localStorage.removeItem('seqa_token');
      localStorage.removeItem('seqa_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handleExpired = () => {
      setUser(null);
    };
    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener('seqa-auth-expired', handleExpired);
    window.addEventListener('seqa-auth-logout', handleLogout);

    return () => {
      window.removeEventListener('seqa-auth-expired', handleExpired);
      window.removeEventListener('seqa-auth-logout', handleLogout);
    };
  }, [checkAuth]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await api.auth.login(email, pass);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
  };

  const hasRole = (roles: string[]) => {
    return user ? roles.includes(user.role) : false;
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    hasRole,
  };
}
