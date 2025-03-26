import { sql } from '../config/db';
import bcrypt from 'bcrypt';

// User subscription types
export enum SubscriptionType {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM'
}

// User interface
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  subscription: SubscriptionType;
  dbName?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create users table in master database
export async function initializeUserTable() {
  try {
    await sql.query`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
      BEGIN
        CREATE TABLE Users (
          id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          email NVARCHAR(255) UNIQUE NOT NULL,
          password NVARCHAR(255) NOT NULL,
          name NVARCHAR(255) NOT NULL,
          subscription NVARCHAR(50) NOT NULL DEFAULT 'FREE',
          db_name NVARCHAR(255),
          created_at DATETIME DEFAULT GETDATE(),
          updated_at DATETIME DEFAULT GETDATE()
        );
      END
    `;
    console.log('Users table initialized');
  } catch (err) {
    console.error('Error initializing users table:', err);
    throw err;
  }
}

// Create a new user
export async function createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'dbName'>) {
  try {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);
    
    // Insert user
    const result = await sql.query`
      INSERT INTO Users (email, password, name, subscription)
      VALUES (${user.email}, ${hashedPassword}, ${user.name}, ${user.subscription})
      OUTPUT INSERTED.id;
    `;
    
    return result.recordset[0].id;
  } catch (err) {
    console.error('Error creating user:', err);
    throw err;
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await sql.query`
      SELECT 
        id, 
        email, 
        password, 
        name, 
        subscription, 
        db_name as dbName,
        created_at as createdAt, 
        updated_at as updatedAt
      FROM Users 
      WHERE email = ${email};
    `;
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    return result.recordset[0] as User;
  } catch (err) {
    console.error('Error getting user by email:', err);
    throw err;
  }
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  try {
    const result = await sql.query`
      SELECT 
        id, 
        email, 
        password, 
        name, 
        subscription, 
        db_name as dbName,
        created_at as createdAt, 
        updated_at as updatedAt
      FROM Users 
      WHERE id = ${id};
    `;
    
    if (result.recordset.length === 0) {
      return null;
    }
    
    return result.recordset[0] as User;
  } catch (err) {
    console.error('Error getting user by ID:', err);
    throw err;
  }
}

// Update user database name
export async function updateUserDatabaseName(userId: string, dbName: string) {
  try {
    await sql.query`
      UPDATE Users 
      SET db_name = ${dbName}, updated_at = GETDATE()
      WHERE id = ${userId};
    `;
  } catch (err) {
    console.error('Error updating user database name:', err);
    throw err;
  }
}

// Update user subscription
export async function updateUserSubscription(userId: string, subscription: SubscriptionType) {
  try {
    await sql.query`
      UPDATE Users 
      SET subscription = ${subscription}, updated_at = GETDATE()
      WHERE id = ${userId};
    `;
  } catch (err) {
    console.error('Error updating user subscription:', err);
    throw err;
  }
} 