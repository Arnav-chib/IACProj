import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';
import { toast } from 'react-toastify';
import logger from '../utils/logger';

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
      console.log('Validating auth token...');
      const response = await apiService.getCurrentUser();
      console.log('Auth validation response:', response);
      
      if (!response || !response.user) {
        console.error('Invalid auth response - missing user data:', response);
        throw new Error('Invalid authentication response');
      }
      
      // Set the current user directly from the response without special cases
      const user = response.user;
      
      console.log('Setting current user:', user);
      setCurrentUser(user);
      setError(null);
    } catch (error) {
      console.error('Token validation error:', error);
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
      logger.logToConsole('Login attempt with:', credentials.email);
      
      // Clear any previous errors
      setError(null);
      
      const response = await apiService.login(credentials);
      const { token, user } = response;
      
      if (!token || !user) {
        setError('Invalid response from server - missing token or user data');
        return { 
          success: false, 
          error: 'Login failed - server returned incomplete data' 
        };
      }
      
      localStorage.setItem('token', token);
      setCurrentUser(user);
      
      logger.logToConsole('Login successful for:', user.email);
      
      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          error.message || 
                          'Unable to connect to server';
                          
      logger.logToConsole('Login error:', errorMessage);
      
      // Set a user-friendly error message
      setError(
        error.response?.status === 401 
          ? 'Login failed. Please check your credentials.' 
          : error.response?.status >= 500 
            ? 'Server error. Please try again later.'
            : `Login failed: ${errorMessage}`
      );
      
      return {
        success: false,
        error: errorMessage,
        status: error.response?.status
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