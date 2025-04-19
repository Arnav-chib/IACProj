import { api } from './api';

// Get form by ID
export const getForm = async (formId) => {
  console.log(`Fetching form ${formId}...`);
  const response = await api.get(`/forms/${formId}`);
  console.log('Form response:', response.data);
  return response.data.data;
};

// List forms for current user
export const getForms = async () => {
  console.log('Fetching forms...');
  const response = await api.get('/forms');
  console.log('Forms response:', response.data);
  return response.data.data || [];
};

// Submit form response
export const submitResponse = async (formId, responseData) => {
  const response = await api.post(`/forms/${formId}/responses`, responseData);
  return response.data;
};

// Get form responses
export const getFormResponses = async (formId) => {
  console.log(`Fetching responses for form ${formId}...`);
  const response = await api.get(`/forms/${formId}/responses`);
  console.log('Form responses:', response.data);
  return response.data.data || [];
};

// Get form analytics
export const getFormAnalytics = async (formId) => {
  const response = await api.get(`/forms/${formId}/analytics`);
  return response.data;
};

export const createForm = async (formData) => {
  console.log('Creating form:', formData);
  const response = await api.post('/forms', formData);
  console.log('Create form response:', response.data);
  return response.data.data;
};

export const updateForm = async (formId, formData) => {
  console.log(`Updating form ${formId}:`, formData);
  const response = await api.put(`/forms/${formId}`, formData);
  console.log('Update form response:', response.data);
  return response.data.data;
};

export const deleteForm = async (formId) => {
  console.log(`Deleting form ${formId}...`);
  const response = await api.delete(`/forms/${formId}`);
  console.log('Delete form response:', response.data);
  return response.data;
};

export default {
  getForms,
  getForm,
  createForm,
  updateForm,
  deleteForm,
  getFormResponses
};
