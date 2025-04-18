const app = require('./config/app');
const { initializeMasterDbPool } = require('./config/database');
const { initializeMasterDb } = require('./utils/dbUtils');
const { setPool } = require('./models/userModel');
const dotenv = require('dotenv');

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
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server gracefully...');
  process.exit(0);
});
