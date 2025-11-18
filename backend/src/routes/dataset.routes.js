import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import { uploadDataset } from "../controllers/dataset.controller.js";

const router = express.Router();

const projectRoot = path.resolve(process.cwd(), "..");
const uploadsDir = path.join(projectRoot, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
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
  limits: { fileSize: 25 * 1024 * 1024 },
});

const datasetFields = [
  { name: "csvFiles", maxCount: 10 },
  { name: "jsonFiles", maxCount: 10 },
  { name: "pdfFiles", maxCount: 10 },
  { name: "dataset", maxCount: 1 },
];

router.post("/process", upload.fields(datasetFields), uploadDataset);

export default router;
