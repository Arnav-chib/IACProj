const express = require('express');
const { authenticateToken } = require('../middleware/tokenAuth');
const { resolveTenant } = require('../middleware/tenantResolver');
const embedController = require('../controllers/embedController');

const router = express.Router();

// Embedding routes
router.get('/form/:id', resolveTenant, embedController.renderForm);
router.get('/results/:id', authenticateToken, embedController.renderResults);

module.exports = router;
