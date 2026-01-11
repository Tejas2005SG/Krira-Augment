import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PLAN_CONFIG } from '../lib/plan.js';

const userSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId; // Password not required for Google users
      },
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    googleId: {
      type: String,
      sparse: true, // Allows null values but ensures uniqueness when present
      unique: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },

    // Subscription Details
    plan: {
      type: String,
      enum: ['free', 'startup_monthly', 'enterprise_monthly'],
      default: 'free',
    },
    planPrice: {
      type: Number,
      default: 0,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual'],
      default: 'monthly',
    },
    subscriptionStart: {
      type: Date,
      default: Date.now,
    },
    subscriptionEnd: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    paymentId: {
      type: String,
    },

    // API Configuration
    apiKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    apiUsage: {
      type: Number,
      default: 0,
    },

    // Usage Limits
    questionLimit: {
      type: Number,
      default: 100,
    },
    questionsUsed: {
      type: Number,
      default: 0,
    },
    chatbotLimit: {
      type: Number,
      default: 1,
    },
    chatbotsCreated: {
      type: Number,
      default: 0,
    },
    teamMembers: {
      type: Number,
      default: 0,
    },
    storageLimitMb: {
      type: Number,
      default: 50,
    },
    storageUsedMb: {
      type: Number,
      default: 0,
    },

    // Support and Features
    supportType: {
      type: String,
      enum: ['community', 'priority-email', 'priority-24x7'],
      default: 'community',
    },
    watermarkType: {
      type: String,
      enum: ['powered-by-krira', 'custom'],
      default: 'powered-by-krira',
    },
    analyticsEnabled: {
      type: Boolean,
      default: false,
    },
    earlyAccess: {
      type: Boolean,
      default: false,
    },

    // Chatbot and System Data
    chatbots: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chatbot',
      },
    ],
    systemPrompt: {
      type: String,
      default: 'You are a helpful AI assistant.',
    },
    vectorStoreType: {
      type: String,
      enum: ['chroma', 'pinecone'],
      default: 'chroma',
    },
    vectorStoreCredentials: {
      apiKey: {
        type: String,
        select: false,
      },
      indexName: {
        type: String,
      },
    },

    // Account Management
    lastLogin: {
      type: Date,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    stripeCustomerId: {
      type: String,
    },
    stripeSubscriptionId: {
      type: String,
    },
    requestsResetAt: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Apply plan configuration when plan changes
userSchema.pre('save', function (next) {
  if (this.isModified('plan')) {
    const planConfig = PLAN_CONFIG[this.plan];

    if (planConfig) {
      const planPrice = planConfig.monthlyPrice ?? planConfig.price ?? 0;
      this.planPrice = planPrice;
      this.chatbotLimit = planConfig.chatbotLimit;
      this.questionLimit = planConfig.questionLimit;
      this.storageLimitMb = planConfig.storageLimitMb ?? this.storageLimitMb;
      this.vectorStoreType = planConfig.vectorStore ?? planConfig.vectorStores?.[0] ?? 'chroma';
      this.supportType = planConfig.support;
      this.watermarkType = planConfig.watermark;
      this.analyticsEnabled = planConfig.analytics || false;
      this.earlyAccess = planConfig.earlyAccess || false;
      this.teamMembers = planConfig.teamMembers || 0;
      this.billingCycle = planConfig.billingCycle || 'monthly';
      this.requestsResetAt = new Date();

      if (this.plan !== 'free' && !this.apiKey) {
        this.apiKey = this.generateApiKey();
      }
    }
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate API key
userSchema.methods.generateApiKey = function () {
  return `krira_${crypto.randomBytes(32).toString('hex')}`;
};

// Generate password reset token
userSchema.methods.generateResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

  return resetToken;
};

// Check if user has reached chatbot limit
userSchema.methods.canCreateChatbot = function () {
  return this.chatbotsCreated < this.chatbotLimit;
};

// Check if user has reached question limit
userSchema.methods.canAskQuestion = function () {
  return this.questionsUsed < this.questionLimit;
};

// Reset monthly usage
userSchema.methods.resetMonthlyUsage = function () {
  this.questionsUsed = 0;
  this.apiUsage = 0;
};

const User = mongoose.model('User', userSchema);

export default User;