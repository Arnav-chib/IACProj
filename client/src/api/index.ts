import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with baseURL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to inject auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication API
export const auth = {
  register: (data: { name: string; email: string; password: string; subscription?: string }) => 
    api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) => 
    api.post('/auth/login', data),
  
  getCurrentUser: () => 
    api.get('/auth/me')
};

// Forms API
export const forms = {
  getAllForms: () => 
    api.get('/forms'),
  
  getForm: (formId: string) => 
    api.get(`/forms/${formId}`),
  
  createForm: (form: any) => 
    api.post('/forms', form),
  
  updateForm: (formId: string, formData: any) => 
    api.put(`/forms/${formId}`, formData),
  
  deleteForm: (formId: string) => 
    api.delete(`/forms/${formId}`)
};

// Responses API
export const responses = {
  getFormResponses: (formId: string) => 
    api.get(`/responses/form/${formId}`),
  
  getResponse: (responseId: string) => 
    api.get(`/responses/${responseId}`),
  
  getResponseCount: (formId: string) => 
    api.get(`/responses/form/${formId}/count`),
  
  submitResponse: (formId: string, responseData: any) => 
    api.post(`/responses/submit/${formId}`, { responseData }),
  
  deleteResponse: (responseId: string) => 
    api.delete(`/responses/${responseId}`)
};

export default api; 