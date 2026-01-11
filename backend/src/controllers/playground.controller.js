import { Chatbot } from '../models/chatbot.model.js';
import User from '../models/auth.model.js';
import { redisClient } from '../utils/redis.js';
import { ENV } from '../lib/env.js';
import { consumeRequests, ensureRequestCapacity } from '../services/usage.service.js';

// Use local Python backend in development, hosted in production
const PYTHON_BACKEND_URL = ENV.NODE_ENV === 'production'
  ? (ENV.PYTHON_BACKEND_URL_HOSTED || 'https://rag-python-backend.onrender.com')
  : (ENV.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000');
const CHAT_HISTORY_TTL = 60 * 60 * 24 * 30; // 30 days

/**
 * Store chat message in Redis
 */
async function storeChatMessage(sessionId, chatbotId, role, content) {
  const key = `chat:${chatbotId}:${sessionId}`;
  const message = {
    role,
    content,
    timestamp: new Date().toISOString(),
  };

  try {
    // Get existing messages
    const existingData = await redisClient.get(key);
    let messages = [];

    if (existingData) {
      try {
        messages = typeof existingData === 'string' ? JSON.parse(existingData) : existingData;
        if (!Array.isArray(messages)) messages = [];
      } catch {
        messages = [];
      }
    }

    // Add new message
    messages.push(message);

    // Store with TTL
    await redisClient.client.setex(key, CHAT_HISTORY_TTL, JSON.stringify(messages));

    return messages;
  } catch (error) {
    console.error('Error storing chat message:', error);
    throw error;
  }
}

/**
 * Get chat history from Redis
 */
async function getChatHistory(sessionId, chatbotId) {
  const key = `chat:${chatbotId}:${sessionId}`;

  try {
    const data = await redisClient.get(key);

    if (!data) return [];

    try {
      const messages = typeof data === 'string' ? JSON.parse(data) : data;
      return Array.isArray(messages) ? messages : [];
    } catch {
      return [];
    }
  } catch (error) {
    console.error('Error getting chat history:', error);
    return [];
  }
}

/**
 * Clear chat history from Redis
 */
async function clearChatHistory(sessionId, chatbotId) {
  const key = `chat:${chatbotId}:${sessionId}`;

  try {
    await redisClient.client.del(key);
    return true;
  } catch (error) {
    console.error('Error clearing chat history:', error);
    return false;
  }
}

/**
 * Chat with chatbot in playground
 */
export const playgroundChat = async (req, res) => {
  try {
    const { pipelineId, chatbotId, message, sessionId } = req.body;
    const targetId = pipelineId || chatbotId;
    const userId = req.user._id;

    if (!targetId || !message) {
      return res.status(400).json({
        success: false,
        message: 'pipelineId and message are required',
      });
    }

    // Find the chatbot and verify ownership
    const chatbot = await Chatbot.findOne({ _id: targetId, userId });

    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: 'Chatbot not found or access denied',
      });
    }

    // Verify chatbot is properly configured
    if (!chatbot.llm?.model || !chatbot.embedding?.isEmbedded) {
      return res.status(400).json({
        success: false,
        message: 'Chatbot is not fully configured',
      });
    }

    // Get fresh user data for usage tracking
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user has request capacity before making the API call
    try {
      ensureRequestCapacity(user, 1);
    } catch (capacityError) {
      return res.status(capacityError.statusCode || 402).json({
        success: false,
        message: capacityError.message || 'Request limit reached',
      });
    }

    // Store user message in Redis
    const effectiveSessionId = sessionId || `session-${Date.now()}`;
    await storeChatMessage(effectiveSessionId, targetId, 'user', message);

    // Get chat history for context (last 10 messages)
    const chatHistory = await getChatHistory(effectiveSessionId, targetId);
    const recentHistory = chatHistory.slice(-10);

    // Prepare the request to Python backend
    const llmConfig = chatbot.llm;
    const embeddingConfig = chatbot.embedding;

    // Convert pinecone config from camelCase to snake_case for Python backend
    let pineconeConfig = null;
    if (embeddingConfig.pineconeConfig && embeddingConfig.vectorStore === 'pinecone') {
      pineconeConfig = {
        api_key: embeddingConfig.pineconeConfig.apiKey,
        index_name: embeddingConfig.pineconeConfig.indexName,
        namespace: embeddingConfig.pineconeConfig.namespace || null,
      };
    }

    const requestBody = {
      provider: llmConfig.provider,
      model_id: llmConfig.model,
      system_prompt: llmConfig.systemPrompt,
      vector_store: embeddingConfig.vectorStore,
      embedding_model: embeddingConfig.model,
      embedding_dimension: embeddingConfig.dimension,
      dataset_ids: embeddingConfig.datasetIds || [],
      top_k: llmConfig.topK || 30,
      question: message,
      pinecone: pineconeConfig,
      chat_history: recentHistory,
    };

    // Call Python backend for RAG response with timeout
    console.log('Calling Python backend:', `${PYTHON_BACKEND_URL}/api/llm/playground-chat`);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800000); // 30 minute timeout

    let response;
    try {
      response = await fetch(`${PYTHON_BACKEND_URL}/api/llm/playground-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', fetchError);
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({
          success: false,
          message: 'Request timed out. The AI is taking too long to respond.',
        });
      }
      return res.status(502).json({
        success: false,
        message: 'Failed to connect to AI service. Please try again.',
      });
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Python backend error:', errorData);
      return res.status(response.status).json({
        success: false,
        message: errorData.detail || 'Failed to get response from AI',
      });
    }

    const data = await response.json();
    console.log('Python backend response:', data);

    // Track usage - consume 1 request
    try {
      await consumeRequests(user, 1, { source: 'playground', botId: targetId });
      console.log('Usage tracked for playground request');
    } catch (usageError) {
      console.error('Failed to track usage:', usageError);
      // Don't fail the request if usage tracking fails
    }

    // Store assistant response in Redis
    await storeChatMessage(effectiveSessionId, targetId, 'assistant', data.answer);

    return res.status(200).json({
      success: true,
      answer: data.answer,
      sessionId: effectiveSessionId,
      contextSnippets: data.context_snippets || [],
    });
  } catch (error) {
    console.error('Playground chat error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get chat history for a session
 */
export const getPlaygroundHistory = async (req, res) => {
  try {
    const { pipelineId, chatbotId, sessionId } = req.params;
    const targetId = pipelineId || chatbotId;
    const userId = req.user._id;

    if (!targetId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'pipelineId and sessionId are required',
      });
    }

    // Verify chatbot ownership
    const chatbot = await Chatbot.findOne({ _id: targetId, userId });

    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: 'Pipeline not found or access denied',
      });
    }

    const history = await getChatHistory(sessionId, targetId);

    return res.status(200).json({
      success: true,
      messages: history,
    });
  } catch (error) {
    console.error('Get playground history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Clear chat history for a session
 */
export const clearPlaygroundHistory = async (req, res) => {
  try {
    const { pipelineId, chatbotId, sessionId } = req.params;
    const targetId = pipelineId || chatbotId;
    const userId = req.user._id;

    if (!targetId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'pipelineId and sessionId are required',
      });
    }

    // Verify chatbot ownership
    const chatbot = await Chatbot.findOne({ _id: targetId, userId });

    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: 'Pipeline not found or access denied',
      });
    }

    await clearChatHistory(sessionId, targetId);

    return res.status(200).json({
      success: true,
      message: 'Chat history cleared',
    });
  } catch (error) {
    console.error('Clear playground history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
