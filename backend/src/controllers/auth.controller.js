import User from '../models/auth.model.js';
import { emailService } from '../utils/email.js';
import { redisClient } from '../utils/redis.js';
import { tokenService } from '../utils/token.js';
import { googleAuthService } from '../utils/google.js';
import crypto from 'crypto';
import { ENV } from '../lib/env.js';

// ==================== SIGNUP ====================
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields.',
      });
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Email validation
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email.',
        });
      } else {
        // Delete unverified user and allow re-registration
        await User.deleteOne({ email: normalizedEmail });
      }
    }

    // Generate OTP
    const otp = emailService.generateOTP();

    console.log('Signup - Storing OTP for email:', normalizedEmail);
    console.log('Generated OTP:', otp);

    // Store signup data temporarily in Redis (using normalized email as key)
    await redisClient.storeSignupData(normalizedEmail, {
      name,
      email: normalizedEmail,
      password,
    });

    // Store OTP in Redis
    await redisClient.storeOTP(normalizedEmail, otp);

    // Send OTP email
    await emailService.sendOTP(normalizedEmail, otp, name);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
      email: normalizedEmail, // Return normalized email so frontend can pass it to verification page
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during signup. Please try again.',
      error: error.message,
    });
  }
};

// ==================== VERIFY OTP ====================
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validation
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP.',
      });
    }

    // Normalize email to match signup
    const normalizedEmail = email.toLowerCase().trim();

    // Get stored OTP
    const storedOTP = await redisClient.getOTP(normalizedEmail);

    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or invalid. Please request a new one.',
      });
    }

    // Normalize both OTPs (trim and convert to string)
    const normalizedStoredOTP = String(storedOTP).trim();
    const normalizedInputOTP = String(otp).trim();

    // Debug logging
    console.log('OTP Verification Debug:');
    console.log('Normalized Email:', normalizedEmail);
    console.log('Stored OTP:', normalizedStoredOTP);
    console.log('Input OTP:', normalizedInputOTP);
    console.log('Match:', normalizedStoredOTP === normalizedInputOTP);

    // Verify OTP
    if (normalizedStoredOTP !== normalizedInputOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.',
      });
    }

    // Get signup data from Redis
    const signupData = await redisClient.getSignupData(normalizedEmail);

    if (!signupData) {
      return res.status(400).json({
        success: false,
        message: 'Signup session expired. Please sign up again.',
      });
    }

    // Create user
    const user = await User.create({
      name: signupData.name,
      email: signupData.email,
      password: signupData.password,
      isVerified: true,
      authProvider: 'local',
    });

    // Delete OTP and signup data from Redis
    await redisClient.deleteOTP(normalizedEmail);
    await redisClient.deleteSignupData(normalizedEmail);

    // Generate tokens
    const { accessToken, refreshToken } = tokenService.generateTokens(
      user._id.toString(),
      user.role
    );

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save();

    // Set cookies
    tokenService.setTokenCookies(res, accessToken, refreshToken);

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(user.email, user.name).catch(console.error);

    // Cache user data
    await redisClient.cacheUser(user._id.toString(), user);

    res.status(201).json({
      success: true,
      message: 'Email verified successfully. Account created!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        isVerified: user.isVerified,
      },
      accessToken,
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP. Please try again.',
      error: error.message,
    });
  }
};

// ==================== RESEND OTP ====================
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required to resend OTP.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already verified. Please login instead.',
      });
    }

    const signupData = await redisClient.getSignupData(normalizedEmail);

    if (!signupData) {
      return res.status(400).json({
        success: false,
        message: 'Signup session expired. Please sign up again to receive a new OTP.',
      });
    }

    const otp = emailService.generateOTP();

    await redisClient.storeSignupData(normalizedEmail, signupData);
    await redisClient.storeOTP(normalizedEmail, otp);

    await emailService.sendOTP(
      normalizedEmail,
      otp,
      signupData.name || existingUser?.name || 'there'
    );

    return res.status(200).json({
      success: true,
      message: 'OTP resent successfully. Please check your email.',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend OTP. Please try again.',
      error: error.message,
    });
  }
};

// ==================== LOGIN ====================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Check if user signed up with Google
    if (user.authProvider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google Sign-In. Please login with Google.',
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in.',
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = tokenService.generateTokens(
      user._id.toString(),
      user.role
    );

    // Save refresh token
    user.refreshToken = refreshToken;
    user.lastLogin = Date.now();
    await user.save();

    // Set cookies
    tokenService.setTokenCookies(res, accessToken, refreshToken);

    // Cache user data
    const userWithoutPassword = await User.findById(user._id);
    await redisClient.cacheUser(user._id.toString(), userWithoutPassword);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        isVerified: user.isVerified,
      },
      accessToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login. Please try again.',
      error: error.message,
    });
  }
};

// ==================== LOGOUT ====================
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const accessToken = req.cookies?.accessToken;

    // Blacklist tokens if they exist
    if (accessToken) {
      await redisClient.blacklistToken(accessToken, 15 * 60); // 15 minutes
    }

    if (refreshToken) {
      await redisClient.blacklistToken(refreshToken, 7 * 24 * 60 * 60); // 7 days

      // Remove refresh token from database
      try {
        const decoded = tokenService.verifyRefreshToken(refreshToken);
        await User.findByIdAndUpdate(decoded.userId, {
          refreshToken: null,
        });

        // Clear cached user
        await redisClient.deleteCachedUser(decoded.userId);
      } catch (error) {
        // Token might be expired, continue with logout
        console.log('Error clearing refresh token:', error.message);
      }
    }

    // Clear cookies
    tokenService.clearTokenCookies(res);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    console.error('Logout error:', error);

    // Even if there's an error, clear cookies
    tokenService.clearTokenCookies(res);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  }
};

// ==================== REFRESH ACCESS TOKEN ====================
export const refreshAccessToken = async (req, res) => {
  try {
    // Get refresh token from cookies or authorization header
    let refreshToken = req.cookies?.refreshToken;

    if (!refreshToken && req.headers.authorization) {
      refreshToken = req.headers.authorization.split(' ')[1];
    }

    // Check if refresh token exists
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not provided.',
      });
    }

    // Check if refresh token is blacklisted
    const isBlacklisted = await redisClient.isTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Session invalidated. Please login again.',
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = tokenService.verifyRefreshToken(refreshToken);
    } catch (error) {
      // Token is invalid or expired
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token. Please login again.',
      });
    }

    // Find user and include the stored refresh token
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.',
      });
    }

    // Check if user has an active refresh token
    if (!user.refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No active session found. Please login again.',
      });
    }

    // Compare incoming refresh token with stored refresh token
    if (user.refreshToken !== refreshToken) {
      // Token mismatch - possible token theft or old token usage
      // Blacklist the incoming token
      const ttl = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
      if (ttl > 0) {
        await redisClient.blacklistToken(refreshToken, ttl);
      }

      return res.status(401).json({
        success: false,
        message: 'Refresh token does not match active session. Please login again.',
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = tokenService.generateTokens(
      user._id.toString(),
      user.role
    );

    // Rotate refresh token: blacklist old one
    const oldTokenTTL = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
    if (oldTokenTTL > 0) {
      await redisClient.blacklistToken(refreshToken, oldTokenTTL);
    }

    // Update user with new refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    // Update cookies
    tokenService.setTokenCookies(res, accessToken, newRefreshToken);

    // Refresh cached user data
    const userWithoutPassword = await User.findById(user._id);
    await redisClient.cacheUser(user._id.toString(), userWithoutPassword);

    res.status(200).json({
      success: true,
      message: 'Access token refreshed successfully.',
      accessToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token. Please login again.',
      error: error.message,
    });
  }
};


// ==================== FORGOT PASSWORD ====================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address.',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    // Check if user signed up with Google
    if (user.authProvider === 'google') {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google Sign-In. Password reset is not available.',
      });
    }

    // Generate reset token
    const resetToken = user.generateResetToken();
    await user.save();

    // Create reset URL pointing to frontend application
    const clientBaseUrl = (ENV.CLIENT_URL || '').replace(/\/$/, '') || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${clientBaseUrl}/resetpassword?token=${resetToken}`;

    // Send email
    await emailService.sendPasswordResetEmail(user.email, resetUrl, user.name);

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending password reset email. Please try again.',
      error: error.message,
    });
  }
};

// ==================== RESET PASSWORD ====================
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    // Hash token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.',
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Clear cached user
    await redisClient.deleteCachedUser(user._id.toString());

    // Generate new tokens
    const { accessToken, refreshToken } = tokenService.generateTokens(
      user._id.toString(),
      user.role
    );

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Set cookies
    tokenService.setTokenCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You are now logged in.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password. Please try again.',
      error: error.message,
    });
  }
};

// ==================== GOOGLE SIGNUP ====================
export const signupWithGoogle = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required.',
      });
    }

    // Verify Google token
    const googleUser = await googleAuthService.verifyIdToken(idToken);

    // Check if user already exists
    let user = await User.findOne({ email: googleUser.email });

    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists. Please login instead.',
      });
    }

    // Create new user
    user = await User.create({
      name: googleUser.name,
      email: googleUser.email,
      googleId: googleUser.googleId,
      isVerified: true, // Google accounts are pre-verified
      authProvider: 'google',
      role: 'user',
    });

    // Generate tokens
    const { accessToken, refreshToken } = tokenService.generateTokens(
      user._id.toString(),
      user.role
    );

    // Save refresh token
    user.refreshToken = refreshToken;
    user.lastLogin = Date.now();
    await user.save();

    // Set cookies
    tokenService.setTokenCookies(res, accessToken, refreshToken);

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(user.email, user.name).catch(console.error);

    // Cache user data
    await redisClient.cacheUser(user._id.toString(), user);

    res.status(201).json({
      success: true,
      message: 'Signup with Google successful.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        isVerified: user.isVerified,
      },
      accessToken,
    });
  } catch (error) {
    console.error('Google signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error signing up with Google. Please try again.',
      error: error.message,
    });
  }
};

// ==================== GOOGLE LOGIN ====================
export const loginWithGoogle = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required.',
      });
    }

    // Verify Google token
    const googleUser = await googleAuthService.verifyIdToken(idToken);

    // Find user
    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found. Please sign up first.',
      });
    }

    // If user exists but didn't sign up with Google, link the account
    if (!user.googleId) {
      user.googleId = googleUser.googleId;
      user.authProvider = 'google';
      user.isVerified = true;
      await user.save();
    }

    // Generate tokens
    const { accessToken, refreshToken } = tokenService.generateTokens(
      user._id.toString(),
      user.role
    );

    // Save refresh token
    user.refreshToken = refreshToken;
    user.lastLogin = Date.now();
    await user.save();

    // Set cookies
    tokenService.setTokenCookies(res, accessToken, refreshToken);

    // Cache user data
    await redisClient.cacheUser(user._id.toString(), user);

    res.status(200).json({
      success: true,
      message: 'Login with Google successful.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        isVerified: user.isVerified,
      },
      accessToken,
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in with Google. Please try again.',
      error: error.message,
    });
  }
};

// ==================== PROFILE ====================
export const profile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // Try to get from cache first
    let user = await redisClient.getCachedUser(userId.toString());

    if (!user) {
      // Get from database
      user = await User.findById(userId).populate('chatbots');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }

      // Cache the user
      await redisClient.cacheUser(userId.toString(), user);
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        authProvider: user.authProvider,
        isVerified: user.isVerified,

        // Subscription details
        plan: user.plan,
        planPrice: user.planPrice,
        billingCycle: user.billingCycle,
        subscriptionStart: user.subscriptionStart,
        subscriptionEnd: user.subscriptionEnd,
        isActive: user.isActive,

        // Usage and limits
        apiKey: user.apiKey,
        apiUsage: user.apiUsage,
        questionLimit: user.questionLimit,
        questionsUsed: user.questionsUsed,
        chatbotLimit: user.chatbotLimit,
        chatbotsCreated: user.chatbotsCreated,
        teamMembers: user.teamMembers,

        // Features
        supportType: user.supportType,
        watermarkType: user.watermarkType,
        analyticsEnabled: user.analyticsEnabled,
        earlyAccess: user.earlyAccess,

        // System
        vectorStoreType: user.vectorStoreType,
        systemPrompt: user.systemPrompt,
        chatbots: user.chatbots,

        // Metadata
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile.',
      error: error.message,
    });
  }
};