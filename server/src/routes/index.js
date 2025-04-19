const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Dynamically load available route files
const routeFiles = fs.readdirSync(__dirname)
  .filter(file => file !== 'index.js' && file.endsWith('Routes.js'));

// Register routes
routeFiles.forEach(file => {
  try {
    const routeName = file.replace('Routes.js', '').toLowerCase();
    const route = require(`./${file}`);
    
    // Map route name to API path
    let apiPath;
    switch (routeName) {
      case 'auth':
        apiPath = '/auth';
        break;
      case 'form':
        apiPath = '/forms';
        break;
      case 'health':
        apiPath = '/health';
        break;
      case 'systemcontent':
        apiPath = '/system';
        break;
      case 'orgmember':
        apiPath = '/organizations';
        break;
      case 'embed':
        apiPath = '/embed';
        break;
      case 'token':
        apiPath = '/tokens';
        break;
      default:
        apiPath = `/${routeName}`;
    }
    
    router.use(apiPath, route);
    console.log(`Registered route: ${apiPath}`);
  } catch (error) {
    console.error(`Error loading route file ${file}:`, error);
  }
});

module.exports = router; 