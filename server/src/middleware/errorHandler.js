const logger = require('../utils/logger');

/**
 * Error types enum
 */
const ErrorTypes = {
  VALIDATION: { code: 'VALIDATION_ERROR', message: 'Validation error' },
  AUTHENTICATION: { code: 'AUTHENTICATION_ERROR', message: 'Authentication error' },
  AUTHORIZATION: { code: 'AUTHORIZATION_ERROR', message: 'Authorization error' },
  NOT_FOUND: { code: 'NOT_FOUND', message: 'Resource not found' },
  CONFLICT: { code: 'CONFLICT', message: 'Resource conflict' },
  DATABASE: { code: 'DATABASE_ERROR', message: 'Database error' },
  SERVER: { code: 'SERVER_ERROR', message: 'Internal server error' }
};

/**
 * Application error class for consistent error handling
 */
class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Error code for client
   */
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errorCode = err.code || ErrorTypes.SERVER.code;
  let errors = err.errors || null;
  
  // Log detailed error information for debugging
  logger.error(`Error: ${message}`, {
    path: req.originalUrl,
    method: req.method,
    statusCode,
    errorCode,
    stack: err.stack,
    errors
  });

  // Specific handling for known error types
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    errorCode = ErrorTypes.VALIDATION.code;
    errors = err.errors.map(e => ({ field: e.path, message: e.message }));
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = ErrorTypes.AUTHENTICATION.code;
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    errorCode = ErrorTypes.VALIDATION.code;
    message = 'Invalid reference to a related resource';
  }

  // Send response to client
  const response = {
    success: false,
    message,
    code: errorCode
  };

  if (errors) {
    response.errors = errors;
  }

  // Don't expose stack trace in production
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  errorHandler,
  AppError,
  ErrorTypes
}; 