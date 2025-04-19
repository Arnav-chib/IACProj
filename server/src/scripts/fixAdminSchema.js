/**
 * This script is used to fix the admin user's schema if it already exists
 * but doesn't have properly initialized tables.
 * 
 * To run this script:
 * node src/scripts/fixAdminSchema.js
 */

// Load environment variables
require('dotenv').config();

const { initializeMasterDbPool } = require('../config/database');
const { initializeTenantDb } = require('../utils/dbUtils');
const { setPool } = require('../models/userModel');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

async function fixAdminSchema() {
  let pool;
  
  try {
    // Initialize database connection
    pool = await initializeMasterDbPool();
    setPool(pool);
    
    // Find the admin user
    logger.info('Looking for admin user...');
    const adminResult = await pool.request().query(`
      SELECT * FROM Users WHERE Email = 'admin@gmail.com'
    `);
    
    if (adminResult.recordset.length === 0) {
      logger.error('Admin user not found in the database');
      return;
    }
    
    const adminUser = adminResult.recordset[0];
    logger.info(`Found admin user with ID: ${adminUser.UserID}`);
    
    // Get schema information for this user
    let schemaName;
    let connectionString;
    
    if (adminUser.DBConnectionString) {
      try {
        // Try to parse as JSON
        const connectionInfo = typeof adminUser.DBConnectionString === 'string' 
          ? JSON.parse(adminUser.DBConnectionString)
          : adminUser.DBConnectionString;
        
        if (connectionInfo.schemaName) {
          // Old format just had schemaName
          schemaName = connectionInfo.schemaName;
        } else if (connectionInfo.schema) {
          // New format has full connection info with schema
          schemaName = connectionInfo.schema;
          connectionString = adminUser.DBConnectionString;
        }
      } catch (e) {
        // If not JSON, use as-is (though unlikely)
        connectionString = adminUser.DBConnectionString;
      }
    }
    
    if (!schemaName && !connectionString) {
      // Create a new schema for this user
      schemaName = `User_${adminUser.UserID}_Schema`;
      logger.info(`No schema found for admin user. Creating new schema: ${schemaName}`);
      
      // Create schema if it doesn't exist
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = '${schemaName}')
        BEGIN
          EXEC('CREATE SCHEMA [${schemaName}]')
        END
      `);
    } else {
      logger.info(`Found schema for admin user: ${schemaName}`);
      
      // Make sure schema exists
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = '${schemaName}')
        BEGIN
          EXEC('CREATE SCHEMA [${schemaName}]')
        END
      `);
    }
    
    // If we don't have a valid connection string, create one
    if (!connectionString) {
      const config = pool.config;
      
      // Create a proper connection string for this schema
      const dbConfig = {
        server: config.server,
        database: config.database,
        user: config.user,
        password: config.password,
        options: config.options,
        schema: schemaName
      };
      
      connectionString = JSON.stringify(dbConfig);
      
      // Update the user with this connection string
      await pool.request()
        .input('userId', adminUser.UserID)
        .input('dbConnectionString', connectionString)
        .query(`
          UPDATE Users 
          SET DBConnectionString = @dbConnectionString
          WHERE UserID = @userId
        `);
        
      logger.info('Updated admin user with proper connection string');
    }
    
    // Initialize the tenant tables in this schema
    logger.info('Initializing tenant tables in admin schema...');
    await initializeTenantDb(connectionString);
    
    // Verify tables were created
    const tableResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = '${schemaName}'
    `);
    
    if (tableResult.recordset.length > 0) {
      logger.info('Tables created successfully in admin schema:');
      tableResult.recordset.forEach(table => {
        logger.info(`- ${table.TABLE_NAME}`);
      });
    } else {
      logger.warn('No tables were created in the admin schema!');
    }
    
    logger.info('Admin schema fix completed successfully.');
  } catch (error) {
    logger.error('Error fixing admin schema:', { 
      error: error.message,
      stack: error.stack
    });
  } finally {
    // Close the database connection
    if (pool) {
      try {
        await pool.close();
      } catch (e) {
        logger.error('Error closing database connection:', e);
      }
    }
  }
}

// Run the script
fixAdminSchema().catch(err => {
  logger.error('Unhandled error in fixAdminSchema script:', err);
  process.exit(1);
}); 