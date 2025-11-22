import mongoose from "mongoose";

const apiKeySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    botId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chatbot",
      required: true,
      index: true,
    },
    botNameSnapshot: {
      type: String,
      trim: true,
    },
    botSlugSnapshot: {
      type: String,
      trim: true,
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    prefix: {
      type: String,
      required: true,
    },
    suffix: {
      type: String,
      required: true,
    },
    permissions: {
      type: [String],
      default: ["chat"],
    },
    status: {
      type: String,
      enum: ["active", "revoked"],
      default: "active",
    },
    expiresAt: {
      type: Date,
    },
    lastUsedAt: {
      type: Date,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    rateLimitPerMinute: {
      type: Number,
      default: 60,
      min: 1,
      max: 6000,
    },
    windowStartedAt: {
      type: Date,
    },
    requestsInWindow: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

apiKeySchema.index({ userId: 1, botId: 1 });

export const ApiKey = mongoose.model("ApiKey", apiKeySchema);
