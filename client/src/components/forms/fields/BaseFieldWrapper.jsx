import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { parseFieldValue, processFieldValue } from '../../../services/responseService';

/**
 * A wrapper component for form fields that need approval
 * 
 * This component handles:
 * 1. Parsing field values with approval status
 * 2. Processing field values for submission with approval status
 * 3. Rendering approval checkboxes for fields that need approval
 */
const BaseFieldWrapper = ({
  field,
  value,
  onChange,
  error,
  isFormCreator,
  children,
}) => {
  const { id, name, needsApproval } = field;
  
  // If the field doesn't need approval, just render the children
  if (!needsApproval) {
    return children;
  }
  
  // Parse the value to extract the actual value and approval status
  const [fieldValue, setFieldValue] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  
  // When the value changes externally, update our internal state
  useEffect(() => {
    if (value !== undefined) {
      const { value: extractedValue, isApproved: extractedApproval } = parseFieldValue(value, field.type);
      setFieldValue(extractedValue);
      setIsApproved(extractedApproval);
    }
  }, [value, field.type]);
  
  // When the internal field value changes, propagate it up with approval status
  const handleFieldChange = (newValue) => {
    setFieldValue(newValue);
    const processedValue = processFieldValue(newValue, field.type, needsApproval, isApproved);
    onChange(processedValue);
  };
  
  // When approval status changes, update the value
  const handleApprovalChange = (e) => {
    const newApproved = e.target.checked;
    setIsApproved(newApproved);
    
    const processedValue = processFieldValue(fieldValue, field.type, needsApproval, newApproved);
    onChange(processedValue);
  };
  
  // Clone the children with new props
  const childrenWithProps = React.cloneElement(children, {
    value: fieldValue,
    onChange: handleFieldChange,
    error,
  });
  
  return (
    <div className="field-wrapper">
      {childrenWithProps}
      
      {needsApproval && isFormCreator && (
        <div className="mt-2 flex items-center">
          <input
            type="checkbox"
            id={`${id}-approval`}
            checked={isApproved}
            onChange={handleApprovalChange}
            className="mr-2"
          />
          <label htmlFor={`${id}-approval`} className="text-sm text-gray-700">
            Approve
          </label>
        </div>
      )}
    </div>
  );
};

BaseFieldWrapper.propTypes = {
  field: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    needsApproval: PropTypes.bool,
  }).isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  isFormCreator: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

BaseFieldWrapper.defaultProps = {
  error: null,
  isFormCreator: false,
};

export default BaseFieldWrapper; 