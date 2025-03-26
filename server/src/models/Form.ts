import { sql } from '../config/db';

// Form field types
export enum FieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  EMAIL = 'EMAIL',
  DATE = 'DATE',
  TIME = 'TIME',
  CHECKBOX = 'CHECKBOX',
  RADIO = 'RADIO',
  SELECT = 'SELECT',
  TEXTAREA = 'TEXTAREA',
  FILE = 'FILE',
  GROUP = 'GROUP', // For grouped fields
  CONDITIONAL = 'CONDITIONAL' // For conditional logic
}

// Field option for select, radio, checkbox
export interface FieldOption {
  label: string;
  value: string;
}

// Condition for conditional fields
export interface Condition {
  sourceFieldId: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: string;
}

// Base field interface
export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  required: boolean;
  order: number;
}

// Text field
export interface TextField extends FormField {
  type: FieldType.TEXT;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
}

// Number field
export interface NumberField extends FormField {
  type: FieldType.NUMBER;
  placeholder?: string;
  min?: number;
  max?: number;
}

// Email field
export interface EmailField extends FormField {
  type: FieldType.EMAIL;
  placeholder?: string;
}

// Date field
export interface DateField extends FormField {
  type: FieldType.DATE;
  minDate?: string;
  maxDate?: string;
}

// Select, Radio, Checkbox fields
export interface ChoiceField extends FormField {
  type: FieldType.SELECT | FieldType.RADIO | FieldType.CHECKBOX;
  options: FieldOption[];
}

// Group field (contains subfields)
export interface GroupField extends FormField {
  type: FieldType.GROUP;
  fields: FormField[];
}

// Conditional field
export interface ConditionalField extends FormField {
  type: FieldType.CONDITIONAL;
  condition: Condition;
  fields: FormField[]; // Fields to show when condition is met
}

// Form schema
export interface FormSchema {
  fields: FormField[];
}

// Form interface
export interface Form {
  id: string;
  title: string;
  description?: string;
  schema: FormSchema;
  createdAt: Date;
  updatedAt: Date;
}

// Create a new form in user's database
export async function createForm(dbName: string, form: Omit<Form, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    // Connect to user's database
    await sql.query`USE ${dbName}`;
    
    // Insert form with schema as JSON
    const result = await sql.query`
      INSERT INTO Forms (title, description, schema)
      VALUES (
        ${form.title}, 
        ${form.description || null}, 
        ${JSON.stringify(form.schema)}
      )
      OUTPUT INSERTED.id;
    `;
    
    return result.recordset[0].id;
  } catch (err) {
    console.error('Error creating form:', err);
    throw err;
  }
}

// Get a form by ID from user's database
export async function getFormById(dbName: string, formId: string): Promise<Form | null> {
  try {
    // Connect to user's database
    await sql.query`USE ${dbName}`;
    
    const result = await sql.query`
      SELECT 
        id, 
        title, 
        description, 
        schema, 
        created_at as createdAt,
        updated_at as updatedAt
      FROM Forms 
      WHERE id = ${formId};
    `;
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    // Parse schema JSON
    const form = result.recordset[0];
    form.schema = JSON.parse(form.schema);
    
    return form as Form;
  } catch (err) {
    console.error('Error getting form by ID:', err);
    throw err;
  }
}

// Get all forms from user's database
export async function getAllForms(dbName: string): Promise<Form[]> {
  try {
    // Connect to user's database
    await sql.query`USE ${dbName}`;
    
    const result = await sql.query`
      SELECT 
        id, 
        title, 
        description, 
        schema, 
        created_at as createdAt,
        updated_at as updatedAt
      FROM Forms
      ORDER BY created_at DESC;
    `;
    
    // Parse schema JSON for all forms
    return result.recordset.map(form => {
      form.schema = JSON.parse(form.schema);
      return form as Form;
    });
  } catch (err) {
    console.error('Error getting all forms:', err);
    throw err;
  }
}

// Update a form
export async function updateForm(dbName: string, formId: string, formData: Partial<Omit<Form, 'id' | 'createdAt' | 'updatedAt'>>) {
  try {
    // Connect to user's database
    await sql.query`USE ${dbName}`;
    
    let updateQuery = 'UPDATE Forms SET updated_at = GETDATE()';
    const params: any[] = [];
    
    if (formData.title) {
      updateQuery += ', title = @title';
      params.push({ name: 'title', value: formData.title });
    }
    
    if (formData.description !== undefined) {
      updateQuery += ', description = @description';
      params.push({ name: 'description', value: formData.description || null });
    }
    
    if (formData.schema) {
      updateQuery += ', schema = @schema';
      params.push({ name: 'schema', value: JSON.stringify(formData.schema) });
    }
    
    updateQuery += ' WHERE id = @formId';
    params.push({ name: 'formId', value: formId });
    
    // Create request with parameters
    const request = new sql.Request();
    params.forEach(param => {
      request.input(param.name, param.value);
    });
    
    await request.query(updateQuery);
  } catch (err) {
    console.error('Error updating form:', err);
    throw err;
  }
}

// Delete a form
export async function deleteForm(dbName: string, formId: string) {
  try {
    // Connect to user's database
    await sql.query`USE ${dbName}`;
    
    await sql.query`
      DELETE FROM Responses WHERE form_id = ${formId};
      DELETE FROM Forms WHERE id = ${formId};
    `;
  } catch (err) {
    console.error('Error deleting form:', err);
    throw err;
  }
} 