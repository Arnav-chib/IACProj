const express = require('express');
const { authenticate } = require('../middleware/auth');
const tokenController = require('../controllers/tokenController');

const router = express.Router();

// All token routes require authentication
router.use(authenticate);

// Token management routes
router.get('/', tokenController.listTokens);
router.post('/', tokenController.createToken);
router.delete('/:id', tokenController.revokeToken);

module.exports = router;
