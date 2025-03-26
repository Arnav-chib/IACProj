import { sql } from '../config/db';

// Response interface
export interface Response {
  id: string;
  formId: string;
  responseData: Record<string, any>; // Maps field ID to response value
  submittedAt: Date;
}

// Create a new response
export async function createResponse(dbName: string, response: Omit<Response, 'id' | 'submittedAt'>) {
  try {
    // Connect to user's database
    await sql.query`USE ${dbName}`;
    
    // Insert response with data as JSON
    const result = await sql.query`
      INSERT INTO Responses (form_id, response_data)
      VALUES (${response.formId}, ${JSON.stringify(response.responseData)})
      OUTPUT INSERTED.id;
    `;
    
    return result.recordset[0].id;
  } catch (err) {
    console.error('Error creating response:', err);
    throw err;
  }
}

// Get all responses for a form
export async function getResponsesByFormId(dbName: string, formId: string): Promise<Response[]> {
  try {
    // Connect to user's database
    await sql.query`USE ${dbName}`;
    
    const result = await sql.query`
      SELECT 
        id, 
        form_id as formId, 
        response_data as responseData,
        submitted_at as submittedAt
      FROM Responses 
      WHERE form_id = ${formId}
      ORDER BY submitted_at DESC;
    `;
    
    // Parse responseData JSON for all responses
    return result.recordset.map(response => {
      response.responseData = JSON.parse(response.responseData);
      return response as Response;
    });
  } catch (err) {
    console.error('Error getting responses by form ID:', err);
    throw err;
  }
}

// Get a single response by ID
export async function getResponseById(dbName: string, responseId: string): Promise<Response | null> {
  try {
    // Connect to user's database
    await sql.query`USE ${dbName}`;
    
    const result = await sql.query`
      SELECT 
        id, 
        form_id as formId, 
        response_data as responseData,
        submitted_at as submittedAt
      FROM Responses 
      WHERE id = ${responseId};
    `;
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    // Parse responseData JSON
    const response = result.recordset[0];
    response.responseData = JSON.parse(response.responseData);
    
    return response as Response;
  } catch (err) {
    console.error('Error getting response by ID:', err);
    throw err;
  }
}

// Delete a response
export async function deleteResponse(dbName: string, responseId: string) {
  try {
    // Connect to user's database
    await sql.query`USE ${dbName}`;
    
    await sql.query`
      DELETE FROM Responses WHERE id = ${responseId};
    `;
  } catch (err) {
    console.error('Error deleting response:', err);
    throw err;
  }
}

// Get response count for a form
export async function getResponseCount(dbName: string, formId: string): Promise<number> {
  try {
    // Connect to user's database
    await sql.query`USE ${dbName}`;
    
    const result = await sql.query`
      SELECT COUNT(*) as count
      FROM Responses 
      WHERE form_id = ${formId};
    `;
    
    return result.recordset[0].count;
  } catch (err) {
    console.error('Error getting response count:', err);
    throw err;
  }
} 