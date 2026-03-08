import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(true);

  // Verify token and load user on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('admin_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        // Set token in api headers
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        const response = await api.get('/auth/me');
        const userData = response.data;

        if (userData.role !== 'admin') {
          throw new Error('Not an admin account');
        }

        setUser(userData);
        setToken(storedToken);
      } catch (err) {
        // Token invalid or expired
        localStorage.removeItem('admin_token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { access_token, user: userData } = response.data;

    if (!userData || userData.role !== 'admin') {
      throw new Error('Access denied. Admin accounts only.');
    }

    localStorage.setItem('admin_token', access_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
