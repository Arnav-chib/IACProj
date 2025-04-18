import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useApi } from './useApi';
import { toast } from 'react-toastify';

export const useFormData = (formId) => {
  const api = useApi();
  const queryClient = useQueryClient();

  // Fetch form data
  const {
    data: form,
    isLoading: isLoadingForm,
    error: formError,
  } = useQuery(
    ['form', formId],
    () => api.get(`/forms/${formId}`),
    {
      enabled: !!formId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
    }
  );

  // Fetch form responses
  const {
    data: responses,
    isLoading: isLoadingResponses,
    error: responsesError,
  } = useQuery(
    ['formResponses', formId],
    () => api.get(`/forms/${formId}/responses`),
    {
      enabled: !!formId,
      staleTime: 1 * 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Create form mutation
  const createForm = useMutation(
    (formData) => api.post('/forms', formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('forms');
        toast.success('Form created successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create form');
      },
    }
  );

  // Update form mutation
  const updateForm = useMutation(
    ({ formId, formData }) => api.put(`/forms/${formId}`, formData),
    {
      onSuccess: (_, { formId }) => {
        queryClient.invalidateQueries(['form', formId]);
        queryClient.invalidateQueries('forms');
        toast.success('Form updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update form');
      },
    }
  );

  // Delete form mutation
  const deleteForm = useMutation(
    (formId) => api.delete(`/forms/${formId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('forms');
        toast.success('Form deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete form');
      },
    }
  );

  // Submit form response mutation
  const submitResponse = useMutation(
    ({ formId, responseData }) => api.post(`/forms/${formId}/responses`, responseData),
    {
      onSuccess: (_, { formId }) => {
        queryClient.invalidateQueries(['formResponses', formId]);
        toast.success('Response submitted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit response');
      },
    }
  );

  // Delete form response mutation
  const deleteResponse = useMutation(
    ({ formId, responseId }) => api.delete(`/forms/${formId}/responses/${responseId}`),
    {
      onSuccess: (_, { formId }) => {
        queryClient.invalidateQueries(['formResponses', formId]);
        toast.success('Response deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete response');
      },
    }
  );

  return {
    form,
    responses,
    isLoadingForm,
    isLoadingResponses,
    formError,
    responsesError,
    createForm,
    updateForm,
    deleteForm,
    submitResponse,
    deleteResponse,
  };
};

export default useFormData; 