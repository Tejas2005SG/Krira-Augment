import axios from "axios";
import path from "path";

import { ENV } from "../lib/env.js";

const projectRoot = path.resolve(process.cwd(), "..");

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
  try {
    const response = await axios.post(
      `${ENV.PYTHON_BACKEND_URL.replace(/\/$/, "")}/uploaddataset`,
      payload,
      { timeout: 300000 } // 5 minutes timeout
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

const buildRelativePath = (absolutePath) =>
  path.relative(projectRoot, absolutePath).replace(/\\/g, "/");

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

      const statusCode = errors.length > 0 && results.length === 0 ? 400 : 200;
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
    return res.status(200).json(pythonResponse);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ message: "Failed to process dataset", detail: error.message });
  }
};
