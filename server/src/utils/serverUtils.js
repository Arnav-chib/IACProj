const logger = require('./logger');

/**
 * Set up graceful shutdown for the server
 * @param {http.Server} server - HTTP server instance
 * @param {sql.ConnectionPool} masterPool - Master database connection pool
 */
function setupGracefulShutdown(server, masterPool) {
  // Handle process termination
  const handleShutdown = async (signal) => {
    logger.info(`Received ${signal} signal, shutting down gracefully`);
    
    // Close HTTP server first (stop accepting new connections)
    server.close(() => {
      logger.info('HTTP server closed');
      
      // Close database connections
      if (masterPool) {
        masterPool.close().then(() => {
          logger.info('Database connections closed');
          logger.info('Graceful shutdown completed');
          process.exit(0);
        }).catch(err => {
          logger.error('Error closing database connections', err);
          process.exit(1);
        });
      } else {
        logger.info('No database connections to close');
        logger.info('Graceful shutdown completed');
        process.exit(0);
      }
    });
    
    // If server doesn't close in 10 seconds, force shutdown
    setTimeout(() => {
      logger.warn('Server did not close in time, forcing shutdown');
      process.exit(1);
    }, 10000);
  };
  
  // Listen for termination signals
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', { 
      error: err.message,
      stack: err.stack
    });
    handleShutdown('uncaughtException');
  });
}

module.exports = {
  setupGracefulShutdown
}; 