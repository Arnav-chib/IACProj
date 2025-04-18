const sql = require('mssql');

// Get form response analytics
async function getFormResponseAnalytics(formId, tenantDb) {
  try {
    // Get form details
    const formResult = await tenantDb.request()
      .input('formId', sql.Int, formId)
      .query('SELECT * FROM FormMaster WHERE ID = @formId');
    
    if (formResult.recordset.length === 0) {
      throw new Error('Form not found');
    }
    
    const form = formResult.recordset[0];
    
    // Get total response count
    const countResult = await tenantDb.request()
      .input('formId', sql.Int, formId)
      .query('SELECT COUNT(*) as totalResponses FROM FormResponses WHERE FormID = @formId');
    
    const totalResponses = countResult.recordset[0].totalResponses;
    
    // Get response date distribution (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dateDistributionResult = await tenantDb.request()
      .input('formId', sql.Int, formId)
      .input('startDate', sql.DateTime, thirtyDaysAgo)
      .query(`
        SELECT 
          CAST(SubmittedAt AS DATE) as responseDate,
          COUNT(*) as count
        FROM FormResponses
        WHERE FormID = @formId AND SubmittedAt >= @startDate
        GROUP BY CAST(SubmittedAt AS DATE)
        ORDER BY responseDate
      `);
    
    // Get field-level statistics (for numeric and choice fields)
    const fieldsResult = await tenantDb.request()
      .input('formId', sql.Int, formId)
      .query(`
        SELECT * FROM FormDetails 
        WHERE FormID = @formId AND Status != 'removed'
        ORDER BY Position
      `);
    
    const fieldStats = [];
    
    for (const field of fieldsResult.recordset) {
      if (['dropdown', 'radio', 'checkbox', 'number'].includes(field.FieldType)) {
        // Get response values for this field
        const fieldResponsesResult = await tenantDb.request()
          .input('fieldId', sql.Int, field.ID)
          .query(`
            SELECT rd.Value
            FROM ResponseDetails rd
            JOIN FormResponses fr ON rd.ResponseID = fr.ResponseID
            WHERE rd.FieldID = @fieldId
          `);
        
        // Build stats based on field type
        const stats = {
          fieldId: field.ID,
          fieldName: field.FieldName,
          fieldType: field.FieldType
        };
        
        if (field.FieldType === 'number') {
          // Calculate average, min, max for numeric fields
          const values = fieldResponsesResult.recordset
            .map(r => r.Value ? JSON.parse(r.Value) : null)
            .filter(v => v !== null && !isNaN(Number(v)));
          
          if (values.length > 0) {
            stats.average = values.reduce((sum, val) => sum + Number(val), 0) / values.length;
            stats.min = Math.min(...values);
            stats.max = Math.max(...values);
          }
        } else {
          // Calculate distribution for choice fields
          const valueDistribution = {};
          
          fieldResponsesResult.recordset.forEach(r => {
            if (!r.Value) return;
            
            let value = JSON.parse(r.Value);
            
            // Handle array values (like checkbox)
            if (Array.isArray(value)) {
              value.forEach(v => {
                valueDistribution[v] = (valueDistribution[v] || 0) + 1;
              });
            } else {
              valueDistribution[value] = (valueDistribution[value] || 0) + 1;
            }
          });
          
          stats.distribution = valueDistribution;
        }
        
        fieldStats.push(stats);
      }
    }
    
    return {
      formId: form.ID,
      formName: form.Name,
      totalResponses,
      dateDistribution: dateDistributionResult.recordset,
      fieldStats
    };
  } catch (error) {
    console.error('Error getting form analytics:', error);
    throw error;
  }
}

module.exports = {
  getFormResponseAnalytics
};
