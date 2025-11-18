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

  // Verify access token
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, ENV.ACCESS_KEY_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, ENV.REFRESH_KEY_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
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

    // Access token cookie (15 minutes)
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    // Refresh token cookie (7 days)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }

  // Clear token cookies
  clearTokenCookies(res) {
    res.cookie('accessToken', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });

    res.cookie('refreshToken', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });
  }
}

export const tokenService = new TokenService();