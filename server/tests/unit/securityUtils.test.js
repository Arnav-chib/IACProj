const { hashPassword, comparePassword, generateToken, verifyToken } = require('../../src/utils/securityUtils');

describe('Security Utilities', () => {
  describe('Password Hashing', () => {
    test('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      
      // Hash should be a string
      expect(typeof hash).toBe('string');
      
      // Hash should be different from the original password
      expect(hash).not.toBe(password);
      
      // Hash should be sufficiently long (bcrypt hashes are typically ~60 chars)
      expect(hash.length).toBeGreaterThan(50);
    });
    
    test('should verify a correct password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      
      const isValid = await comparePassword(password, hash);
      expect(isValid).toBe(true);
    });
    
    test('should not verify an incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword123';
      const hash = await hashPassword(password);
      
      const isValid = await comparePassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });
  
  describe('JWT Tokens', () => {
    // Set a test secret for JWT
    process.env.JWT_SECRET = 'test_secret_key';
    
    test('should generate a JWT token', () => {
      const payload = { userId: 123 };
      const token = generateToken(payload);
      
      // Token should be a string
      expect(typeof token).toBe('string');
      
      // Token should have 3 parts (header.payload.signature)
      const parts = token.split('.');
      expect(parts.length).toBe(3);
    });
    
    test('should verify a valid token', () => {
      const payload = { userId: 123 };
      const token = generateToken(payload);
      
      const decoded = verifyToken(token);
      
      // Decoded token should contain our payload data
      expect(decoded.userId).toBe(payload.userId);
    });
    
    test('should not verify an invalid token', () => {
      const invalidToken = 'invalid.token.string';
      
      const decoded = verifyToken(invalidToken);
      
      // Should return null for invalid token
      expect(decoded).toBeNull();
    });
  });
});
