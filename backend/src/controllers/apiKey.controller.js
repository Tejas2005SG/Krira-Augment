import crypto from "crypto";

import { ApiKey } from "../models/apiKey.model.js";
import { Chatbot } from "../models/chatbot.model.js";
import { decryptApiKey } from "../lib/crypto.js";

const ALLOWED_PERMISSIONS = new Set(["chat", "manage"]);

const slugify = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const hashApiKey = (apiKey) => crypto.createHash("sha256").update(apiKey).digest("hex");

const generateRawKey = () => `sk-live-${crypto.randomBytes(28).toString("hex")}`;

const normalizePermissions = (permissions = []) => {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return ["chat"];
  }

  const sanitized = Array.from(
    new Set(
      permissions
        .map((permission) => String(permission || "").toLowerCase().trim())
        .filter((permission) => ALLOWED_PERMISSIONS.has(permission))
    )
  );

  return sanitized.length > 0 ? sanitized : ["chat"];
};

const buildExpiresAt = (input) => {
  if (!input) return undefined;
  if (typeof input === "number" && Number.isFinite(input) && input > 0) {
    const expires = new Date();
    expires.setDate(expires.getDate() + input);
    return expires;
  }

  const parsed = new Date(input);
  return Number.isNaN(parsed.valueOf()) ? undefined : parsed;
};

const serializeKey = (keyDoc, bot) => ({
  id: keyDoc._id,
  name: keyDoc.name,
  maskedKey: `${keyDoc.prefix}${"•".repeat(12)}${keyDoc.suffix}`,
  permissions: keyDoc.permissions,
  status: keyDoc.status,
  createdAt: keyDoc.createdAt,
  lastUsedAt: keyDoc.lastUsedAt,
  expiresAt: keyDoc.expiresAt,
  usageCount: keyDoc.usageCount,
  rateLimitPerMinute: keyDoc.rateLimitPerMinute,
  bot: bot
    ? {
        id: bot._id.toString(),
        name: bot.name,
        slug: slugify(bot.name),
      }
    : undefined,
});

export const listApiKeys = async (req, res) => {
  try {
    const keys = await ApiKey.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const botIds = [...new Set(keys.map((key) => key.botId.toString()))];
    const bots = await Chatbot.find({ _id: { $in: botIds } }).select("name");
    const botMap = new Map(bots.map((bot) => [bot._id.toString(), bot]));

    const payload = keys.map((key) => serializeKey(key, botMap.get(key.botId.toString())));
    return res.json({ success: true, keys: payload });
  } catch (error) {
    console.error("Failed to list API keys", error);
    return res.status(500).json({ message: "Unable to load API keys" });
  }
};

export const createApiKey = async (req, res) => {
  try {
    const { name, botId, permissions, expiresInDays, expiresAt, rateLimitPerMinute } = req.body ?? {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Key name is required" });
    }

    if (!botId) {
      return res.status(400).json({ message: "botId is required" });
    }

    const bot = await Chatbot.findOne({ _id: botId, userId: req.user._id }).select("name");
    if (!bot) {
      return res.status(404).json({ message: "Chatbot not found" });
    }

    const rawKey = generateRawKey();
    const keyHash = hashApiKey(rawKey);
    const prefix = rawKey.slice(0, 8);
    const suffix = rawKey.slice(-4);

    const sanitizedPermissions = normalizePermissions(permissions);
    const parsedExpiresAt = buildExpiresAt(expiresAt ?? expiresInDays);

    const parsedRateLimit = Number(rateLimitPerMinute);
    const normalizedRateLimit = Number.isFinite(parsedRateLimit)
      ? Math.min(Math.max(parsedRateLimit, 1), 6000)
      : undefined;

    const keyDoc = await ApiKey.create({
      name: String(name).trim(),
      userId: req.user._id,
      botId,
      botNameSnapshot: bot.name,
      botSlugSnapshot: slugify(bot.name),
      keyHash,
      prefix,
      suffix,
      permissions: sanitizedPermissions,
      expiresAt: parsedExpiresAt,
      rateLimitPerMinute: normalizedRateLimit,
    });

    return res.status(201).json({
      success: true,
      apiKey: serializeKey(keyDoc, bot),
      key: rawKey,
    });
  } catch (error) {
    console.error("Failed to create API key", error);
    return res.status(500).json({ message: "Unable to generate API key" });
  }
};

export const revokeApiKey = async (req, res) => {
  try {
    const { keyId } = req.params;

    const key = await ApiKey.findOne({ _id: keyId, userId: req.user._id });
    if (!key) {
      return res.status(404).json({ message: "API key not found" });
    }

    if (key.status === "revoked") {
      return res.json({ success: true, message: "API key already revoked" });
    }

    key.status = "revoked";
    key.requestsInWindow = 0;
    await key.save();

    return res.json({ success: true });
  } catch (error) {
    console.error("Failed to revoke API key", error);
    return res.status(500).json({ message: "Unable to revoke API key" });
  }
};

const enforceRateLimit = (key) => {
  const now = Date.now();
  const windowStart = key.windowStartedAt ? key.windowStartedAt.getTime() : 0;

  if (!windowStart || now - windowStart >= 60_000) {
    key.windowStartedAt = new Date(now);
    key.requestsInWindow = 0;
  }

  if (key.requestsInWindow >= key.rateLimitPerMinute) {
    return false;
  }

  key.requestsInWindow += 1;
  return true;
};

export const verifyApiKey = async (req, res) => {
  try {
    const { apiKey, botId } = req.body ?? {};

    if (!apiKey || !botId) {
      return res.status(400).json({ message: "apiKey and botId are required" });
    }

    const botIdentifier = String(botId).trim();
    const keyHash = hashApiKey(apiKey);
    const key = await ApiKey.findOne({ keyHash }).populate({ path: "botId", select: "name dataset embedding llm" });

    if (!key || key.status !== "active") {
      return res.status(401).json({ message: "Invalid API key" });
    }

    const normalizedInput = botIdentifier.toLowerCase();
    const inputSlug = slugify(botIdentifier);

    const candidateValues = [
      key.botId?._id?.toString(),
      key.botId?.name,
      key.botNameSnapshot,
      key.botSlugSnapshot,
      slugify(key.botId?.name || ""),
      slugify(key.botNameSnapshot || ""),
    ]
      .filter(Boolean)
      .map((value) => value.toString().trim().toLowerCase());

    const matchesIdentifier = candidateValues.includes(normalizedInput) || (inputSlug && candidateValues.includes(inputSlug));

    if (!matchesIdentifier) {
      return res.status(403).json({ message: "API key is not authorized for this bot" });
    }

    if (key.expiresAt && key.expiresAt.getTime() < Date.now()) {
      key.status = "revoked";
      await key.save();
      return res.status(401).json({ message: "API key has expired" });
    }

    if (!enforceRateLimit(key)) {
      await key.save();
      return res.status(429).json({ message: "API key rate limit exceeded" });
    }

    key.lastUsedAt = new Date();
    key.usageCount += 1;
    await key.save();

    const botPayload = key.botId?.toObject ? key.botId.toObject() : key.botId;
    if (botPayload?.embedding?.pineconeConfig?.apiKey) {
      const decrypted = decryptApiKey(botPayload.embedding.pineconeConfig.apiKey);
      if (decrypted) {
        botPayload.embedding.pineconeConfig.apiKey = decrypted;
      }
    }

    return res.json({
      valid: true,
      permissions: key.permissions,
      bot: {
        id: key.botId._id.toString(),
        name: key.botId.name,
        dataset: botPayload?.dataset,
        embedding: botPayload?.embedding,
        llm: botPayload?.llm,
      },
      rateLimitPerMinute: key.rateLimitPerMinute,
    });
  } catch (error) {
    console.error("Failed to verify API key", error);
    return res.status(500).json({ message: "Unable to verify API key" });
  }
};
