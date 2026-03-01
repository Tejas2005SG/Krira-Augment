import axios from "axios";
import fs from "fs";
import path from "path";

import { ENV } from "../lib/env.js";
import { getPlanDefinition } from "../lib/plan.js";
import User from "../models/auth.model.js";
import { redisClient } from "../utils/redis.js";

const parseIntOrDefault = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseUrlsInput = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch (_err) {
      return raw.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
};

const normalizeUrl = (url) => {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};

const safeJsonParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch (_err) {
    return fallback;
  }
};

const mapFilesById = (filesByType) => {
  const lookup = new Map();
  Object.entries(filesByType).forEach(([type, files = []]) => {
    files.forEach((file) => {
      const separatorIndex = file.originalname.indexOf("__");
      if (separatorIndex === -1) {
        return;
      }
      const id = file.originalname.slice(0, separatorIndex);
      const originalName = file.originalname.slice(separatorIndex + 2) || file.originalname;
      lookup.set(id, { file, originalName, type });
    });
  });
  return lookup;
};

const callPython = async (payload) => {
  if (!ENV.PYTHON_BACKEND_URL) {
    throw new Error("Python backend URL is not configured");
  }

  console.log(`[Node] Calling Python backend at ${ENV.PYTHON_BACKEND_URL}/uploaddataset`);

  const enhancedPayload = { ...payload };
  if (payload.file_path) {
    try {
      const filePath = payload.file_path;
      console.log(`[Node] Reading file for Python backend: ${filePath}`);
      const fileBuffer = fs.readFileSync(filePath);
      enhancedPayload.file_content = fileBuffer.toString("base64");
      // Clear file_path so Python uses file_content instead
      enhancedPayload.file_path = null;
      console.log(`[Node] Encoded file as base64 (${fileBuffer.length} bytes)`);
    } catch (readError) {
      console.error(`[Node] Failed to read file at ${payload.file_path}:`, readError.message);
      throw new Error(`Failed to read uploaded file: ${readError.message}`);
    }
  }

  try {
    const response = await axios.post(
      `${ENV.PYTHON_BACKEND_URL.replace(/\/$/, "")}/uploaddataset`,
      enhancedPayload,
      {
        timeout: 300000, // 5 minutes timeout
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );
    console.log("[Node] Python backend responded successfully");
    return response.data;
  } catch (error) {
    console.error("[Node] Python backend call failed:", error.message);
    if (error.code === 'ECONNABORTED') {
      throw new Error("Python backend timed out");
    }
    throw error;
  }
};

// Just use the absolute path directly
const buildRelativePath = (absolutePath) => absolutePath.replace(/\\/g, "/");

// Clean up uploaded temp files to prevent /tmp from filling up on Render
const cleanupFiles = (files) => {
  if (!files) return;
  const allFiles = Object.values(files).flat();
  for (const file of allFiles) {
    try {
      if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        console.log(`[Node] Cleaned up temp file: ${file.path}`);
      }
    } catch (err) {
      console.warn(`[Node] Failed to cleanup file ${file?.path}:`, err.message);
    }
  }
};

const formatError = (label, type, error) => ({
  label,
  type,
  status: error.response?.status ?? 500,
  message:
    error.response?.data?.detail ??
    error.response?.data?.message ??
    error.message ??
    "Failed to process dataset",
});

/**
 * Store dataset uploads and delegate chunking to the Python service.
 */
export const uploadDataset = async (req, res) => {
  console.log("[Node] Received uploadDataset request");
  try {
    const userRecord = await User.findById(req.user?._id).select("storageUsedMb storageLimitMb plan");
    if (!userRecord) {
      return res.status(401).json({ message: "Unable to locate user profile." });
    }

    const plan = getPlanDefinition(userRecord.plan ?? req.user?.plan);
    const storageLimitMb = plan.storageLimitMb ?? 50;
    const existingUsageMb = userRecord.storageUsedMb ?? 0;

    const allFiles = Object.values(req.files ?? {}).flat();
    const totalBytes = allFiles.reduce((acc, file) => acc + (file?.size ?? 0), 0);
    const uploadMb = Number((totalBytes / (1024 * 1024)).toFixed(4));
    const projectedUsageMb = Number((existingUsageMb + uploadMb).toFixed(4));

    if (uploadMb > 0 && projectedUsageMb - storageLimitMb > 1e-6) {
      const remainingMb = Math.max(storageLimitMb - existingUsageMb, 0);
      return res.status(403).json({
        message: `Upload exceeds your total ${storageLimitMb} MB storage pool. ${remainingMb.toFixed(2)} MB remaining.`,
      });
    }

    let storageCommitted = false;
    const commitStorageUsage = async () => {
      if (storageCommitted || uploadMb <= 0) {
        return;
      }
      storageCommitted = true;
      userRecord.storageUsedMb = projectedUsageMb;
      await userRecord.save();
      if (req.user) {
        req.user.storageUsedMb = projectedUsageMb;
      }
      await redisClient.cacheUser(userRecord._id.toString(), userRecord);
    };

    const chunkSize = parseIntOrDefault(req.body?.chunkSize, 1000);
    const chunkOverlap = parseIntOrDefault(req.body?.chunkOverlap, 200);

    if (chunkSize <= 0 || chunkOverlap < 0 || chunkOverlap >= chunkSize) {
      return res.status(400).json({ message: "Invalid chunk configuration" });
    }

    const manifestRaw = req.body?.manifest;

    if (manifestRaw) {
      const manifest = safeJsonParse(manifestRaw, []);
      if (!Array.isArray(manifest) || manifest.length === 0) {
        return res.status(400).json({ message: "No datasets provided" });
      }

      const filesByType = {
        csv: req.files?.csvFiles ?? [],
        json: req.files?.jsonFiles ?? [],
        pdf: req.files?.pdfFiles ?? [],
      };
      const fileLookup = mapFilesById(filesByType);

      const queue = [];
      const errors = [];

      manifest.forEach((entry) => {
        if (!entry || !entry.id || !entry.type) {
          errors.push({
            label: entry?.label ?? "Unknown dataset",
            type: entry?.type ?? "csv",
            status: 400,
            message: "Invalid manifest entry",
          });
          return;
        }

        if (entry.type === "website") {
          const normalizedUrl = normalizeUrl(entry.url);
          if (!normalizedUrl) {
            errors.push({ label: entry.label ?? "Website dataset", type: "website", status: 400, message: "URL is required" });
            return;
          }
          queue.push({
            id: entry.id,
            label: entry.label ?? normalizedUrl,
            type: "website",
            url: normalizedUrl,
          });
          return;
        }

        const fileRecord = fileLookup.get(entry.id);
        if (!fileRecord) {
          errors.push({
            label: entry.label ?? entry.name ?? "Dataset",
            type: entry.type,
            status: 400,
            message: "Uploaded file missing for manifest entry",
          });
          return;
        }

        queue.push({
          id: entry.id,
          label: entry.label ?? fileRecord.originalName,
          type: entry.type,
          filePath: buildRelativePath(fileRecord.file.path),
          originalName: fileRecord.originalName,
        });
        fileLookup.delete(entry.id);
      });

      if (queue.length === 0 && errors.length > 0) {
        return res.status(400).json({ results: [], errors });
      }

      const results = [];
      for (const item of queue) {
        try {
          const payload = {
            dataset_type: item.type,
            chunk_size: chunkSize,
            chunk_overlap: chunkOverlap,
            file_path: item.filePath ?? null,
            urls: item.type === "website" ? [item.url] : null,
            file_name: item.originalName ?? null,
          };

          const pythonResponse = await callPython(payload);
          results.push({
            id: item.id,
            label: item.label,
            type: pythonResponse.dataset_type,
            preview: pythonResponse,
          });
        } catch (error) {
          errors.push({ id: item.id, ...formatError(item.label, item.type, error) });
        }
      }

      // Clean up uploaded temp files after processing
      cleanupFiles(req.files);

      const statusCode = errors.length > 0 && results.length === 0 ? 400 : 200;
      if (statusCode === 200 && results.length > 0) {
        await commitStorageUsage();
      }
      return res.status(statusCode).json({ results, errors });
    }

    // Legacy single dataset flow (fallback for older clients)
    const datasetType = req.body?.datasetType;
    if (!datasetType) {
      return res.status(400).json({ message: "datasetType is required" });
    }

    const legacyFile = Array.isArray(req.files?.dataset) ? req.files.dataset[0] : req.file;

    let filePath = null;
    if (legacyFile) {
      filePath = buildRelativePath(legacyFile.path);
    } else if (datasetType !== "website") {
      return res.status(400).json({ message: "Dataset file is required for the selected type" });
    }

    let urlList = null;
    if (datasetType === "website") {
      urlList = parseUrlsInput(req.body?.urls).map(normalizeUrl).filter(Boolean);
      if (!urlList || urlList.length === 0) {
        return res.status(400).json({ message: "At least one URL is required" });
      }
    }

    const payload = {
      dataset_type: datasetType,
      chunk_size: chunkSize,
      chunk_overlap: chunkOverlap,
      file_path: filePath,
      urls: urlList,
      file_name: legacyFile?.originalname ?? null,
    };

    const pythonResponse = await callPython(payload);
    await commitStorageUsage();
    // Clean up uploaded temp files after processing
    cleanupFiles(req.files);
    return res.status(200).json(pythonResponse);
  } catch (error) {
    // Always clean up temp files, even on error
    cleanupFiles(req.files);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ message: "Failed to process dataset", detail: error.message });
  }
};
