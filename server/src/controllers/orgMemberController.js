const { 
  addOrgMember, 
  getOrgMembers, 
  updateMemberRole, 
  removeOrgMember 
} = require('../models/orgMemberModel');
const { asyncHandler, sendSuccess } = require('../utils/controllerUtils');

/**
 * Get all members of an organization
 */
const getMembers = asyncHandler(async (req, res) => {
  const { orgId } = req.params;
  const members = await getOrgMembers(orgId);
  sendSuccess(res, 200, 'Organization members retrieved successfully', members);
});

/**
 * Add a new member to an organization
 */
const addMember = asyncHandler(async (req, res) => {
  const { orgId } = req.params;
  const { userId, role } = req.body;
  
  const memberId = await addOrgMember(userId, orgId, role);
  
  sendSuccess(res, 201, 'Member added to organization successfully', { memberId });
});

/**
 * Update a member's role
 */
const updateRole = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  const { role } = req.body;
  
  await updateMemberRole(memberId, role);
  
  sendSuccess(res, 200, 'Member role updated successfully');
});

/**
 * Remove a member from an organization
 */
const removeMember = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  
  await removeOrgMember(memberId);
  
  sendSuccess(res, 200, 'Member removed from organization successfully');
});

module.exports = {
  getMembers,
  addMember,
  updateRole,
  removeMember
}; 