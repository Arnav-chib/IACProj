const express = require('express');
const { authenticate } = require('../middleware/auth');
const { resolveTenant } = require('../middleware/tenantResolver');
const formController = require('../controllers/formController');
const responseController = require('../controllers/responseController');
const analyticsController = require('../controllers/analyticsController');
const { validateRequest } = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

// Public routes (no authentication required)
router.get('/:id', resolveTenant, formController.getForm);

// Create form submission validation
const validateFormSubmission = [
  body().notEmpty().withMessage('Request body cannot be empty'),
  validateRequest
];

router.post('/:id/responses', resolveTenant, validateFormSubmission, responseController.submitResponse);

// Protected routes (authentication required)
router.get('/', authenticate, resolveTenant, formController.listForms);

// The following routes should be protected
router.get('/:id/responses', authenticate, resolveTenant, formController.validateFormOwnership, responseController.getFormResponses);
router.delete('/:id/responses/:responseId', authenticate, resolveTenant, formController.validateFormOwnership, responseController.deleteResponse);
router.put('/:formId/responses/:responseId/fields/:fieldId/approval', authenticate, resolveTenant, formController.validateFormOwnership, responseController.updateResponseApproval);
router.get('/:id/analytics', authenticate, resolveTenant, formController.validateFormOwnership, analyticsController.getFormAnalytics);

module.exports = router;
