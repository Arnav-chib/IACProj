import React, { useState, useEffect, useCallback, memo } from 'react';
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
  const { id, name, needsApproval, type } = field;
  
  // If the field doesn't need approval, just render the children directly
  if (!needsApproval) {
    // Prevent unnecessary re-renders and prop changes
    return React.Children.only(children);
  }
  
  // Track the internal state of value and approval status
  const [fieldValue, setFieldValue] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  
  // When the value changes externally, update our internal state
  useEffect(() => {
    // Only update if the value has actually changed to prevent loops
    if (value !== localValue) {
      setLocalValue(value);
      
      if (value !== undefined) {
        // Log value for debugging
        if (type === 'richtext') {
          console.log(`Processing richtext field ${id}:`, value);
        }
        
        try {
          const { value: extractedValue, isApproved: extractedApproval } = parseFieldValue(value, field.type);
          setFieldValue(extractedValue);
          setIsApproved(extractedApproval);
          
          if (type === 'richtext') {
            console.log(`Extracted values for ${id}:`, { extractedValue, extractedApproval });
          }
        } catch (err) {
          console.error(`Error parsing field value for ${id}:`, err);
          // Fallback to raw value if parsing fails
          setFieldValue(value);
        }
      }
    }
  }, [value, field.type, id, type, localValue]);
  
  // When the internal field value changes, propagate it up with approval status
  const handleFieldChange = useCallback((newValue, event) => {
    console.log(`BaseFieldWrapper ${id} field change:`, { type: field.type, needsApproval });
    
    // Prevent default behavior for events
    if (event) {
      event.preventDefault?.();
      event.stopPropagation?.();
    }
    
    // Store current scroll position
    const scrollPosition = window.scrollY;
    
    // Update internal state
    setFieldValue(newValue);
    
    // Don't change approval status when editing content
    // Only apply the current approval status
    try {
      const processedValue = processFieldValue(newValue, field.type, needsApproval, isApproved);
      
      // Update our local tracking value
      setLocalValue(processedValue);
      
      // Use rAF to ensure the event is processed after the current execution
      requestAnimationFrame(() => {
        onChange(processedValue, event);
        
        // Restore scroll position
        window.scrollTo(0, scrollPosition);
      });
    } catch (err) {
      console.error(`Error processing field value for ${id}:`, err);
      // Fallback - pass the raw value
      onChange(newValue, event);
    }
    
    // Return false to stop event propagation
    return false;
  }, [id, field.type, needsApproval, isApproved, onChange]);
  
  // When approval status changes, update the value
  const handleApprovalChange = useCallback((e) => {
    // Prevent default actions
    e.preventDefault();
    e.stopPropagation();
    
    // Store current scroll position
    const scrollPosition = window.scrollY;
    
    const newApproved = e.target.checked;
    console.log(`Approval change for ${id}: ${isApproved} -> ${newApproved}`);
    setIsApproved(newApproved);
    
    if (type === 'richtext') {
      console.log(`Approval changed for ${id}:`, newApproved, fieldValue);
    }
    
    try {
      // Process the existing fieldValue with the new approval status
      const processedValue = processFieldValue(fieldValue, field.type, needsApproval, newApproved);
      
      // Update local tracking value
      setLocalValue(processedValue);
      
      // Use rAF to ensure the event is processed after the current execution
      requestAnimationFrame(() => {
        onChange(processedValue);
        
        // Restore scroll position
        window.scrollTo(0, scrollPosition);
      });
    } catch (err) {
      console.error(`Error processing approval change for ${id}:`, err);
    }
    
    return false;
  }, [id, fieldValue, isApproved, type, needsApproval, onChange]);
  
  // Clone the children with new props - ensure we pass the correct value
  const childrenWithProps = React.cloneElement(React.Children.only(children), {
    value: fieldValue,
    onChange: handleFieldChange,
    error,
    needsApproval,
    isApproved,
    isFormCreator
  });
  
  return (
    <div className="field-wrapper">
      {childrenWithProps}
      
      {needsApproval && isFormCreator && (
        <div className="mt-2 flex items-center bg-blue-50 p-2 rounded">
          <input
            type="checkbox"
            id={`${id}-approval`}
            checked={isApproved}
            onChange={handleApprovalChange}
            className="mr-2"
          />
          <label htmlFor={`${id}-approval`} className="text-sm text-gray-700">
            Approve Content for Viewing {isApproved ? '(Approved)' : '(Not Approved)'}
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

export default memo(BaseFieldWrapper); 