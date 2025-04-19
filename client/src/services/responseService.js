import { api } from './api';

/**
 * Process field value for submission or display
 * @param {any} value - The field value
 * @param {string} fieldType - The type of field
 * @param {boolean} needsApproval - Whether the field needs approval
 * @param {boolean} isApproved - Current approval status
 * @returns {any} - Processed value
 */
export const processFieldValue = (value, fieldType, needsApproval, isApproved = false) => {
  if (!needsApproval) {
    return value;
  }
  
  // For fields that need approval, wrap the value with approval status
  return JSON.stringify({
    value,
    isApproved
  });
};

/**
 * Parse a field value that might have approval status
 * @param {any} value - The value to parse
 * @param {string} fieldType - The type of field
 * @returns {Object} - Object with value and isApproved properties 
 */
export const parseFieldValue = (value, fieldType) => {
  try {
    // Try to parse as JSON first
    if (typeof value === 'string' && value.startsWith('{')) {
      const parsed = JSON.parse(value);
      
      // If it has approval status directly
      if (parsed.isApproved !== undefined) {
        // Special case for rich text
        if (fieldType === 'richtext' && parsed.content) {
          return {
            value: parsed,
            isApproved: parsed.isApproved || false
          };
        }
        
        return {
          value: parsed.value !== undefined ? parsed.value : parsed,
          isApproved: parsed.isApproved
        };
      }
      
      // Special case for rich text which has a different structure
      if (fieldType === 'richtext' && parsed.content) {
        return {
          value: parsed,
          isApproved: parsed.isApproved || false
        };
      }
    }
    
    // Default case - not an approval-wrapped value
    return {
      value,
      isApproved: false
    };
  } catch (e) {
    console.error('Error parsing field value:', e, value, fieldType);
    return {
      value,
      isApproved: false
    };
  }
};

/**
 * Format a field value for display
 * @param {any} value - The value to format
 * @param {Object} field - The field definition
 * @returns {string} - Formatted value for display
 */
export const formatFieldValue = (value, field) => {
  if (value === null || value === undefined) {
    return '-';
  }
  
  // Extract the actual value if it's wrapped with approval status
  const { value: extractedValue, isApproved } = parseFieldValue(value, field.type);
  
  // If field needs approval and is not approved, don't show content
  if (field.needsApproval && !isApproved) {
    return 'Content pending approval';
  }
  
  try {
    // Handle values based on field type
    switch (field.type) {
      case 'richtext':
        // For richtext, we just show a placeholder. The actual rendering is done by the component.
        return 'Rich text content';
        
      case 'dropdown':
      case 'checkbox':
        if (Array.isArray(extractedValue)) {
          return extractedValue.join(', ');
        }
        break;
        
      case 'file':
        return 'File uploaded';
    }
    
    // Default handling
    if (typeof extractedValue === 'object') {
      return JSON.stringify(extractedValue);
    }
    
    return String(extractedValue);
  } catch (e) {
    console.error('Error formatting field value:', e);
    return String(value);
  }
};

/**
 * Check if a field value is approved
 * @param {any} value - The value to check
 * @param {Object} field - The field definition
 * @returns {boolean} - Whether the field is approved
 */
export const isFieldApproved = (value, field) => {
  if (!field.needsApproval) {
    return true;
  }
  
  const { isApproved } = parseFieldValue(value, field.type);
  return isApproved;
};

/**
 * Update approval status for a field
 * @param {number} formId - Form ID
 * @param {number} responseId - Response ID
 * @param {number} fieldId - Field ID
 * @param {boolean} isApproved - New approval status
 * @returns {Promise} - Promise resolving to the API response
 */
export const updateFieldApproval = async (formId, responseId, fieldId, isApproved) => {
  try {
    const response = await api.put(
      `/forms/${formId}/responses/${responseId}/fields/${fieldId}/approval`,
      { isApproved }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating approval for field ${fieldId}:`, error);
    throw error;
  }
}; 