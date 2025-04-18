const express = require('express');
const { 
  register, 
  login, 
  getCurrentUser, 
  requestPasswordReset, 
  resetPasswordWithToken 
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPasswordWithToken);

module.exports = router;
