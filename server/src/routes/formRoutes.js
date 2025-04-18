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
router.get('/:id/analytics', authenticate, resolveTenant, analyticsController.getFormAnalytics);

module.exports = router;
