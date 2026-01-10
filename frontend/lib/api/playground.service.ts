import { apiClient } from "./client"

export type PlaygroundChatRequest = {
  pipelineId: string
  message: string
  sessionId?: string
}

export type PlaygroundChatResponse = {
  success: boolean
  answer: string
  sessionId: string
  contextSnippets?: Array<Record<string, unknown>>
}

class PlaygroundService {
  async chat(payload: PlaygroundChatRequest): Promise<PlaygroundChatResponse> {
    return apiClient.post<PlaygroundChatResponse>("/playground/chat", payload, {
      retry: 1,
    })
  }
}

export const playgroundService = new PlaygroundService()
