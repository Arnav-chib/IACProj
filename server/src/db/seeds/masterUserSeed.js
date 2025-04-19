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
          
          if (connectionInfo && connectionInfo.schema) {
            const schemaName = connectionInfo.schema;
            
            // Check if tables already exist in this schema
            const tableResult = await pool.request().query(`
              SELECT COUNT(*) as tableCount 
              FROM INFORMATION_SCHEMA.TABLES 
              WHERE TABLE_SCHEMA = '${schemaName}'
            `);
            
            if (tableResult.recordset[0].tableCount === 0) {
              logger.info(`No tables found in schema ${schemaName}, creating them now...`);
              
              // Read tenant schema SQL file
              const tenantSchemaPath = path.resolve(__dirname, '../../../db/tenantSchema.sql');
              const tenantSchemaScript = await fs.readFile(tenantSchemaPath, 'utf8');
              
              // Execute the SQL within the user's schema
              await pool.request().batch(`
                -- Create tables in the specific schema
                USE [${connectionInfo.database}];
                
                -- Execute statements in the context of the specified schema
                DECLARE @sql NVARCHAR(MAX) = N'
                  BEGIN TRANSACTION;
                  
                  ${tenantSchemaScript.replace(/'/g, "''")}
                  
                  COMMIT;
                ';
                
                -- Execute the SQL in the context of the schema
                EXEC sp_executesql @sql;
              `);
              
              logger.info(`Successfully created tenant tables in schema ${schemaName}`);
            } else {
              logger.info(`Tables already exist in schema ${schemaName}`);
            }
          } else {
            logger.warn('Admin user has invalid connection info');
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
    
    // For master user, create a schema in the master database
    try {
      // Create a schema for this user in the master database
      const schemaName = `User_${user.UserID}_Schema`;
      
      // Create schema if it doesn't exist
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = '${schemaName}')
        BEGIN
          EXEC('CREATE SCHEMA [${schemaName}]')
        END
      `);
      
      // Get the current database configuration
      const config = await pool.config;
      
      // Create a proper connection string for this schema
      const dbConfig = {
        server: config.server,
        database: config.database,
        user: config.user,
        password: config.password,
        options: config.options,
        schema: schemaName
      };
      
      const connectionString = JSON.stringify(dbConfig);
      
      // Update the user record with the proper connection information
      await pool.request()
        .input('userId', user.UserID)
        .input('dbConnectionString', connectionString)
        .query(`
          UPDATE Users 
          SET DBConnectionString = @dbConnectionString
          WHERE UserID = @userId
        `);
      
      // Initialize the tenant tables in this schema
      logger.info(`Creating tenant tables in schema ${schemaName}`);
      
      // Read the tenant schema SQL directly
      const tenantSchemaPath = path.resolve(__dirname, '../../../db/tenantSchema.sql');
      const tenantSchemaScript = await fs.readFile(tenantSchemaPath, 'utf8');
      
      // Execute the SQL within the user's schema
      await pool.request().batch(`
        -- Create tables in the specific schema
        USE [${config.database}];
        
        -- Execute statements in the context of the specified schema
        DECLARE @sql NVARCHAR(MAX) = N'
          BEGIN TRANSACTION;
          
          ${tenantSchemaScript.replace(/'/g, "''")}
          
          COMMIT;
        ';
        
        -- Execute the SQL in the context of the schema
        EXEC sp_executesql @sql;
      `);
      
      logger.info(`Tenant database schema created successfully in schema ${schemaName}`);
      
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