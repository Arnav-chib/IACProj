const sql = require('mssql');
const { hashPassword, generateResetToken } = require('../utils/securityUtils');

// Master database pool
let masterPool;

// Set the database pool
function setPool(pool) {
  masterPool = pool;
}

// Get user by email
async function getUserByEmail(email) {
  try {
    const result = await masterPool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE Email = @email');
    
    return result.recordset[0];
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

// Get user by ID
async function getUserById(userId) {
  try {
    const result = await masterPool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM Users WHERE UserID = @userId');
    
    return result.recordset[0];
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

// Create user
async function createUser(userData) {
  try {
    const { username, email, password, orgId = null } = userData;
    
    // Hash the password
    const passwordHash = await hashPassword(password);
    
    // Insert the user
    const result = await masterPool.request()
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .input('passwordHash', sql.NVarChar, passwordHash)
      .input('orgId', sql.Int, orgId)
      .input('subscriptionStatus', sql.NVarChar, 'active')
      .query(`
        INSERT INTO Users (Username, Email, PasswordHash, OrgID, SubscriptionStatus)
        OUTPUT INSERTED.UserID
        VALUES (@username, @email, @passwordHash, @orgId, @subscriptionStatus)
      `);
    
    const userId = result.recordset[0].UserID;
    return userId;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Update user's password reset token
async function setPasswordResetToken(email) {
  try {
    const token = generateResetToken();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token valid for 1 hour
    
    await masterPool.request()
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
    console.error('Error setting password reset token:', error);
    throw error;
  }
}

// Get user by reset token
async function getUserByResetToken(token) {
  try {
    const result = await masterPool.request()
      .input('token', sql.NVarChar, token)
      .input('now', sql.DateTime, new Date())
      .query(`
        SELECT * FROM Users 
        WHERE ResetPasswordToken = @token 
        AND ResetPasswordExpires > @now
      `);
    
    return result.recordset[0];
  } catch (error) {
    console.error('Error getting user by reset token:', error);
    throw error;
  }
}

// Reset password
async function resetPassword(userId, newPassword) {
  try {
    const passwordHash = await hashPassword(newPassword);
    
    await masterPool.request()
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
    console.error('Error resetting password:', error);
    throw error;
  }
}

module.exports = {
  setPool,
  getUserByEmail,
  getUserById,
  createUser,
  setPasswordResetToken,
  getUserByResetToken,
  resetPassword
};
