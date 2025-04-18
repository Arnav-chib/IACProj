const { getTenantDbConnection } = require('../config/database');
const masterPool = require('../config/database').masterPool;

// Resolve tenant middleware
async function resolveTenant(req, res, next) {
  try {
    // For authenticated users (form creators)
    if (req.user) {
      // Check if user is part of an organization
      if (req.user.OrgID) {
        // Get organization's connection string
        const orgResult = await masterPool.request()
          .input('orgId', req.user.OrgID)
          .query('SELECT DBConnectionString FROM Organizations WHERE OrgID = @orgId');
        
        if (orgResult.recordset.length === 0) {
          return res.status(404).json({ error: 'Organization not found' });
        }
        
        const connectionString = orgResult.recordset[0].DBConnectionString;
        req.tenantDbConnection = await getTenantDbConnection(connectionString);
      } else {
        // Individual user, use their connection string
        req.tenantDbConnection = await getTenantDbConnection(req.user.DBConnectionString);
      }
    }
    // For public form access (via form links)
    else if (req.params.formId) {
      // Resolve tenant from form ID in master database
      const formMappingResult = await masterPool.request()
        .input('formId', req.params.formId)
        .query(`
          SELECT u.UserID, u.OrgID, u.DBConnectionString, o.DBConnectionString AS OrgDBConnectionString
          FROM FormMapping fm 
          JOIN Users u ON fm.UserID = u.UserID
          LEFT JOIN Organizations o ON u.OrgID = o.OrgID
          WHERE fm.FormID = @formId
        `);
      
      if (formMappingResult.recordset.length === 0) {
        return res.status(404).json({ error: 'Form not found' });
      }
      
      const formOwner = formMappingResult.recordset[0];
      const connectionString = formOwner.OrgID 
        ? formOwner.OrgDBConnectionString 
        : formOwner.DBConnectionString;
      
      req.tenantDbConnection = await getTenantDbConnection(connectionString);
    } else {
      return res.status(400).json({ error: 'Unable to resolve tenant' });
    }
    
    next();
  } catch (error) {
    console.error('Tenant resolution error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { resolveTenant };
