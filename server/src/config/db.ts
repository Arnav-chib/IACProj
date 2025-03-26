import * as sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// Main database configuration
const sqlConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'master',
  server: process.env.DB_SERVER || 'localhost',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

// Connect to database
async function connectToDatabase() {
  try {
    const pool = await sql.connect(sqlConfig);
    console.log('Connected to MSSQL database');
    return pool;
  } catch (err) {
    console.error('Database connection failed:', err);
    throw err;
  }
}

// Function to create a new database for a user
async function createUserDatabase(userId: string) {
  try {
    const pool = await sql.connect(sqlConfig);
    const dbName = `forms_user_${userId}`;
    
    // Create new database for user
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${dbName}')
      BEGIN
        CREATE DATABASE ${dbName};
      END
    `);
    
    // Switch to the new database and create required tables
    await pool.request().query(`USE ${dbName}`);
    
    // Create tables in the new database
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Forms')
      BEGIN
        CREATE TABLE Forms (
          id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          title NVARCHAR(255) NOT NULL,
          description NVARCHAR(MAX),
          schema NVARCHAR(MAX) NOT NULL,
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE()
        );
        
        CREATE TABLE Responses (
          id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          form_id UNIQUEIDENTIFIER NOT NULL,
          response_data NVARCHAR(MAX) NOT NULL,
          submitted_at DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (form_id) REFERENCES Forms(id)
        );
      END
    `);
    
    console.log(`Database ${dbName} created successfully`);
    return dbName;
  } catch (err) {
    console.error('Error creating user database:', err);
    throw err;
  }
}

export { connectToDatabase, sqlConfig, createUserDatabase, sql }; 