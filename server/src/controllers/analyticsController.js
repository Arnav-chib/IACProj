const { getFormResponseAnalytics } = require('../services/analyticsService');

// Get form analytics
async function getFormAnalytics(req, res) {
  try {
    const { id } = req.params;
    
    // Get analytics
    const analytics = await getFormResponseAnalytics(id, req.tenantDbConnection);
    
    res.json(analytics);
  } catch (error) {
    console.error('Error getting form analytics:', error);
    
    if (error.message === 'Form not found') {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    res.status(500).json({ error: 'Failed to retrieve form analytics' });
  }
}

module.exports = {
  getFormAnalytics
};
