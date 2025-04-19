const { 
  getAboutUs, 
  updateAboutUs, 
  getAllBlogPosts, 
  getBlogPostBySlug, 
  createBlogPost, 
  updateBlogPost, 
  deleteBlogPost 
} = require('../models/systemContentModel');
const { asyncHandler, sendSuccess, sendError } = require('../utils/controllerUtils');

/**
 * Get about us content
 */
const getAboutUsContent = asyncHandler(async (req, res) => {
  const aboutUs = await getAboutUs();
  
  if (!aboutUs) {
    return sendError(res, 404, 'About Us content not found');
  }
  
  sendSuccess(res, 200, 'About Us content retrieved successfully', aboutUs);
});

/**
 * Update about us content
 */
const updateAboutUsContent = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const userId = req.user.id;
  
  const contentId = await updateAboutUs(userId, content);
  
  sendSuccess(res, 200, 'About Us content updated successfully', { contentId });
});

/**
 * Get all blog posts
 */
const getBlogPosts = asyncHandler(async (req, res) => {
  const blogPosts = await getAllBlogPosts();
  
  sendSuccess(res, 200, 'Blog posts retrieved successfully', blogPosts);
});

/**
 * Get blog post by slug
 */
const getBlogPost = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  const blogPost = await getBlogPostBySlug(slug);
  
  if (!blogPost) {
    return sendError(res, 404, 'Blog post not found');
  }
  
  sendSuccess(res, 200, 'Blog post retrieved successfully', blogPost);
});

/**
 * Create new blog post
 */
const createNewBlogPost = asyncHandler(async (req, res) => {
  const { title, content, slug } = req.body;
  const userId = req.user.id;
  
  const contentId = await createBlogPost(userId, title, content, slug);
  
  sendSuccess(res, 201, 'Blog post created successfully', { contentId });
});

/**
 * Update blog post
 */
const updateExistingBlogPost = asyncHandler(async (req, res) => {
  const { contentId } = req.params;
  const { title, content, slug } = req.body;
  
  await updateBlogPost(contentId, title, content, slug);
  
  sendSuccess(res, 200, 'Blog post updated successfully');
});

/**
 * Delete blog post
 */
const deleteExistingBlogPost = asyncHandler(async (req, res) => {
  const { contentId } = req.params;
  
  await deleteBlogPost(contentId);
  
  sendSuccess(res, 200, 'Blog post deleted successfully');
});

module.exports = {
  getAboutUsContent,
  updateAboutUsContent,
  getBlogPosts,
  getBlogPost,
  createNewBlogPost,
  updateExistingBlogPost,
  deleteExistingBlogPost
}; 