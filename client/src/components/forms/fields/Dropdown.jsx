import React, { useEffect, useState, useRef, useCallback } from 'react';

const Dropdown = ({ 
  id, 
  label, 
  options, 
  value, 
  onChange, 
  required = false, 
  error = null,
  multiple = false,
  placeholder = 'Select...',
  disabled = false
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

  // Memoized change handler to prevent unnecessary re-renders
  const handleChange = useCallback((e) => {
    console.log(`Dropdown ${id} change event`);
    
    // Prevent default behavior immediately
    e.preventDefault();
    e.stopPropagation();
    
    // Save scroll position
    const scrollPosition = window.scrollY;
    
    if (multiple) {
      // For multi-select, create an array of selected values
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setInternalValue(selectedOptions);
      
      // Use setTimeout to ensure the event is processed after the current execution
      setTimeout(() => {
        onChange(selectedOptions, e);
      }, 0);
    } else {
      const newValue = e.target.value;
      setInternalValue(newValue);
      
      // Use setTimeout to ensure the event is processed after the current execution
      setTimeout(() => {
        onChange(newValue, e);
      }, 0);
    }
    
    // For multiple select, maintain focus on the select element
    if (multiple && selectRef.current) {
      selectRef.current.focus();
    }
    
    // Restore scroll position after a slight delay
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPosition);
    });
    
    return false; // Ensure event doesn't bubble up
  }, [id, multiple, onChange]);

  // Prevent event propagation on mouse events
  const handleMouseDown = useCallback((e) => {
    e.stopPropagation();
  }, []);
  
  // Handle keyboard events - prevent form submission
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, []);

  // Create a memoized click handler to stop propagation
  const handleClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

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
        name={id}
        value={internalValue}
        onChange={handleChange}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        required={required}
        multiple={multiple}
        disabled={disabled}
        className={`block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${disabled ? 'bg-gray-100 text-gray-500' : ''} ${multiple ? 'min-h-[100px]' : ''}`}
      >
        {!multiple && <option value="">{placeholder}</option>}
        {options.map(option => (
          <option key={option.value || 'empty'} value={option.value}>
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

export default React.memo(Dropdown);
