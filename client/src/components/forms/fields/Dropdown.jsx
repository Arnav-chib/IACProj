import React, { useEffect, useState } from 'react';

const Dropdown = ({ 
  id, 
  label, 
  options, 
  value, 
  onChange, 
  required = false, 
  error = null,
  multiple = false,
  placeholder = 'Select...'
}) => {
  // Ensure value is always an array for multiple select
  const [internalValue, setInternalValue] = useState(multiple ? (Array.isArray(value) ? value : []) : value);
  
  // Update internal value when prop changes
  useEffect(() => {
    if (multiple) {
      setInternalValue(Array.isArray(value) ? value : []);
    } else {
      setInternalValue(value);
    }
  }, [value, multiple]);

  const handleChange = (e) => {
    if (multiple) {
      // For multi-select, create an array of selected values
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setInternalValue(selectedOptions);
      onChange(selectedOptions);
    } else {
      setInternalValue(e.target.value);
      onChange(e.target.value);
    }
  };

  return (
    <div className="mb-4">
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={id}
        value={internalValue}
        onChange={handleChange}
        required={required}
        multiple={multiple}
        className={`block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
      >
        {!multiple && <option value="">{placeholder}</option>}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Dropdown;
