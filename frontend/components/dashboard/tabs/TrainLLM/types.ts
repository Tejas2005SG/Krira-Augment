import { ColorResult } from "react-color"

export type DatasetType = "csv" | "json" | "website" | "pdf"

export type DatasetPreview = {
  dataset_type: DatasetType
  chunk_size: number
  chunk_overlap: number
  total_chunks: number
  chunks: Array<{ order: number; text: string }>
}

export type PreviewDatasetResult = {
  id: string
  label: string
  source: DatasetType
  status: "success" | "error"
  data?: DatasetPreview
  error?: string
}

export type FileDatasetType = Exclude<DatasetType, "website">
export type FileUploadEntry = { id: string; file: File }
export type VectorStoreOption = "pinecone" | "chroma"

// We need to import EMBEDDING_MODELS from constants to infer this type properly if we want to use typeof, 
// but to avoid circular deps, we can define the IDs as a union here or export the type after defining constants.
// For now, let's define it as string or try to match the values.
// Since I can't easily import values from constants to types without circular dependency if constants use types,
// I will define a string union or just string for now, or repeat the values.
// Looking at the code: type EmbeddingModelId = (typeof EMBEDDING_MODELS)[number]["id"]
// I'll move this type definition to constants.ts or keep it here as string for now, or better:
export type EmbeddingModelId = "openai-small" | "openai-large" | "huggingface"

export type EmbeddingSummaryResult = {
  dataset_id: string
  label: string
  vector_store: VectorStoreOption
  embedding_model: EmbeddingModelId
  chunks_processed: number
  chunks_embedded: number
}

export type EmbeddingSummaryError = {
  dataset_id: string
  label: string
  message: string
}

export type EmbeddingRunSummary = {
  results: EmbeddingSummaryResult[]
  errors: EmbeddingSummaryError[]
}

export type EmbeddingDatasetPayload = {
  id: string
  label: string
  dataset_type: DatasetType
  chunk_size: number
  chunk_overlap: number
  chunks: Array<{ order: number; text: string }>
}

export type EvaluationMetrics = {
  accuracy: number
  evaluationScore: number
  semanticAccuracy: number
  faithfulness: number
  answerRelevancy: number
  contentPrecision: number
  contextRecall: number
}

export type EvaluationRow = {
  questionNumber: string
  question: string
  expectedAnswer: string
  modelAnswer: string
  verdict: "correct" | "incorrect" | "partial"
  llmScore: number
  semanticScore?: number | null
  faithfulness?: number | null
  answerRelevancy?: number | null
  contentPrecision?: number | null
  contextRecall?: number | null
  contextSnippets: string[]
  notes?: string | null
}

export type MetricJustifications = Record<string, string>

export type LLMProviderId =
  | "openai"
  | "anthropic"
  | "google"
  | "grok"
  | "deepseek"
  | "perplexity"
  | "glm"

export type LLMModelOption = {
  id: string
  label: string
  badge?: "Paid" | "Free"
}

export type RetrievedContextEntry = {
  text: string
  score?: number | null
  metadata?: Record<string, unknown>
}

export type LLMModelsResponsePayload = {
  providers?: Array<{
    id: LLMProviderId
    models?: LLMModelOption[]
  }>
}

export type LLMTestResponsePayload = {
  provider: string
  modelId: string
  question: string
  answer: string
  context?: RetrievedContextEntry[]
  totalChunksScanned?: number
  relevantChunksFound?: number
}

export type ManifestResult = {
  id: string
  label: string
  type: DatasetType
  preview: DatasetPreview
}

export type ManifestError = {
  id?: string
  label?: string
  message: string
  type?: DatasetType
}

export type AppearanceConfig = {
  primary: string
  accent: string
  background: string
  text: string
  button: string
  borderRadius: number
  bubbleSize: number
  font: string
  useGradient: boolean
}

export type BehaviorConfig = {
  welcomeMessage: string
  placeholder: string
  responseDelay: number[]
  typingIndicator: boolean
  soundNotifications: boolean
}

export type BrandingConfig = {
  chatbotName: string
  watermark: string
  position: string
  customWatermark: string
  logo: File | null
}
