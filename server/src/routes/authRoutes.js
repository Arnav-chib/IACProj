const express = require('express');
const { 
  register, 
  login, 
  getCurrentUser, 
  requestPasswordReset, 
  resetPasswordWithToken 
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

// Auth routes
router.post('/register', validate(schemas.register), register);
router.post('/login', validate(schemas.login), login);
router.get('/me', authenticate, getCurrentUser);
router.post('/forgot-password', validate(schemas.forgotPassword), requestPasswordReset);
router.post('/reset-password', validate(schemas.resetPassword), resetPasswordWithToken);

module.exports = router;
