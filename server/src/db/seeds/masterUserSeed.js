const { createUser, getUserByEmail, getPool } = require('../../models/userModel');
const logger = require('../../utils/logger');

async function seedMasterUser() {
  try {
    // Check if master user already exists
    const existingUser = await getUserByEmail('admin@gmail.com');
    if (existingUser) {
      logger.info('Master user already exists');
      return;
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
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
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
      
      // Update the user record with the schema information
      await pool.request()
        .input('userId', user.UserID)
        .input('schemaInfo', JSON.stringify({ schemaName, isMasterSchema: true }))
        .query(`
          UPDATE Users 
          SET DBConnectionString = @schemaInfo
          WHERE UserID = @userId
        `);
      
      logger.logToConsole(`Created schema for admin user: ${user.UserID}, schema: ${schemaName}`);
    } catch (dbError) {
      logger.error('Error creating schema for admin user:', {
        error: dbError.message,
        stack: dbError.stack,
        userId: user.UserID
      });
      // Don't rethrow - we still want to consider the seeding successful
      // even if the schema creation failed
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