const express = require('express');
const { body, param } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { isAuthenticated, isSystemAdmin } = require('../middleware/auth');
const systemContentController = require('../controllers/systemContentController');

const router = express.Router();

// Get About Us page content (public)
router.get('/about', systemContentController.getAboutUsContent);

// Update About Us page content (system admin only)
router.put('/about', [
  isAuthenticated,
  isSystemAdmin,
  body('content').notEmpty().withMessage('Content is required'),
  validateRequest
], systemContentController.updateAboutUsContent);

// Get all blog posts (public)
router.get('/blog', systemContentController.getBlogPosts);

// Get blog post by ID for editing (system admin only)
// This specific route must come BEFORE the generic slug route
router.get('/blog/edit/:contentId', [
  isAuthenticated,
  isSystemAdmin,
  param('contentId').isInt().withMessage('Invalid content ID'),
  validateRequest
], systemContentController.getBlogPostById);

// Get blog post by slug (public)
router.get('/blog/:slug', [
  param('slug').notEmpty().withMessage('Slug is required'),
  validateRequest
], systemContentController.getBlogPost);

// Create blog post (system admin only)
router.post('/blog', [
  isAuthenticated,
  isSystemAdmin,
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('slug').notEmpty().withMessage('Slug is required'),
  validateRequest
], systemContentController.createNewBlogPost);

// Update blog post (system admin only)
router.put('/blog/:contentId', [
  isAuthenticated,
  isSystemAdmin,
  param('contentId').isInt().withMessage('Invalid content ID'),
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('slug').notEmpty().withMessage('Slug is required'),
  validateRequest
], systemContentController.updateExistingBlogPost);

// Delete blog post (system admin only)
router.delete('/blog/:contentId', [
  isAuthenticated,
  isSystemAdmin,
  param('contentId').isInt().withMessage('Invalid content ID'),
  validateRequest
], systemContentController.deleteExistingBlogPost);

module.exports = router; 