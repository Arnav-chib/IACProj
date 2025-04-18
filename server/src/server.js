const app = require('./config/app');
const { initializeMasterDbPool } = require('./config/database');
const { initializeMasterDb } = require('./utils/dbUtils');
const { setPool } = require('./models/userModel');
const dotenv = require('dotenv');
const logger = require('./utils/logger');

dotenv.config();

const PORT = process.env.PORT || 3000;

// Initialize database connection and start server
async function startServer() {
  try {
    // Initialize master database connection
    const masterPool = await initializeMasterDbPool();
    
    // Set pool for user model
    setPool(masterPool);
    
    // Initialize master database schema
    await initializeMasterDb(masterPool);
    
    // Start the server
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
    
    // Handle graceful shutdown
    setupGracefulShutdown(server, masterPool);
    
  } catch (err) {
    logger.error('Failed to start server:', { 
      error: err.message,
      stack: err.stack
    });
    process.exit(1);
  }
}

// Setup graceful shutdown
function setupGracefulShutdown(server, pool) {
  // Handle SIGTERM signal
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    shutdown(server, pool);
  });
  
  // Handle SIGINT signal (Ctrl+C)
  process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    shutdown(server, pool);
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', { 
      error: err.message,
      stack: err.stack
    });
    shutdown(server, pool);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection:', { 
      reason: reason.message || reason,
      stack: reason.stack
    });
    shutdown(server, pool);
  });
}

// Graceful shutdown function
async function shutdown(server, pool) {
  // Set a timeout to force exit if graceful shutdown takes too long
  const forceExit = setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
  
  try {
    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');
    });
    
    // Close database connections
    if (pool) {
      await pool.close();
      logger.info('Database connections closed');
    }
    
    // Clear the force exit timeout
    clearTimeout(forceExit);
    
    // Exit the process
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown:', { 
      error: err.message,
      stack: err.stack
    });
    process.exit(1);
  }
}

startServer();
