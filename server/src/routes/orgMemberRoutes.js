const express = require('express');
const { body, param } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { isAuthenticated, isOrgAdmin, hasOrgAccess } = require('../middleware/auth');
const orgMemberController = require('../controllers/orgMemberController');

const router = express.Router();

// Get organization members (org admin or member)
router.get('/:orgId/members', [
  isAuthenticated,
  hasOrgAccess,
  param('orgId').isInt().withMessage('Invalid organization ID'),
  validateRequest
], orgMemberController.getMembers);

// Add member to organization (org admin only)
router.post('/:orgId/members', [
  isAuthenticated,
  isOrgAdmin,
  param('orgId').isInt().withMessage('Invalid organization ID'),
  body('userId').isInt().withMessage('Invalid user ID'),
  body('role').isIn(['admin', 'member']).withMessage('Invalid role'),
  validateRequest
], orgMemberController.addMember);

// Update member role (org admin only)
router.put('/:orgId/members/:memberId', [
  isAuthenticated,
  isOrgAdmin,
  param('orgId').isInt().withMessage('Invalid organization ID'),
  param('memberId').isInt().withMessage('Invalid member ID'),
  body('role').isIn(['admin', 'member']).withMessage('Invalid role'),
  validateRequest
], orgMemberController.updateRole);

// Remove member from organization (org admin only)
router.delete('/:orgId/members/:memberId', [
  isAuthenticated,
  isOrgAdmin,
  param('orgId').isInt().withMessage('Invalid organization ID'),
  param('memberId').isInt().withMessage('Invalid member ID'),
  validateRequest
], orgMemberController.removeMember);

module.exports = router; 