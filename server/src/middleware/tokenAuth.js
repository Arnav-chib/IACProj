const { validateApiToken } = require('../services/tokenService');
const { getTenantDbConnection } = require('../config/database');
const { initializeMasterDbPool } = require('../config/database');

let masterPool;

// Initialize the master pool
async function init() {
  masterPool = await initializeMasterDbPool();
}
init();

// Authenticate with API token
async function authenticateToken(req, res, next) {
  try {
    // Check if token is provided
    const token = req.query.token || req.headers['x-api-token'];
    
    if (!token) {
      return res.status(401).json({ error: 'API token is required' });
    }
    
    // Validate token
    const tokenData = await validateApiToken(token, masterPool);
    
    if (!tokenData) {
      return res.status(401).json({ error: 'Invalid or expired API token' });
    }
    
    // Check permission for the requested resource
    const validPermission = checkPermission(req, tokenData.permissions);
    
    if (!validPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
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
    console.error('API token authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
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

module.exports = { authenticateToken };
