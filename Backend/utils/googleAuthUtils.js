const { google } = require('googleapis');
const User = require('../Schema/UserSchema');
const dotenv = require('dotenv');
dotenv.config();

/**
 * Creates and configures an OAuth2 client
 * @returns {google.auth.OAuth2} Configured OAuth2 client
 */
function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * Refreshes Google OAuth tokens for a user and updates the database
 * @param {string} userEmail - The user's email address
 * @param {string} refreshToken - The user's refresh token
 * @returns {Promise<{accessToken: string, expiryDate: Date}>} Updated tokens
 * @throws {Error} If token refresh fails
 */
async function refreshUserTokens(userEmail, refreshToken) {
  const oAuth2Client = createOAuth2Client();
  
  oAuth2Client.setCredentials({
    refresh_token: refreshToken
  });
  
  const { credentials } = await oAuth2Client.refreshAccessToken();
  
  // Update the user's tokens in the database
  await User.findOneAndUpdate(
    { email: userEmail },
    { 
      $set: { 
        'google.accessToken': credentials.access_token,
        'google.tokenExpiryDate': new Date(credentials.expiry_date)
      }
    }
  );
  
  return {
    accessToken: credentials.access_token,
    expiryDate: new Date(credentials.expiry_date)
  };
}

/**
 * Checks if a token needs refresh and refreshes it if necessary
 * @param {Object} user - User object with Google tokens
 * @returns {Promise<Object>} Updated user object with fresh tokens
 * @throws {Error} If token refresh fails
 */
async function ensureValidTokens(user) {
  if (!user.google || !user.google.refreshToken) {
    throw new Error('User has not linked Google Calendar');
  }
  
  const now = Date.now();
  const tokenExpiry = user.google.tokenExpiryDate ? new Date(user.google.tokenExpiryDate).getTime() : 0;
  
  // If token is expired or will expire in the next 5 minutes, refresh it
  if (now >= tokenExpiry - 300000) { // 5 minutes buffer
    console.log('Token needs refresh for user:', user.email);
    
    const { accessToken, expiryDate } = await refreshUserTokens(
      user.email, 
      user.google.refreshToken
    );
    
    // Update the user object for this request
    user.google.accessToken = accessToken;
    user.google.tokenExpiryDate = expiryDate;
    
    console.log('Token refreshed successfully for user:', user.email);
  }
  
  return user;
}

/**
 * Creates a configured Google Calendar API client with valid tokens
 * @param {Object} user - User object with Google tokens
 * @returns {Promise<{calendar: Object, user: Object}>} Calendar client and updated user
 * @throws {Error} If token refresh fails
 */
async function createCalendarClient(user) {
  const userWithValidTokens = await ensureValidTokens(user);
  
  const oAuth2Client = createOAuth2Client();
  oAuth2Client.setCredentials({
    refresh_token: userWithValidTokens.google.refreshToken,
    access_token: userWithValidTokens.google.accessToken,
    expiry_date: userWithValidTokens.google.tokenExpiryDate ? new Date(userWithValidTokens.google.tokenExpiryDate).getTime() : null
  });
  
  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
  
  return {
    calendar,
    user: userWithValidTokens
  };
}

module.exports = {
  createOAuth2Client,
  refreshUserTokens,
  ensureValidTokens,
  createCalendarClient
};
