const sql = require('mssql');

// Get form schema by ID
async function getFormSchema(formId, tenantDb) {
  try {
    // Get form master data
    const formResult = await tenantDb.request()
      .input('formId', sql.Int, formId)
      .query('SELECT * FROM FormMaster WHERE ID = @formId');
    
    if (formResult.recordset.length === 0) {
      throw new Error('Form not found');
    }
    
    const form = formResult.recordset[0];
    
    // Get form fields
    const fieldsResult = await tenantDb.request()
      .input('formId', sql.Int, formId)
      .query(`
        SELECT * FROM FormDetails 
        WHERE FormID = @formId AND Status != 'removed' 
        ORDER BY Position
      `);
    
    // Get group details
    const groupsResult = await tenantDb.request()
      .input('formId', sql.Int, formId)
      .query('SELECT * FROM GroupDetails WHERE FormID = @formId');
    
    // Transform database results into schema format
    return {
      id: form.ID,
      name: form.Name,
      status: form.Status,
      fields: fieldsResult.recordset.map(field => ({
        id: field.ID,
        name: field.FieldName,
        type: field.FieldType,
        required: field.IsMandatory === true,
        status: field.Status,
        position: field.Position,
        validation: field.ValidationLogic ? JSON.parse(field.ValidationLogic) : null,
        population: field.PopulationLogic ? JSON.parse(field.PopulationLogic) : null,
        groupId: field.InGroup,
        needsApproval: field.NeedsApproval === true
      })),
      groups: groupsResult.recordset.map(group => ({
        id: group.ID,
        groupId: group.GroupID,
        label: group.LabelName,
        columns: group.NumColumns,
        columnConfig: JSON.parse(group.ColumnConfig),
        rows: group.NumRows,
        canAddRows: group.CanAddRows === true
      }))
    };
  } catch (error) {
    console.error('Error retrieving form schema:', error);
    throw error;
  }
}

// List forms for a user
async function getUserForms(userId, tenantDb) {
  try {
    const result = await tenantDb.request()
      .input('createdBy', sql.Int, userId)
      .query(`
        SELECT ID, Name, CreateDate, Status
        FROM FormMaster
        WHERE CreatedBy = @createdBy
        ORDER BY CreateDate DESC
      `);
    
    return result.recordset;
  } catch (error) {
    console.error('Error getting user forms:', error);
    throw error;
  }
}

module.exports = {
  getFormSchema,
  getUserForms
};
