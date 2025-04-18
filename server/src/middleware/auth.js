const { verifyToken } = require('../utils/securityUtils');
const { getUserById } = require('../models/userModel');

// Authenticate middleware
async function authenticate(req, res, next) {
  try {
    // Check if Authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Check if user exists
    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }
    
    // Check subscription status for individual users
    if (!user.OrgID && user.SubscriptionStatus !== 'active') {
      return res.status(403).json({ error: 'Subscription inactive' });
    }
    
    // Set user on request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

module.exports = { authenticate };
