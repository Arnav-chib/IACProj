const logger = require('./logger');
const { AppError, ErrorTypes } = require('../middleware/errorHandler');

/**
 * Standard success response format
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {Object} data - Response data
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = {
    success: true,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Standard error response format
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} errors - Detailed errors
 */
const sendError = (res, statusCode = 500, message = 'Server error', errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors !== null) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Creates a controller method with standardized try/catch handling
 * @param {Function} controllerFn - Controller function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (controllerFn) => {
  return async (req, res, next) => {
    try {
      await controllerFn(req, res, next);
    } catch (error) {
      logger.error(`Controller error: ${error.message}`, { 
        stack: error.stack,
        path: req.path,
        method: req.method 
      });

      // If it's already an AppError, use its status and message
      if (error instanceof AppError) {
        return sendError(res, error.statusCode, error.message, { code: error.code });
      }

      sendError(res, 500, 'Server error');
    }
  };
};

/**
 * Creates a controller with standard CRUD operations for a model
 * @param {Object} model - Model with CRUD operations
 * @returns {Object} Controller object with CRUD methods
 */
const createCrudController = (model) => {
  return {
    getAll: asyncHandler(async (req, res) => {
      const items = await model.getAll();
      sendSuccess(res, 200, 'Retrieved successfully', items);
    }),

    getById: asyncHandler(async (req, res) => {
      const { id } = req.params;
      const item = await model.getById(id);
      
      if (!item) {
        return sendError(res, 404, 'Item not found');
      }
      
      sendSuccess(res, 200, 'Retrieved successfully', item);
    }),

    create: asyncHandler(async (req, res) => {
      const newItemId = await model.create(req.body);
      sendSuccess(res, 201, 'Created successfully', { id: newItemId });
    }),

    update: asyncHandler(async (req, res) => {
      const { id } = req.params;
      const success = await model.update(id, req.body);
      
      if (!success) {
        return sendError(res, 404, 'Item not found');
      }
      
      sendSuccess(res, 200, 'Updated successfully');
    }),

    delete: asyncHandler(async (req, res) => {
      const { id } = req.params;
      const success = await model.delete(id);
      
      if (!success) {
        return sendError(res, 404, 'Item not found');
      }
      
      sendSuccess(res, 200, 'Deleted successfully');
    })
  };
};

module.exports = {
  sendSuccess,
  sendError,
  asyncHandler,
  createCrudController
}; 