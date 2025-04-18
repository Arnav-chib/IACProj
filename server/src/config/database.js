const sql = require('mssql');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();

// Master database configuration
const masterConfig = JSON.parse(process.env.DB_CONNECTION_STRING);

// Add connection pooling configuration
const poolConfig = {
  ...masterConfig,
  pool: {
    max: 10, // Maximum number of connections in the pool
    min: 0,  // Minimum number of connections in the pool
    idleTimeoutMillis: 30000, // How long a connection can be idle before being removed
    acquireTimeoutMillis: 30000, // How long to wait for a connection to become available
    createTimeoutMillis: 30000, // How long to wait for a connection to be created
    destroyTimeoutMillis: 30000, // How long to wait for a connection to be destroyed
    reapIntervalMillis: 1000, // How often to check for idle connections
    createRetryIntervalMillis: 500 // How long to wait between connection creation retries
  }
};

// Initialize connection pool
const initializeMasterDbPool = async () => {
  try {
    const pool = await sql.connect(poolConfig);
    logger.info('Connected to master database successfully');
    return pool;
  } catch (error) {
    logger.error('Database connection failed:', { 
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Tenant database connection manager
const tenantPools = {};

const getTenantDbConnection = async (connectionString) => {
  try {
    if (!tenantPools[connectionString]) {
      const config = JSON.parse(connectionString);
      // Add connection pooling configuration to tenant configs
      const tenantPoolConfig = {
        ...config,
        pool: {
          max: 5, // Lower max connections for tenant pools
          min: 0,
          idleTimeoutMillis: 30000,
          acquireTimeoutMillis: 30000,
          createTimeoutMillis: 30000,
          destroyTimeoutMillis: 30000,
          reapIntervalMillis: 1000,
          createRetryIntervalMillis: 500
        }
      };
      
      tenantPools[connectionString] = await sql.connect(tenantPoolConfig);
      logger.info('Connected to tenant database successfully');
    }
    return tenantPools[connectionString];
  } catch (error) {
    logger.error('Tenant database connection failed:', { 
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Clean up tenant pools that haven't been used for a while
const cleanupTenantPools = () => {
  const now = Date.now();
  Object.keys(tenantPools).forEach(key => {
    const pool = tenantPools[key];
    if (pool.lastUsed && (now - pool.lastUsed) > 3600000) { // 1 hour
      pool.close();
      delete tenantPools[key];
      logger.info('Closed idle tenant database connection');
    }
  });
};

// Run cleanup every hour
setInterval(cleanupTenantPools, 3600000);

module.exports = {
  initializeMasterDbPool,
  getTenantDbConnection
};
