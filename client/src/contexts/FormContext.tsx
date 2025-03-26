import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import api from '../services/api';

// Field types
export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  EMAIL = 'email',
  DATE = 'date',
  TIME = 'time',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  SELECT = 'select',
  TEXTAREA = 'textarea',
  FILE = 'file',
  GROUP = 'group',
  CONDITIONAL = 'conditional'
}

// Option for select, radio, checkbox
export interface FieldOption {
  id: string;
  label: string;
  value: string;
}

// Condition for conditional fields
export interface FieldCondition {
  sourceFieldId: string;
  operator: string;
  value: string;
}

// FormField interface - defines the structure of a form field
export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  required: boolean;
  order: number;
  placeholder?: string;
  defaultValue?: any;
  min?: number;
  max?: number;
  minDate?: string;
  maxDate?: string;
  maxFileSize?: number;
  acceptedFileTypes?: string;
  options?: FieldOption[];
  condition?: FieldCondition;
  fields?: FormField[];
}

// Form interface - defines the structure of a form
export interface Form {
  id?: string;
  title: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  schema: {
    fields: FormField[];
  };
}

// Context interface
interface FormContextType {
  forms: Form[];
  currentForm: Form | null;
  isLoading: boolean;
  error: string | null;
  getForms: () => Promise<void>;
  getForm: (id: string) => Promise<void>;
  createForm: (form: Omit<Form, 'id'>) => Promise<string>;
  updateForm: (id: string, form: Partial<Form>) => Promise<void>;
  deleteForm: (id: string) => Promise<void>;
  clearCurrentForm: () => void;
}

// Create the context
const FormContext = createContext<FormContextType | undefined>(undefined);

// Provider component
export const FormProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [forms, setForms] = useState<Form[]>([]);
  const [currentForm, setCurrentForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load forms when authenticated
  useEffect(() => {
    getForms();
  }, []);

  // Get all forms
  const getForms = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/forms');
      setForms(response.data);
    } catch (err) {
      console.error('Error getting forms:', err);
      setError('Failed to load forms');
    } finally {
      setIsLoading(false);
    }
  };

  // Get a single form by ID
  const getForm = async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/forms/${id}`);
      setCurrentForm(response.data);
    } catch (err) {
      console.error(`Error getting form ${id}:`, err);
      setError('Failed to load form');
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new form
  const createForm = async (form: Omit<Form, 'id'>): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/forms', form);
      const newForm = response.data;
      setForms([...forms, newForm]);
      return newForm.id;
    } catch (err) {
      console.error('Error creating form:', err);
      setError('Failed to create form');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing form
  const updateForm = async (id: string, form: Partial<Form>): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.put(`/forms/${id}`, form);
      const updatedForm = response.data;
      
      // Update the forms array
      setForms(forms.map(f => (f.id === id ? updatedForm : f)));
      
      // If we're updating the current form, update it too
      if (currentForm && currentForm.id === id) {
        setCurrentForm(updatedForm);
      }
    } catch (err) {
      console.error(`Error updating form ${id}:`, err);
      setError('Failed to update form');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a form
  const deleteForm = async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await api.delete(`/forms/${id}`);
      setForms(forms.filter(form => form.id !== id));
      
      // If we're deleting the current form, clear it
      if (currentForm && currentForm.id === id) {
        setCurrentForm(null);
      }
    } catch (err) {
      console.error(`Error deleting form ${id}:`, err);
      setError('Failed to delete form');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear the current form
  const clearCurrentForm = (): void => {
    setCurrentForm(null);
  };

  // Context value
  const value = {
    forms,
    currentForm,
    isLoading,
    error,
    getForms,
    getForm,
    createForm,
    updateForm,
    deleteForm,
    clearCurrentForm
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};

// Custom hook to use the form context
export const useForm = (): FormContextType => {
  const context = useContext(FormContext);
  
  if (context === undefined) {
    throw new Error('useForm must be used within a FormProvider');
  }
  
  return context;
}; 