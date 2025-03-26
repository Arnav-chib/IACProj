import { v4 as uuidv4 } from 'uuid';
import { FormField, FieldType } from '../contexts/FormContext';

/**
 * Generate a unique ID for form fields
 */
export const generateFieldId = (): string => {
  return uuidv4();
};

/**
 * Create a new field with default values based on the field type
 */
export const createNewField = (type: FieldType, order: number): FormField => {
  const baseField: FormField = {
    id: uuidv4(),
    type,
    label: getDefaultLabel(type),
    required: false,
    order
  };

  // Add type-specific properties
  switch (type) {
    case FieldType.TEXT:
    case FieldType.EMAIL:
    case FieldType.TEXTAREA:
      return {
        ...baseField,
        placeholder: '',
      };

    case FieldType.NUMBER:
      return {
        ...baseField,
        placeholder: '',
        min: undefined,
        max: undefined,
      };

    case FieldType.SELECT:
    case FieldType.RADIO:
    case FieldType.CHECKBOX:
      return {
        ...baseField,
        options: [
          { id: uuidv4(), label: 'Option 1', value: 'option1' },
          { id: uuidv4(), label: 'Option 2', value: 'option2' }
        ],
      };

    case FieldType.DATE:
    case FieldType.TIME:
      return {
        ...baseField,
        minDate: undefined,
        maxDate: undefined,
      };

    case FieldType.FILE:
      return {
        ...baseField,
        acceptedFileTypes: '',
        maxFileSize: undefined,
      };

    case FieldType.GROUP:
      return {
        ...baseField,
        fields: [],
      };

    case FieldType.CONDITIONAL:
      return {
        ...baseField,
        condition: {
          sourceFieldId: '',
          operator: 'equals',
          value: ''
        },
        fields: [],
      };

    default:
      return baseField;
  }
};

/**
 * Get a default label for a new field based on its type
 */
export const getDefaultLabel = (type: FieldType): string => {
  const labelMap: Record<FieldType, string> = {
    [FieldType.TEXT]: 'Text Field',
    [FieldType.NUMBER]: 'Number Field',
    [FieldType.EMAIL]: 'Email Field',
    [FieldType.DATE]: 'Date Field',
    [FieldType.TIME]: 'Time Field',
    [FieldType.CHECKBOX]: 'Checkbox Field',
    [FieldType.RADIO]: 'Radio Button Field',
    [FieldType.SELECT]: 'Dropdown Field',
    [FieldType.TEXTAREA]: 'Text Area Field',
    [FieldType.FILE]: 'File Upload Field',
    [FieldType.GROUP]: 'Field Group',
    [FieldType.CONDITIONAL]: 'Conditional Field'
  };
  
  return labelMap[type] || 'New Field';
};

/**
 * Get human-readable field type name
 */
export const getFieldTypeName = (type: FieldType): string => {
  return type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ');
};

/**
 * Check if a field supports options (select, radio, checkbox)
 */
export const fieldSupportsOptions = (type: FieldType): boolean => {
  return [FieldType.SELECT, FieldType.RADIO, FieldType.CHECKBOX].includes(type);
};

/**
 * Move a field from one position to another in the fields array
 */
export const moveField = (fields: FormField[], sourceIndex: number, destinationIndex: number): FormField[] => {
  const result = Array.from(fields);
  const [removed] = result.splice(sourceIndex, 1);
  result.splice(destinationIndex, 0, removed);
  
  // Update order values
  return result.map((field, index) => ({
    ...field,
    order: index
  }));
};

/**
 * Check if a field type supports min/max values
 */
export const fieldSupportsMinMax = (type: FieldType): boolean => {
  return [FieldType.NUMBER, FieldType.DATE, FieldType.TIME].includes(type);
};

/**
 * Check if a field type supports placeholder text
 */
export const fieldSupportsPlaceholder = (type: FieldType): boolean => {
  return [
    FieldType.TEXT, 
    FieldType.NUMBER, 
    FieldType.EMAIL, 
    FieldType.TEXTAREA
  ].includes(type);
};

/**
 * Check if a field type can be a source for conditional logic
 */
export const canBeConditionalSource = (type: FieldType): boolean => {
  return [
    FieldType.TEXT, 
    FieldType.NUMBER,
    FieldType.SELECT, 
    FieldType.RADIO, 
    FieldType.CHECKBOX
  ].includes(type);
};

/**
 * Get available condition operators based on the source field type
 */
export const getAvailableOperators = (sourceFieldType?: FieldType): string[] => {
  if (!sourceFieldType) return [];
  
  const commonOperators = ['equals', 'not_equals'];
  
  switch (sourceFieldType) {
    case FieldType.TEXT:
    case FieldType.EMAIL:
      return [...commonOperators, 'contains', 'not_contains', 'starts_with', 'ends_with'];
      
    case FieldType.NUMBER:
      return [...commonOperators, 'greater_than', 'less_than', 'greater_than_or_equals', 'less_than_or_equals'];
      
    case FieldType.SELECT:
    case FieldType.RADIO:
      return commonOperators;
      
    case FieldType.CHECKBOX:
      return [...commonOperators, 'contains', 'not_contains'];
      
    default:
      return commonOperators;
  }
};

/**
 * Format operator for display
 */
export const formatOperator = (operator: string): string => {
  const operatorMap: Record<string, string> = {
    'equals': 'equals',
    'not_equals': 'does not equal',
    'contains': 'contains',
    'not_contains': 'does not contain',
    'starts_with': 'starts with',
    'ends_with': 'ends with',
    'greater_than': 'is greater than',
    'less_than': 'is less than',
    'greater_than_or_equals': 'is greater than or equal to',
    'less_than_or_equals': 'is less than or equal to'
  };
  
  return operatorMap[operator] || operator;
};

/**
 * Find a field by ID (including nested fields in groups and conditionals)
 */
export const findFieldById = (fields: FormField[], fieldId: string): FormField | null => {
  for (const field of fields) {
    if (field.id === fieldId) {
      return field;
    }

    // Check in group fields
    if (field.type === FieldType.GROUP && field.fields && field.fields.length > 0) {
      const foundInGroup = findFieldById(field.fields, fieldId);
      if (foundInGroup) {
        return foundInGroup;
      }
    }

    // Check in conditional fields
    if (field.type === FieldType.CONDITIONAL && field.fields && field.fields.length > 0) {
      const foundInConditional = findFieldById(field.fields, fieldId);
      if (foundInConditional) {
        return foundInConditional;
      }
    }
  }

  return null;
}; 