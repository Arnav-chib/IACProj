import React, { createContext, useContext, useState, ReactNode } from 'react';
import { responses } from '../api';

// Response interface
export interface FormResponse {
  id: string;
  formId: string;
  responseData: Record<string, any>;
  submittedAt: Date;
}

interface ResponseContextType {
  formResponses: FormResponse[];
  currentResponse: FormResponse | null;
  responseCount: number;
  isLoading: boolean;
  error: string | null;
  getFormResponses: (formId: string) => Promise<void>;
  getResponse: (responseId: string) => Promise<void>;
  getResponseCount: (formId: string) => Promise<void>;
  submitResponse: (formId: string, responseData: Record<string, any>) => Promise<string>;
  deleteResponse: (responseId: string) => Promise<void>;
  clearCurrentResponse: () => void;
}

const ResponseContext = createContext<ResponseContextType | null>(null);

export const useResponse = () => {
  const context = useContext(ResponseContext);
  if (!context) {
    throw new Error('useResponse must be used within a ResponseProvider');
  }
  return context;
};

interface ResponseProviderProps {
  children: ReactNode;
}

export const ResponseProvider: React.FC<ResponseProviderProps> = ({ children }) => {
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [currentResponse, setCurrentResponse] = useState<FormResponse | null>(null);
  const [responseCount, setResponseCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFormResponses = async (formId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await responses.getFormResponses(formId);
      setFormResponses(response.data.responses);
    } catch (err) {
      setError('Failed to load responses');
      console.error('Error loading responses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getResponse = async (responseId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await responses.getResponse(responseId);
      setCurrentResponse(response.data.response);
    } catch (err) {
      setError('Failed to load response');
      console.error('Error loading response:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getResponseCount = async (formId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await responses.getResponseCount(formId);
      setResponseCount(response.data.count);
    } catch (err) {
      setError('Failed to load response count');
      console.error('Error loading response count:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const submitResponse = async (formId: string, responseData: Record<string, any>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await responses.submitResponse(formId, responseData);
      return response.data.responseId;
    } catch (err) {
      setError('Failed to submit response');
      console.error('Error submitting response:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteResponse = async (responseId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await responses.deleteResponse(responseId);
      
      // Clear current response if it's the one being deleted
      if (currentResponse && currentResponse.id === responseId) {
        setCurrentResponse(null);
      }
      
      // Update responses list
      setFormResponses(formResponses.filter(response => response.id !== responseId));
    } catch (err) {
      setError('Failed to delete response');
      console.error('Error deleting response:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCurrentResponse = () => {
    setCurrentResponse(null);
  };

  const value = {
    formResponses,
    currentResponse,
    responseCount,
    isLoading,
    error,
    getFormResponses,
    getResponse,
    getResponseCount,
    submitResponse,
    deleteResponse,
    clearCurrentResponse
  };

  return <ResponseContext.Provider value={value}>{children}</ResponseContext.Provider>;
}; 