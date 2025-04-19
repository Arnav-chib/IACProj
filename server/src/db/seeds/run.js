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