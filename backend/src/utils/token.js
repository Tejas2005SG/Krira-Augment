import jwt from 'jsonwebtoken';
import { ENV } from '../lib/env.js';

class TokenService {
  // Generate access token (15 minutes)
  generateAccessToken(userId, role) {
    return jwt.sign(
      { userId, role },
      ENV.ACCESS_KEY_SECRET,
      { expiresIn: '15m' }
    );
  }

  // Generate refresh token (7 days)
  generateRefreshToken(userId, role) {
    return jwt.sign(
      { userId, role },
      ENV.REFRESH_KEY_SECRET,
      { expiresIn: '7d' }
    );
  }

  // Verify access token - let JWT errors propagate
  verifyAccessToken(token) {
    return jwt.verify(token, ENV.ACCESS_KEY_SECRET);
  }

  // Verify refresh token - let JWT errors propagate
  verifyRefreshToken(token) {
    return jwt.verify(token, ENV.REFRESH_KEY_SECRET);
  }

  // Generate both tokens
  generateTokens(userId, role) {
    return {
      accessToken: this.generateAccessToken(userId, role),
      refreshToken: this.generateRefreshToken(userId, role),
    };
  }

  // Set token cookies
  setTokenCookies(res, accessToken, refreshToken) {
    const isProduction = ENV.NODE_ENV === 'production';

    // Cookie configuration for production (cross-origin) vs development
    const cookieConfig = {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-origin in production
      path: '/',
    };

    // Access token cookie (15 minutes)
    res.cookie('accessToken', accessToken, {
      ...cookieConfig,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Refresh token cookie (7 days)
    res.cookie('refreshToken', refreshToken, {
      ...cookieConfig,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  // Clear token cookies
  clearTokenCookies(res) {
    const isProduction = ENV.NODE_ENV === 'production';

    const cookieConfig = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      expires: new Date(0),
      path: '/',
    };

    res.cookie('accessToken', '', cookieConfig);
    res.cookie('refreshToken', '', cookieConfig);
  }
}

export const tokenService = new TokenService();


