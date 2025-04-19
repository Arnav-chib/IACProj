import { toast } from 'react-toastify';

/**
 * Standard error messages for common error scenarios
 */
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your internet connection and try again.',
  SERVER: 'Server error. Our team has been notified. Please try again later.',
  AUTH_EXPIRED: 'Your session has expired. Please log in again.',
  AUTH_INVALID: 'Invalid credentials. Please check your email and password.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'There was an issue with your submission. Please check the form and try again.',
  RATE_LIMIT: 'Too many requests. Please wait a few moments before trying again.',
  DEFAULT: 'An unexpected error occurred. Please try again.'
};

/**
 * Handles API errors with standardized error messages and logging
 * @param {Error} error - The error object from axios
 * @param {Object} options - Additional options
 * @param {boolean} options.redirect - Whether to redirect on auth errors
 * @param {Function} options.onError - Optional callback for custom error handling
 */
export const handleApiError = (error, options = {}) => {
  const { redirect = true, onError } = options;
  
  // Call custom error handler if provided
  if (onError && typeof onError === 'function') {
    onError(error);
  }

  // Handle network errors (no response)
  if (!error.response) {
    toast.error(ERROR_MESSAGES.NETWORK);
    logError('Network Error', error);
    return;
  }

  const { status, data } = error.response;
  const errorMessage = data?.message || getErrorMessageByStatus(status);

  // Handle different error status codes
  switch (status) {
    case 400:
      toast.error(errorMessage || ERROR_MESSAGES.DEFAULT);
      break;
    case 401:
      toast.error(ERROR_MESSAGES.AUTH_EXPIRED);
      // Redirect to login if option is set
      if (redirect) {
        // Clear any stored auth data
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      }
      break;
    case 403:
      toast.error(errorMessage || ERROR_MESSAGES.FORBIDDEN);
      break;
    case 404:
      toast.error(errorMessage || ERROR_MESSAGES.NOT_FOUND);
      break;
    case 422:
      // Handle validation errors
      if (data.errors && typeof data.errors === 'object') {
        // Show only first 3 validation errors to avoid spamming
        const errorMessages = Object.values(data.errors).flat();
        errorMessages.slice(0, 3).forEach(msg => toast.error(msg));
        
        if (errorMessages.length > 3) {
          toast.error(`And ${errorMessages.length - 3} more errors...`);
        }
      } else {
        toast.error(errorMessage || ERROR_MESSAGES.VALIDATION);
      }
      break;
    case 429:
      toast.error(ERROR_MESSAGES.RATE_LIMIT);
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      toast.error(ERROR_MESSAGES.SERVER);
      break;
    default:
      toast.error(ERROR_MESSAGES.DEFAULT);
  }

  // Log error details
  logError(`API Error (${status})`, error);
};

/**
 * Get appropriate error message based on status code
 */
const getErrorMessageByStatus = (status) => {
  switch (status) {
    case 400: return 'Invalid request';
    case 401: return ERROR_MESSAGES.AUTH_EXPIRED;
    case 403: return ERROR_MESSAGES.FORBIDDEN;
    case 404: return ERROR_MESSAGES.NOT_FOUND;
    case 422: return ERROR_MESSAGES.VALIDATION;
    case 429: return ERROR_MESSAGES.RATE_LIMIT;
    case 500:
    case 502:
    case 503:
    case 504: return ERROR_MESSAGES.SERVER;
    default: return ERROR_MESSAGES.DEFAULT;
  }
};

/**
 * Logs error information to console
 */
const logError = (type, error) => {
  const errorData = {
    type,
    message: error.message,
    url: error.config?.url,
    method: error.config?.method,
    timestamp: new Date().toISOString(),
  };

  if (error.response) {
    errorData.status = error.response.status;
    errorData.statusText = error.response.statusText;
    errorData.data = error.response.data;
  }

  console.error('Error:', errorData);
  
  // You could send this to a logging service here
  // logErrorToService(errorData);
};

/**
 * Helper functions for checking error types
 */
export const isNetworkError = (error) => !error.response;

export const isValidationError = (error) => error.response?.status === 422;

export const isAuthError = (error) => error.response?.status === 401;

export const isForbiddenError = (error) => error.response?.status === 403;

export const isServerError = (error) => {
  const status = error.response?.status;
  return status >= 500 && status < 600;
}; 