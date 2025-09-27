const express=require('express');
const router=express.Router();
const axios = require('axios');
const crypto = require('crypto');
const dotenv = require('dotenv');
const User = require('../Schema/UserSchema');

const verificationSessions = new Map();

const { OAuth2Client } = require('google-auth-library');
dotenv.config();

const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );


router.get('/user/verify-email', (req, res) => {
    const sessionId = crypto.randomBytes(16).toString('hex');
    
    // Store session ID for verification callback
    verificationSessions.set(sessionId, { timestamp: Date.now() });
    
    // Generate OAuth URL with state containing session ID
    const state = sessionId;
    const url = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/calendar'],
      prompt: 'consent',
      state
    });
    
    res.redirect(url);
  });
  
  router.get('/user/google/callback', async (req, res) => {
    const { code, state } = req.query;
    
    // Validate state to prevent CSRF
    if (!verificationSessions.has(state)) {
      return res.send(`
        <script>
          window.opener.postMessage(${JSON.stringify({
            success: false,
            message: "Invalid verification session"
          })}, "*");
          window.close();
        </script>
      `);
    }
    
    try {
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);
  
      // Get user info from Google
      const { data: googleUser } = await axios.get(
        `https://www.googleapis.com/oauth2/v2/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        }
      );
      
      // Clean up verification session
      verificationSessions.delete(state);
      
      // Send verified user data back to client
      return res.send(`
        <script>
          window.opener.postMessage(${JSON.stringify({
            success: true,
            userData: {
              email: googleUser.email,
              googleId: googleUser.id,
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              tokenExpiryDate: tokens.expiry_date || (Date.now() + tokens.expires_in * 1000)
            },
            message: 'Email verification successful'
          })}, "*");
          window.close();
        </script>
      `);
    } catch (error) {
      console.error('Google OAuth Error:', error);
      
      // Clean up verification session
      verificationSessions.delete(state);
      
      return res.send(`
        <script>
          window.opener.postMessage(${JSON.stringify({
            success: false,
            message: 'Email verification failed: ' + error.message
          })}, "*");
          window.close();
        </script>
      `);
    }
  });

  // Route to update Google tokens for existing users
  router.post('/user/update-google-tokens', async (req, res) => {
    try {
      const { username, googleData } = req.body;
      
      if (!username || !googleData || !googleData.accessToken || !googleData.refreshToken) {
        return res.status(400).json({ 
          error: 'Username and Google token data are required' 
        });
      }
      
      // Find and update the user's Google tokens
      const updatedUser = await User.findOneAndUpdate(
        { username },
        { 
          $set: { 
            'google.accessToken': googleData.accessToken,
            'google.refreshToken': googleData.refreshToken,
            'google.tokenExpiryDate': googleData.tokenExpiryDate ? new Date(googleData.tokenExpiryDate) : null
          }
        },
        { new: true }
      );
      
      if (!updatedUser) {
        return res.status(404).json({ 
          error: 'User not found' 
        });
      }
      
      res.json({ 
        success: true, 
        message: 'Google tokens updated successfully',
        user: {
          username: updatedUser.username,
          email: updatedUser.email
        }
      });
      
    } catch (error) {
      console.error('Error updating Google tokens:', error);
      res.status(500).json({ 
        error: 'Failed to update Google tokens',
        details: error.message 
      });
    }
  });

  module.exports=router;