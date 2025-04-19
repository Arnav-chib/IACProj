import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    if (token) {
      validateToken();
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async () => {
    try {
      const response = await apiService.getCurrentUser();
      setCurrentUser(response.user);
      setError(null);
    } catch (error) {
      // Clear token if invalid
      localStorage.removeItem('token');
      setCurrentUser(null);
      setError('Session expired. Please log in again.');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await apiService.login(credentials);
      const { token, user } = response;
      localStorage.setItem('token', token);
      setCurrentUser(user);
      setError(null);
      return { success: true };
    } catch (error) {
      setError('Login failed. Please check your credentials.');
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      const { token, user } = response;
      localStorage.setItem('token', token);
      setCurrentUser(user);
      setError(null);
      return { success: true };
    } catch (error) {
      setError('Registration failed. Please check your information.');
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setError(null);
    toast.info('You have been logged out');
  };

  const forgotPassword = async (email) => {
    try {
      await apiService.forgotPassword(email);
      setError(null);
      return { success: true };
    } catch (error) {
      setError('Password reset request failed.');
      return {
        success: false,
        error: error.response?.data?.error || 'Password reset request failed'
      };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      await apiService.resetPassword(token, newPassword);
      setError(null);
      return { success: true };
    } catch (error) {
      setError('Password reset failed.');
      return {
        success: false,
        error: error.response?.data?.error || 'Password reset failed'
      };
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 