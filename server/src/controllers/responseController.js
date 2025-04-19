const { submitFormResponse, getFormResponses } = require('../services/responseService');
const sql = require('mssql');

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

// List responses for a form
async function listResponses(req, res) {
  try {
    const { id } = req.params;
    
    // Get responses
    const responses = await getFormResponses(id, req.tenantDbConnection);
    
    res.json({ responses });
  } catch (error) {
    console.error('Error listing responses:', error);
    
    if (error.message === 'Form not found') {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    res.status(500).json({ error: 'Failed to retrieve responses' });
  }
}

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
  listResponses,
  updateResponseApproval,
  deleteResponse
};
