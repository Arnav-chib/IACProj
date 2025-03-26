import express, { Router } from 'express';
import {
  submitFormResponse,
  getFormResponses,
  getResponse,
  deleteFormResponse,
  getFormResponseCount
} from '../controllers/responseController';
import { authenticate, requireDatabase } from '../middleware/auth';

const router: Router = express.Router();

// Public route for submitting form responses
router.post('/submit/:formId', submitFormResponse);

// Protected routes (require authentication)
router.use(authenticate);
router.use(requireDatabase);

// Get all responses for a form
router.get('/form/:formId', getFormResponses);

// Get response count for a form
router.get('/form/:formId/count', getFormResponseCount);

// Get a specific response
router.get('/:responseId', getResponse);

// Delete a response
router.delete('/:responseId', deleteFormResponse);

export default router; 