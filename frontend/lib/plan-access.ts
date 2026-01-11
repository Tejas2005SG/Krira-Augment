import modelAccess from "./model-access.json";

type ModelAccessEntry = {
  freeModels?: string[]
  paidModels?: string[]
}

type ModelAccessMap = Record<string, ModelAccessEntry>

const MODEL_ACCESS = modelAccess as ModelAccessMap

type PlanAccess = {
  allowedProviders: string[]
  allowedEmbeddingModels: string[]
  allowedVectorStores: string[]
  requestLimit: number
  isPaid: boolean
  allowedModelsByProvider?: Record<string, string[]>
}

const pickFreeModels = (providers: string[]) => {
  const result: Record<string, string[]> = {}
  providers.forEach((provider) => {
    const entry = MODEL_ACCESS[provider]
    if (entry?.freeModels?.length) {
      result[provider] = entry.freeModels
    } else if (entry?.paidModels?.length) {
      result[provider] = []
    }
  })
  return result
}

const ACCESS_MAP: Record<string, PlanAccess> = {
  free: {
    allowedProviders: ["openai", "google", "deepseek", "glm"],
    allowedEmbeddingModels: ["openai-small", "huggingface"],
    allowedVectorStores: ["chroma"],
    requestLimit: 100,
    isPaid: false,
    allowedModelsByProvider: pickFreeModels(["openai", "google", "deepseek", "glm"]),
  },
  startup_monthly: {
    allowedProviders: ["openai", "anthropic", "google", "perplexity", "grok", "deepseek", "glm"],
    allowedEmbeddingModels: ["openai-small", "openai-large", "huggingface"],
    allowedVectorStores: ["chroma", "pinecone"],
    requestLimit: 5000,
    isPaid: true,
    allowedModelsByProvider: undefined,
  },
  enterprise_monthly: {
    allowedProviders: ["openai", "anthropic", "google", "perplexity", "grok", "deepseek", "glm"],
    allowedEmbeddingModels: ["openai-small", "openai-large", "huggingface"],
    allowedVectorStores: ["chroma", "pinecone"],
    requestLimit: 15000,
    isPaid: true,
    allowedModelsByProvider: undefined,
  },
}

export const resolvePlanAccess = (planId?: string): PlanAccess => {
  return ACCESS_MAP[planId ?? "free"] ?? ACCESS_MAP.free
}
