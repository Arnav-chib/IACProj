import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from './useApi';
import { toast } from 'react-toastify';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const api = useApi();

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const user = await api.get('/auth/me');
          setCurrentUser(user);
        } catch (error) {
          localStorage.removeItem('token');
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [api]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response;
      
      localStorage.setItem('token', token);
      setCurrentUser(user);
      
      toast.success('Successfully logged in');
      navigate('/dashboard');
      
      return user;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to login');
      throw error;
    }
  }, [api, navigate]);

  const register = useCallback(async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response;
      
      localStorage.setItem('token', token);
      setCurrentUser(user);
      
      toast.success('Successfully registered');
      navigate('/dashboard');
      
      return user;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register');
      throw error;
    }
  }, [api, navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    navigate('/login');
    toast.success('Successfully logged out');
  }, [navigate]);

  const updateProfile = useCallback(async (userData) => {
    try {
      const updatedUser = await api.put('/auth/profile', userData);
      setCurrentUser(updatedUser);
      toast.success('Profile updated successfully');
      return updatedUser;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
      throw error;
    }
  }, [api]);

  const changePassword = useCallback(async (passwordData) => {
    try {
      await api.put('/auth/change-password', passwordData);
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
      throw error;
    }
  }, [api]);

  const forgotPassword = useCallback(async (email) => {
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Password reset instructions sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process request');
      throw error;
    }
  }, [api]);

  const resetPassword = useCallback(async (token, password) => {
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password reset successfully');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
      throw error;
    }
  }, [api, navigate]);

  return {
    currentUser,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
  };
};

export default useAuth; 