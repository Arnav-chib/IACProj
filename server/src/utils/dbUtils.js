const sql = require('mssql');
const fs = require('fs').promises;
const path = require('path');
const { getTenantDbConnection } = require('../config/database');

// Initialize master database tables
async function initializeMasterDb(pool) {
  try {
    const schemaPath = path.join(__dirname, '../../db/masterSchema.sql');
    const schemaScript = await fs.readFile(schemaPath, 'utf8');
    
    await pool.request().batch(schemaScript);
    console.log('Master database schema initialized');
  } catch (error) {
    console.error('Error initializing master database schema:', error);
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
    console.log('Tenant database schema initialized');
  } catch (error) {
    console.error('Error initializing tenant database schema:', error);
    throw error;
  }
}

module.exports = {
  initializeMasterDb,
  initializeTenantDb
};
