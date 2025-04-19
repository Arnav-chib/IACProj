import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      // Clear token if it's expired
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/forgot-password') {
        localStorage.removeItem('token');
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
