/**
 * Simple client-side logger utility
 * Only logs to console in development mode to avoid leaking sensitive information in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  /**
   * Log to console only in development mode
   */
  logToConsole: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log errors to console (and potentially to an error tracking service in production)
   */
  error: (...args) => {
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, you might want to send this to an error tracking service
      // like Sentry, LogRocket, etc.
      // Example: Sentry.captureException(args[0]);
    }
  },

  /**
   * Log warnings to console
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log info messages to console
   */
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  }
};

export default logger; 