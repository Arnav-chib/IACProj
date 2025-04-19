const sql = require('mssql');
const fs = require('fs').promises;
const path = require('path');
const { getTenantDbConnection } = require('../config/database');
const logger = require('./logger');

/**
 * Initialize the master database schema
 * @param {sql.ConnectionPool} pool - Database connection pool
 * @returns {Promise<void>}
 */
async function initializeMasterDb(pool) {
  try {
    // Check if the Users table exists
    const tableResult = await pool.request().query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Users'
    `);
    
    // If the table exists, we assume the schema is initialized
    if (tableResult.recordset[0].count > 0) {
      logger.info('Master database schema already exists');
      
      // Verify admin user exists
      const adminCheck = await pool.request().query(`
        SELECT COUNT(*) as count FROM Users WHERE Email = 'admin@gmail.com'
      `);
      
      if (adminCheck.recordset[0].count === 0) {
        // Create admin user if it doesn't exist
        const hashedPassword = '$2b$10$RzNvbW5I7qqvGPNKPfduweK6dKdSfqP8YBNL5M8aK4IbXJbX3PhBC'; // admin123
        
        await pool.request().query(`
          INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Role, IsSystemAdmin)
          VALUES ('admin@gmail.com', '${hashedPassword}', 'Admin', 'User', 'admin', 1)
        `);
        
        logger.logToConsole('Admin user created during initialization check');
      }
      
      return;
    }
    
    // Otherwise, create the schema
    logger.info('Initializing master database schema...');
    
    // Create Users table
    await pool.request().query(`
      CREATE TABLE Users (
        UserID INT PRIMARY KEY IDENTITY(1,1),
        Email NVARCHAR(255) NOT NULL UNIQUE,
        Username NVARCHAR(100),
        PasswordHash NVARCHAR(255) NOT NULL,
        FirstName NVARCHAR(100),
        LastName NVARCHAR(100),
        Role NVARCHAR(50) NOT NULL DEFAULT 'user',
        IsSystemAdmin BIT NOT NULL DEFAULT 0,
        IsOrgAdmin BIT NOT NULL DEFAULT 0,
        OrgID INT NULL,
        SubscriptionStatus NVARCHAR(50) DEFAULT 'active',
        DBConnectionString NVARCHAR(MAX) NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        ResetPasswordToken NVARCHAR(255),
        ResetPasswordExpires DATETIME
      )
    `);
    
    // Create default admin user
    const hashedPassword = '$2b$10$RzNvbW5I7qqvGPNKPfduweK6dKdSfqP8YBNL5M8aK4IbXJbX3PhBC'; // admin123
    
    await pool.request().query(`
      INSERT INTO Users (Email, Username, PasswordHash, FirstName, LastName, Role, IsSystemAdmin)
      VALUES ('admin@gmail.com', 'admin', '${hashedPassword}', 'Admin', 'User', 'admin', 1)
    `);
    
    logger.logToConsole('Master database schema initialized with admin user');
  } catch (error) {
    logger.error('Error initializing master database:', { 
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
    
    // Check if tables already exist
    const checkResult = await tenantPool.request()
      .query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
      `);
    
    if (checkResult.recordset[0].count > 0) {
      logger.info('Tenant database schema already exists');
      return;
    }
    
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

// Execute a query with error handling
async function executeQuery(pool, query, params = {}) {
  try {
    const request = pool.request();
    
    // Add parameters to request
    Object.keys(params).forEach(key => {
      request.input(key, params[key].type, params[key].value);
    });
    
    const result = await request.query(query);
    return result;
  } catch (error) {
    logger.error('Error executing query:', { 
      error: error.message,
      stack: error.stack,
      query
    });
    throw error;
  }
}

// Generate a unique database name for a new tenant
function generateTenantDatabaseName(type, id) {
  // Create a name based on tenant type (user/org) and ID
  // Format: FormDB_User_123 or FormDB_Org_456
  const timestamp = new Date().getTime().toString().slice(-6); // Last 6 digits of timestamp for uniqueness
  const dbName = `FormDB_${type}_${id}_${timestamp}`;
  
  // Ensure the name is SQL Server compliant (alphanumeric and underscores only)
  return dbName.replace(/[^a-zA-Z0-9_]/g, '_');
}

// Generate a connection string for a new tenant database
function generateConnectionString(databaseName) {
  try {
    // Get the base connection info from environment
    const baseConfig = JSON.parse(process.env.DB_CONNECTION_STRING);
    
    // Create a new config with the new database name
    const newConfig = {
      ...baseConfig,
      database: databaseName
    };
    
    // Convert to connection string format
    return JSON.stringify(newConfig);
  } catch (error) {
    logger.error('Error generating connection string:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Create a new database for a tenant
async function createTenantDatabase(pool, databaseName) {
  try {
    logger.info(`Creating new tenant database: ${databaseName}`);
    
    // Create the database
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${databaseName}')
      BEGIN
        CREATE DATABASE [${databaseName}]
      END
    `);
    
    logger.info(`Tenant database created successfully: ${databaseName}`);
    
    // Generate connection string for the new database
    const connectionString = generateConnectionString(databaseName);
    
    // Initialize the schema in the new database
    await initializeTenantDb(connectionString);
    
    return connectionString;
  } catch (error) {
    logger.error('Error creating tenant database:', {
      error: error.message,
      stack: error.stack,
      databaseName
    });
    throw error;
  }
}

module.exports = {
  initializeMasterDb,
  initializeTenantDb,
  executeQuery,
  generateTenantDatabaseName,
  createTenantDatabase,
  generateConnectionString
};
