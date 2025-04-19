// Load environment variables FIRST, before any other imports
const dotenv = require('dotenv');
const path = require('path');

// Configure dotenv with the absolute path to the .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Now import other modules AFTER environment variables are loaded
const { initializeMasterDbPool } = require('../../config/database');
const { setPool } = require('../../models/userModel');
const seedMasterUser = require('./masterUserSeed');
const logger = require('../../utils/logger');

async function runSeeds() {
  try {
    // Initialize database connection
    const masterPool = await initializeMasterDbPool();
    setPool(masterPool);

    // Run seeds
    await seedMasterUser();

    logger.info('All seeds completed successfully');
    
    // For debugging and development help - check if the admin user's tables exist
    logger.info('Checking admin user tenant schema tables...');
    
    try {
      // Find the admin user
      const adminResult = await masterPool.request().query(`
        SELECT * FROM Users WHERE Email = 'admin@gmail.com'
      `);
      
      if (adminResult.recordset.length > 0) {
        const adminUser = adminResult.recordset[0];
        logger.info(`Found admin user with ID: ${adminUser.UserID}`);
        
        // Check if we can find their schema
        try {
          const connectionInfo = typeof adminUser.DBConnectionString === 'string' 
            ? JSON.parse(adminUser.DBConnectionString) 
            : adminUser.DBConnectionString;
          
          if (connectionInfo && connectionInfo.schema) {
            logger.info(`Admin user has schema: ${connectionInfo.schema}`);
            
            // Check if the tables exist in this schema
            const tableResult = await masterPool.request().query(`
              SELECT TABLE_NAME 
              FROM INFORMATION_SCHEMA.TABLES 
              WHERE TABLE_SCHEMA = '${connectionInfo.schema}'
            `);
            
            if (tableResult.recordset.length > 0) {
              logger.info('Tables found in admin schema:');
              tableResult.recordset.forEach(table => {
                logger.info(`- ${table.TABLE_NAME}`);
              });
            } else {
              logger.warn('No tables found in admin user schema! You should re-run the seed or manually run the tenant schema SQL.');
            }
          } else {
            logger.warn('Admin user does not have a valid schema configuration');
          }
        } catch (e) {
          logger.error('Error processing admin user schema:', e);
        }
      }
    } catch (e) {
      logger.error('Error checking admin user schema:', e);
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Error running seeds:', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

runSeeds(); 