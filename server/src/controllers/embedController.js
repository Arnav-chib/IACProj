const { getFormSchema } = require('../services/formService');
const { getFormResponses } = require('../services/responseService');
const { getFormResponseAnalytics } = require('../services/analyticsService');

// Render embeddable form
async function renderForm(req, res) {
  try {
    const { id } = req.params;
    
    // Get form schema
    const formSchema = await getFormSchema(id, req.tenantDbConnection);
    
    // Remove sensitive or unnecessary data
    const embedFormSchema = {
      id: formSchema.id,
      name: formSchema.name,
      fields: formSchema.fields.map(field => ({
        id: field.id,
        name: field.name,
        type: field.type,
        required: field.required,
        position: field.position,
        validation: field.validation,
        population: field.population,
        groupId: field.groupId
      })),
      groups: formSchema.groups
    };
    
    res.json(embedFormSchema);
  } catch (error) {
    console.error('Error rendering embeddable form:', error);
    
    if (error.message === 'Form not found') {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    res.status(500).json({ error: 'Failed to render form' });
  }
}

// Render embeddable results
async function renderResults(req, res) {
  try {
    const { id } = req.params;
    const { showResponses, showAnalytics } = req.query;
    
    const result = {
      formId: id
    };
    
    // Get form schema for basic info
    const formSchema = await getFormSchema(id, req.tenantDbConnection);
    result.formName = formSchema.name;
    
    // Add responses if requested
    if (showResponses === 'true') {
      const responses = await getFormResponses(id, req.tenantDbConnection);
      result.responses = responses;
    }
    
    // Add analytics if requested
    if (showAnalytics === 'true') {
      const analytics = await getFormResponseAnalytics(id, req.tenantDbConnection);
      result.analytics = analytics;
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error rendering embeddable results:', error);
    
    if (error.message === 'Form not found') {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    res.status(500).json({ error: 'Failed to render results' });
  }
}

module.exports = {
  renderForm,
  renderResults
};
