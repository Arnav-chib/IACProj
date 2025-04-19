const { submitFormResponse, getFormResponses } = require('../services/responseService');
const sql = require('mssql');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const asyncHandler = require('express-async-handler');

// Submit response
async function submitResponse(req, res) {
  try {
    const { id } = req.params;
    const responseData = req.body;
    
    // Submit response
    const responseId = await submitFormResponse(id, responseData, req.tenantDbConnection);
    
    res.status(201).json({
      message: 'Response submitted successfully',
      responseId
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ error: 'Failed to submit response' });
  }
}

/**
 * Get form responses
 */
const getFormResponses = asyncHandler(async (req, res) => {
  try {
    const { id: formId } = req.params;
    
    // Get form responses
    const responses = await getFormResponses(formId, req.tenantDbConnection);
    
    sendSuccess(res, 200, 'Form responses retrieved successfully', { responses });
  } catch (error) {
    console.error('Error getting form responses:', error);
    sendError(res, 500, 'Failed to retrieve form responses');
  }
});

// Update response field approval status
async function updateResponseApproval(req, res) {
  try {
    const { formId, responseId, fieldId } = req.params;
    const { isApproved } = req.body;
    
    // Update the approval status
    await req.tenantDbConnection.request()
      .input('responseId', sql.Int, parseInt(responseId))
      .input('fieldId', sql.Int, parseInt(fieldId))
      .input('isApproved', sql.Bit, isApproved)
      .query(`
        UPDATE ResponseDetails
        SET IsApproved = @isApproved
        WHERE ResponseID = @responseId AND FieldID = @fieldId
      `);
    
    res.json({
      message: 'Response approval status updated successfully'
    });
  } catch (error) {
    console.error('Error updating response approval:', error);
    res.status(500).json({ error: 'Failed to update approval status' });
  }
}

// Delete a response
async function deleteResponse(req, res) {
  try {
    const { responseId } = req.params;
    
    // First delete all response details
    await req.tenantDbConnection.request()
      .input('responseId', sql.Int, parseInt(responseId))
      .query('DELETE FROM ResponseDetails WHERE ResponseID = @responseId');
    
    // Then delete the response itself
    await req.tenantDbConnection.request()
      .input('responseId', sql.Int, parseInt(responseId))
      .query('DELETE FROM FormResponses WHERE ResponseID = @responseId');
    
    res.json({
      message: 'Response deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting response:', error);
    res.status(500).json({ error: 'Failed to delete response' });
  }
}

module.exports = {
  submitResponse,
  getFormResponses,
  deleteResponse,
  updateResponseApproval
};
