import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('studysprint_token'));
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('studysprint_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
          }
        } catch (error) {
          console.error('Failed to authenticate token:', error);
          localStorage.removeItem('studysprint_token');
          localStorage.removeItem('studysprint_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data;
        localStorage.setItem('studysprint_token', newToken);
        localStorage.setItem('studysprint_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        return { success: true, user: newUser };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Login failed';
      return { success: false, message: msg };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post('/auth/register', { name, email, password });
      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data;
        localStorage.setItem('studysprint_token', newToken);
        localStorage.setItem('studysprint_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        return { success: true, user: newUser };
      }
      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Registration failed';
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('studysprint_token');
    localStorage.removeItem('studysprint_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }));
    localStorage.setItem('studysprint_user', JSON.stringify({ ...user, ...updatedUser }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

