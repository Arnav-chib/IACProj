const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initializeMasterDbPool } = require('./config/database');
const { initializeMasterDb } = require('./utils/dbUtils');
const { setPool } = require('./models/userModel');
const { setPool: setOrgPool } = require('./models/orgModel');
const { scheduleTokenCleanup } = require('./services/tokenService');
const routes = require('./routes');
const logger = require('./utils/logger');
const { setupGracefulShutdown } = require('./utils/serverUtils');
const { errorHandler, AppError, ErrorTypes } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({ origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*' }));
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', async (req, res) => {
  try {
    // Check database connectivity
    const masterPool = await initializeMasterDbPool();
    await masterPool.request().query('SELECT 1 as dbConnectivity');
    
    res.status(200).json({
      status: 'UP',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health check failed:', { error: error.message });
    res.status(500).json({
      status: 'DOWN',
      database: 'Disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler for unmatched routes
app.use((req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404, ErrorTypes.NOT_FOUND.code));
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Initialize database connection and start server
async function startServer() {
  try {
    // Initialize master database connection
    const masterPool = await initializeMasterDbPool();
    
    // Set pool for user model
    setPool(masterPool);
    
    // Set pool for organization model
    setOrgPool(masterPool);
    
    // Check if required tables exist before scheduling token cleanup
    const tableCheckResult = await masterPool.request().query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'API_Tokens'
    `);
    
    if (tableCheckResult.recordset[0].count > 0) {
      // Schedule cleanup of expired API tokens only if the table exists
      scheduleTokenCleanup(masterPool);
    } else {
      logger.info('API_Tokens table does not exist yet. Token cleanup not scheduled.');
    }
    
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

// Start server
startServer();
