const { getTenantDbConnection } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Middleware to resolve tenant database connection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
async function resolveTenant(req, res, next) {
  try {
    // For demo purposes, use a default tenant ID
    // In a real app, this would come from a subdomain, header, or token
    const tenantId = req.headers['x-tenant-id'] || 'default';
    
    // Get tenant database connection string
    // In a real app, this would be retrieved from a tenant table
    const connectionString = process.env.DB_CONNECTION_STRING;
    
    // Get tenant database connection
    const tenantDbConnection = await getTenantDbConnection(connectionString);
    
    // Attach tenant DB connection to request
    req.tenantDbConnection = tenantDbConnection;
    req.tenantId = tenantId;
    
    next();
  } catch (error) {
    logger.error('Error resolving tenant:', { error: error.message });
    res.status(500).json({ error: 'Error connecting to tenant database' });
  }
}

module.exports = {
  resolveTenant
};
