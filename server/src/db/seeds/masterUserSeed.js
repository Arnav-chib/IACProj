const { createUser, getUserByEmail, getPool } = require('../../models/userModel');
const logger = require('../../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const { initializeTenantDb, generateConnectionString } = require('../../utils/dbUtils');

async function seedMasterUser() {
  try {
    // Check if master user already exists
    const existingUser = await getUserByEmail('admin@gmail.com');
    if (existingUser) {
      logger.info('Master user already exists');
      
      // Even if the user exists, make sure the tenant schema is initialized with tables
      if (existingUser.DBConnectionString) {
        try {
          // Parse the connection info - it might be a JSON string or already a JSON object
          let connectionInfo;
          try {
            connectionInfo = typeof existingUser.DBConnectionString === 'string' 
              ? JSON.parse(existingUser.DBConnectionString) 
              : existingUser.DBConnectionString;
          } catch (e) {
            connectionInfo = existingUser.DBConnectionString;
          }
          
          // Initialize tenant tables using this connection info
          logger.info(`Ensuring tenant tables exist for admin user (${existingUser.UserID})`);
          const pool = getPool();
          
          // Check if tables already exist in the dbo schema
          const tableResult = await pool.request().query(`
            SELECT COUNT(*) as tableCount 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'FormMaster'
          `);
          
          if (tableResult.recordset[0].tableCount === 0) {
            logger.info(`No tenant tables found, creating them now...`);
            
            // Read tenant schema SQL file
            const tenantSchemaPath = path.resolve(__dirname, '../../../db/tenantSchema.sql');
            const tenantSchemaScript = await fs.readFile(tenantSchemaPath, 'utf8');
            
            // Modified script to fix clustered index issue
            const modifiedScript = tenantSchemaScript.replace(
              /CREATE CLUSTERED INDEX IX_FormDetails_FormID ON FormDetails\(FormID, Position\)/g,
              `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FormDetails_FormID' AND object_id = OBJECT_ID('FormDetails'))
               CREATE NONCLUSTERED INDEX IX_FormDetails_FormID ON FormDetails(FormID, Position)`
            );
            
            // Execute the SQL in the dbo schema
            await pool.request().batch(modifiedScript);
            
            logger.info(`Successfully created tenant tables in dbo schema`);
          } else {
            logger.info(`Tenant tables already exist in dbo schema`);
          }
        } catch (err) {
          logger.error('Error initializing tenant tables for existing admin user:', {
            error: err.message,
            stack: err.stack,
            userId: existingUser.UserID
          });
        }
      }
      
      return existingUser;
    }

    // Get column information to understand the schema
    const pool = getPool();
    const columnsResult = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Users'
    `);
    
    // Create a set of available columns
    const availableColumns = new Set();
    columnsResult.recordset.forEach(col => {
      availableColumns.add(col.COLUMN_NAME.toLowerCase());
    });
    
    logger.logToConsole('Available columns in Users table (seed):', Array.from(availableColumns));

    // Create master user with required fields
    const masterUser = {
      username: 'admin',
      email: 'admin@gmail.com',
      password: 'admin123',
      isSystemAdmin: true,
      subscriptionStatus: 'active',
    };

    // Create master user
    const user = await createUser(masterUser);
    logger.info('Master user created successfully', { userId: user.UserID });
    
    // Create connection string for the user
    try {
      // Get the current database configuration
      const config = await pool.config;
      
      // Create a connection string using the default dbo schema
      const dbConfig = {
        server: config.server,
        database: config.database,
        user: config.user,
        password: config.password,
        options: config.options
        // No schema specified - will use default 'dbo'
      };
      
      const connectionString = JSON.stringify(dbConfig);
      
      // Update the user record with the connection information
      await pool.request()
        .input('userId', user.UserID)
        .input('dbConnectionString', connectionString)
        .query(`
          UPDATE Users 
          SET DBConnectionString = @dbConnectionString
          WHERE UserID = @userId
        `);
      
      // Initialize the tenant tables in the dbo schema
      logger.info(`Creating tenant tables in dbo schema`);
      
      // Read the tenant schema SQL directly
      const tenantSchemaPath = path.resolve(__dirname, '../../../db/tenantSchema.sql');
      const tenantSchemaScript = await fs.readFile(tenantSchemaPath, 'utf8');
      
      // Modified script to fix clustered index issue
      const modifiedScript = tenantSchemaScript.replace(
        /CREATE CLUSTERED INDEX IX_FormDetails_FormID ON FormDetails\(FormID, Position\)/g,
        `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FormDetails_FormID' AND object_id = OBJECT_ID('FormDetails'))
         CREATE NONCLUSTERED INDEX IX_FormDetails_FormID ON FormDetails(FormID, Position)`
      );
      
      // Execute the modified SQL directly
      await pool.request().batch(modifiedScript);
      
      logger.info(`Tenant database schema created successfully in dbo schema`);
      
      return user;
    } catch (dbError) {
      logger.error('Error creating schema for admin user:', {
        error: dbError.message,
        stack: dbError.stack,
        userId: user.UserID
      });
      // Don't rethrow - still return the user
      return user;
    }
  } catch (error) {
    logger.error('Error seeding master user:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

module.exports = seedMasterUser; 