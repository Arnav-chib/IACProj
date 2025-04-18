const sql = require('mssql');

// Submit form response
async function submitFormResponse(formId, responseData, tenantDb) {
  // Begin transaction to ensure all data is saved
  const transaction = new sql.Transaction(tenantDb);
  
  try {
    await transaction.begin();
    
    // Insert form response record
    const responseResult = await transaction.request()
      .input('formId', sql.Int, formId)
      .input('respondentInfo', sql.NVarChar, JSON.stringify(responseData.respondentInfo || {}))
      .query(`
        INSERT INTO FormResponses (FormID, RespondentInfo)
        OUTPUT INSERTED.ResponseID
        VALUES (@formId, @respondentInfo)
      `);
    
    const responseId = responseResult.recordset[0].ResponseID;
    
    // Insert response details for each field
    const fieldEntries = Object.entries(responseData.values || {});
    
    for (const [fieldId, value] of fieldEntries) {
      await transaction.request()
        .input('responseId', sql.Int, responseId)
        .input('fieldId', sql.Int, parseInt(fieldId, 10))
        .input('value', sql.NVarChar, JSON.stringify(value))
        .query(`
          INSERT INTO ResponseDetails (ResponseID, FieldID, Value)
          VALUES (@responseId, @fieldId, @value)
        `);
    }
    
    await transaction.commit();
    return responseId;
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    console.error('Error submitting form response:', error);
    throw error;
  }
}

// Get form responses
async function getFormResponses(formId, tenantDb) {
  try {
    // Get form details first to verify form exists
    const formResult = await tenantDb.request()
      .input('formId', sql.Int, formId)
      .query('SELECT * FROM FormMaster WHERE ID = @formId');
    
    if (formResult.recordset.length === 0) {
      throw new Error('Form not found');
    }
    
    // Get responses
    const responsesResult = await tenantDb.request()
      .input('formId', sql.Int, formId)
      .query(`
        SELECT ResponseID, RespondentInfo, SubmittedAt 
        FROM FormResponses
        WHERE FormID = @formId
        ORDER BY SubmittedAt DESC
      `);
    
    const responses = [];
    
    // For each response, get the field values
    for (const response of responsesResult.recordset) {
      const detailsResult = await tenantDb.request()
        .input('responseId', sql.Int, response.ResponseID)
        .query(`
          SELECT rd.FieldID, rd.Value, fd.FieldName, fd.FieldType
          FROM ResponseDetails rd
          JOIN FormDetails fd ON rd.FieldID = fd.ID
          WHERE rd.ResponseID = @responseId
        `);
      
      const formattedResponse = {
        id: response.ResponseID,
        submittedAt: response.SubmittedAt,
        respondentInfo: response.RespondentInfo ? JSON.parse(response.RespondentInfo) : {},
        values: {}
      };
      
      // Format the values
      detailsResult.recordset.forEach(detail => {
        formattedResponse.values[detail.FieldID] = detail.Value ? JSON.parse(detail.Value) : null;
      });
      
      responses.push(formattedResponse);
    }
    
    return responses;
  } catch (error) {
    console.error('Error getting form responses:', error);
    throw error;
  }
}

module.exports = {
  submitFormResponse,
  getFormResponses
};
