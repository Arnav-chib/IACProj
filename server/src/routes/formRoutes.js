const express = require('express');
const { authenticate } = require('../middleware/auth');
const { resolveTenant } = require('../middleware/tenantResolver');
const formController = require('../controllers/formController');
const responseController = require('../controllers/responseController');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

// Public routes (no authentication required)
router.get('/:id', resolveTenant, formController.getForm);
router.post('/:id/responses', resolveTenant, responseController.submitResponse);

// Protected routes (authentication required)
router.get('/', authenticate, resolveTenant, formController.listForms);
router.get('/:id/responses', authenticate, resolveTenant, responseController.listResponses);
router.post('/:id/responses', validateForm, responseController.submitResponse);
router.delete('/:id/responses/:responseId', authenticate, resolveTenant, formController.validateFormOwnership, responseController.deleteResponse);
router.put('/:formId/responses/:responseId/fields/:fieldId/approval', authenticate, resolveTenant, formController.validateFormOwnership, responseController.updateResponseApproval);
router.get('/:id/analytics', authenticate, resolveTenant, analyticsController.getFormAnalytics);

module.exports = router;
