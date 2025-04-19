// Load environment variables FIRST, before any other imports
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs').promises;

// Configure dotenv with the absolute path to the .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Now import other modules AFTER environment variables are loaded
const { initializeMasterDbPool } = require('../../config/database');
const { setPool } = require('../../models/userModel');
const { setPool: setSystemContentPool } = require('../../models/systemContentModel');
const seedMasterUser = require('./masterUserSeed');
const logger = require('../../utils/logger');

// Function to seed initial system content
async function seedInitialSystemContent(pool, adminUserId) {
  try {
    logger.info('Checking if system content needs to be seeded...');
    
    // Check if about us content exists
    const aboutUsCheck = await pool.request().query(`
      SELECT COUNT(*) as count 
      FROM SystemContent 
      WHERE ContentType = 'about_us'
    `);
    
    if (aboutUsCheck.recordset[0].count === 0) {
      // Create initial About Us content
      logger.info('Creating initial About Us content');
      
      await pool.request()
        .input('contentType', 'about_us')
        .input('content', '<h1>About Our Form Builder</h1><p>Welcome to our powerful and flexible form building platform. We make it easy to create, share, and manage forms for any purpose.</p><p>Our system allows you to customize forms with various field types, validation rules, and complex layouts to meet your specific needs.</p>')
        .input('createdBy', adminUserId)
        .query(`
          INSERT INTO SystemContent (ContentType, Content, CreatedBy)
          VALUES (@contentType, @content, @createdBy)
        `);
      
      logger.info('Initial About Us content created successfully');
    }
    
    // Check if any blog posts exist
    const blogPostCheck = await pool.request().query(`
      SELECT COUNT(*) as count 
      FROM SystemContent 
      WHERE ContentType = 'blog_post'
    `);
    
    if (blogPostCheck.recordset[0].count === 0) {
      // Create initial blog posts
      logger.info('Creating initial blog posts');
      
      const blogPosts = [
        {
          title: 'Getting Started with Form Builder',
          content: '<h1>Getting Started with Form Builder</h1><p>This guide will help you create your first form using our platform. Learn about the various field types, validation options, and how to share your form with users.</p>',
          slug: 'getting-started'
        },
        {
          title: 'Advanced Form Techniques',
          content: '<h1>Advanced Form Techniques</h1><p>Take your forms to the next level with conditional logic, complex validation rules, and custom layouts. This post covers advanced techniques for power users.</p>',
          slug: 'advanced-techniques'
        }
      ];
      
      // Insert blog posts
      for (const post of blogPosts) {
        await pool.request()
          .input('contentType', 'blog_post')
          .input('title', post.title)
          .input('content', post.content)
          .input('slug', post.slug)
          .input('publishedAt', new Date())
          .input('createdBy', adminUserId)
          .query(`
            INSERT INTO SystemContent (ContentType, Title, Content, Slug, PublishedAt, CreatedBy)
            VALUES (@contentType, @title, @content, @slug, @publishedAt, @createdBy)
          `);
      }
      
      logger.info('Initial blog posts created successfully');
    }
    
    logger.info('System content seeding completed successfully');
  } catch (error) {
    logger.error('Error seeding system content:', {
      error: error.message,
      stack: error.stack
    });
    // Don't throw, continue with other operations
  }
}

async function runSeeds() {
  try {
    // Initialize database connection
    const masterPool = await initializeMasterDbPool();
    setPool(masterPool);
    setSystemContentPool(masterPool);

    // Create master database schema first 
    logger.info('Creating master database schema...');
    const masterSchemaPath = path.resolve(__dirname, '../../../db/masterSchema.sql');
    const masterSchemaScript = await fs.readFile(masterSchemaPath, 'utf8');
    await masterPool.request().batch(masterSchemaScript);
    logger.info('Master database schema created successfully');

    // Now run the seed to create admin user
    const adminUser = await seedMasterUser();

    // Seed initial system content
    if (adminUser && adminUser.UserID) {
      await seedInitialSystemContent(masterPool, adminUser.UserID);
    }

    logger.info('All seeds completed successfully');
    
    // For debugging and development help - check if the admin user's tables exist
    logger.info('Checking admin user tenant schema tables...');
    
    try {
      // Find the admin user
      const adminResult = await masterPool.request().query(`
        SELECT * FROM Users WHERE Email = 'admin@gmail.com'
      `);
      
      if (adminResult.recordset.length > 0) {
        const adminUser = adminResult.recordset[0];
        logger.info(`Found admin user with ID: ${adminUser.UserID}`);
        
        // Check if we can find their schema
        try {
          const connectionInfo = typeof adminUser.DBConnectionString === 'string' 
            ? JSON.parse(adminUser.DBConnectionString) 
            : adminUser.DBConnectionString;
          
          if (connectionInfo && connectionInfo.schema) {
            logger.info(`Admin user has schema: ${connectionInfo.schema}`);
            
            // Check if the tables exist in this schema
            const tableResult = await masterPool.request().query(`
              SELECT TABLE_NAME 
              FROM INFORMATION_SCHEMA.TABLES 
              WHERE TABLE_SCHEMA = '${connectionInfo.schema}'
            `);
            
            if (tableResult.recordset.length > 0) {
              logger.info('Tables found in admin schema:');
              tableResult.recordset.forEach(table => {
                logger.info(`- ${table.TABLE_NAME}`);
              });
            } else {
              logger.warn('No tables found in admin user schema! Creating tables now...');
              
              // Get tenant schema SQL
              const tenantSchemaPath = path.resolve(__dirname, '../../../db/tenantSchema.sql');
              const tenantSchemaScript = await fs.readFile(tenantSchemaPath, 'utf8');
              
              // Execute tenant schema SQL within the admin user's schema
              await masterPool.request().batch(`
                -- Set the schema context
                USE [${connectionInfo.database}];
                
                -- Create tenant tables in the specific schema
                SET QUOTED_IDENTIFIER ON;
                
                -- Execute statements in the context of the specified schema
                EXEC('
                  BEGIN TRANSACTION;
                  
                  ${tenantSchemaScript.replace(/'/g, "''")}
                  
                  COMMIT;
                ');
              `);
              
              logger.info('Successfully created tenant tables in admin schema');
            }
          } else {
            logger.warn('Admin user does not have a valid schema configuration');
          }
        } catch (e) {
          logger.error('Error processing admin user schema:', e);
        }
      }
    } catch (e) {
      logger.error('Error checking admin user schema:', e);
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Error running seeds:', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

runSeeds(); 