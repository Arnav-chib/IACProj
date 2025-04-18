const { 
    getUserByEmail, 
    createUser, 
    setPasswordResetToken, 
    getUserByResetToken, 
    resetPassword 
  } = require('../models/userModel');
  const { comparePassword, generateToken } = require('../utils/securityUtils');
  const nodemailer = require('nodemailer');
  
  // Register user
  async function register(req, res) {
    try {
      const { username, email, password } = req.body;
      
      // Check if user already exists
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
      
      // Create new user
      const userId = await createUser({ username, email, password });
      
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
      console.error('Registration error:', error);
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
      console.error('Login error:', error);
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
      console.error('Get current user error:', error);
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
        // Don't reveal that the email doesn't exist
        return res.status(200).json({ message: 'If your email is registered, you will receive a password reset link' });
      }
      
      // Generate and store reset token
      const resetToken = await setPasswordResetToken(email);
      
      // Send password reset email
      // Note: In a production environment, set up a real email service
      // For now, we'll just log the token
      console.log(`Password reset token for ${email}: ${resetToken}`);
      
      // Mock email sending (replace with actual email service in production)
      const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
      console.log(`Reset URL: ${resetUrl}`);
      
      res.status(200).json({ message: 'If your email is registered, you will receive a password reset link' });
    } catch (error) {
      console.error('Password reset request error:', error);
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
      
      res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
      console.error('Password reset error:', error);
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
  