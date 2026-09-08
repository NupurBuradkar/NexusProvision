import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api } from '../api/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('seqa_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [developerId, setDeveloperId] = useState<number | null>(() => {
    const saved = localStorage.getItem('seqa_dev_id');
    return saved ? Number(saved) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('seqa_token');
    if (!token) {
      setUser(null);
      setDeveloperId(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await api.auth.getMe();
      setUser(profile);
      localStorage.setItem('seqa_user', JSON.stringify(profile));
      const savedDevId = localStorage.getItem('seqa_dev_id');
      if (savedDevId) setDeveloperId(Number(savedDevId));
    } catch {
      localStorage.removeItem('seqa_token');
      localStorage.removeItem('seqa_user');
      localStorage.removeItem('seqa_dev_id');
      setUser(null);
      setDeveloperId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handleExpired = () => {
      setUser(null);
      setDeveloperId(null);
    };
    const handleLogout = () => {
      setUser(null);
      setDeveloperId(null);
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
      if (res.developer_id) {
        setDeveloperId(res.developer_id);
      }
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const employeeLogin = async (data: { email: string; full_name?: string; designation: string; team?: string }) => {
    setLoading(true);
    try {
      const res = await api.auth.employeeLogin(data);
      setUser(res.user);
      if (res.developer_id) {
        setDeveloperId(res.developer_id);
      }
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
    setDeveloperId(null);
  };

  const hasRole = (roles: string[]) => {
    return user ? roles.includes(user.role) : false;
  };

  return {
    user,
    developerId,
    loading,
    isAuthenticated: !!user,
    isEmployee: user?.role === 'developer' || !!developerId,
    login,
    employeeLogin,
    logout,
    hasRole,
  };
}
