const { validationResult, body, param, query } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Common validation rules for reuse
 */
const rules = {
  id: param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address is required'),
  
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  username: body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('Username can only contain letters, numbers, and the characters _.-'),
  
  name: body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be between 1 and 100 characters'),
  
  description: body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  
  url: body('url')
    .optional()
    .isURL()
    .withMessage('Must be a valid URL'),
  
  date: body('date')
    .optional()
    .isISO8601()
    .withMessage('Must be a valid date in ISO 8601 format'),
  
  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  sortBy: query('sortBy')
    .optional()
    .isString()
    .withMessage('Sort field must be a string'),
  
  sortOrder: query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either "asc" or "desc"')
};

/**
 * Validation schemas for different routes
 */
const schemas = {
  login: [
    rules.email,
    body('password').notEmpty().withMessage('Password is required')
  ],
  
  register: [
    rules.username,
    rules.email,
    rules.password,
  ],
  
  createForm: [
    body('title')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Form title must be between 3 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    body('fields')
      .isArray({ min: 1 })
      .withMessage('Form must have at least one field'),
    body('fields.*.type')
      .isIn(['text', 'number', 'email', 'textarea', 'select', 'checkbox', 'radio', 'date', 'file'])
      .withMessage('Invalid field type'),
    body('fields.*.label')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Field label is required and cannot exceed 100 characters'),
    body('fields.*.required')
      .optional()
      .isBoolean()
      .withMessage('Required flag must be a boolean')
  ],
  
  resetPassword: [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    rules.password
  ],
  
  forgotPassword: [
    rules.email
  ],
  
  pagination: [
    rules.limit,
    rules.page,
    rules.sortBy,
    rules.sortOrder
  ]
};

/**
 * Handles validation errors by formatting them and sending a response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} errors - Validation errors from express-validator
 * @returns {Boolean} Whether errors were found and handled
 */
const handleValidationErrors = (req, res, errors) => {
  if (errors.isEmpty()) {
    return false;
  }

  const formattedErrors = {};
  
  // Format errors for easier client consumption
  errors.array().forEach(error => {
    formattedErrors[error.path] = formattedErrors[error.path] || [];
    formattedErrors[error.path].push(error.msg);
  });
  
  // Log the validation error
  logger.warn('Validation error', {
    path: req.path,
    method: req.method,
    errors: formattedErrors,
    body: JSON.stringify(req.body),
    params: req.params,
    query: req.query
  });
  
  res.status(422).json({
    success: false,
    message: 'Validation failed',
    errors: formattedErrors
  });
  
  return true;
};

/**
 * Middleware to validate request against express-validator validations
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!handleValidationErrors(req, res, errors)) {
    next();
  }
};

/**
 * Middleware to validate request data
 * @param {Array} validations - Array of validation rules to apply
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!handleValidationErrors(req, res, errors)) {
      next();
    }
  };
};

module.exports = {
  validate,
  validateRequest,
  rules,
  schemas
}; 