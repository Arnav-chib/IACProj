const sql = require('mssql');
const logger = require('../utils/logger');

// Master database pool
let masterPool;

// Set the database pool
function setPool(pool) {
  masterPool = pool;
}

// Get about us content
async function getAboutUs() {
  try {
    const result = await masterPool.request()
      .input('contentType', sql.NVarChar, 'about_us')
      .query(`
        SELECT 
          sc.ContentID,
          sc.Content,
          sc.CreatedAt,
          sc.UpdatedAt,
          u.Username as AuthorName
        FROM SystemContent sc
        JOIN Users u ON sc.CreatedBy = u.UserID
        WHERE sc.ContentType = @contentType
        ORDER BY sc.UpdatedAt DESC
        OFFSET 0 ROWS FETCH NEXT 1 ROW ONLY
      `);
    
    return result.recordset[0];
  } catch (error) {
    logger.error('Error getting about us content:', error);
    throw error;
  }
}

// Update about us content
async function updateAboutUs(userId, content) {
  try {
    // Check if about us content exists
    const existing = await getAboutUs();
    
    if (existing) {
      // Update existing content
      await masterPool.request()
        .input('contentId', sql.Int, existing.ContentID)
        .input('content', sql.NVarChar, content)
        .input('updatedAt', sql.DateTime, new Date())
        .query(`
          UPDATE SystemContent 
          SET Content = @content,
              UpdatedAt = @updatedAt
          WHERE ContentID = @contentId
        `);
      
      return existing.ContentID;
    } else {
      // Create new content
      const result = await masterPool.request()
        .input('contentType', sql.NVarChar, 'about_us')
        .input('content', sql.NVarChar, content)
        .input('createdBy', sql.Int, userId)
        .query(`
          INSERT INTO SystemContent (ContentType, Content, CreatedBy)
          OUTPUT INSERTED.ContentID
          VALUES (@contentType, @content, @createdBy)
        `);
      
      return result.recordset[0].ContentID;
    }
  } catch (error) {
    logger.error('Error updating about us content:', error);
    throw error;
  }
}

// Get all blog posts
async function getAllBlogPosts() {
  try {
    const result = await masterPool.request()
      .input('contentType', sql.NVarChar, 'blog_post')
      .query(`
        SELECT 
          sc.ContentID,
          sc.Title,
          sc.Content,
          sc.Slug,
          sc.PublishedAt,
          sc.CreatedAt,
          sc.UpdatedAt,
          u.Username as AuthorName
        FROM SystemContent sc
        JOIN Users u ON sc.CreatedBy = u.UserID
        WHERE sc.ContentType = @contentType
        ORDER BY sc.PublishedAt DESC
      `);
    
    return result.recordset;
  } catch (error) {
    logger.error('Error getting blog posts:', error);
    throw error;
  }
}

// Get blog post by slug
async function getBlogPostBySlug(slug) {
  try {
    const result = await masterPool.request()
      .input('contentType', sql.NVarChar, 'blog_post')
      .input('slug', sql.NVarChar, slug)
      .query(`
        SELECT 
          sc.ContentID,
          sc.Title,
          sc.Content,
          sc.Slug,
          sc.PublishedAt,
          sc.CreatedAt,
          sc.UpdatedAt,
          u.Username as AuthorName
        FROM SystemContent sc
        JOIN Users u ON sc.CreatedBy = u.UserID
        WHERE sc.ContentType = @contentType AND sc.Slug = @slug
      `);
    
    return result.recordset[0];
  } catch (error) {
    logger.error('Error getting blog post by slug:', error);
    throw error;
  }
}

// Get blog post by ID
async function getBlogPostById(contentId) {
  try {
    const result = await masterPool.request()
      .input('contentType', sql.NVarChar, 'blog_post')
      .input('contentId', sql.Int, contentId)
      .query(`
        SELECT 
          sc.ContentID,
          sc.Title,
          sc.Content,
          sc.Slug,
          sc.PublishedAt,
          sc.CreatedAt,
          sc.UpdatedAt,
          u.Username as AuthorName
        FROM SystemContent sc
        JOIN Users u ON sc.CreatedBy = u.UserID
        WHERE sc.ContentType = @contentType AND sc.ContentID = @contentId
      `);
    
    return result.recordset[0];
  } catch (error) {
    logger.error('Error getting blog post by ID:', error);
    throw error;
  }
}

// Create blog post
async function createBlogPost(userId, title, content, slug) {
  try {
    const result = await masterPool.request()
      .input('contentType', sql.NVarChar, 'blog_post')
      .input('title', sql.NVarChar, title)
      .input('content', sql.NVarChar, content)
      .input('slug', sql.NVarChar, slug)
      .input('publishedAt', sql.DateTime, new Date())
      .input('createdBy', sql.Int, userId)
      .query(`
        INSERT INTO SystemContent (
          ContentType, 
          Title, 
          Content, 
          Slug, 
          PublishedAt, 
          CreatedBy
        )
        OUTPUT INSERTED.ContentID
        VALUES (
          @contentType, 
          @title, 
          @content, 
          @slug, 
          @publishedAt, 
          @createdBy
        )
      `);
    
    return result.recordset[0].ContentID;
  } catch (error) {
    logger.error('Error creating blog post:', error);
    throw error;
  }
}

// Update blog post
async function updateBlogPost(contentId, title, content, slug) {
  try {
    await masterPool.request()
      .input('contentId', sql.Int, contentId)
      .input('title', sql.NVarChar, title)
      .input('content', sql.NVarChar, content)
      .input('slug', sql.NVarChar, slug)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE SystemContent 
        SET Title = @title,
            Content = @content,
            Slug = @slug,
            UpdatedAt = @updatedAt
        WHERE ContentID = @contentId
      `);
    
    return true;
  } catch (error) {
    logger.error('Error updating blog post:', error);
    throw error;
  }
}

// Delete blog post
async function deleteBlogPost(contentId) {
  try {
    await masterPool.request()
      .input('contentId', sql.Int, contentId)
      .query('DELETE FROM SystemContent WHERE ContentID = @contentId');
    
    return true;
  } catch (error) {
    logger.error('Error deleting blog post:', error);
    throw error;
  }
}

module.exports = {
  setPool,
  getAboutUs,
  updateAboutUs,
  getAllBlogPosts,
  getBlogPostBySlug,
  getBlogPostById,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost
}; 