import { tokenService } from '../utils/token.js';
import { redisClient } from '../utils/redis.js';
import User from '../models/auth.model.js';

export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from cookies or authorization header
    let accessToken = req.cookies?.accessToken;

    if (!accessToken && req.headers.authorization) {
      accessToken = req.headers.authorization.split(' ')[1];
    }

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Check if token is blacklisted
    const isBlacklisted = await redisClient.isTokenBlacklisted(accessToken);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been invalidated. Please login again.',
      });
    }

    // Verify access token
    const decoded = tokenService.verifyAccessToken(accessToken);

    // Try to get user from cache
    let user = await redisClient.getCachedUser(decoded.userId);

    if (!user) {
      // If not in cache, get from database
      user = await User.findById(decoded.userId).select('-password -refreshToken');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found.',
        });
      }

      // Cache user data
      await redisClient.cacheUser(decoded.userId, user);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    // Check if the error is specifically a TokenExpiredError
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired. Please refresh your token.',
        code: 'TOKEN_EXPIRED',
      });
    }

    // For any other error (invalid signature, malformed token, etc.)
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

export const adminMiddlware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error.',
      error: error.message,
    });
  }
};