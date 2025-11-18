import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import {ENV} from './lib/env.js'
import {connectDb} from './lib/db.js';

//routes
import authRoutes from "./routes/auth.routes.js";
import datasetRoutes from "./routes/dataset.routes.js";
import embeddingRoutes from "./routes/embedding.routes.js";
import llmRoutes from "./routes/llm.routes.js";

const app = express();
const PORT = process.env.PORT;

app.use(cors({
    origin:ENV.CLIENT_URL, 
    credentials: true, 
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());


app.use("/api/auth",authRoutes);
app.use("/api/datasets", datasetRoutes);
app.use("/api/embeddings", embeddingRoutes);
app.use("/api/llm", llmRoutes);


app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await connectDb();
});