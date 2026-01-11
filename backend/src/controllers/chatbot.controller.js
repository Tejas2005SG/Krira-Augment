import { Chatbot } from "../models/chatbot.model.js";
import User from "../models/auth.model.js";
import { encryptApiKey, decryptApiKey } from "../lib/crypto.js";
import { redisClient } from "../utils/redis.js";
import { getPlanDefinition } from "../lib/plan.js";

const buildActivePipelineFilter = (userId) => ({
    userId,
    $or: [{ isCompleted: true }, { isCompleted: { $exists: false } }],
});

const ensureLegacyCompletionState = async (chatbot) => {
    if (chatbot && typeof chatbot.isCompleted !== "boolean") {
        chatbot.isCompleted = true;
        chatbot.status = chatbot.status ?? "active";
        chatbot.completedAt = chatbot.completedAt ?? chatbot.updatedAt ?? new Date();
        await chatbot.save();
    }
    return chatbot;
};

export const createChatbot = async (req, res) => {
    try {
        const { name } = req.body;
        const trimmedName = typeof name === "string" ? name.trim() : "";
        if (!trimmedName) {
            return res.status(400).json({ message: "Chatbot name is required" });
        }

        const userId = req.user._id;

        // Check if a chatbot with the same name already exists
        const existingChatbot = await Chatbot.findOne({ userId, name: trimmedName });
        if (existingChatbot) {
            // Resume existing chatbot
            // Ensure legacy state if needed
            await ensureLegacyCompletionState(existingChatbot);

            // If we need to decrypt keys for the frontend
            const chatbotObj = existingChatbot.toObject();
            const pineconeKey = chatbotObj?.embedding?.pineconeConfig?.apiKey;
            if (pineconeKey) {
                try {
                    chatbotObj.embedding.pineconeConfig.apiKey = decryptApiKey(pineconeKey) ?? null;
                } catch (decryptError) {
                    chatbotObj.embedding.pineconeConfig.apiKey = null;
                }
            }

            // Return 200 OK to indicate retrieval/resume rather than creation
            return res.status(200).json(chatbotObj);
        }

        // Check limits before creating new one
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // Check if storage is already full before allowing a new pipeline creation
        const plan = getPlanDefinition(user?.plan ?? req.user?.plan);
        const storageLimitMb = plan.storageLimitMb ?? 50;
        const currentUsageMb = user.storageUsedMb ?? 0;

        if (currentUsageMb >= storageLimitMb) {
            return res.status(403).json({
                message: "Storage limit reached. You cannot create more pipelines until you free up space.",
            });
        }

        // Multi-pipeline support enabled - constraint is now exclusively storage.

        const chatbot = new Chatbot({
            userId: req.user._id,
            name: trimmedName,
            status: "draft",
            isCompleted: false,
        });

        await chatbot.save();

        if (Array.isArray(user.chatbots)) {
            const exists = user.chatbots.some((botId) => botId.toString() === chatbot._id.toString());
            if (!exists) {
                user.chatbots.push(chatbot._id);
            }
        } else {
            user.chatbots = [chatbot._id];
        }

        // Update chatbotsCreated count to reflect total pipelines (draft + active)
        // This ensures the user profile matches the strict limit logic
        user.chatbotsCreated = await Chatbot.countDocuments({ userId });

        await user.save();
        await redisClient.cacheUser(user._id.toString(), user);

        res.status(201).json(chatbot);
    } catch (error) {
        console.error("Error creating chatbot:", error);
        res.status(500).json({ message: "Failed to create chatbot", error: error.message });
    }
};

export const getChatbot = async (req, res) => {
    try {
        const { id } = req.params;
        const chatbot = await Chatbot.findOne({ _id: id, userId: req.user._id });

        if (!chatbot) {
            return res.status(404).json({ message: "Chatbot not found" });
        }

        await ensureLegacyCompletionState(chatbot);
        const chatbotObj = chatbot.toObject();

        // Decrypt Pinecone API key before sending to frontend
        const pineconeKey = chatbotObj?.embedding?.pineconeConfig?.apiKey;
        if (pineconeKey) {
            try {
                chatbotObj.embedding.pineconeConfig.apiKey = decryptApiKey(pineconeKey) ?? null;
            } catch (decryptError) {
                console.error("Failed to decrypt Pinecone API key:", decryptError);
                chatbotObj.embedding.pineconeConfig.apiKey = null;
            }
        }

        res.status(200).json(chatbotObj);
    } catch (error) {
        console.error("Error fetching chatbot:", error);
        res.status(500).json({ message: "Failed to fetch chatbot", error: error.message });
    }
};

export const updateChatbot = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Ensure we don't overwrite the userId or immutable fields
        delete updateData.userId;
        delete updateData._id;

        // Encrypt Pinecone API key if present
        if (updateData.embedding?.pineconeConfig?.apiKey) {
            updateData.embedding.pineconeConfig.apiKey = encryptApiKey(updateData.embedding.pineconeConfig.apiKey);
        }

        // Find the existing chatbot first
        const existingChatbot = await Chatbot.findOne({ _id: id, userId: req.user._id });

        if (!existingChatbot) {
            return res.status(404).json({ message: "Chatbot not found" });
        }

        // Deep merge function that handles nested objects properly
        const deepMerge = (target, source) => {
            const output = { ...target };
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    output[key] = deepMerge(target[key] || {}, source[key]);
                } else {
                    output[key] = source[key];
                }
            }
            return output;
        };

        // Merge the update data with existing data
        const mergedData = {};
        for (const key in updateData) {
            if (updateData[key] && typeof updateData[key] === 'object' && !Array.isArray(updateData[key])) {
                mergedData[key] = deepMerge(existingChatbot[key]?.toObject?.() || existingChatbot[key] || {}, updateData[key]);
            } else {
                mergedData[key] = updateData[key];
            }
        }

        // Update the chatbot with merged data
        const chatbot = await Chatbot.findOneAndUpdate(
            { _id: id, userId: req.user._id },
            mergedData,
            { new: true, runValidators: true }
        );

        res.status(200).json(chatbot);
    } catch (error) {
        console.error("Error updating chatbot:", error);
        res.status(500).json({ message: "Failed to update chatbot", error: error.message });
    }
};

export const completeChatbot = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const chatbot = await Chatbot.findOne({ _id: id, userId });
        if (!chatbot) {
            return res.status(404).json({ message: "Chatbot not found" });
        }

        if (typeof chatbot.isCompleted !== "boolean") {
            await ensureLegacyCompletionState(chatbot);
            return res.status(200).json(chatbot);
        }

        if (chatbot.isCompleted) {
            return res.status(200).json(chatbot);
        }

        // Check storage limit before completing
        const user = await User.findById(userId);
        const plan = getPlanDefinition(user?.plan);
        const storageLimitMb = plan.storageLimitMb ?? 50;
        const currentUsageMb = user?.storageUsedMb ?? 0;

        if (currentUsageMb >= storageLimitMb) {
            return res.status(403).json({
                message: "Cannot activate pipeline. Storage pool is full.",
            });
        }

        // Pipeline count checks removed in favor of total storage pool enforcement.

        chatbot.isCompleted = true;
        chatbot.status = "active";
        chatbot.completedAt = new Date();
        await chatbot.save();

        if (user) {
            const totalActive = await Chatbot.countDocuments(buildActivePipelineFilter(userId));
            user.chatbotsCreated = totalActive;
            if (Array.isArray(user.chatbots)) {
                const exists = user.chatbots.some((botId) => botId.toString() === chatbot._id.toString());
                if (!exists) {
                    user.chatbots.push(chatbot._id);
                }
            } else {
                user.chatbots = [chatbot._id];
            }
            await user.save();
            await redisClient.cacheUser(user._id.toString(), user);
        }

        return res.status(200).json(chatbot);
    } catch (error) {
        console.error("Error completing chatbot:", error);
        return res.status(500).json({ message: "Failed to finalize chatbot", error: error.message });
    }
};

// Specific endpoint to push a test result to history
export const addTestResult = async (req, res) => {
    try {
        const { id } = req.params;
        const { question, answer, context } = req.body;

        const chatbot = await Chatbot.findOneAndUpdate(
            { _id: id, userId: req.user._id },
            {
                $push: {
                    testHistory: {
                        question,
                        answer,
                        context,
                        timestamp: new Date()
                    }
                }
            },
            { new: true }
        );

        if (!chatbot) {
            return res.status(404).json({ message: "Chatbot not found" });
        }

        res.status(200).json(chatbot);
    } catch (error) {
        console.error("Error adding test result:", error);
        res.status(500).json({ message: "Failed to add test result", error: error.message });
    }
};

// Get all chatbots for the logged-in user
export const getAllChatbots = async (req, res) => {
    try {
        const chatbots = await Chatbot.find({ userId: req.user._id })
            .select('-embedding.pineconeConfig.apiKey') // Don't send API key in list
            .sort({ createdAt: -1 }); // Newest first

        res.status(200).json({
            success: true,
            count: chatbots.length,
            chatbots
        });
    } catch (error) {
        console.error("Error fetching chatbots:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch chatbots",
            error: error.message
        });
    }
};

// Delete a chatbot
export const deleteChatbot = async (req, res) => {
    try {
        const { id } = req.params;

        const chatbot = await Chatbot.findOneAndDelete({
            _id: id,
            userId: req.user._id
        });

        if (!chatbot) {
            return res.status(404).json({
                success: false,
                message: "Chatbot not found"
            });
        }

        const user = await User.findById(req.user._id);
        if (user) {
            user.chatbots = (user.chatbots ?? []).filter((botId) => botId.toString() !== chatbot._id.toString());
            const activeCount = await Chatbot.countDocuments(buildActivePipelineFilter(user._id));
            user.chatbotsCreated = activeCount;
            await user.save();
            await redisClient.cacheUser(user._id.toString(), user);
        }

        res.status(200).json({
            success: true,
            message: "Chatbot deleted successfully",
            chatbot: {
                id: chatbot._id,
                name: chatbot.name
            }
        });
    } catch (error) {
        console.error("Error deleting chatbot:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete chatbot",
            error: error.message
        });
    }
};
