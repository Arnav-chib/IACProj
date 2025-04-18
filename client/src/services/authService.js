import api from './api';
import { jwtDecode } from 'jwt-decode';

// Register new user
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

// Login user
export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

// Logout user
export const logout = () => {
  localStorage.removeItem('token');
};

// Get current user info
export const getCurrentUser = async () => {
  return await api.get('/auth/me');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

// Request password reset
export const requestPasswordReset = async (email) => {
  return await api.post('/auth/forgot-password', { email });
};

// Reset password with token
export const resetPassword = async (token, newPassword) => {
  return await api.post('/auth/reset-password', { token, newPassword });
};
