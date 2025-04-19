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
    logger.info('Checking tenant tables...');
    
    try {
      // Check if tenant tables exist in the dbo schema
      const tableResult = await masterPool.request().query(`
        SELECT COUNT(*) AS tableCount 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'FormMaster'
      `);
      
      if (tableResult.recordset[0].tableCount === 0) {
        logger.warn('No tenant tables found in dbo schema! Creating tables now...');
        
        // Get tenant schema SQL
        const tenantSchemaPath = path.resolve(__dirname, '../../../db/tenantSchema.sql');
        const tenantSchemaScript = await fs.readFile(tenantSchemaPath, 'utf8');
        
        // Modified script to fix clustered index issue
        const modifiedScript = tenantSchemaScript.replace(
          /CREATE CLUSTERED INDEX IX_FormDetails_FormID ON FormDetails\(FormID, Position\)/g,
          `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FormDetails_FormID' AND object_id = OBJECT_ID('FormDetails'))
           CREATE NONCLUSTERED INDEX IX_FormDetails_FormID ON FormDetails(FormID, Position)`
        );
        
        // Execute the SQL directly
        await masterPool.request().batch(modifiedScript);
        
        logger.info('Successfully created tenant tables in dbo schema');
      } else {
        logger.info('Tenant tables already exist in dbo schema');
      }
    } catch (e) {
      logger.error('Error creating tenant tables:', e);
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