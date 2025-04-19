import React, { useCallback, memo } from 'react';

const TextInput = ({ 
  id, 
  label, 
  value, 
  onChange, 
  required = false, 
  error = null, 
  placeholder = '',
  type = 'text',
  disabled = false
}) => {
  // Handle input changes with careful event handling
  const handleChange = useCallback((e) => {
    // Prevent default just in case, but allow the input to work normally
    e.stopPropagation();
    
    // Pass only the value up to parent
    onChange(e.target.value, e);
  }, [onChange]);

  // Handle key presses to prevent form submission on Enter
  const handleKeyDown = useCallback((e) => {
    // For single-line text inputs, prevent form submission on Enter
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [type]);

  return (
    <div className="mb-4">
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value || ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className={`block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${disabled ? 'bg-gray-100 text-gray-500' : ''}`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default memo(TextInput);
