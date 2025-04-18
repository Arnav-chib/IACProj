import api from './api';

// Get form by ID
export const getForm = async (formId) => {
  const response = await api.get(`/forms/${formId}`);
  return response.data;
};

// List forms for current user
export const listForms = async () => {
  const response = await api.get('/forms');
  return response.data.forms;
};

// Submit form response
export const submitResponse = async (formId, responseData) => {
  const response = await api.post(`/forms/${formId}/responses`, responseData);
  return response.data;
};

// Get form responses
export const getFormResponses = async (formId) => {
  const response = await api.get(`/forms/${formId}/responses`);
  return response.data.responses;
};

// Get form analytics
export const getFormAnalytics = async (formId) => {
  const response = await api.get(`/forms/${formId}/analytics`);
  return response.data;
};
