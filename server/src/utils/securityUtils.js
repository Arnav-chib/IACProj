const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Hash a password
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Compare a password with a hash
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Generate JWT token
function generateToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Generate a random token for password reset
function generateResetToken() {
  return crypto.randomBytes(40).toString('hex');
}

// Generate API token
function generateApiToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Hash API token for storage
function hashApiToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  generateResetToken,
  generateApiToken,
  hashApiToken
};
