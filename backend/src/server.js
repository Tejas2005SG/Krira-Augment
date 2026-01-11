import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './lib/env.js'
import { connectDb } from './lib/db.js';

//routes
import authRoutes from "./routes/auth.routes.js";
import datasetRoutes from "./routes/dataset.routes.js";
import embeddingRoutes from "./routes/embedding.routes.js";
import llmRoutes from "./routes/llm.routes.js";
import chatbotRoutes from "./routes/chatbot.routes.js";
import apiKeyRoutes from "./routes/apiKey.routes.js";
import billingRoutes from "./routes/billing.routes.js";
import usageRoutes from "./routes/usage.routes.js";
import playgroundRoutes from "./routes/playground.routes.js";
import { handleStripeWebhook } from "./controllers/billing.controller.js";

const app = express();
const PORT = process.env.PORT;

const allowedOrigins = (ENV.ALLOWED_ORIGINS || ENV.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

// CORS configuration for cross-origin cookie authentication
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        console.warn(`Blocked CORS origin: ${origin}`);
        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200
}));

if (ENV.STRIPE_SECRET_KEY && ENV.STRIPE_WEBHOOK_SECRET) {
    app.post("/api/billing/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());


app.use("/api/auth", authRoutes);
app.use("/api/datasets", datasetRoutes);
app.use("/api/embeddings", embeddingRoutes);
app.use("/api/llm", llmRoutes);
app.use("/api/chatbots", chatbotRoutes);
app.use("/api/keys", apiKeyRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/usage", usageRoutes);
app.use("/api/playground", playgroundRoutes);


const server = app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await connectDb();
});

server.timeout = 1800000; // 30 minutes
server.keepAliveTimeout = 1800000; // 30 minutes