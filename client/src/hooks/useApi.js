import { useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create axios instance with base URL
  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    withCredentials: true, // Important for cookies
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  api.interceptors.request.use(
    (config) => {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Add authorization header if token exists
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Get CSRF token from cookie and add to header
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf-token='))
        ?.split('=')[1];
        
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  api.interceptors.response.use(
    (response) => {
      return response.data;
    },
    (error) => {
      // Handle different error scenarios
      if (error.response) {
        const { status, data } = error.response;
        
        // Handle specific error codes
        switch (status) {
          case 401:
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem('token');
            window.location.href = '/login';
            toast.error('Your session has expired. Please log in again.');
            break;
          case 403:
            // Forbidden - CSRF token issue or permission denied
            if (data.message === 'Invalid CSRF token') {
              toast.error('Security validation failed. Please refresh the page and try again.');
            } else {
              toast.error('You do not have permission to perform this action.');
            }
            break;
          case 404:
            toast.error('The requested resource was not found.');
            break;
          case 429:
            toast.error('Too many requests. Please try again later.');
            break;
          case 500:
            toast.error('An unexpected error occurred. Please try again later.');
            break;
          default:
            toast.error(data.message || 'An error occurred.');
        }
      } else if (error.request) {
        // Network error
        toast.error('Network error. Please check your connection and try again.');
      } else {
        // Other errors
        toast.error('An unexpected error occurred.');
      }
      
      return Promise.reject(error);
    }
  );

  // API methods
  const get = useCallback(async (url, params) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(url, { params });
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const post = useCallback(async (url, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(url, data);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const put = useCallback(async (url, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(url, data);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const del = useCallback(async (url) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.delete(url);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  return {
    loading,
    error,
    get,
    post,
    put,
    delete: del,
  };
};

export default useApi; 