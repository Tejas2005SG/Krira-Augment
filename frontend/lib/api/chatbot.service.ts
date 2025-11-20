import { apiClient } from './client';

// Type definitions
export interface Chatbot {
  _id: string;
  userId: string;
  name: string;
  dataset?: {
    type: string;
    files?: Array<{ name: string; size: number; chunks: number }>;
    urls?: string[];
  };
  embedding?: {
    model: string;
    vectorStore: string;
    pineconeConfig?: {
      indexName: string;
    };
    stats?: {
      chunksProcessed: number;
      chunksEmbedded: number;
    };
    isEmbedded: boolean;
  };
  llm?: {
    provider: string;
    model: string;
    topK: number;
    systemPrompt: string;
  };
  tests?: Array<{
    question: string;
    answer: string;
  }>;
  testHistory?: Array<{
    question: string;
    answer: string;
    context: any[];
    timestamp: Date;
  }>;
  evaluation?: {
    file?: {
      name: string;
      size: number;
      path: string;
    };
    metrics?: any;
    rows?: any[];
    justifications?: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface GetAllChatbotsResponse {
  success: boolean;
  count: number;
  chatbots: Chatbot[];
}

export interface ChatbotResponse {
  success: boolean;
  message?: string;
  chatbot?: Chatbot;
}

export interface CreateChatbotData {
  name: string;
}

export interface UpdateChatbotData {
  name?: string;
  dataset?: any;
  embedding?: any;
  llm?: any;
  testHistory?: any;
  evaluation?: any;
}

// Chatbot Service class
class ChatbotService {
  private baseUrl = '/chatbots';

  /**
   * Get all chatbots for the logged-in user
   */
  async getAllChatbots(): Promise<GetAllChatbotsResponse> {
    return apiClient.get<GetAllChatbotsResponse>(this.baseUrl);
  }

  /**
   * Get a single chatbot by ID
   */
  async getChatbot(id: string): Promise<Chatbot> {
    return apiClient.get<Chatbot>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new chatbot
   */
  async createChatbot(data: CreateChatbotData): Promise<Chatbot> {
    return apiClient.post<Chatbot>(this.baseUrl, data);
  }

  /**
   * Update a chatbot
   */
  async updateChatbot(id: string, data: UpdateChatbotData): Promise<Chatbot> {
    return apiClient.put<Chatbot>(`${this.baseUrl}/${id}`, data);
  }

  /**
   * Delete a chatbot
   */
  async deleteChatbot(id: string): Promise<ChatbotResponse> {
    return apiClient.delete<ChatbotResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Add a test result to chatbot history
   */
  async addTestResult(
    id: string,
    question: string,
    answer: string,
    context: any[]
  ): Promise<Chatbot> {
    return apiClient.post<Chatbot>(`${this.baseUrl}/${id}/test-result`, {
      question,
      answer,
      context,
    });
  }
}

// Create and export chatbot service instance
export const chatbotService = new ChatbotService();
