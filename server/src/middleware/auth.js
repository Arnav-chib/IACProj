const jwt = require('jsonwebtoken');
const { getUserById } = require('../models/userModel');
const logger = require('../utils/logger');
const { AppError, ErrorTypes } = require('./errorHandler');
const { validateApiToken } = require('../services/tokenService');
const { getTenantDbConnection, initializeMasterDbPool } = require('../config/database');

let masterPool = null;

// Initialize the master pool - will be called once the server is running
const initPool = async () => {
  try {
    if (!masterPool) {
      masterPool = await initializeMasterDbPool();
      logger.info('Auth middleware: Master pool initialized');
    }
    return masterPool;
  } catch (error) {
    logger.error('Failed to initialize master pool in auth middleware:', error);
    throw new AppError(
      'Database connection failed', 
      500, 
      ErrorTypes.DATABASE.code
    );
  }
};

/**
 * Middleware to ensure user is authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const ensureAuthenticated = (req, res, next) => {
  if (!req.user) {
    return next(new AppError(
      'Authentication required', 
      401, 
      ErrorTypes.AUTHENTICATION.code
    ));
  }
  next();
};

/**
 * Authentication middleware to verify JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
async function authenticate(req, res, next) {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError(
        'Authorization token is required', 
        401, 
        ErrorTypes.AUTHENTICATION.code
      ));
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await getUserById(decoded.userId);
      
      if (!user) {
        return next(new AppError(
          'Invalid token - user not found', 
          401, 
          ErrorTypes.AUTHENTICATION.code
        ));
      }
      
      // Check subscription status instead of Status
      if (user.SubscriptionStatus && user.SubscriptionStatus !== 'active') {
        return next(new AppError(
          'User subscription is not active', 
          403, 
          ErrorTypes.AUTHORIZATION.code
        ));
      }
      
      // Attach user to request object
      req.user = user;
      
      next();
    } catch (jwtError) {
      if (jwtError.name === 'JsonWebTokenError') {
        return next(new AppError(
          'Invalid token', 
          401, 
          ErrorTypes.AUTHENTICATION.code
        ));
      }
      
      if (jwtError.name === 'TokenExpiredError') {
        return next(new AppError(
          'Token expired', 
          401, 
          ErrorTypes.AUTHENTICATION.code
        ));
      }
      
      throw jwtError;
    }
  } catch (error) {
    logger.error('Authentication error:', { error: error.message });
    next(new AppError(
      'Authentication failed', 
      500, 
      ErrorTypes.SERVER.code
    ));
  }
}

/**
 * Authenticate with API token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
async function authenticateToken(req, res, next) {
  try {
    // Check if token is provided
    const token = req.query.token || req.headers['x-api-token'];
    
    if (!token) {
      return next(new AppError(
        'API token is required', 
        401, 
        ErrorTypes.AUTHENTICATION.code
      ));
    }
    
    // Ensure pool is initialized
    if (!masterPool) {
      await initPool();
    }
    
    // Validate token
    const tokenData = await validateApiToken(token, masterPool);
    
    if (!tokenData) {
      return next(new AppError(
        'Invalid or expired API token', 
        401, 
        ErrorTypes.AUTHENTICATION.code
      ));
    }
    
    // Check permission for the requested resource
    const validPermission = checkPermission(req, tokenData.permissions);
    
    if (!validPermission) {
      return next(new AppError(
        'Insufficient permissions', 
        403, 
        ErrorTypes.AUTHORIZATION.code
      ));
    }
    
    // Set tenant database connection
    req.tenantDbConnection = await getTenantDbConnection(tokenData.connectionString);
    
    // Set token user info
    req.tokenUser = {
      userId: tokenData.userId,
      orgId: tokenData.orgId
    };
    
    next();
  } catch (error) {
    logger.error('API token authentication error:', { error: error.message });
    next(new AppError(
      'Authentication failed', 
      500, 
      ErrorTypes.SERVER.code
    ));
  }
}

// Check if token has permission for the requested resource
function checkPermission(req, permissions) {
  const { method, path } = req;
  
  // Check for specific endpoints and methods
  if (path.includes('/forms') && !path.includes('/responses')) {
    return permissions.readForms === true;
  }
  
  if (path.includes('/responses')) {
    if (method === 'GET') {
      return permissions.readResponses === true;
    }
    if (method === 'POST') {
      return permissions.submitResponses === true;
    }
  }
  
  // Default to false for unknown endpoints
  return false;
}

/**
 * Authorization middleware to check if user has required role
 * @param {string|string[]} roles - Required role(s) for access
 * @returns {Function} Express middleware function
 */
function authorize(roles) {
  return (req, res, next) => {
    try {
      // First check if user is authenticated
      if (!req.user) {
        return next(new AppError(
          'User not authenticated', 
          401, 
          ErrorTypes.AUTHENTICATION.code
        ));
      }
      
      const userRoles = Array.isArray(req.user.Roles) ? req.user.Roles : [req.user.Roles];
      
      // Check if user has any of the required roles
      const hasRole = Array.isArray(roles)
        ? roles.some(role => userRoles.includes(role))
        : userRoles.includes(roles);
      
      if (!hasRole) {
        return next(new AppError(
          'Insufficient permissions', 
          403, 
          ErrorTypes.AUTHORIZATION.code
        ));
      }
      
      next();
    } catch (error) {
      logger.error('Authorization error:', { error: error.message });
      next(new AppError(
        'Authorization error', 
        500, 
        ErrorTypes.SERVER.code
      ));
    }
  };
}

/**
 * Check if user is a system administrator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
function isSystemAdmin(req, res, next) {
  try {
    // First check if user is authenticated
    if (!req.user) {
      return next(new AppError(
        'User not authenticated', 
        401, 
        ErrorTypes.AUTHENTICATION.code
      ));
    }
    
    // Debug the user object to see what properties are actually available
    console.log('User object in isSystemAdmin check:', {
      id: req.user.id || req.user.UserID || req.user.userId,
      isSystemAdmin: req.user.isSystemAdmin,
      IsSystemAdmin: req.user.IsSystemAdmin
    });
    
    // Since there's no role column in the database, only check isSystemAdmin flag
    // Check both camelCase and PascalCase variations
    const isAdmin = req.user.isSystemAdmin === true || req.user.IsSystemAdmin === true;
    
    if (!isAdmin) {
      return next(new AppError(
        'System administrator access required', 
        403, 
        ErrorTypes.AUTHORIZATION.code
      ));
    }
    
    next();
  } catch (error) {
    logger.error('Authorization error:', { error: error.message });
    next(new AppError(
      'Authorization error', 
      500, 
      ErrorTypes.SERVER.code
    ));
  }
}

/**
 * Check if user is an organization administrator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
function isOrgAdmin(req, res, next) {
  try {
    // First check if user is authenticated
    if (!req.user) {
      return next(new AppError(
        'User not authenticated', 
        401, 
        ErrorTypes.AUTHENTICATION.code
      ));
    }
    
    // Debug the user object to see what properties are actually available
    console.log('User object in isOrgAdmin check:', {
      id: req.user.id || req.user.UserID || req.user.userId,
      isOrgAdmin: req.user.isOrgAdmin,
      IsOrgAdmin: req.user.IsOrgAdmin,
      isSystemAdmin: req.user.isSystemAdmin // System admins should have org admin access too
    });
    
    // Check for isOrgAdmin property (or variations) or isSystemAdmin
    const isAdmin = 
      req.user.isOrgAdmin === true || 
      req.user.IsOrgAdmin === true || 
      req.user.isSystemAdmin === true || 
      req.user.IsSystemAdmin === true;
    
    if (!isAdmin) {
      return next(new AppError(
        'Organization administrator access required', 
        403, 
        ErrorTypes.AUTHORIZATION.code
      ));
    }
    
    next();
  } catch (error) {
    logger.error('Authorization error:', { error: error.message });
    next(new AppError(
      'Authorization error', 
      500, 
      ErrorTypes.SERVER.code
    ));
  }
}

// Check if user has access to the organization
async function hasOrgAccess(req, res, next) {
  try {
    if (!req.user) {
      return next(new AppError(
        'Authentication required', 
        401, 
        ErrorTypes.AUTHENTICATION.code
      ));
    }

    const orgId = req.params.orgId || req.body.orgId;
    
    if (!orgId) {
      return next(new AppError(
        'Organization ID is required', 
        400, 
        'MISSING_ORG_ID'
      ));
    }

    // System admin has access to all organizations (check both camelCase and PascalCase)
    if (req.user.isSystemAdmin === true || req.user.IsSystemAdmin === true) {
      return next();
    }

    // Check if user is a member of the organization
    const result = await req.app.locals.db.request()
      .input('userId', req.user.id)
      .input('orgId', orgId)
      .query(`
        SELECT COUNT(*) as count
        FROM OrganizationMembers
        WHERE UserID = @userId AND OrgID = @orgId
      `);
    
    if (result.recordset[0].count === 0) {
      return next(new AppError(
        'You do not have access to this organization', 
        403, 
        ErrorTypes.AUTHORIZATION.code
      ));
    }
    
    next();
  } catch (error) {
    logger.error('Error checking organization access:', { 
      error: error.message,
      stack: error.stack 
    });
    
    return next(new AppError(
      'Server error', 
      500, 
      ErrorTypes.SERVER.code
    ));
  }
}

// Initialize pool when module is loaded
initPool().catch(err => {
  logger.error('Could not initialize auth middleware pool:', err);
});

module.exports = {
  authenticate,
  isAuthenticated: authenticate,
  authenticateToken,
  authorize,
  isSystemAdmin,
  isOrgAdmin,
  hasOrgAccess,
  ensureAuthenticated,
  initPool
};
