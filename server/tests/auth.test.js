const request = require('supertest');
const app = require('../src/config/app');
const { initializeMasterDbPool } = require('../src/config/database');
const { initializeMasterDb } = require('../src/utils/dbUtils');
const { hashPassword } = require('../src/utils/securityUtils');
const sql = require('mssql');

// Mock the database connection
jest.mock('../src/config/database', () => ({
  initializeMasterDbPool: jest.fn().mockResolvedValue({
    request: jest.fn().mockReturnThis(),
    input: jest.fn().mockReturnThis(),
    query: jest.fn().mockResolvedValue({ recordset: [] }),
    batch: jest.fn().mockResolvedValue({}),
    close: jest.fn().mockResolvedValue({})
  }),
  getTenantDbConnection: jest.fn()
}));

// Mock the database utilities
jest.mock('../src/utils/dbUtils', () => ({
  initializeMasterDb: jest.fn().mockResolvedValue({}),
  executeQuery: jest.fn()
}));

// Mock the security utilities
jest.mock('../src/utils/securityUtils', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashedPassword'),
  comparePassword: jest.fn().mockResolvedValue(true),
  generateToken: jest.fn().mockReturnValue('mockToken'),
  verifyToken: jest.fn().mockReturnValue({ userId: 1 }),
  generateResetToken: jest.fn().mockReturnValue('resetToken'),
  generateApiToken: jest.fn().mockReturnValue('apiToken'),
  hashApiToken: jest.fn().mockReturnValue('hashedApiToken')
}));

describe('Authentication API', () => {
  beforeAll(async () => {
    // Setup test database
    const pool = await initializeMasterDbPool();
    await initializeMasterDb(pool);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      // Mock database query to return no existing user
      const mockPool = await initializeMasterDbPool();
      mockPool.request().query.mockResolvedValueOnce({ recordset: [] });
      
      // Mock successful user creation
      mockPool.request().query.mockResolvedValueOnce({ 
        recordset: [{ UserID: 1 }] 
      });
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
    });
    
    it('should not register a user with existing email', async () => {
      // Mock database query to return existing user
      const mockPool = await initializeMasterDbPool();
      mockPool.request().query.mockResolvedValueOnce({ 
        recordset: [{ UserID: 1 }] 
      });
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          name: 'Existing User'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('POST /api/auth/login', () => {
    it('should login a user with valid credentials', async () => {
      // Mock database query to return user
      const mockPool = await initializeMasterDbPool();
      mockPool.request().query.mockResolvedValueOnce({ 
        recordset: [{ 
          UserID: 1, 
          Email: 'test@example.com',
          PasswordHash: 'hashedPassword',
          Username: 'Test User'
        }] 
      });
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
    });
    
    it('should not login a user with invalid credentials', async () => {
      // Mock database query to return no user
      const mockPool = await initializeMasterDbPool();
      mockPool.request().query.mockResolvedValueOnce({ recordset: [] });
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
  });
}); 