// This script sets up the Political Promises form in the tenant database
const fs = require('fs');
const path = require('path');
const { initializeMasterDbPool } = require('../../config/database');
const logger = require('../../utils/logger');
const { getUserByEmail } = require('../../models/userModel');
const { getTenantDbConnection } = require('../../config/database');

async function setupPromisesForm() {
  try {
    logger.info('Setting up Political Promises Tracker form...');
    
    // Get the master database connection
    const masterPool = await initializeMasterDbPool();
    
    // Find the admin user
    const adminResult = await masterPool.request().query(`
      SELECT * FROM Users WHERE Email = 'admin@gmail.com'
    `);
    
    if (adminResult.recordset.length === 0) {
      logger.error('Admin user not found! Please run the seed script first.');
      process.exit(1);
    }
    
    const adminUser = adminResult.recordset[0];
    logger.info(`Found admin user with ID: ${adminUser.UserID}`);
    
    // Check connection string
    if (!adminUser.DBConnectionString) {
      logger.error('Admin user does not have a DBConnectionString! Please run the seed script first.');
      process.exit(1);
    }
    
    // Parse the connection info - it might be a JSON string or already a JSON object
    let connectionInfo;
    try {
      connectionInfo = typeof adminUser.DBConnectionString === 'string' 
        ? JSON.parse(adminUser.DBConnectionString) 
        : adminUser.DBConnectionString;
    } catch (e) {
      logger.error('Error parsing connection string:', e);
      connectionInfo = adminUser.DBConnectionString;
    }
    
    // Connect to the tenant database
    const tenantPool = await getTenantDbConnection(
      typeof connectionInfo === 'object' ? JSON.stringify(connectionInfo) : adminUser.DBConnectionString
    );
    
    // First check if FormMaster exists in the dbo schema
    const tableCheck = await tenantPool.request().query(`
      SELECT COUNT(*) AS count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'FormMaster'
    `);
    
    if (tableCheck.recordset[0].count === 0) {
      logger.error('FormMaster table not found in dbo schema! Please ensure tenant tables are created first.');
      process.exit(1);
    }
    
    // Read the promises form schema SQL
    const schemaPath = path.join(__dirname, '../../../db/promises_form_schema.sql');
    const schemaScript = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the script directly in the dbo schema
    logger.info('Executing form setup directly in dbo schema');
    await tenantPool.request().batch(schemaScript);
    
    logger.info('Political Promises Tracker form has been set up successfully.');
    process.exit(0);
  } catch (error) {
    logger.error('Error setting up Political Promises form:', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Run the setup
setupPromisesForm(); 