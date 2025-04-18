const { submitFormResponse, getFormResponses } = require('../services/responseService');

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

module.exports = {
  submitResponse,
  listResponses
};
