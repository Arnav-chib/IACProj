import { api } from './api';

// Get form by ID
export const getForm = async (formId) => {
  console.log(`Fetching form ${formId}...`);
  try {
    const response = await api.get(`/forms/${formId}`);
    console.log('Form response:', response.data);
    
    // Handle different response formats
    const formData = response.data.data || response.data;
    
    // Make sure we have a form with fields
    if (!formData || !formData.fields) {
      console.error('Invalid form data structure:', formData);
      throw new Error('Form not found or invalid form structure');
    }
    
    return formData;
  } catch (error) {
    console.error(`Error fetching form ${formId}:`, error);
    throw error;
  }
};

// List forms for current user
export const getForms = async () => {
  console.log('Fetching forms...');
  const response = await api.get('/forms');
  console.log('Forms response:', response.data);
  return response.data.forms || [];
};

// Submit form response
export const submitResponse = async (formId, responseData) => {
  const response = await api.post(`/forms/${formId}/responses`, responseData);
  return response.data;
};

// Get form responses
export const getFormResponses = async (formId) => {
  console.log(`Fetching responses for form ${formId}...`);
  try {
    const response = await api.get(`/forms/${formId}/responses`);
    console.log('Form responses:', response.data);
    return response.data.responses || response.data.data || [];
  } catch (error) {
    console.error(`Error fetching responses for form ${formId}:`, error);
    throw error;
  }
};

// Get form analytics
export const getFormAnalytics = async (formId) => {
  try {
    const response = await api.get(`/forms/${formId}/analytics`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching analytics for form ${formId}:`, error);
    throw error;
  }
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
  getFormResponses,
  submitResponse,
  getFormAnalytics
};
