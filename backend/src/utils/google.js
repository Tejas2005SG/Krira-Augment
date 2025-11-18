import { OAuth2Client } from 'google-auth-library';
import { ENV } from '../lib/env.js';

class GoogleAuthService {
  constructor() {
    this.client = new OAuth2Client(ENV.GOOGLE_CLIENT_ID);
  }

  // Verify Google ID token
  async verifyIdToken(idToken) {
    try {
      console.log('Verifying Google ID token...');
      
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: ENV.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      
      console.log('Google token verified successfully for:', payload.email);

      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        emailVerified: payload.email_verified,
      };
    } catch (error) {
      console.error('Error verifying Google token:', error);
      throw new Error('Invalid Google token');
    }
  }
}

export const googleAuthService = new GoogleAuthService();