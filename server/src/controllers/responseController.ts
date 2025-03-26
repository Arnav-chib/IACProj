import { Request, Response } from 'express';
import { 
  createResponse, 
  getResponsesByFormId, 
  getResponseById, 
  deleteResponse,
  getResponseCount
} from '../models/Response';
import { getFormById } from '../models/Form';

// Submit a response to a form
export const submitFormResponse = async (req: Request, res: Response) => {
  try {
    const { formId } = req.params;
    const { responseData } = req.body;
    
    // Validate input
    if (!formId || !responseData) {
      return res.status(400).json({ message: 'Form ID and response data are required' });
    }
    
    // We need to check if the form exists and get the owner's database
    // This will be handled differently based on how form sharing works
    // Here's a simple implementation assuming formId contains the dbName info
    
    // Format: dbName_formUUID
    const parts = formId.split('_');
    if (parts.length !== 2) {
      return res.status(400).json({ message: 'Invalid form ID format' });
    }
    
    const dbName = parts[0];
    const actualFormId = parts[1];
    
    // Check if form exists
    const form = await getFormById(dbName, actualFormId);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    // Create response
    const responseId = await createResponse(dbName, {
      formId: actualFormId,
      responseData
    });
    
    res.status(201).json({
      message: 'Response submitted successfully',
      responseId
    });
  } catch (err) {
    console.error('Submit form response error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all responses for a form
export const getFormResponses = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.dbName) {
      return res.status(400).json({ message: 'No forms available' });
    }
    
    const { formId } = req.params;
    
    // Check if form exists
    const form = await getFormById(req.user.dbName, formId);
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    // Get responses
    const responses = await getResponsesByFormId(req.user.dbName, formId);
    
    res.json({ responses });
  } catch (err) {
    console.error('Get form responses error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific response
export const getResponse = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.dbName) {
      return res.status(400).json({ message: 'No forms available' });
    }
    
    const { responseId } = req.params;
    
    // Get response
    const response = await getResponseById(req.user.dbName, responseId);
    
    if (!response) {
      return res.status(404).json({ message: 'Response not found' });
    }
    
    res.json({ response });
  } catch (err) {
    console.error('Get response error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a response
export const deleteFormResponse = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.dbName) {
      return res.status(400).json({ message: 'No forms available' });
    }
    
    const { responseId } = req.params;
    
    // Check if response exists
    const response = await getResponseById(req.user.dbName, responseId);
    
    if (!response) {
      return res.status(404).json({ message: 'Response not found' });
    }
    
    // Delete response
    await deleteResponse(req.user.dbName, responseId);
    
    res.json({ message: 'Response deleted successfully' });
  } catch (err) {
    console.error('Delete response error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get response count for a form
export const getFormResponseCount = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.dbName) {
      return res.status(400).json({ message: 'No forms available' });
    }
    
    const { formId } = req.params;
    
    // Check if form exists
    const form = await getFormById(req.user.dbName, formId);
    
    if (!form) {
      return res.status(404).json({ message: 'Form not found' });
    }
    
    // Get response count
    const count = await getResponseCount(req.user.dbName, formId);
    
    res.json({ count });
  } catch (err) {
    console.error('Get response count error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}; 