const { getFormSchema, getUserForms, isFormOwner } = require('../services/formService');
const { sendError } = require('../utils/controllerUtils');

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

// Middleware to validate form ownership
async function validateFormOwnership(req, res, next) {
  try {
    const formId = req.params.id || req.params.formId;
    const userId = req.user.UserID;
    
    if (!formId) {
      return sendError(res, 400, 'Form ID is required');
    }
    
    // Check if user owns the form
    const isOwner = await isFormOwner(userId, formId, req.tenantDbConnection);
    
    if (!isOwner) {
      return sendError(res, 403, 'You do not have permission to access this form');
    }
    
    // If user owns the form, proceed
    next();
  } catch (error) {
    console.error('Error validating form ownership:', error);
    return sendError(res, 500, 'Failed to validate form ownership');
  }
}

module.exports = {
  getForm,
  listForms,
  validateFormOwnership
};
