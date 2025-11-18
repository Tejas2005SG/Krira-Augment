import express from "express";

import { startEmbedding } from "../controllers/embedding.controller.js";

const router = express.Router();

router.post("/start", startEmbedding);

export default router;
