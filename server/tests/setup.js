const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.test file if it exists
const testEnvPath = path.join(__dirname, '../.env.test');
try {
  require('dotenv').config({ path: testEnvPath });
} catch (error) {
  // If .env.test doesn't exist, use the regular .env file
  dotenv.config();
}

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods to avoid cluttering test output
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Increase timeout for tests
jest.setTimeout(10000);

// Clean up after tests
afterAll(() => {
  // Add any global cleanup here
}); 