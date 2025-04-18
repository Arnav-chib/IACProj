const { rateLimit } = require('express-rate-limit');

// Auth routes rate limiter
const auth = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Form submission rate limiter
const formSubmission = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 submissions per hour
  message: {
    success: false,
    message: 'Too many form submissions, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Default rate limiter for all routes
const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  auth,
  formSubmission,
  default: defaultLimiter
}; 