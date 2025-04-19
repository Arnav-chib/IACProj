const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ level, message, timestamp, ...rest }) => {
    const restString = Object.keys(rest).length ? JSON.stringify(rest, null, 2) : '';
    return `${timestamp} ${level.toUpperCase()}: ${message} ${restString}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: 'debug', // Set to debug to capture more logs
  format: logFormat,
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transports
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log') 
    })
  ]
});

// Explicitly log to console for critical operations
logger.logToConsole = (message, meta = {}) => {
  console.log(`LOG: ${message}`, meta);
  logger.info(message, meta);
};

module.exports = logger; 