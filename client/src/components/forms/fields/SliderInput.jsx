import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const SliderInput = ({ id, label, value, onChange, required, error, config }) => {
  const [sliderValue, setSliderValue] = useState(
    value !== undefined && value !== '' ? Number(value) : config?.defaultValue || 0
  );
  
  const min = config?.min || 0;
  const max = config?.max || 10;
  const step = config?.step || 1;
  
  useEffect(() => {
    // Update local state if value changes from outside
    if (value !== undefined && value !== '' && Number(value) !== sliderValue) {
      setSliderValue(Number(value));
    }
  }, [value, sliderValue]);

  const handleChange = (e) => {
    const newValue = Number(e.target.value);
    setSliderValue(newValue);
    onChange(newValue.toString());
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={id}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="flex items-center">
        <input
          type="range"
          id={id}
          min={min}
          max={max}
          step={step}
          value={sliderValue}
          onChange={handleChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          required={required}
        />
        <span className="ml-3 text-gray-700 font-bold w-8 text-center">{sliderValue}</span>
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{min}</span>
        {max - min > 2 && <span>{Math.floor((max + min) / 2)}</span>}
        <span>{max}</span>
      </div>
      
      {error && <p className="text-red-500 text-xs italic mt-1">{error}</p>}
    </div>
  );
};

SliderInput.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  error: PropTypes.string,
  config: PropTypes.shape({
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    defaultValue: PropTypes.number
  })
};

SliderInput.defaultProps = {
  value: '',
  required: false,
  error: null,
  config: {
    min: 0,
    max: 10,
    step: 1,
    defaultValue: 0
  }
};

export default SliderInput; 