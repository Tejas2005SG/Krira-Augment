import { apiClient } from "./client"

export type ApiKeyStatus = "active" | "revoked"

export interface ApiKeyRecord {
  id: string
  name: string
  maskedKey: string
  permissions: string[]
  status: ApiKeyStatus
  createdAt: string
  lastUsedAt?: string
  expiresAt?: string
  usageCount: number
  rateLimitPerMinute: number
  pipeline?: {
    id: string
    name: string
  }
}

export interface CreateApiKeyPayload {
  name: string
  pipelineId: string
  permissions?: string[]
  expiresInDays?: number
  expiresAt?: string
  rateLimitPerMinute?: number
}

class ApiKeysService {
  private baseUrl = "/keys"

  async list(): Promise<{ success: boolean; keys: ApiKeyRecord[] }> {
    return apiClient.get(this.baseUrl)
  }

  async create(payload: CreateApiKeyPayload): Promise<{ success: boolean; apiKey: ApiKeyRecord; key: string }> {
    return apiClient.post(this.baseUrl, payload)
  }

  async revoke(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(`${this.baseUrl}/${id}`)
  }
}

export const apiKeysService = new ApiKeysService()
