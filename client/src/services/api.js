import axios from 'axios';
import { toast } from 'react-toastify';
import { handleApiError } from '../utils/errorHandler';

// Configure default axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000, // Increase timeout for slower connections
  headers: {
    'Content-Type': 'application/json',
  }
});

// Get the public API URL for when we need to make absolute URLs (for sharing)
const publicApiUrl = process.env.REACT_APP_PUBLIC_API_URL || 
                     (window.location.origin + '/api');

// Add debugging to see what URL is being used
console.log('API Base URL:', api.defaults.baseURL);
console.log('Public API URL:', publicApiUrl);

// Export the public API URL for use in components
export const getPublicApiUrl = () => publicApiUrl;

// Request interceptor to add auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Adding auth token to request:', token.substring(0, 15) + '...');
    }
    console.log(`Making ${config.method.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    return config;
  },
  error => {
    console.error('API request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API response error:', error);
    // Handle auth errors
    if (error.response && error.response.status === 401) {
      console.log('Auth error detected, clearing token');
      localStorage.removeItem('token');
      // Avoid redirect loops
      if (!window.location.pathname.includes('/login')) {
        toast.error('Session expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
    }
    return Promise.reject(error);
  }
);

// API service methods with error handling
const apiService = {
  // Auth endpoints
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      // Don't show toast for auth check failures
      if (error.response?.status !== 401) {
        handleApiError(error);
      }
      throw error;
    }
  },

  // Forms endpoints
  getForms: async (params) => {
    try {
      const response = await api.get('/forms', { params });
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  getForm: async (formId) => {
    try {
      const response = await api.get(`/forms/${formId}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  createForm: async (formData) => {
    try {
      const response = await api.post('/forms', formData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  updateForm: async (formId, formData) => {
    try {
      const response = await api.put(`/forms/${formId}`, formData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  deleteForm: async (formId) => {
    try {
      const response = await api.delete(`/forms/${formId}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  // Responses endpoints
  getResponses: async (formId, params) => {
    try {
      const response = await api.get(`/forms/${formId}/responses`, { params });
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  submitResponse: async (formId, responseData) => {
    try {
      const response = await api.post(`/forms/${formId}/responses`, responseData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  // API tokens endpoints
  getApiTokens: async () => {
    try {
      const response = await api.get('/tokens');
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  createApiToken: async (tokenData) => {
    try {
      const response = await api.post('/tokens', tokenData);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  deleteApiToken: async (tokenId) => {
    try {
      const response = await api.delete(`/tokens/${tokenId}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  }
};

export default apiService;
export { api };
