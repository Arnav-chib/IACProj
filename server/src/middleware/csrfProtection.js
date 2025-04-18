const crypto = require('crypto');
const { AppError } = require('./errorHandler');

/**
 * CSRF Protection Middleware
 * 
 * This middleware generates a CSRF token and validates it on non-GET requests.
 * The token is stored in a cookie and must be included in the X-CSRF-Token header.
 */
const csrfProtection = () => {
  return (req, res, next) => {
    // Skip CSRF check for GET requests and health check endpoint
    if (req.method === 'GET' || req.path === '/api/health') {
      return next();
    }

    // Generate a new CSRF token if one doesn't exist
    if (!req.cookies['csrf-token']) {
      const token = crypto.randomBytes(32).toString('hex');
      res.cookie('csrf-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
      });
      return next();
    }

    // Validate CSRF token
    const csrfToken = req.headers['x-csrf-token'];
    const cookieToken = req.cookies['csrf-token'];

    if (!csrfToken || csrfToken !== cookieToken) {
      return next(new AppError('Invalid CSRF token', 403));
    }

    next();
  };
};

module.exports = csrfProtection; 