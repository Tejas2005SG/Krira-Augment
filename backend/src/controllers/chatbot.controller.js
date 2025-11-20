import { Chatbot } from "../models/chatbot.model.js";
import { encryptApiKey, decryptApiKey } from "../lib/crypto.js";

export const createChatbot = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Chatbot name is required" });
        }

        const chatbot = new Chatbot({
            userId: req.user._id,
            name,
        });

        await chatbot.save();
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

        // Decrypt Pinecone API key before sending to frontend
        if (chatbot.embedding?.pineconeConfig?.apiKey) {
            const chatbotObj = chatbot.toObject();
            chatbotObj.embedding.pineconeConfig.apiKey = decryptApiKey(chatbot.embedding.pineconeConfig.apiKey);
            return res.status(200).json(chatbotObj);
        }

        res.status(200).json(chatbot);
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
