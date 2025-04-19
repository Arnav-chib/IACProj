const { createApiToken, getUserApiTokens, revokeApiToken } = require('../services/tokenService');
const { initializeMasterDbPool } = require('../config/database');

let masterPool;

// Initialize the master pool
async function init() {
  try {
    console.log('Initializing master pool for token controller');
    masterPool = await initializeMasterDbPool();
    console.log('Master pool initialized successfully');
  } catch (error) {
    console.error('Failed to initialize master pool for token controller:', error);
  }
}
// Call init immediately
init();

// Create a new API token
async function createToken(req, res) {
  try {
    // Ensure masterPool is initialized
    if (!masterPool) {
      console.log('Master pool not initialized, initializing now');
      await init();
    }
    
    const { name, permissions } = req.body;
    const userId = req.user.UserID;
    
    if (!name) {
      return res.status(400).json({ error: 'Token name is required' });
    }
    
    // Default permissions if not provided
    const tokenPermissions = permissions || {
      readForms: true,
      readResponses: false,
      submitResponses: false
    };
    
    // Create token
    const token = await createApiToken(userId, name, tokenPermissions, masterPool);
    
    res.status(201).json({
      message: 'API token created successfully',
      token // Note: This is the only time the raw token will be shown
    });
  } catch (error) {
    console.error('Error creating API token:', error);
    res.status(500).json({ error: 'Failed to create API token' });
  }
}

// List user's API tokens
async function listTokens(req, res) {
  try {
    // Ensure masterPool is initialized
    if (!masterPool) {
      console.log('Master pool not initialized, initializing now');
      await init();
    }
    
    const userId = req.user.UserID;
    
    // Get tokens
    const tokens = await getUserApiTokens(userId, masterPool);
    
    res.json({ tokens });
  } catch (error) {
    console.error('Error listing API tokens:', error);
    res.status(500).json({ error: 'Failed to retrieve API tokens' });
  }
}

// Revoke an API token
async function revokeToken(req, res) {
  try {
    // Ensure masterPool is initialized
    if (!masterPool) {
      console.log('Master pool not initialized, initializing now');
      await init();
    }
    
    const { id } = req.params;
    const userId = req.user.UserID;
    
    // Revoke token
    const success = await revokeApiToken(id, userId, masterPool);
    
    if (!success) {
      return res.status(404).json({ error: 'Token not found or not owned by user' });
    }
    
    res.json({ message: 'API token revoked successfully' });
  } catch (error) {
    console.error('Error revoking API token:', error);
    res.status(500).json({ error: 'Failed to revoke API token' });
  }
}

module.exports = {
  createToken,
  listTokens,
  revokeToken
};
