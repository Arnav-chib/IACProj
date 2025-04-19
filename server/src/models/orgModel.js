const sql = require('mssql');
const logger = require('../utils/logger');

// Database connection pool
let pool;

/**
 * Set the database connection pool
 * @param {sql.ConnectionPool} dbPool - SQL connection pool
 */
function setPool(dbPool) {
  pool = dbPool;
}

module.exports = {
  setPool
}; 