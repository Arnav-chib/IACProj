const sql = require('mssql');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');
const { hashPassword, generateResetToken } = require('../utils/securityUtils');

// Database connection pool
let pool;

/**
 * Set the database connection pool
 * @param {sql.ConnectionPool} dbPool - SQL connection pool
 */
function setPool(dbPool) {
  pool = dbPool;
}

/**
 * Get the current database pool
 * @returns {sql.ConnectionPool} The current database pool
 */
function getPool() {
  return pool;
}

/**
 * Get a user by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function getUserById(userId) {
  try {
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM Users WHERE UserID = @userId');
    
    return result.recordset[0] || null;
  } catch (error) {
    logger.error('Error in getUserById:', { error: error.message, userId });
    throw error;
  }
}

/**
 * Get a user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function getUserByEmail(email) {
  try {
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE Email = @email');
    
    return result.recordset[0] || null;
  } catch (error) {
    logger.error('Error in getUserByEmail:', { error: error.message, email });
    throw error;
  }
}

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user object
 */
async function createUser(userData) {
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Get column information for Users table
    const columnsResult = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Users'
    `);
    
    // Create a map of available columns for easy lookup
    const availableColumns = new Set();
    columnsResult.recordset.forEach(col => {
      availableColumns.add(col.COLUMN_NAME.toLowerCase());
    });
    
    logger.info('Available columns in Users table:', { columns: Array.from(availableColumns) });
    
    // Build query using only columns that exist in the database
    const fieldNames = [];
    const valueParams = [];
    const request = pool.request();
    
    // Required fields - Username and Email should always exist
    if (availableColumns.has('username')) {
      fieldNames.push('Username');
      valueParams.push('@username');
      request.input('username', sql.NVarChar, userData.username || userData.email.split('@')[0]);
    }
    
    if (availableColumns.has('email')) {
      fieldNames.push('Email');
      valueParams.push('@email');
      request.input('email', sql.NVarChar, userData.email);
    }
    
    if (availableColumns.has('passwordhash')) {
      fieldNames.push('PasswordHash');
      valueParams.push('@password');
      request.input('password', sql.NVarChar, hashedPassword);
    }
    
    // Optional fields - only add if they exist in the schema
    if (availableColumns.has('firstname') && userData.firstName) {
      fieldNames.push('FirstName');
      valueParams.push('@firstName');
      request.input('firstName', sql.NVarChar, userData.firstName);
    }
    
    if (availableColumns.has('lastname') && userData.lastName) {
      fieldNames.push('LastName');
      valueParams.push('@lastName');
      request.input('lastName', sql.NVarChar, userData.lastName);
    }
    
    // Check for role/usertype field
    if (availableColumns.has('role') && userData.role) {
      fieldNames.push('Role');
      valueParams.push('@role');
      request.input('role', sql.NVarChar, userData.role);
    } else if (availableColumns.has('usertype') && userData.role) {
      fieldNames.push('UserType');
      valueParams.push('@userType');
      request.input('userType', sql.NVarChar, userData.role);
    }
    
    // Check for system admin field
    if (availableColumns.has('issystemadmin') && userData.isSystemAdmin !== undefined) {
      fieldNames.push('IsSystemAdmin');
      valueParams.push('@isSystemAdmin');
      request.input('isSystemAdmin', sql.Bit, userData.isSystemAdmin ? 1 : 0);
    }
    
    // Check for subscription status
    if (availableColumns.has('subscriptionstatus') && userData.subscriptionStatus) {
      fieldNames.push('SubscriptionStatus');
      valueParams.push('@subscriptionStatus');
      request.input('subscriptionStatus', sql.NVarChar, userData.subscriptionStatus);
    }
    
    // Add connection string if it exists
    if (availableColumns.has('dbconnectionstring') && userData.dbConnectionString) {
      fieldNames.push('DBConnectionString');
      valueParams.push('@dbConnectionString');
      request.input('dbConnectionString', sql.NVarChar, userData.dbConnectionString);
    }
    
    // Check if we have the minimum required fields
    if (fieldNames.length < 2) {
      throw new Error('Not enough valid columns found in Users table');
    }
    
    // Construct and run query
    const query = `
      INSERT INTO Users (${fieldNames.join(', ')})
      OUTPUT INSERTED.*
      VALUES (${valueParams.join(', ')})
    `;
    
    logger.info('Inserting user with query:', { query });
    const result = await request.query(query);
    return result.recordset[0];
  } catch (error) {
    logger.error('Error in createUser:', { error: error.message });
    throw error;
  }
}

/**
 * Verify user password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if password matches
 */
async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

// Update user's password reset token
async function setPasswordResetToken(email) {
  try {
    const token = generateResetToken();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token valid for 1 hour
    
    await pool.request()
      .input('email', sql.NVarChar, email)
      .input('token', sql.NVarChar, token)
      .input('expires', sql.DateTime, expires)
      .query(`
        UPDATE Users SET 
        ResetPasswordToken = @token,
        ResetPasswordExpires = @expires
        WHERE Email = @email
      `);
    
    return token;
  } catch (error) {
    logger.error('Error setting password reset token:', { error: error.message });
    throw error;
  }
}

// Get user by reset token
async function getUserByResetToken(token) {
  try {
    const result = await pool.request()
      .input('token', sql.NVarChar, token)
      .input('now', sql.DateTime, new Date())
      .query(`
        SELECT * FROM Users 
        WHERE ResetPasswordToken = @token 
        AND ResetPasswordExpires > @now
      `);
    
    return result.recordset[0];
  } catch (error) {
    logger.error('Error getting user by reset token:', { error: error.message });
    throw error;
  }
}

// Reset password
async function resetPassword(userId, newPassword) {
  try {
    const passwordHash = await hashPassword(newPassword);
    
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .query(`
        UPDATE Users SET 
        PasswordHash = @passwordHash,
        ResetPasswordToken = NULL,
        ResetPasswordExpires = NULL
        WHERE UserID = @userId
      `);
    
    return true;
  } catch (error) {
    logger.error('Error resetting password:', { error: error.message });
    throw error;
  }
}

module.exports = {
  setPool,
  getPool,
  getUserById,
  getUserByEmail,
  createUser,
  setPasswordResetToken,
  getUserByResetToken,
  resetPassword,
  verifyPassword,
  pool // Also expose pool directly for raw access
};
