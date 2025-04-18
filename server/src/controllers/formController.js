const { getFormSchema, getUserForms } = require('../services/formService');

// Get form by ID
async function getForm(req, res) {
  try {
    const { id } = req.params;
    
    // Get form schema
    const formSchema = await getFormSchema(id, req.tenantDbConnection);
    
    res.json(formSchema);
  } catch (error) {
    console.error('Error getting form:', error);
    
    if (error.message === 'Form not found') {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    res.status(500).json({ error: 'Failed to retrieve form' });
  }
}

// List forms for the authenticated user
async function listForms(req, res) {
  try {
    const forms = await getUserForms(req.user.UserID, req.tenantDbConnection);
    
    res.json({ forms });
  } catch (error) {
    console.error('Error listing forms:', error);
    res.status(500).json({ error: 'Failed to retrieve forms' });
  }
}

module.exports = {
  getForm,
  listForms
};
