const sql = require('mssql');
const dotenv = require('dotenv');

dotenv.config();

// Master database configuration
const masterConfig = JSON.parse(process.env.DB_CONNECTION_STRING);

// Initialize connection pool
const initializeMasterDbPool = async () => {
  try {
    const pool = await sql.connect(masterConfig);
    console.log('Connected to master database');
    return pool;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

// Tenant database connection manager
const tenantPools = {};

const getTenantDbConnection = async (connectionString) => {
  if (!tenantPools[connectionString]) {
    const config = JSON.parse(connectionString);
    tenantPools[connectionString] = await sql.connect(config);
  }
  return tenantPools[connectionString];
};

module.exports = {
  initializeMasterDbPool,
  getTenantDbConnection
};
