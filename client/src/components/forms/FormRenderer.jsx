import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getForm, submitResponse } from '../../services/formService';
import TextInput from './fields/TextInput';
import Dropdown from './fields/Dropdown';
import GroupField from './fields/GroupField';
import DateInput from './fields/DateInput';
import CheckboxInput from './fields/CheckboxInput';
import SliderInput from './fields/SliderInput';
import RichTextInput from './fields/RichTextInput';
import FileInput from './fields/FileInput';
import BaseFieldWrapper from './fields/BaseFieldWrapper';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';

const FormRenderer = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Memoized form data fetching
  const loadForm = useCallback(async () => {
    try {
      setLoading(true);
      setNetworkError(null);
      console.log(`FormRenderer: Loading form ${formId}`);
      const formData = await getForm(formId);
      console.log('FormRenderer: Form loaded successfully', formData);
      setForm(formData);
      
      // Initialize form values
      const initialValues = {};
      formData.fields.forEach(field => {
        // Initialize multiple select fields with empty arrays
        if (field.type === 'dropdown' && field.population && field.population.multiple) {
          initialValues[field.id] = [];
        } else if (field.type === 'richtext') {
          // Initialize rich text with empty content structure
          initialValues[field.id] = JSON.stringify({
            content: {
              blocks: [{ text: '', type: 'unstyled', depth: 0, inlineStyleRanges: [], entityRanges: [], data: {} }],
              entityMap: {}
            },
            isApproved: false
          });
        } else {
          initialValues[field.id] = '';
        }
      });
      setFormValues(initialValues);
    } catch (error) {
      console.error(`FormRenderer: Error loading form ${formId}:`, error);
      if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
        setNetworkError('Unable to connect to the server. Please check your internet connection.');
      } else if (error.response?.status === 404) {
        setNetworkError('Form not found. It may have been deleted or moved.');
      } else {
        setNetworkError(`Error loading form: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [formId]);
  
  useEffect(() => {
    loadForm();
  }, [loadForm]);
  
  // Controlled, debounced field change handler to prevent excessive re-renders
  const handleFieldChange = useCallback((fieldId, value, event) => {
    console.log(`Field change: ${fieldId}`, { value, event: event?.type });
    
    // Prevent default behavior to avoid form submission
    if (event) {
      event.preventDefault?.();
      event.stopPropagation?.();
    }
    
    // Save current scroll position
    const scrollPosition = window.scrollY;
    
    setFormValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear any errors for this field
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
    
    // Use requestAnimationFrame for smoother scrolling restoration
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPosition);
    });
  }, [errors]);
  
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!form || !form.fields) return false;
    
    form.fields.forEach(field => {
      // Check required fields
      if (field.required) {
        if (field.type === 'dropdown' && field.population?.multiple) {
          // For multi-select dropdowns, check if array has items
          const value = formValues[field.id];
          if (!value || (Array.isArray(value) && value.length === 0)) {
            newErrors[field.id] = `${field.name} is required`;
          }
        } else if (!formValues[field.id]) {
          newErrors[field.id] = `${field.name} is required`;
        }
      }
      
      // Apply custom validation if needed
      if (field.validation) {
        // For date field validations
        if (field.type === 'date' && field.validation.dependsOn) {
          const dependentField = field.validation.dependsOn;
          const dependentValue = formValues[dependentField];
          
          if (field.validation.minDate === 'fieldValue' && dependentValue && formValues[field.id]) {
            const currentDate = new Date(formValues[field.id]);
            const compareDate = new Date(dependentValue);
            
            if (currentDate < compareDate) {
              const dependentFieldName = form.fields.find(f => f.id === dependentField)?.name || 'another field';
              newErrors[field.id] = `${field.name} must be after ${dependentFieldName}`;
            }
          }
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, formValues]);
  
  const preprocessFormData = useCallback(() => {
    const processedValues = { ...formValues };
    
    if (!form || !form.fields) return processedValues;
    
    // Process file uploads if any
    const fileFieldIds = form.fields
      .filter(field => field.type === 'file')
      .map(field => field.id);
    
    fileFieldIds.forEach(fieldId => {
      const fileData = formValues[fieldId];
      if (fileData && fileData.file) {
        console.log(`File to upload: ${fileData.name}`);
        // Replace file object with just metadata for now
        processedValues[fieldId] = {
          name: fileData.name,
          type: fileData.type,
          size: fileData.size,
          // In a real implementation, this would be the uploaded file URL
          url: URL.createObjectURL(fileData.file)
        };
      }
    });
    
    return processedValues;
  }, [form, formValues]);
  
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setNetworkError(null);
      
      // Preprocess form data (e.g., handle file uploads)
      const processedValues = preprocessFormData();
      
      await submitResponse(formId, {
        respondentInfo: {},
        values: processedValues
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      
      if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
        setNetworkError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setNetworkError(`Failed to submit form: ${error.message || 'Unknown error'}`);
      }
      
      setErrors(prev => ({
        ...prev,
        form: 'Failed to submit form. Please try again.'
      }));
    } finally {
      setSubmitting(false);
    }
  }, [formId, validateForm, preprocessFormData]);
  
  // Memoized field renderer to prevent unnecessary re-renders
  const RenderField = useCallback(({ field, values, setValues, errors, disabled }) => {
    const fieldId = field.id;
    const isFormCreator = false; // Regular form submitter, not the creator
    
    const handleChange = (value, event) => {
      // Pass both the value and the event up to the parent component
      handleFieldChange(fieldId, value, event);
    };
    
    // Render the field component based on type
    let fieldComponent;
    switch (field.type) {
      case 'text':
        fieldComponent = (
          <TextInput 
            id={fieldId}
            label={field.name}
            value={values[fieldId] || ''}
            onChange={handleChange}
            required={field.required}
            error={errors[fieldId]}
            disabled={disabled}
          />
        );
        break;
      
      case 'date':
        fieldComponent = (
          <DateInput
            id={fieldId}
            label={field.name}
            value={values[fieldId] || ''}
            onChange={handleChange}
            required={field.required}
            error={errors[fieldId]}
            validation={field.validation}
          />
        );
        break;
      
      case 'checkbox':
        fieldComponent = (
          <CheckboxInput
            id={fieldId}
            label={field.name}
            value={values[fieldId] || ''}
            onChange={handleChange}
            required={field.required}
            error={errors[fieldId]}
          />
        );
        break;
      
      case 'dropdown':
        let options = [];
        let isMultiple = false;
        
        if (field.population) {
          if (field.population.options) {
            if (Array.isArray(field.population.options)) {
              options = field.population.options.map(option => ({
                value: option.value || option,
                label: option.label || option
              }));
            } else if (field.population.dependsOn && field.population.options) {
              // Handle dynamic options based on another field
              const dependentFieldId = field.population.dependsOn;
              const dependentValue = values[dependentFieldId];
              
              if (dependentValue && field.population.options[dependentValue]) {
                options = field.population.options[dependentValue].map(option => ({
                  value: option.value || option,
                  label: option.label || option
                }));
              }
            }
          }
          
          isMultiple = field.population.multiple === true;
        }
        
        fieldComponent = (
          <Dropdown
            id={fieldId}
            label={field.name}
            value={values[fieldId] || (isMultiple ? [] : '')}
            onChange={handleChange}
            required={field.required}
            error={errors[fieldId]}
            options={options}
            multiple={isMultiple}
          />
        );
        break;
      
      case 'slider':
        fieldComponent = (
          <SliderInput
            id={fieldId}
            label={field.name}
            value={values[fieldId] || ''}
            onChange={handleChange}
            required={field.required}
            error={errors[fieldId]}
            config={field.population}
          />
        );
        break;
      
      case 'richtext':
        fieldComponent = (
          <RichTextInput
            id={fieldId}
            label={field.name}
            value={values[fieldId] || ''}
            onChange={handleChange}
            required={field.required}
            error={errors[fieldId]}
            needsApproval={field.needsApproval}
            isFormCreator={isFormCreator}
            disabled={disabled}
          />
        );
        break;
      
      case 'file':
        fieldComponent = (
          <FileInput
            id={fieldId}
            label={field.name}
            value={values[fieldId] || ''}
            onChange={handleChange}
            required={field.required}
            error={errors[fieldId]}
          />
        );
        break;
      
      case 'group':
        // Find group definition
        const group = form.groups.find(g => g.id === field.groupId);
        if (!group) return null;
        
        fieldComponent = (
          <GroupField
            id={fieldId}
            label={field.name}
            value={values[fieldId] || ''}
            onChange={handleChange}
            required={field.required}
            error={errors[fieldId]}
            columns={group.columns}
            columnConfig={JSON.parse(group.columnConfig)}
            rows={group.rows}
            canAddRows={group.canAddRows}
          />
        );
        break;
      
      default:
        fieldComponent = (
          <TextInput 
            id={fieldId}
            label={field.name}
            value={values[fieldId] || ''}
            onChange={handleChange}
            required={field.required}
            error={errors[fieldId]}
            disabled={disabled}
          />
        );
    }
    
    // Wrap with the BaseFieldWrapper for approval handling
    return (
      <BaseFieldWrapper
        field={field}
        value={values[fieldId]}
        onChange={handleChange}
        error={errors[fieldId]}
        isFormCreator={isFormCreator}
      >
        {fieldComponent}
      </BaseFieldWrapper>
    );
  }, [form, handleFieldChange]);
  
  if (loading) {
    return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
  }
  
  if (networkError) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white shadow-md rounded-lg">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{networkError}</p>
        </div>
        <button 
          onClick={() => loadForm()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (!form) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-600">Form not found</h2>
        <p className="mt-2">This form may have been removed or is no longer available.</p>
      </div>
    );
  }
  
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white shadow-md rounded-lg">
        <div className="text-center">
          <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <h2 className="text-2xl font-bold mt-4">Thank you for your submission!</h2>
          <p className="mt-2 text-gray-600">Your response has been recorded successfully.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Submit another response
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto p-8 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-6">{form.name}</h1>
      
      {errors.form && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{errors.form}</span>
        </div>
      )}
      
      <form 
        onSubmit={handleSubmit} 
        onKeyDown={(e) => {
          // Prevent form submission on Enter key
          if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
          }
        }}
        noValidate
      >
        {form.fields
          .filter(field => !field.groupId)
          .sort((a, b) => a.position - b.position)
          .map(field => (
            <RenderField
              key={field.id}
              field={field}
              values={formValues}
              setValues={handleFieldChange}
              errors={errors}
              disabled={submitting}
            />
          ))}
        
        <div className="mt-6">
          <Button 
            type="submit" 
            disabled={submitting}
            className="w-full"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FormRenderer;
