import mongoose from "mongoose";

const chatbotSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        // Step 1: Upload Dataset
        dataset: {
            type: {
                type: String,
                enum: ["csv", "json", "website", "pdf"],
            },
            files: [
                {
                    name: String,
                    size: Number,
                    chunks: Number,
                },
            ],
            urls: [String],
        },
        // Step 2: Configure Embedding
        embedding: {
            model: String,
            vectorStore: {
                type: String,
                enum: ["pinecone", "chroma"],
            },
            pineconeConfig: {
                apiKey: String,
                indexName: String,
            },
            stats: {
                chunksProcessed: Number,
                chunksEmbedded: Number,
            },
            isEmbedded: {
                type: Boolean,
                default: false,
            },
        },
        // Step 3: Choose LLM
        llm: {
            provider: String,
            model: String,
            topK: Number,
            systemPrompt: String,
        },
        // Step 3 (Part 2): Test Model History
        testHistory: [
            {
                question: String,
                answer: String,
                context: [mongoose.Schema.Types.Mixed], // Store retrieved chunks/metadata
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        // Step 4: Evaluate
        evaluation: {
            file: {
                name: String,
                size: Number,
                path: String,
            },
            metrics: {
                accuracy: Number,
                evaluationScore: Number,
                semanticAccuracy: Number,
                faithfulness: Number,
                answerRelevancy: Number,
                contentPrecision: Number,
                contextRecall: Number,
            },
            rows: [mongoose.Schema.Types.Mixed], // Store the evaluation table rows
            justifications: mongoose.Schema.Types.Mixed,
        },
    },
    { timestamps: true }
);

export const Chatbot = mongoose.model("Chatbot", chatbotSchema);
