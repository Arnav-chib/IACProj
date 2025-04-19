import { api } from './api';

/**
 * Get form by ID
 * This function handles fetching a form from the server
 */
export const getForm = async (formId) => {
  console.log(`Fetching form ${formId}...`);
  try {
    // Make the API request - we add a cache-busting parameter to avoid caching issues
    const response = await api.get(`/forms/${formId}?t=${Date.now()}`);
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
    
    // Enhance error message with more details
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error details:', {
        baseURL: api.defaults.baseURL,
        formId
      });
    }
    
    throw error;
  }
};

// List forms for current user
export const getForms = async () => {
  console.log('Fetching forms...');
  try {
    const response = await api.get('/forms');
    console.log('Forms response:', response.data);
    // Handle both response formats: { forms: [] } or { data: [] }
    return response.data.forms || response.data.data || [];
  } catch (error) {
    console.error('Error fetching forms:', error);
    // Provide more details for debugging
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
    throw error;
  }
};

/**
 * Submit form response
 * This function handles submitting a form response to the server
 */
export const submitResponse = async (formId, responseData) => {
  console.log(`Submitting response for form ${formId}...`);
  try {
    const response = await api.post(`/forms/${formId}/responses`, responseData);
    console.log('Submit response result:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error submitting form ${formId}:`, error);
    
    // Provide more detailed error information
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error details for submission:', {
        baseURL: api.defaults.baseURL,
        formId,
        dataSize: JSON.stringify(responseData).length
      });
    }
    
    throw error;
  }
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

// Delete a specific form response
export const deleteFormResponse = async (formId, responseId) => {
  console.log(`Deleting response ${responseId} from form ${formId}...`);
  try {
    const response = await api.delete(`/forms/${formId}/responses/${responseId}`);
    console.log('Delete response result:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error deleting response ${responseId} from form ${formId}:`, error);
    throw error;
  }
};

// Update response field approval status
export const updateResponseApproval = async (formId, responseId, fieldId, isApproved) => {
  console.log(`Updating approval status for field ${fieldId} in response ${responseId}...`);
  try {
    const response = await api.put(`/forms/${formId}/responses/${responseId}/fields/${fieldId}/approval`, { isApproved });
    console.log('Update approval result:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating approval status for field ${fieldId}:`, error);
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
