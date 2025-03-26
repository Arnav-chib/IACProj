import express, { Router } from 'express';
import {
  createNewForm,
  getUserForms,
  getForm,
  updateUserForm,
  deleteUserForm
} from '../controllers/formController';
import { authenticate, requireDatabase } from '../middleware/auth';

const router: Router = express.Router();

// All form routes require authentication
router.use(authenticate);

// Get all forms
router.get('/', getUserForms);

// Create a new form
router.post('/', createNewForm);

// Get a specific form
router.get('/:formId', requireDatabase, getForm);

// Update a form
router.put('/:formId', requireDatabase, updateUserForm);

// Delete a form
router.delete('/:formId', requireDatabase, deleteUserForm);

export default router; 