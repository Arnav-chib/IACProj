import React from 'react';
import PropTypes from 'prop-types';

const CheckboxInput = ({ id, label, value, onChange, required, error }) => {
  const handleChange = (e) => {
    onChange(e.target.checked);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center">
        <input
          type="checkbox"
          id={id}
          checked={value === true}
          onChange={handleChange}
          className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          required={required}
        />
        <label className="text-gray-700 text-sm font-bold" htmlFor={id}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
      {error && <p className="text-red-500 text-xs italic mt-1">{error}</p>}
    </div>
  );
};

CheckboxInput.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  error: PropTypes.string
};

CheckboxInput.defaultProps = {
  value: false,
  required: false,
  error: null
};

export default CheckboxInput; 