import { Request, Response } from 'express';
import { 
  createForm, 
  getFormById, 
  getAllForms, 
  updateForm, 
  deleteForm, 
  Form
} from '../models/Form';
import { SubscriptionType, updateUserDatabaseName } from '../models/User';
import { createUserDatabase } from '../config/db';

// Create a new form
export const createNewForm = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { title, description, schema } = req.body;
    
    // Validate input
    if (!title || !schema || !schema.fields) {
      return res.status(400).json({ message: 'Title and schema are required' });
    }
    
    // Check if user has a database
    let dbName = req.user.dbName;
    
    // If user doesn't have a database yet, create one (first form creation)
    if (!dbName) {
      // Free users cannot create forms
      if (req.user.subscription === SubscriptionType.FREE) {
        return res.status(403).json({ 
          message: 'Subscription required to create forms',
          required: [SubscriptionType.BASIC, SubscriptionType.PREMIUM]
        });
      }
      
      // Create database for user
      dbName = await createUserDatabase(req.user.id);
      
      // Update user with database name
      await updateUserDatabaseName(req.user.id, dbName);
    }
    
    // Create form
    const formId = await createForm(dbName, {
      title,
      description,
      schema
    });
    
    res.status(201).json({
      message: 'Form created successfully',
      formId
    });
  } catch (err) {
    console.error('Create form error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all forms for a user
export const getUserForms = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.dbName) {
      return res.status(400).json({ message: 'No forms available' });
    }
    
    const forms = await getAllForms(req.user.dbName);
    
    res.json({ forms });
  } catch (err) {
    console.error('Get user forms error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific form by ID
export const getForm = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.dbName) {
      return res.status(400).json({ message: 'No forms available' });
    }
    
    const { formId } = req.params;
    
    const form = await getFormById(req.user.dbName, formId);
    
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    res.json({ form });
  } catch (err) {
    console.error('Get form error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a form
export const updateUserForm = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.dbName) {
      return res.status(400).json({ message: 'No forms available' });
    }
    
    const { formId } = req.params;
    const { title, description, schema } = req.body;
    
    // Check if form exists
    const existingForm = await getFormById(req.user.dbName, formId);
    
    if (!existingForm) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    // Update form
    await updateForm(req.user.dbName, formId, {
      title,
      description,
      schema
    });
    
    res.json({ message: 'Form updated successfully' });
  } catch (err) {
    console.error('Update form error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a form
export const deleteUserForm = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.dbName) {
      return res.status(400).json({ message: 'No forms available' });
    }
    
    const { formId } = req.params;
    
    // Check if form exists
    const existingForm = await getFormById(req.user.dbName, formId);
    
    if (!existingForm) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    // Delete form
    await deleteForm(req.user.dbName, formId);
    
    res.json({ message: 'Form deleted successfully' });
  } catch (err) {
    console.error('Delete form error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}; 