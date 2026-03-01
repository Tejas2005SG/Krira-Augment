import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import { uploadDataset } from "../controllers/dataset.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

import os from "os";

const router = express.Router();

// Use /tmp (via os.tmpdir()) for Render deployment or production
// This ensures we write to a valid ephemeral location
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;
const uploadsDir = isProduction
  ? path.join(os.tmpdir(), 'krira_uploads')
  : path.resolve(process.cwd(), '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`[Node] Created uploads directory: ${uploadsDir}`);
  } catch (err) {
    console.error(`[Node] Failed to create uploads directory at ${uploadsDir}:`, err);
    // Fallback to simpler temp dir if custom subfolder fails
    if (isProduction) {
      console.warn("[Node] Falling back to system temp directory root");
    }
  }
} else if (isProduction) {
  // On startup in production, clean up any leftover temp files from previous runs
  try {
    const existingFiles = fs.readdirSync(uploadsDir);
    let cleaned = 0;
    for (const file of existingFiles) {
      try {
        fs.unlinkSync(path.join(uploadsDir, file));
        cleaned++;
      } catch (_err) { /* skip files that can't be deleted */ }
    }
    if (cleaned > 0) {
      console.log(`[Node] Startup cleanup: removed ${cleaned} old temp file(s) from ${uploadsDir}`);
    }
  } catch (err) {
    console.warn(`[Node] Startup cleanup failed:`, err.message);
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, "_");
    cb(null, `${timestamp}_${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 * 1024 }, // 20GB
});

const datasetFields = [
  { name: "csvFiles", maxCount: 10 },
  { name: "jsonFiles", maxCount: 10 },
  { name: "pdfFiles", maxCount: 10 },
  { name: "dataset", maxCount: 1 },
];

router.use(authMiddleware);

router.post("/process", upload.fields(datasetFields), uploadDataset);

export default router;
