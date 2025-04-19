const sql = require('mssql');
const dotenv = require('dotenv');
const path = require('path');
const logger = require('../utils/logger');

// Configure dotenv with absolute path to ensure it works regardless of where script is executed from
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Parse database configuration safely
 */
const parseDatabaseConfig = (connectionString) => {
  // If connectionString is undefined or null, use the environment variable directly
  if (!connectionString) {
    connectionString = process.env.DB_CONNECTION_STRING;
    
    // If still undefined, throw a more helpful error
    if (!connectionString) {
      logger.error('Database connection string is missing. Check your .env file.');
      throw new Error('Database connection string is missing. Check your .env file.');
    }
  }
  
  try {
    // Try to parse as JSON first
    return JSON.parse(connectionString);
  } catch (error) {
    // If JSON parsing fails, try to parse as a connection string
    try {
      // Parse connection string format like:
      // Server=server;Database=db;User Id=user;Password=password;
      const config = {};
      const parts = connectionString.split(';');
      
      parts.forEach(part => {
        if (!part) return;
        
        const [key, value] = part.split('=');
        if (!key || !value) return;
        
        const trimmedKey = key.trim();
        
        // Map common connection string keys to mssql config properties
        if (trimmedKey.toLowerCase() === 'server') {
          config.server = value.trim();
        } else if (trimmedKey.toLowerCase() === 'database') {
          config.database = value.trim();
        } else if (trimmedKey.toLowerCase() === 'user id' || trimmedKey.toLowerCase() === 'user') {
          config.user = value.trim();
        } else if (trimmedKey.toLowerCase() === 'password' || trimmedKey.toLowerCase() === 'pwd') {
          config.password = value.trim();
        } else if (trimmedKey.toLowerCase() === 'encrypt') {
          config.options = config.options || {};
          config.options.encrypt = value.toLowerCase() === 'true';
        } else if (trimmedKey.toLowerCase() === 'trustservercertificate') {
          config.options = config.options || {};
          config.options.trustServerCertificate = value.toLowerCase() === 'true';
        }
      });
      
      return config;
    } catch (parseError) {
      logger.error('Failed to parse database connection string:', {
        error: parseError.message,
        original: error.message,
        timestamp: new Date().toISOString()
      });
      throw new Error('Invalid database connection format');
    }
  }
};

// Get master database configuration from environment
const masterConfig = parseDatabaseConfig(process.env.DB_CONNECTION_STRING);

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
  },
  options: {
    ...(masterConfig.options || {}),
    enableArithAbort: true,
    trustServerCertificate: process.env.NODE_ENV !== 'production'
  }
};

// Initialize connection pool
const initializeMasterDbPool = async () => {
  try {
    const pool = await sql.connect(poolConfig);
    logger.info('Connected to master database successfully');
    
    // Test the connection
    await pool.request().query('SELECT 1 as connectionTest');
    
    return pool;
  } catch (error) {
    logger.error('Database connection failed:', { 
      error: error.message,
      stack: error.stack,
      server: poolConfig.server,
      database: poolConfig.database
    });
    throw error;
  }
};

// Tenant database connection manager
const tenantPools = {};
const tenantPoolLastUsed = {};

const getTenantDbConnection = async (connectionString) => {
  try {
    if (!connectionString) {
      throw new Error('Connection string is required');
    }
    
    // Update last used timestamp or create new connection
    if (tenantPools[connectionString]) {
      tenantPoolLastUsed[connectionString] = Date.now();
      return tenantPools[connectionString];
    }
    
    // Parse and configure tenant connection
    const config = parseDatabaseConfig(connectionString);
    
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
      },
      options: {
        ...(config.options || {}),
        enableArithAbort: true,
        trustServerCertificate: process.env.NODE_ENV !== 'production'
      }
    };
    
    // Create new connection
    tenantPools[connectionString] = await sql.connect(tenantPoolConfig);
    tenantPoolLastUsed[connectionString] = Date.now();
    
    logger.info('Connected to tenant database successfully', {
      server: config.server,
      database: config.database
    });
    
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
  const idleThreshold = 3600000; // 1 hour
  
  Object.keys(tenantPools).forEach(key => {
    const lastUsed = tenantPoolLastUsed[key] || 0;
    
    if ((now - lastUsed) > idleThreshold) {
      try {
        tenantPools[key].close();
        delete tenantPools[key];
        delete tenantPoolLastUsed[key];
        logger.info('Closed idle tenant database connection');
      } catch (error) {
        logger.error('Error closing tenant connection:', {
          error: error.message
        });
      }
    }
  });
};

// Run cleanup every hour
setInterval(cleanupTenantPools, 3600000);

module.exports = {
  initializeMasterDbPool,
  getTenantDbConnection
};
