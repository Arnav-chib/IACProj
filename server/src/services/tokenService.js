const sql = require('mssql');
const { generateApiToken, hashApiToken } = require('../utils/securityUtils');
const logger = require('../utils/logger');

// Generate a new API token for a user
async function createApiToken(userId, tokenName, permissions, masterPool) {
  try {
    // Generate a random token
    const token = generateApiToken();
    
    // Hash the token for storage
    const tokenHash = hashApiToken(token);
    
    // Set expiration date (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    
    // Store token in database
    await masterPool.request()
      .input('userId', sql.Int, userId)
      .input('tokenHash', sql.NVarChar, tokenHash)
      .input('tokenName', sql.NVarChar, tokenName)
      .input('permissions', sql.NVarChar, JSON.stringify(permissions))
      .input('expiresAt', sql.DateTime, expiresAt)
      .query(`
        INSERT INTO API_Tokens (UserID, TokenHash, TokenName, Permissions, ExpiresAt)
        VALUES (@userId, @tokenHash, @tokenName, @permissions, @expiresAt)
      `);
    
    // Return the unhashed token (will only be shown once)
    return token;
  } catch (error) {
    console.error('Error creating API token:', error);
    throw error;
  }
}

// Get all API tokens for a user
async function getUserApiTokens(userId, masterPool) {
  try {
    const result = await masterPool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT TokenID, TokenName, Permissions, CreatedAt, ExpiresAt, LastUsed
        FROM API_Tokens
        WHERE UserID = @userId
        ORDER BY CreatedAt DESC
      `);
    
    return result.recordset.map(token => ({
      id: token.TokenID,
      name: token.TokenName,
      permissions: JSON.parse(token.Permissions),
      createdAt: token.CreatedAt,
      expiresAt: token.ExpiresAt,
      lastUsed: token.LastUsed
    }));
  } catch (error) {
    console.error('Error getting user API tokens:', error);
    throw error;
  }
}

// Revoke an API token
async function revokeApiToken(tokenId, userId, masterPool) {
  try {
    const result = await masterPool.request()
      .input('tokenId', sql.Int, tokenId)
      .input('userId', sql.Int, userId)
      .query(`
        DELETE FROM API_Tokens
        WHERE TokenID = @tokenId AND UserID = @userId
      `);
    
    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error('Error revoking API token:', error);
    throw error;
  }
}

// Validate an API token
async function validateApiToken(token, masterPool) {
  try {
    // Hash the token
    const tokenHash = hashApiToken(token);
    
    // Find the token in the database
    const result = await masterPool.request()
      .input('tokenHash', sql.NVarChar, tokenHash)
      .input('now', sql.DateTime, new Date())
      .query(`
        SELECT t.*, u.OrgID, u.DBConnectionString, o.DBConnectionString AS OrgDBConnectionString
        FROM API_Tokens t
        JOIN Users u ON t.UserID = u.UserID
        LEFT JOIN Organizations o ON u.OrgID = o.OrgID
        WHERE t.TokenHash = @tokenHash AND t.ExpiresAt > @now
      `);
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    // Update last used timestamp
    await masterPool.request()
      .input('tokenHash', sql.NVarChar, tokenHash)
      .input('now', sql.DateTime, new Date())
      .query(`
        UPDATE API_Tokens
        SET LastUsed = @now
        WHERE TokenHash = @tokenHash
      `);
    
    // Return token data
    const tokenData = result.recordset[0];
    return {
      userId: tokenData.UserID,
      permissions: JSON.parse(tokenData.Permissions),
      connectionString: tokenData.OrgID ? tokenData.OrgDBConnectionString : tokenData.DBConnectionString,
      orgId: tokenData.OrgID
    };
  } catch (error) {
    console.error('Error validating API token:', error);
    throw error;
  }
}

// Clean up expired tokens
async function cleanupExpiredTokens(masterPool) {
  try {
    const now = new Date();
    const result = await masterPool.request()
      .input('now', sql.DateTime, now)
      .query(`
        DELETE FROM API_Tokens
        WHERE ExpiresAt < @now
      `);
    
    const deletedCount = result.rowsAffected[0];
    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} expired API tokens`);
    }
    
    return deletedCount;
  } catch (error) {
    logger.error('Error cleaning up expired tokens:', { error: error.message });
  }
}

// Schedule cleanup to run daily
function scheduleTokenCleanup(masterPool) {
  // Run once at startup
  cleanupExpiredTokens(masterPool).catch(err => 
    logger.error('Initial token cleanup failed:', { error: err.message })
  );
  
  // Schedule to run daily (86400000 ms = 24 hours)
  setInterval(() => {
    cleanupExpiredTokens(masterPool).catch(err => 
      logger.error('Scheduled token cleanup failed:', { error: err.message })
    );
  }, 86400000);
  
  logger.info('API token cleanup scheduled to run daily');
}

module.exports = {
  createApiToken,
  getUserApiTokens,
  revokeApiToken,
  validateApiToken,
  cleanupExpiredTokens,
  scheduleTokenCleanup
};
