const { createUser, getUserByEmail, getPool } = require('../../models/userModel');
const { generateTenantDatabaseName, createTenantDatabase } = require('../../utils/dbUtils');
const logger = require('../../utils/logger');

async function seedMasterUser() {
  try {
    // Check if master user already exists
    const existingUser = await getUserByEmail('admin@gmail.com');
    if (existingUser) {
      logger.info('Master user already exists');
      return;
    }

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
      // Initially no connection string - will be set after creation
    };

    // Create master user
    const user = await createUser(masterUser);
    logger.info('Master user created successfully', { userId: user.UserID });
    
    // Now create a tenant database for this user
    try {
      // Get the database pool
      const pool = getPool();
      
      // Generate a unique database name for this user
      const dbName = generateTenantDatabaseName('User', user.UserID);
      
      // Create a new database for this user and get the connection string
      const connectionString = await createTenantDatabase(pool, dbName);
      
      // Update the user with the connection string
      await pool.request()
        .input('userId', user.UserID)
        .input('dbConnectionString', connectionString)
        .query(`
          UPDATE Users 
          SET DBConnectionString = @dbConnectionString
          WHERE UserID = @userId
        `);
      
      logger.info(`Created new tenant database for admin user: ${user.UserID}, database: ${dbName}`);
    } catch (dbError) {
      logger.error('Error creating tenant database for admin user:', {
        error: dbError.message,
        stack: dbError.stack,
        userId: user.UserID
      });
      // Don't rethrow - we still want to consider the seeding successful
      // even if the tenant db creation failed
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