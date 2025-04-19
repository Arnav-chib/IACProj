const { 
    getUserByEmail, 
    createUser, 
    setPasswordResetToken, 
    getUserByResetToken, 
    resetPassword 
  } = require('../models/userModel');
  const { comparePassword, generateToken } = require('../utils/securityUtils');
  const { generateTenantDatabaseName, createTenantDatabase } = require('../utils/dbUtils');
  const { initializeMasterDbPool } = require('../config/database');
  const nodemailer = require('nodemailer');
  const logger = require('../utils/logger');
  
  // Get master database pool
  let masterPool;
  async function initMasterPool() {
    if (!masterPool) {
      masterPool = await initializeMasterDbPool();
    }
    return masterPool;
  }
  
  // Register user
  async function register(req, res) {
    try {
      const { username, email, password } = req.body;
      
      // Check if user already exists
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
      
      // First create the user without a database connection string
      // We need the user ID to create a proper database name
      const userData = { username, email, password };
      const userId = await createUser(userData);
      
      // Initialize master pool if not already done
      const pool = await initMasterPool();
      
      // Generate a unique database name for this user
      const dbName = generateTenantDatabaseName('User', userId);
      
      // Create a new database for this user and get the connection string
      const connectionString = await createTenantDatabase(pool, dbName);
      
      // Update the user with the connection string
      await pool.request()
        .input('userId', userId)
        .input('dbConnectionString', connectionString)
        .query(`
          UPDATE Users 
          SET DBConnectionString = @dbConnectionString
          WHERE UserID = @userId
        `);
      
      logger.info(`Created new database for user: ${userId}, database: ${dbName}`);
      
      // Generate JWT token
      const token = generateToken({ userId });
      
      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: userId,
          username,
          email
        }
      });
    } catch (error) {
      logger.error('Registration error:', { 
        error: error.message,
        stack: error.stack
      });
      res.status(500).json({ error: 'Registration failed' });
    }
  }
  
  // Login user
  async function login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Verify password
      const isPasswordValid = await comparePassword(password, user.PasswordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Generate JWT token
      const token = generateToken({ userId: user.UserID });
      
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.UserID,
          username: user.Username,
          email: user.Email,
          isOrgAdmin: user.IsOrgAdmin,
          orgId: user.OrgID
        }
      });
    } catch (error) {
      logger.error('Login error:', { 
        error: error.message,
        stack: error.stack
      });
      res.status(500).json({ error: 'Login failed' });
    }
  }
  
  // Get current user
  async function getCurrentUser(req, res) {
    try {
      const user = req.user;
      
      res.json({
        user: {
          id: user.UserID,
          username: user.Username,
          email: user.Email,
          isOrgAdmin: user.IsOrgAdmin,
          orgId: user.OrgID
        }
      });
    } catch (error) {
      logger.error('Get current user error:', { 
        error: error.message,
        stack: error.stack
      });
      res.status(500).json({ error: 'Failed to get user information' });
    }
  }
  
  // Request password reset
  async function requestPasswordReset(req, res) {
    try {
      const { email } = req.body;
      
      // Check if user exists
      const user = await getUserByEmail(email);
      if (!user) {
        // Don't reveal that the email doesn't exist, but don't process further
        logger.info(`Password reset requested for non-existent email: ${email}`);
        return res.status(200).json({ message: 'If your email is registered, you will receive a password reset link' });
      }
      
      // Generate and store reset token
      const resetToken = await setPasswordResetToken(email);
      
      // Log that a token was generated (without exposing the token)
      logger.info(`Password reset token generated for user: ${user.UserID}`);
      
      // Construct reset URL - would be sent in email
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password/${resetToken}`;
      
      // In production, send actual email
      if (process.env.NODE_ENV === 'production') {
        try {
          // Configure email transporter
          const transporter = nodemailer.createTransport({
            // Add your email service configuration here
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD
            }
          });
          
          await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Password Reset',
            html: `
              <p>You requested a password reset.</p>
              <p>Click this link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
              <p>This link will expire in 1 hour.</p>
            `
          });
          
          logger.info(`Password reset email sent to user: ${user.UserID}`);
        } catch (emailError) {
          logger.error('Error sending password reset email:', {
            error: emailError.message,
            stack: emailError.stack,
            userId: user.UserID
          });
          // Still return success to user to avoid exposing information
        }
      } else {
        // In development, just log that an email would be sent
        logger.info(`[DEV] Would send password reset email to: ${email}`);
        logger.info(`[DEV] Reset URL: ${resetUrl}`);
      }
      
      res.status(200).json({ message: 'If your email is registered, you will receive a password reset link' });
    } catch (error) {
      logger.error('Password reset request error:', { 
        error: error.message,
        stack: error.stack
      });
      res.status(500).json({ error: 'Password reset request failed' });
    }
  }
  
  // Reset password with token
  async function resetPasswordWithToken(req, res) {
    try {
      const { token, newPassword } = req.body;
      
      // Find user by reset token
      const user = await getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }
      
      // Reset the password
      await resetPassword(user.UserID, newPassword);
      
      logger.info(`Password reset completed for user: ${user.UserID}`);
      
      res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
      logger.error('Password reset error:', { 
        error: error.message,
        stack: error.stack
      });
      res.status(500).json({ error: 'Password reset failed' });
    }
  }
  
  module.exports = {
    register,
    login,
    getCurrentUser,
    requestPasswordReset,
    resetPasswordWithToken
  };
  