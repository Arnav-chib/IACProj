const sql = require('mssql');
const logger = require('../utils/logger');

// Master database pool
let masterPool;

// Set the database pool
function setPool(pool) {
  masterPool = pool;
}

// Add a member to an organization
async function addOrgMember(userId, orgId, role = 'member') {
  try {
    const result = await masterPool.request()
      .input('userId', sql.Int, userId)
      .input('orgId', sql.Int, orgId)
      .input('role', sql.NVarChar, role)
      .query(`
        INSERT INTO OrganizationMembers (UserID, OrgID, Role)
        OUTPUT INSERTED.MemberID
        VALUES (@userId, @orgId, @role)
      `);
    
    return result.recordset[0].MemberID;
  } catch (error) {
    logger.error('Error adding organization member:', error);
    throw error;
  }
}

// Get organization members
async function getOrgMembers(orgId) {
  try {
    const result = await masterPool.request()
      .input('orgId', sql.Int, orgId)
      .query(`
        SELECT 
          om.MemberID,
          om.Role,
          om.CreatedAt,
          u.UserID,
          u.Username,
          u.Email
        FROM OrganizationMembers om
        JOIN Users u ON om.UserID = u.UserID
        WHERE om.OrgID = @orgId
        ORDER BY om.Role DESC, om.CreatedAt DESC
      `);
    
    return result.recordset;
  } catch (error) {
    logger.error('Error getting organization members:', error);
    throw error;
  }
}

// Update member role
async function updateMemberRole(memberId, newRole) {
  try {
    await masterPool.request()
      .input('memberId', sql.Int, memberId)
      .input('newRole', sql.NVarChar, newRole)
      .input('updatedAt', sql.DateTime, new Date())
      .query(`
        UPDATE OrganizationMembers 
        SET Role = @newRole,
            UpdatedAt = @updatedAt
        WHERE MemberID = @memberId
      `);
    
    return true;
  } catch (error) {
    logger.error('Error updating member role:', error);
    throw error;
  }
}

// Remove member from organization
async function removeOrgMember(memberId) {
  try {
    await masterPool.request()
      .input('memberId', sql.Int, memberId)
      .query('DELETE FROM OrganizationMembers WHERE MemberID = @memberId');
    
    return true;
  } catch (error) {
    logger.error('Error removing organization member:', error);
    throw error;
  }
}

// Check if user is org admin
async function isOrgAdmin(userId, orgId) {
  try {
    const result = await masterPool.request()
      .input('userId', sql.Int, userId)
      .input('orgId', sql.Int, orgId)
      .query(`
        SELECT COUNT(*) as count
        FROM OrganizationMembers
        WHERE UserID = @userId 
        AND OrgID = @orgId 
        AND Role = 'admin'
      `);
    
    return result.recordset[0].count > 0;
  } catch (error) {
    logger.error('Error checking org admin status:', error);
    throw error;
  }
}

module.exports = {
  setPool,
  addOrgMember,
  getOrgMembers,
  updateMemberRole,
  removeOrgMember,
  isOrgAdmin
}; 