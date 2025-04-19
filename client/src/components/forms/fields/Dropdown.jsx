import React, { useEffect, useState, useRef } from 'react';

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
  const selectRef = useRef(null);
  
  // Ensure value is always an array for multiple select
  const [internalValue, setInternalValue] = useState(
    multiple ? (Array.isArray(value) ? value : value ? [value] : []) : value
  );
  
  // Update internal value when prop changes
  useEffect(() => {
    if (multiple) {
      setInternalValue(Array.isArray(value) ? value : value ? [value] : []);
    } else {
      setInternalValue(value);
    }
  }, [value, multiple]);

  const handleChange = (e) => {
    // Prevent default browser behavior
    e.preventDefault();
    
    // Store current scroll position
    const scrollPosition = window.scrollY;
    
    if (multiple) {
      // For multi-select, create an array of selected values
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setInternalValue(selectedOptions);
      onChange(selectedOptions, e);
    } else {
      setInternalValue(e.target.value);
      onChange(e.target.value, e);
    }
    
    // For multiple select, maintain focus on the select element
    if (multiple && selectRef.current) {
      selectRef.current.focus();
    }
    
    // Restore scroll position
    setTimeout(() => {
      window.scrollTo(0, scrollPosition);
    }, 0);
  };

  // Prevent mousedown default behavior which can cause perceived refresh
  const handleMouseDown = (e) => {
    e.stopPropagation();
    // Don't prevent default here as it would prevent the dropdown from opening
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
        ref={selectRef}
        id={id}
        value={internalValue}
        onChange={handleChange}
        onMouseDown={handleMouseDown}
        required={required}
        multiple={multiple}
        className={`block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${multiple ? 'min-h-[100px]' : ''}`}
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
      {multiple && internalValue && internalValue.length > 0 && (
        <div className="mt-2">
          <p className="text-sm text-gray-600">Selected: {
            internalValue.map(val => {
              const option = options.find(opt => opt.value === val);
              return option ? option.label : val;
            }).join(', ')
          }</p>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
