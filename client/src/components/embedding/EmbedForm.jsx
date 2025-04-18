import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TextInput from '../forms/fields/TextInput';
import Dropdown from '../forms/fields/Dropdown';
import GroupField from '../forms/fields/GroupField';
import LoadingSpinner from '../common/LoadingSpinner';
import Button from '../common/Button';
import api from '../../services/api';

const EmbedForm = () => {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  useEffect(() => {
    const loadForm = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/embed/form/${id}`);
        const formData = response.data;
        setForm(formData);
        
        // Initialize form values
        const initialValues = {};
        formData.fields.forEach(field => {
          initialValues[field.id] = '';
        });
        setFormValues(initialValues);
      } catch (error) {
        console.error('Error loading form:', error);
        setErrors({ form: 'Failed to load form. Please try again later.' });
      } finally {
        setLoading(false);
      }
    };
    
    loadForm();
  }, [id]);
  
  const handleFieldChange = (fieldId, value) => {
    setFormValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear error for this field if any
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    form.fields.forEach(field => {
      if (field.required && !formValues[field.id]) {
        newErrors[field.id] = `${field.name} is required`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      await api.post(`/forms/${id}/responses`, {
        respondentInfo: {},
        values: formValues
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ form: 'Failed to submit form. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };
  
  const renderField = (field) => {
    const commonProps = {
      id: field.id,
      label: field.name,
      value: formValues[field.id] || '',
      onChange: (value) => handleFieldChange(field.id, value),
      required: field.required,
      error: errors[field.id]
    };
    
    switch (field.type) {
      case 'text':
        return <TextInput key={field.id} {...commonProps} />;
      case 'dropdown':
        return (
          <Dropdown
            key={field.id}
            {...commonProps}
            options={(field.population?.options || []).map(option => ({
              value: option.value || option,
              label: option.label || option
            }))}
            multiple={field.population?.multiple}
          />
        );
      case 'group':
        // Find group definition
        const group = form.groups.find(g => g.id === field.groupId);
        if (!group) return null;
        
        return (
          <GroupField
            key={field.id}
            {...commonProps}
            columns={group.columns}
            columnConfig={JSON.parse(group.columnConfig)}
            rows={group.rows}
            canAddRows={group.canAddRows}
          />
        );
      default:
        return <TextInput key={field.id} {...commonProps} />;
    }
  };
  
  if (loading) {
    return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
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
      
      <form onSubmit={handleSubmit}>
        {form.fields
          .filter(field => !field.groupId)
          .sort((a, b) => a.position - b.position)
          .map(renderField)}
        
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

export default EmbedForm; 