import nodemailer from 'nodemailer';
import { ENV } from '../lib/env.js';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: ENV.GOOGLE_EMAIL_USER,
        pass: ENV.GOOGLE_APP_PASSWORD,
      },
    });
  }

  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP email
  async sendOTP(email, otp, name) {
    const mailOptions = {
      from: `"Krira AI" <${ENV.GOOGLE_EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - Krira AI',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Verification</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Thank you for signing up with Krira AI! Please use the following OTP to verify your email address:</p>
              <div class="otp-box">
                <div class="otp">${otp}</div>
              </div>
              <p><strong>This OTP will expire in 5 minutes.</strong></p>
              <p>If you didn't request this verification, please ignore this email.</p>
              <p>Best regards,<br>The Krira AI Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Krira AI. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, resetUrl, name) {
    const mailOptions = {
      from: `"Krira AI" <${ENV.GOOGLE_EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request - Krira AI',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <p>This link will expire in 30 minutes. If you didn't request a password reset, please ignore this email and ensure your account is secure.</p>
              </div>
              <p>Best regards,<br>The Krira AI Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Krira AI. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  // Send welcome email
  async sendWelcomeEmail(email, name) {
    const mailOptions = {
      from: `"Krira AI" <${ENV.GOOGLE_EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Krira AI! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Krira AI! 🎉</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Congratulations! Your account has been successfully verified. We're excited to have you on board!</p>
              <h3>What's Next?</h3>
              <div class="feature">
                <strong>🤖 Create Your First Chatbot</strong>
                <p>Start building intelligent chatbots for your business.</p>
              </div>
              <div class="feature">
                <strong>📊 Explore Analytics</strong>
                <p>Track your chatbot's performance and user interactions.</p>
              </div>
              <div class="feature">
                <strong>🚀 Upgrade Your Plan</strong>
                <p>Unlock more features and higher limits with our premium plans.</p>
              </div>
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <p>Best regards,<br>The Krira AI Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Krira AI. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw error for welcome email
      return false;
    }
  }
}

export const emailService = new EmailService();