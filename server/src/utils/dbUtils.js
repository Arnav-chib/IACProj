const sql = require('mssql');
const fs = require('fs').promises;
const path = require('path');
const { getTenantDbConnection } = require('../config/database');
const logger = require('./logger');

// Initialize master database tables
async function initializeMasterDb(pool) {
  try {
    const schemaPath = path.join(__dirname, '../../db/masterSchema.sql');
    const schemaScript = await fs.readFile(schemaPath, 'utf8');
    
    await pool.request().batch(schemaScript);
    logger.info('Master database schema initialized successfully');
  } catch (error) {
    logger.error('Error initializing master database schema:', { 
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Initialize tenant database tables
async function initializeTenantDb(connectionString) {
  try {
    const tenantPool = await getTenantDbConnection(connectionString);
    const schemaPath = path.join(__dirname, '../../db/tenantSchema.sql');
    const schemaScript = await fs.readFile(schemaPath, 'utf8');
    
    await tenantPool.request().batch(schemaScript);
    logger.info('Tenant database schema initialized successfully');
  } catch (error) {
    logger.error('Error initializing tenant database schema:', { 
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Execute a query with error handling and logging
async function executeQuery(pool, query, params = []) {
  const startTime = Date.now();
  try {
    const request = pool.request();
    
    // Add parameters if provided
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });
    
    const result = await request.query(query);
    
    // Log query performance
    const executionTime = Date.now() - startTime;
    if (executionTime > 1000) { // Log slow queries (over 1 second)
      logger.warn('Slow query detected', { 
        query: query.substring(0, 100) + '...', // Truncate for logging
        executionTime,
        rowCount: result.recordset.length
      });
    }
    
    return result;
  } catch (error) {
    logger.error('Database query error:', { 
      query: query.substring(0, 100) + '...', // Truncate for logging
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

module.exports = {
  initializeMasterDb,
  initializeTenantDb,
  executeQuery
};
