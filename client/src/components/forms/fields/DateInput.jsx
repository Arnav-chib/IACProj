import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

const DateInput = ({ id, label, value, onChange, required, error, validation, formValues }) => {
  const [dateValue, setDateValue] = useState(value || '');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    // Reset validation error when value changes from outside
    if (value !== dateValue) {
      setDateValue(value || '');
      setValidationError('');
    }
  }, [value, dateValue]);

  const validateAgainstDependentField = useCallback((date) => {
    if (!date || !validation || !validation.dependsOn || !formValues) return true;

    const dependentFieldId = validation.dependsOn;
    const dependentValue = formValues[dependentFieldId];
    
    if (!dependentValue) return true;

    if (validation.minDate === 'fieldValue') {
      // Compare with dependent field value
      const compareDate = new Date(dependentValue);
      const currentDate = new Date(date);
      
      if (currentDate < compareDate) {
        setValidationError(`This date must be after ${label} (${dependentValue})`);
        return false;
      }
    }
    
    setValidationError('');
    return true;
  }, [validation, formValues, label]);

  useEffect(() => {
    // Apply validation logic if dependent fields change
    if (validation && validation.dependsOn && formValues) {
      validateAgainstDependentField(dateValue);
    }
  }, [formValues, validation, validateAgainstDependentField, dateValue]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setDateValue(newValue);
    
    // Validate against dependent field if needed
    if (validation && validation.dependsOn) {
      validateAgainstDependentField(newValue);
    }
    
    onChange(newValue);
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={id}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="date"
        id={id}
        value={dateValue}
        onChange={handleChange}
        className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
          error || validationError ? 'border-red-500' : ''
        }`}
        required={required}
      />
      {(error || validationError) && (
        <p className="text-red-500 text-xs italic mt-1">{error || validationError}</p>
      )}
    </div>
  );
};

DateInput.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  error: PropTypes.string,
  validation: PropTypes.shape({
    dependsOn: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    minDate: PropTypes.string,
    maxDate: PropTypes.string
  }),
  formValues: PropTypes.object
};

DateInput.defaultProps = {
  value: '',
  required: false,
  error: null,
  validation: null,
  formValues: null
};

export default DateInput; 