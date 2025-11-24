"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import { Loader2 } from "lucide-react"

import { apiClient, ApiError } from "@/lib/api/client"
import { chatbotService, type UpdateChatbotData, type Chatbot } from "@/lib/api/chatbot.service"
import { useAuth } from "@/contexts/AuthContext"
import { resolvePlanAccess } from "@/lib/plan-access"
import { Button } from "@/components/ui/button"
import {
  TooltipProvider,
} from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"

import {
  DatasetType,
  FileDatasetType,
  PreviewDatasetResult,
  FileUploadEntry,
  VectorStoreOption,
  EmbeddingModelId,
  EmbeddingRunSummary,
  EmbeddingDatasetPayload,
  EvaluationMetrics,
  EvaluationRow,
  MetricJustifications,
  LLMProviderId,
  LLMModelOption,
  RetrievedContextEntry,
  LLMModelsResponsePayload,
  LLMTestResponsePayload,
  ManifestResult,
  ManifestError,
  AppearanceConfig,
  BehaviorConfig,
  BrandingConfig,
} from "./TrainLLM/types"

import {
  STEPS,
  EMBEDDING_MODELS,
  EMBEDDING_DIMENSION_OPTIONS,
  DEFAULT_EMBEDDING_DIMENSIONS,
  DEFAULT_FRONTEND_MODELS,
  CODE_SNIPPETS,
  FILE_DATASET_TYPES,
} from "./TrainLLM/constants"

import { Stepper } from "./TrainLLM/Stepper"
import { CreateChatbotStep } from "./TrainLLM/CreateChatbotStep"
import { DatasetUploader } from "./TrainLLM/DatasetUploader"
import { TextSplittingCard } from "./TrainLLM/TextSplittingCard"
import { EmbeddingConfiguration } from "./TrainLLM/EmbeddingConfiguration"
import { LLMConfiguration } from "./TrainLLM/LLMConfiguration"
import { EvaluationSection } from "./TrainLLM/EvaluationSection"
import { DeploymentSection } from "./TrainLLM/DeploymentSection"
import { DetailDialog } from "./TrainLLM/DetailDialog"

const FINAL_STEP_INDEX = STEPS.length - 1

const getApiErrorDetail = (error: ApiError): string | undefined => {
  if (typeof error.data === "object" && error.data !== null) {
    const detail = (error.data as { detail?: unknown }).detail
    if (typeof detail === "string") {
      return detail
    }
    const message = (error.data as { message?: unknown }).message
    if (typeof message === "string") {
      return message
    }
  }
  return undefined
}

export function TrainLLMTab() {
  const { user, updateUser } = useAuth()
  const planAccess = React.useMemo(() => resolvePlanAccess(user?.plan), [user?.plan])
  const router = useRouter()
  const { toast } = useToast()
  const [activeStep, setActiveStep] = React.useState(0)
  const [maxUnlockedStep, setMaxUnlockedStep] = React.useState(0)
  const [canJumpFreely, setCanJumpFreely] = React.useState(false)
  const [datasetType, setDatasetType] = React.useState<DatasetType>("csv")
  const [fileUploads, setFileUploads] = React.useState<Record<FileDatasetType, FileUploadEntry[]>>({
    csv: [],
    json: [],
    pdf: [],
  })
  const [websiteUrls, setWebsiteUrls] = React.useState<string[]>([""])
  const [chunkSize, setChunkSize] = React.useState(1000)
  const [chunkOverlap, setChunkOverlap] = React.useState(200)
  const [showPreview, setShowPreview] = React.useState(false)
  const [previewResults, setPreviewResults] = React.useState<PreviewDatasetResult[]>([])
  const [previewError, setPreviewError] = React.useState<string | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = React.useState(false)
  const [selectedModel, setSelectedModel] = React.useState<EmbeddingModelId>(EMBEDDING_MODELS[0].id as EmbeddingModelId)
  const [modelDimensions, setModelDimensions] = React.useState<Record<EmbeddingModelId, number>>({
    ...DEFAULT_EMBEDDING_DIMENSIONS,
  })
  const [pineconeKey, setPineconeKey] = React.useState("")
  const [indexName, setIndexName] = React.useState("krira-pro-index")
  const [connectionStatus, setConnectionStatus] = React.useState<"idle" | "success" | "error">("idle")
  const [isEmbedding, setIsEmbedding] = React.useState(false)
  const [embeddingProgress, setEmbeddingProgress] = React.useState(0)
  const [vectorStore, setVectorStore] = React.useState<VectorStoreOption>("pinecone")
  const [embeddingSummary, setEmbeddingSummary] = React.useState<EmbeddingRunSummary | null>(null)

  React.useEffect(() => {
    if (!planAccess.allowedEmbeddingModels.includes(selectedModel)) {
      setSelectedModel(planAccess.allowedEmbeddingModels[0] as EmbeddingModelId)
    }
    if (!planAccess.allowedVectorStores.includes(vectorStore)) {
      setVectorStore(planAccess.allowedVectorStores[0] as VectorStoreOption)
      setConnectionStatus("idle")
    }
  }, [planAccess, selectedModel, vectorStore])
  const currentEmbeddingDimension = modelDimensions[selectedModel] ?? DEFAULT_EMBEDDING_DIMENSIONS[selectedModel]
  const [provider, setProvider] = React.useState<LLMProviderId>("openai")
  const [model, setModel] = React.useState("")
  const [llmModels, setLlmModels] = React.useState<Record<LLMProviderId, LLMModelOption[]>>({
    openai: [],
    anthropic: [],
    google: [],
    grok: [],
    deepseek: [],
    perplexity: [],
    glm: [],
  })
  const [isModelLoading, setIsModelLoading] = React.useState(false)
  const [modelError, setModelError] = React.useState<string | null>(null)
  const [isTesting, setIsTesting] = React.useState(false)
  const [systemPrompt, setSystemPrompt] = React.useState(
    "You are Krira AI, a friendly assistant that helps product teams train and deploy chatbots."
  )
  const [promptHistory, setPromptHistory] = React.useState<string[]>([
    "Default onboarding assistant",
    "Sales enablement specialist",
    "Developer documentation guide",
  ])
  const [selectedPromptHistory, setSelectedPromptHistory] = React.useState<string>("")
  const [testQuestion, setTestQuestion] = React.useState("")
  const [testResponse, setTestResponse] = React.useState<string | null>(null)
  const [testContext, setTestContext] = React.useState<RetrievedContextEntry[]>([])
  const [testResponseData, setTestResponseData] = React.useState<LLMTestResponsePayload | null>(null)
  const [chunksToRetrieve, setChunksToRetrieve] = React.useState(30)
  const [isEvaluating, setIsEvaluating] = React.useState(false)
  const [evaluationCsv, setEvaluationCsv] = React.useState<File | null>(null)
  const [evaluationCsvError, setEvaluationCsvError] = React.useState<string | null>(null)
  const [isSampleDownloading, setIsSampleDownloading] = React.useState(false)
  const [evaluationMetrics, setEvaluationMetrics] = React.useState<EvaluationMetrics | null>(null)
  const [evaluationRows, setEvaluationRows] = React.useState<EvaluationRow[]>([])
  const [evaluationJustifications, setEvaluationJustifications] = React.useState<MetricJustifications>({})
  const [selectedResult, setSelectedResult] = React.useState<EvaluationRow | null>(null)
  
  const [appearance, setAppearance] = React.useState<AppearanceConfig>({
    primary: "#2563eb",
    accent: "#60a5fa",
    background: "#ffffff",
    text: "#0f172a",
    button: "#1d4ed8",
    borderRadius: 12,
    bubbleSize: 14,
    font: "Inter",
    useGradient: true,
  })
  const [behavior, setBehavior] = React.useState<BehaviorConfig>({
    welcomeMessage: "Hi there! I'm Krira AI. How can I help you train your AI today?",
    placeholder: "Ask about training workflows...",
    responseDelay: [400],
    typingIndicator: true,
    soundNotifications: false,
  })
  const [branding, setBranding] = React.useState<BrandingConfig>({
    chatbotName: "Krira Coach",
    watermark: "Powered by Krira AI",
    position: "bottom-right",
    customWatermark: "",
    logo: null,
  })
  
  const [activePreviewDevice, setActivePreviewDevice] = React.useState("desktop")
  const [deploymentTab, setDeploymentTab] = React.useState("python")

  const searchParams = useSearchParams()
  const editId = searchParams.get('editId')
  
  const [chatbotId, setChatbotId] = React.useState<string | null>(null)
  const [isChatbotCompleted, setIsChatbotCompleted] = React.useState(false)
  const [isFinalizingChatbot, setIsFinalizingChatbot] = React.useState(false)
  const [chatbotNameInput, setChatbotNameInput] = React.useState("")
  const [isCreatingChatbot, setIsCreatingChatbot] = React.useState(false)
  const [isEditMode, setIsEditMode] = React.useState(false)

  const clearPreview = React.useCallback(() => {
    setPreviewResults([])
    setPreviewError(null)
    setShowPreview(false)
    setEmbeddingSummary(null)
  }, [])

  const restoreChatbotState = React.useCallback((chatbot: Chatbot, startStep: number | null = null) => {
    const pipelineCompleted = Boolean(chatbot.isCompleted || chatbot.status === "active")
    
    // Set edit mode and chatbot ID
    setIsEditMode(true)
    setChatbotId(chatbot._id)
    setChatbotNameInput(chatbot.name)
    setIsChatbotCompleted(pipelineCompleted)
    setCanJumpFreely(pipelineCompleted)

    // Pre-fill dataset data and create preview results to show files
    if (chatbot.dataset) {
      if (chatbot.dataset.type) {
        setDatasetType(chatbot.dataset.type as DatasetType)
      }
      
      // Create preview results from saved files
      if (chatbot.dataset.files && chatbot.dataset.files.length > 0) {
        const filePreviewResults: PreviewDatasetResult[] = chatbot.dataset.files.map((file, idx) => ({
          id: file.datasetId || `saved-file-${idx}`,
          label: file.name,
          source: chatbot.dataset!.type as DatasetType,
          status: "success" as const,
          data: {
            dataset_type: chatbot.dataset!.type as DatasetType,
            chunk_size: 1000,
            chunk_overlap: 200,
            total_chunks: file.chunks || 0,
            chunks: []
          }
        }))
        setPreviewResults(filePreviewResults)
        setShowPreview(true)
      }
      
      // Handle URLs
      if (chatbot.dataset.urls && chatbot.dataset.urls.length > 0) {
        setWebsiteUrls(chatbot.dataset.urls)
      }
    }

    // Pre-fill embedding data
    if (chatbot.embedding) {
      if (chatbot.embedding.model) {
        const embeddingId = chatbot.embedding.model as EmbeddingModelId
        setSelectedModel(embeddingId)
        if (typeof chatbot.embedding.dimension === "number") {
          const allowedDimensions = EMBEDDING_DIMENSION_OPTIONS[embeddingId] ?? []
          const normalizedDimension = allowedDimensions.includes(chatbot.embedding.dimension)
            ? chatbot.embedding.dimension
            : DEFAULT_EMBEDDING_DIMENSIONS[embeddingId]
          setModelDimensions((prev) => ({
            ...prev,
            [embeddingId]: normalizedDimension,
          }))
        }
      }
      if (chatbot.embedding.vectorStore) {
        setVectorStore(chatbot.embedding.vectorStore as VectorStoreOption)
      }
      if (chatbot.embedding.pineconeConfig?.indexName) {
        setIndexName(chatbot.embedding.pineconeConfig.indexName)
      }
      if (chatbot.embedding.isEmbedded) {
        const persistedDatasets = chatbot.embedding.datasets ?? []
        const datasetSummaries = persistedDatasets.length > 0
          ? persistedDatasets.map((dataset, idx) => ({
              dataset_id: dataset.id || `dataset-${idx}`,
              label: dataset.label || `Dataset ${idx + 1}`,
              chunks_processed: dataset.chunksProcessed ?? dataset.chunksEmbedded ?? 0,
              chunks_embedded: dataset.chunksEmbedded ?? dataset.chunksProcessed ?? 0,
            }))
          : chatbot.dataset?.files?.map((f, idx) => ({
              dataset_id: f.datasetId || `file-${idx}`,
              label: f.name,
              chunks_processed: f.chunks || 0,
              chunks_embedded: f.chunks || 0,
            })) || []

        setEmbeddingSummary({
          results: datasetSummaries.map((summary) => ({
            dataset_id: summary.dataset_id,
            label: summary.label,
            vector_store: chatbot.embedding!.vectorStore as VectorStoreOption,
            embedding_model: chatbot.embedding!.model as EmbeddingModelId,
            chunks_processed: summary.chunks_processed,
            chunks_embedded: summary.chunks_embedded,
          })),
          errors: [],
        })
      }
    }

    // Pre-fill LLM data
    if (chatbot.llm) {
      if (chatbot.llm.provider) {
        setProvider(chatbot.llm.provider as LLMProviderId)
      }
      if (chatbot.llm.model) {
        setModel(chatbot.llm.model)
      }
      if (chatbot.llm.topK) {
        setChunksToRetrieve(chatbot.llm.topK)
      }
      if (chatbot.llm.systemPrompt) {
        setSystemPrompt(chatbot.llm.systemPrompt)
      }
    }

    // Pre-fill evaluation data
    if (chatbot.evaluation?.metrics) {
      setEvaluationMetrics(chatbot.evaluation.metrics as EvaluationMetrics)
      if (chatbot.evaluation.rows) {
        setEvaluationRows(chatbot.evaluation.rows as EvaluationRow[])
      }
      if (chatbot.evaluation.justifications) {
        setEvaluationJustifications(chatbot.evaluation.justifications as MetricJustifications)
      }
    }

    // Calculate step logic
    if (startStep !== null) {
      setActiveStep(startStep)
      setMaxUnlockedStep((prev) => Math.max(prev, startStep))
    } else {
      // Determine the last completed step to resume from
      let calculatedStep = 0
      if (pipelineCompleted) {
        calculatedStep = FINAL_STEP_INDEX
      } else {
        // Check milestones in reverse order
        if (chatbot.evaluation?.metrics) calculatedStep = 5 // Ready for deploy
        else if (chatbot.llm?.model) calculatedStep = 4 // Ready for eval
        else if (chatbot.embedding?.isEmbedded) calculatedStep = 3 // Ready for LLM
        else if (chatbot.dataset?.files?.length || chatbot.dataset?.urls?.length) calculatedStep = 2 // Ready for embed
        else calculatedStep = 1 // Created, ready for upload
      }
      
      setActiveStep(calculatedStep)
      setMaxUnlockedStep(pipelineCompleted ? FINAL_STEP_INDEX : calculatedStep)
    }

  }, [])

  // Load existing chatbot data if editId is present
  React.useEffect(() => {
    if (!editId) return

    const loadChatbot = async () => {
      try {
        const chatbot = await chatbotService.getChatbot(editId)
        restoreChatbotState(chatbot, 0) // Start at 0 for editId flow to allow name edit
        toast({
          title: "Editing chatbot",
          description: `Loaded configuration for "${chatbot.name}"`
        })
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          toast({
            title: "Chatbot not found",
            description: "The chatbot you tried to edit no longer exists."
          })
          router.replace("/dashboard?tab=train-llm")
        } else {
          console.error("Failed to load chatbot:", error)
          const message = error instanceof Error ? error.message : "Failed to load chatbot data"
          toast({
            title: "Error loading chatbot",
            description: message
          })
        }
      }
    }

    loadChatbot()
  }, [editId, router, toast, restoreChatbotState])

  React.useEffect(() => {
    if (!editId && !chatbotId) {
      setCanJumpFreely(false)
      setMaxUnlockedStep(0)
    }
  }, [editId, chatbotId])

  const handleCreateChatbot = React.useCallback(async () => {
    const trimmedName = chatbotNameInput.trim()
    if (!trimmedName) {
      toast({ title: "Name required", description: "Please enter a name for your chatbot." })
      return
    }

    if (isEditMode && chatbotId) {
      // Just updating name for existing bot
      setIsCreatingChatbot(true)
      try {
        await chatbotService.updateChatbot(chatbotId, { name: trimmedName })
        toast({ title: "Name updated", description: "Chatbot title saved." })
        setActiveStep(1)
        setMaxUnlockedStep((prev) => Math.max(prev, 1))
      } catch (error) {
        console.error("Failed to update chatbot name:", error)
        const description = error instanceof ApiError ? error.message : "Could not update chatbot."
        toast({ title: "Update failed", description })
      } finally {
        setIsCreatingChatbot(false)
      }
      return
    }

    // Creating new or resuming
    setIsCreatingChatbot(true)
    try {
      const response = await chatbotService.createChatbot({ name: trimmedName })
      
      // Check if we got a full chatbot object with existing state (Resume Flow)
      // A new chatbot has empty dataset/embedding/llm usually, or we can check createdAt vs now
      const datasetFileCount = response.dataset?.files?.length ?? 0
      const hasDatasetFiles = datasetFileCount > 0
      const isResumed = hasDatasetFiles || response.embedding?.isEmbedded || response.llm?.model
      
      if (isResumed || response.status === "active" || response._id) {
        // If the backend returned a bot that looks 'used', or simply if we have an ID
        // The backend logic we added returns the existing bot object if name matches.
        
        // Let's assume if it has an ID, we use it.
        // But specifically for the "Resume" Toast:
        if (hasDatasetFiles || response.embedding?.isEmbedded) {
             toast({ title: "Pipeline Resumed", description: `Loaded existing progress for "${response.name}"` })
             restoreChatbotState(response) // Auto-calculate step
        } else {
             // Likely a fresh bot or empty draft
             setChatbotId(response._id)
             setIsChatbotCompleted(Boolean(response.isCompleted))
             toast({ title: "Chatbot created", description: `Started training pipeline for ${response.name}` })
             
             // If it's a fresh bot (draft), we treat it as "Created"
             // Set active step to 1 (Upload)
             setActiveStep(1)
             setMaxUnlockedStep((prev) => Math.max(prev, 1))
             setIsEditMode(true) // Switch to edit mode so future saves work
             setChatbotNameInput(response.name)
        }
      }

    } catch (error) {
      // Only log unexpected errors to the console
      if (!(error instanceof ApiError) || error.status !== 403) {
        console.error("Failed to create chatbot:", error)
      }

      if (error instanceof ApiError) {
        const description = error.status === 403
          ? "You have reached the RAG pipeline limit. Delete an existing chatbot to create a new one."
          : error.message ?? "Could not create chatbot. Please try again."
        toast({ title: "Creation failed", description })
      } else {
        toast({ title: "Creation failed", description: "Could not create chatbot. Please try again." })
      }
    } finally {
      setIsCreatingChatbot(false)
    }
  }, [chatbotId, chatbotNameInput, isEditMode, toast, restoreChatbotState])

  const updateChatbotState = React.useCallback(async (data: UpdateChatbotData) => {
    if (!chatbotId) {
      console.error("Cannot update chatbot: No chatbotId");
      return;
    }

    console.log("updateChatbotState called with:", JSON.stringify(data, null, 2));
    console.log("chatbotId:", chatbotId);

    try {
      const response = await apiClient.put(
        `/chatbots/${chatbotId}`,
        data
      );
      
      console.log("Update successful:", response);
      toast({ title: "Progress saved" });
    } catch (error) {
      console.error("Error updating chatbot state:", error);
      const message = error instanceof ApiError
        ? error.message
        : "Failed to save progress";
      toast({ title: "Save failed", description: message });
    }
  }, [chatbotId, toast]);

  const finalizeChatbot = React.useCallback(async (): Promise<boolean> => {
    if (!chatbotId || isChatbotCompleted || isFinalizingChatbot) {
      return true;
    }

    setIsFinalizingChatbot(true);
    try {
      const response = await chatbotService.completeChatbot(chatbotId);
      setIsChatbotCompleted(true);
      setCanJumpFreely(true);
      setMaxUnlockedStep(FINAL_STEP_INDEX);

      const currentCount = user?.chatbotsCreated ?? 0;
      const existingChatbots = Array.isArray(user?.chatbots) ? user.chatbots : [];
      const mergedChatbots = [...existingChatbots.filter((bot) => bot._id !== response._id), response];

      updateUser?.({
        chatbotsCreated: currentCount + 1,
        chatbots: mergedChatbots,
      });

      toast({
        title: "Pipeline finalized",
        description: "This chatbot now counts toward your plan usage.",
      });
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        toast({
          title: "Pipeline limit reached",
          description: error.message ?? "You have reached the chatbot limit for your plan.",
          variant: "destructive",
        });
      } else {
        const message = error instanceof Error ? error.message : "Unable to finalize chatbot";
        toast({ title: "Finalization failed", description: message });
      }
      return false;
    } finally {
      setIsFinalizingChatbot(false);
    }
  }, [chatbotId, isChatbotCompleted, isFinalizingChatbot, toast, updateUser, user?.chatbots, user?.chatbotsCreated]);

  const handleDatasetTypeChange = React.useCallback((type: DatasetType) => {
    setDatasetType(type)
    clearPreview()
  }, [clearPreview])

  const handleChunkSizeChange = React.useCallback((value: number) => {
    if (Number.isNaN(value)) {
      return
    }
    setChunkSize(value)
    clearPreview()
  }, [clearPreview])

  const handleChunkOverlapChange = React.useCallback((value: number) => {
    if (Number.isNaN(value)) {
      return
    }
    setChunkOverlap(value)
    clearPreview()
  }, [clearPreview])

  const handleVectorStoreChange = React.useCallback((value: VectorStoreOption) => {
    setVectorStore(value)
    setConnectionStatus("idle")
    setEmbeddingSummary(null)
  }, [])

  const handleSelectEvaluationCsv = React.useCallback((file: File | null) => {
    setEvaluationCsv(file)
    setEvaluationCsvError(null)
  }, [])

  const handleRemoveEvaluationCsv = React.useCallback(() => {
    setEvaluationCsv(null)
    setEvaluationCsvError(null)
  }, [])

  const handleDownloadSampleCsv = React.useCallback(async () => {
    setIsSampleDownloading(true)
    try {
      const blob = await apiClient.get<Blob>(
        `/llm/eval/sample`,
        { responseType: "blob" }
      )

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "evaluation-sample.csv"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Sample CSV downloaded",
        description: "Fill in sr.no, input, and output columns before uploading.",
      })
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unable to download sample CSV"
      toast({ title: "Download failed", description: message })
    } finally {
      setIsSampleDownloading(false)
    }
  }, [toast])

  const handleRunEvaluation = React.useCallback(async () => {
    if (!model) {
      toast({ title: "Model required", description: "Select an LLM model before running evaluation." })
      return
    }

    if (!evaluationCsv) {
      setEvaluationCsvError("Upload an evaluation CSV before running metrics.")
      toast({ title: "CSV required", description: "Upload the filled evaluation CSV to continue." })
      return
    }

    const successfulPreviews = previewResults.filter((result) => result.status === "success" && result.data)
    const datasetIds = successfulPreviews.map((result) => result.id)
    if (datasetIds.length === 0) {
      toast({ title: "Datasets missing", description: "Generate dataset previews before running evaluation." })
      return
    }

    if (vectorStore === "pinecone" && (!pineconeKey.trim() || !indexName.trim())) {
      toast({ title: "Missing Pinecone configuration", description: "Provide Pinecone credentials before running evaluation." })
      return
    }

    setEvaluationCsvError(null)
    setSelectedResult(null)
    setIsEvaluating(true)

    try {
      const formData = new FormData()
      formData.append("provider", provider)
      formData.append("modelId", model)
      formData.append("systemPrompt", systemPrompt)
      formData.append("embeddingModel", selectedModel)
      formData.append("embeddingDimension", String(currentEmbeddingDimension))
      formData.append("vectorStore", vectorStore)
      formData.append("datasetIds", JSON.stringify(datasetIds))
      formData.append("topK", String(chunksToRetrieve))
      formData.append("csvFile", evaluationCsv)

      if (vectorStore === "pinecone") {
        formData.append("pinecone", JSON.stringify({
          api_key: pineconeKey.trim(),
          index_name: indexName.trim(),
        }))
      }

      const response = await apiClient.post(
        `/llm/evaluate`,
        formData,
        { timeout: 600000 }
      )

      const data = response as {
        metrics?: EvaluationMetrics
        rows?: EvaluationRow[]
        justifications?: MetricJustifications
      }

      setEvaluationMetrics(data.metrics ?? null)
      setEvaluationRows(Array.isArray(data.rows) ? data.rows : [])
      setEvaluationJustifications(data.justifications ?? {})
      
      // Save evaluation results to MongoDB
      if (chatbotId) {
        const evaluationPayload: NonNullable<UpdateChatbotData["evaluation"]> = {
          file: {
            name: evaluationCsv.name,
            size: evaluationCsv.size,
            path: evaluationCsv.name
          },
          rows: Array.isArray(data.rows) ? data.rows : [],
          justifications: data.justifications ?? {}
        }

        if (data.metrics) {
          evaluationPayload.metrics = data.metrics
        }

        await updateChatbotState({
          evaluation: evaluationPayload
        })
      }
      
      toast({ title: "Evaluation complete", description: "Generated scores from your evaluation dataset." })
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Evaluation failed"
      setEvaluationCsvError(message)
      toast({ title: "Evaluation failed", description: message })
    } finally {
      setIsEvaluating(false)
    }
  }, [
    chatbotId,
    chunksToRetrieve,
    currentEmbeddingDimension,
    evaluationCsv,
    indexName,
    model,
    pineconeKey,
    previewResults,
    provider,
    selectedModel,
    systemPrompt,
    toast,
    updateChatbotState,
    vectorStore,
  ])

  const filteredUrls = React.useMemo(() => websiteUrls.map((url) => url.trim()).filter(Boolean), [websiteUrls])

  const canPreviewDataset = React.useMemo(() => {
    const hasFiles = FILE_DATASET_TYPES.some((type) => fileUploads[type].length > 0)
    const hasUrls = filteredUrls.length > 0
    return hasFiles || hasUrls
  }, [fileUploads, filteredUrls])

  const providerModels = React.useMemo(() => llmModels[provider] ?? [], [llmModels, provider])
  const availableModels = React.useMemo(() => {
    if (planAccess.isPaid) {
      return providerModels
    }
    const allowed = planAccess.allowedModelsByProvider?.[provider]
    if (allowed && allowed.length > 0) {
      const allowedSet = new Set(allowed)
      return providerModels.filter((option) => allowedSet.has(option.id))
    }
    return providerModels.filter((option) => option.badge !== "Paid")
  }, [planAccess.allowedModelsByProvider, planAccess.isPaid, provider, providerModels])

  const handlePreviewChunks = React.useCallback(async () => {
    if (isPreviewLoading) {
      return
    }

    if (showPreview && !isPreviewLoading) {
      setShowPreview(false)
      return
    }

    const manifest: Array<{ id: string; type: DatasetType; label: string; url?: string | null }> = []
    const fieldMap: Record<FileDatasetType, File[]> = { csv: [], json: [], pdf: [] }

    FILE_DATASET_TYPES.forEach((type) => {
      fileUploads[type].forEach(({ id, file }) => {
        const entryId = id
        manifest.push({ id: entryId, type, label: file.name })
        fieldMap[type].push(new File([file], `${entryId}__${file.name}`, { type: file.type, lastModified: file.lastModified }))
      })
    })

    filteredUrls.forEach((url) => {
      const entryId = `website-${url}-${Math.random().toString(36).slice(2, 8)}`
      manifest.push({ id: entryId, type: "website", label: url, url })
    })

    if (manifest.length === 0) {
      const message = "Add at least one dataset before previewing."
      setPreviewError(message)
      setShowPreview(true)
      toast({ title: "Preview unavailable", description: message })
      return
    }

    setShowPreview(true)
    setPreviewError(null)
    setPreviewResults([])
    setIsPreviewLoading(true)

    const formData = new FormData()
    formData.append("chunkSize", String(chunkSize || 1000))
    formData.append("chunkOverlap", String(chunkOverlap || 200))
    formData.append("manifest", JSON.stringify(manifest))

    fieldMap.csv.forEach((file) => formData.append("csvFiles", file))
    fieldMap.json.forEach((file) => formData.append("jsonFiles", file))
    fieldMap.pdf.forEach((file) => formData.append("pdfFiles", file))

    try {
      const response = await apiClient.post(
        `/datasets/process`,
        formData
      )

      const payload = response as {
        results: ManifestResult[]
        errors?: ManifestError[]
      }

      const formatted: PreviewDatasetResult[] = []
      payload.results?.forEach((item) => {
        formatted.push({
          id: item.id,
          label: item.label,
          source: item.type,
          status: "success",
          data: item.preview,
        })
        console.log("[KriraAI] Dataset preview chunks", {
          dataset: item.label,
          type: item.type,
          preview: item.preview,
        })
      })

      payload.errors?.forEach((error) => {
        const datasetType: DatasetType = error.type && ["csv", "json", "pdf", "website"].includes(error.type)
          ? (error.type as DatasetType)
          : "csv"

        formatted.push({
          id: error.id ?? `${error.label}-${Math.random().toString(36).slice(2, 6)}`,
          label: error.label ?? "Dataset",
          source: datasetType,
          status: "error",
          error: error.message,
        })
      })

      setPreviewResults(formatted)

      const successCount = payload.results?.length ?? 0
      if (successCount > 0) {
        toast({
          title: "Preview ready",
          description: `Generated previews for ${successCount} dataset${successCount > 1 ? "s" : ""}.`,
        })
      }

      if (payload.errors?.length) {
        const failureMessage = payload.errors.map((err) => `${err.label ?? "Dataset"}: ${err.message}`).join("; ")
        setPreviewError(failureMessage)
        toast({ title: "Preview issues", description: failureMessage })
      } else {
        setPreviewError(null)
      }
    } catch (error) {
      const detailMessage = error instanceof ApiError ? getApiErrorDetail(error) : undefined

      const message = error instanceof ApiError
        ? detailMessage ?? error.message
        : error instanceof Error
          ? error.message
          : "Unable to process datasets"
      setPreviewError(message)
      toast({
        title: "Preview failed",
        description: message,
      })
    } finally {
      setIsPreviewLoading(false)
    }
  }, [chunkOverlap, chunkSize, fileUploads, filteredUrls, isPreviewLoading, showPreview, toast])

  const handleDropFiles = React.useCallback(
    (acceptedFiles: File[]) => {
      if (datasetType === "website") {
        return
      }

      const type = datasetType as FileDatasetType

      if (acceptedFiles.length === 0) {
        return
      }

      setFileUploads((prev) => ({
        ...prev,
        [type]: [
          ...prev[type],
          ...acceptedFiles.map((file) => ({
            id: `${type}-${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 10)}`,
            file,
          })),
        ],
      }))

      clearPreview()
    },
    [clearPreview, datasetType]
  )

  const dropzoneAccept = React.useMemo(() => {
    if (datasetType === "website") {
      return undefined
    }
    if (datasetType === "csv") {
      return { "text/csv": [".csv"] } as Record<string, string[]>
    }
    if (datasetType === "json") {
      return { "application/json": [".json"] } as Record<string, string[]>
    }
    return { "application/pdf": [".pdf"] } as Record<string, string[]>
  }, [datasetType])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDropFiles,
    accept: dropzoneAccept,
    multiple: true,
    noClick: datasetType === "website",
  })

  React.useEffect(() => {
    if (!isEmbedding) return
    let frame: number
    const step = () => {
      setEmbeddingProgress((prev) => {
        const next = prev >= 95 ? prev : Math.min(prev + Math.random() * 8, 95)
        if (next < 95) {
          frame = requestAnimationFrame(step)
        }
        return next
      })
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [isEmbedding])

  React.useEffect(() => {
    if (!isEmbedding && embeddingProgress === 100 && embeddingSummary) {
      const successCount = embeddingSummary.results.length
      const errorCount = embeddingSummary.errors.length

      if (successCount > 0) {
        const vectorStoreLabel = embeddingSummary.results[0]?.vector_store.toUpperCase() ?? "STORE"
        const description = `${successCount} dataset${successCount > 1 ? "s" : ""} embedded to ${vectorStoreLabel}`
        toast({
          title: errorCount > 0 ? "Embedding completed with warnings" : "Embedding completed",
          description,
          variant: errorCount > 0 ? "default" : "default",
        })
      } else if (errorCount > 0) {
        const message = embeddingSummary.errors.map((error) => `${error.label}: ${error.message}`).join("; ")
        toast({ title: "Embedding failed", description: message })
      }
    }
  }, [embeddingProgress, embeddingSummary, isEmbedding, toast])

  React.useEffect(() => {
    let active = true

    const loadModels = async () => {
      setIsModelLoading(true)
      setModelError(null)

      try {
        const response = await apiClient.get<LLMModelsResponsePayload>(
          `/llm/models`
        )

        if (!active) {
          return
        }

        const mapping: Record<LLMProviderId, LLMModelOption[]> = {
          openai: [],
          anthropic: [],
          google: [],
          grok: [],
          deepseek: [],
          perplexity: [],
          glm: [],
        }

        response.providers?.forEach((entry) => {
          if (!entry?.id) {
            return
          }
          if (mapping[entry.id]) {
            // Use backend-provided models, but fall back to frontend defaults
            // when the server returns an empty set (useful in local dev).
            const providerKey = entry.id as LLMProviderId

            const attachBadge = (m: LLMModelOption) => {
              if (m.badge) return m
              // try to infer badge from our frontend defaults
              const fallback = (DEFAULT_FRONTEND_MODELS[providerKey] ?? []).find((d) => d.id === m.id)
              return { ...m, badge: fallback?.badge }
            }

            mapping[entry.id] =
              (entry.models && entry.models.length > 0)
                ? entry.models.map((m) => attachBadge(m as LLMModelOption))
                : (DEFAULT_FRONTEND_MODELS[providerKey] ?? [])
          }
        })

        setLlmModels(mapping)
      } catch (error) {
        if (!active) {
          return
        }
        const message = error instanceof ApiError
          ? error.message
          : "Unable to load LLM models"
        setModelError(message)
        toast({ title: "Failed to load models", description: message })
      } finally {
        if (active) {
          setIsModelLoading(false)
        }
      }
    }

    loadModels()

    return () => {
      active = false
    }
  }, [toast])

  React.useEffect(() => {
    if (availableModels.length === 0) {
      setModel("")
      return
    }

    setModel((current) => (availableModels.some((option) => option.id === current) ? current : availableModels[0].id))
  }, [availableModels])

  React.useEffect(() => {
    setTestResponse(null)
    setTestContext([])
    setTestResponseData(null)
  }, [provider, model])

  React.useEffect(() => {
    if (!planAccess.allowedProviders.includes(provider)) {
      setProvider(planAccess.allowedProviders[0] as LLMProviderId)
    }
  }, [planAccess, provider])

  const handleRemoveFile = React.useCallback(
    (type: FileDatasetType, id: string) => {
      let removed = false
      setFileUploads((prev) => {
        const nextFiles = prev[type].filter((entry) => entry.id !== id)
        if (nextFiles.length === prev[type].length) {
          return prev
        }
        removed = true
        return {
          ...prev,
          [type]: nextFiles,
        }
      })

      if (removed) {
        clearPreview()
      }
    },
    [clearPreview]
  )

  const handleSelectDimension = React.useCallback(
    (dimension: number) => {
      setModelDimensions((prev) => ({
        ...prev,
        [selectedModel]: dimension,
      }))
    },
    [selectedModel]
  )

  const handleAddUrl = React.useCallback(() => {
    setWebsiteUrls((prev) => [...prev, ""])
    clearPreview()
  }, [clearPreview])

  const handleUrlChange = React.useCallback(
    (index: number, value: string) => {
      setWebsiteUrls((prev) => {
        const next = [...prev]
        next[index] = value
        return next
      })

      clearPreview()
    },
    [clearPreview]
  )

  const handleRemoveUrl = React.useCallback(
    (index: number) => {
      let removed = false
      setWebsiteUrls((prev) => {
        if (prev.length === 1) {
          return prev
        }
        const next = prev.filter((_, idx) => idx !== index)
        removed = true
        return next.length > 0 ? next : [""]
      })

      if (removed) {
        clearPreview()
      }
    },
    [clearPreview]
  )

  const handleTestConnection = React.useCallback(() => {
    if (vectorStore === "chroma") {
      setConnectionStatus("success")
      toast({ title: "Chroma ready", description: "Local Chroma store is available." })
      return
    }

    if (!pineconeKey.trim() || !indexName.trim()) {
      setConnectionStatus("error")
      toast({
        title: "Missing Pinecone credentials",
        description: "Provide both an API key and index name to continue.",
      })
      return
    }

    setConnectionStatus("success")
    toast({ title: "Pinecone connection ready", description: "Credentials look valid." })
  }, [indexName, pineconeKey, toast, vectorStore])

  const handleStartEmbedding = React.useCallback(async () => {
    if (isEmbedding) return

    const successfulDatasets = previewResults.filter((result) => result.status === "success" && result.data)

    if (successfulDatasets.length === 0) {
      toast({
        title: "No datasets to embed",
        description: "Generate chunk previews before starting the embedding pipeline.",
      })
      return
    }

    if (vectorStore === "pinecone" && (!pineconeKey.trim() || !indexName.trim())) {
      setConnectionStatus("error")
      toast({
        title: "Missing Pinecone credentials",
        description: "Provide both an API key and index name to continue.",
      })
      return
    }

    setEmbeddingSummary(null)
    setEmbeddingProgress(0)
    setIsEmbedding(true)

    const datasetsPayload: EmbeddingDatasetPayload[] = successfulDatasets.map((dataset) => ({
      id: dataset.id,
      label: dataset.label,
      dataset_type: dataset.source,
      chunk_size: dataset.data!.chunk_size,
      chunk_overlap: dataset.data!.chunk_overlap,
      chunks: dataset.data!.chunks,
    }))

    const requestPayload: {
      embeddingModel: EmbeddingModelId
      embeddingDimension: number
      vectorDatabase: VectorStoreOption
      datasets: EmbeddingDatasetPayload[]
      pineconeConfig?: { apiKey: string; indexName: string }
    } = {
      embeddingModel: selectedModel,
      embeddingDimension: currentEmbeddingDimension,
      vectorDatabase: vectorStore,
      datasets: datasetsPayload,
    }

    if (vectorStore === "pinecone") {
      requestPayload.pineconeConfig = { apiKey: pineconeKey.trim(), indexName: indexName.trim() }
    }

    try {
      const response = await apiClient.post(
        `/embeddings/start`,
        requestPayload,
        { timeout: 600000 }
      )

      const summary = response as EmbeddingRunSummary
      setEmbeddingSummary(summary)
      setEmbeddingProgress(100)
      if (vectorStore === "pinecone") {
        setConnectionStatus("success")
      }
    } catch (error) {
      const detailMessage = error instanceof ApiError ? getApiErrorDetail(error) : undefined

      const message = error instanceof ApiError
        ? detailMessage ?? error.message
        : error instanceof Error
          ? error.message
          : "Embedding failed"
      setEmbeddingSummary(null)
      setEmbeddingProgress(0)
      if (vectorStore === "pinecone") {
        setConnectionStatus("error")
      }
      toast({ title: "Embedding failed", description: message })
    } finally {
      setIsEmbedding(false)
    }
  }, [currentEmbeddingDimension, indexName, isEmbedding, pineconeKey, previewResults, selectedModel, toast, vectorStore])

  const handleProviderChange = (value: string) => {
    setProvider(value as LLMProviderId)
    setSelectedPromptHistory("")
    setTestResponse(null)
    setTestContext([])
  }

  const handlePromptSave = () => {
    if (selectedPromptHistory) return
    setPromptHistory((prev) => Array.from(new Set([systemPrompt, ...prev])).slice(0, 5))
    toast({ title: "Prompt saved" })
  }

  const handlePromptHistorySelect = (value: string) => {
    setSelectedPromptHistory(value)
    const record = promptHistory.find((prompt) => prompt === value)
    if (record) {
      setSystemPrompt(record)
    }
  }

  const handleAskQuestion = React.useCallback(async () => {
    const trimmedQuestion = testQuestion.trim()
    if (!trimmedQuestion) {
      toast({
        title: "Add a question",
        description: "Enter a question to verify your LLM configuration.",
      })
      return
    }

    if (!model) {
      toast({
        title: "Select an LLM model",
        description: "Choose a model before running a test query.",
      })
      return
    }

    const successfulPreviews = previewResults.filter((result) => result.status === "success" && result.data)
    const datasetIds = successfulPreviews.map((result) => result.id)

    if (datasetIds.length === 0) {
      toast({
        title: "Preview required",
        description: "Generate dataset previews before running a test query.",
      })
      return
    }

    if (vectorStore === "pinecone" && (!pineconeKey.trim() || !indexName.trim())) {
      toast({
        title: "Missing Pinecone configuration",
        description: "Enter your Pinecone API key and index name to query the vector store.",
      })
      return
    }

    setIsTesting(true)
    setTestResponse(null)
    setTestContext([])
    setTestResponseData(null)

    const resolvedTopK = Number.isFinite(chunksToRetrieve) ? chunksToRetrieve : 30

    const payload: {
      provider: LLMProviderId
      modelId: string
      systemPrompt: string
      question: string
      embeddingModel: EmbeddingModelId
      embeddingDimension: number
      vectorStore: VectorStoreOption
      topK: number
      datasetIds: string[]
      pinecone?: { api_key: string; index_name: string }
    } = {
      provider,
      modelId: model,
      systemPrompt,
      question: trimmedQuestion,
      embeddingModel: selectedModel,
      embeddingDimension: currentEmbeddingDimension,
      vectorStore,
      topK: resolvedTopK,
      datasetIds,
    }

    if (vectorStore === "pinecone") {
      payload.pinecone = {
        api_key: pineconeKey.trim(),
        index_name: indexName.trim(),
      }
    } 

    try {
      const response = await apiClient.post<LLMTestResponsePayload>(
        `/llm/test`,
        payload
      )

      const data = response
      setTestResponse(data.answer ?? "")
      setTestResponseData(data)

      const safeContext: RetrievedContextEntry[] = Array.isArray(data.context)
        ? data.context.map((rawEntry) => {
            const textValue = (rawEntry as { text?: unknown })?.text
            const text = typeof textValue === "string" ? textValue : String(textValue ?? "")

            const scoreValue = (rawEntry as { score?: unknown })?.score
            const score = (() => {
              if (typeof scoreValue === "number") {
                return scoreValue
              }
              if (typeof scoreValue === "string") {
                const parsed = Number.parseFloat(scoreValue)
                return Number.isNaN(parsed) ? null : parsed
              }
              return null
            })()

            const metadataValue = (rawEntry as { metadata?: unknown })?.metadata
            const metadata =
              metadataValue && typeof metadataValue === "object" && !Array.isArray(metadataValue)
                ? (metadataValue as Record<string, unknown>)
                : {}

            return {
              text,
              score,
              metadata,
            }
          })
        : []

      setTestContext(safeContext)
      
      // Save test result to MongoDB
      if (chatbotId) {
        try {
          await chatbotService.addTestResult(
            chatbotId,
            testQuestion,
            data.answer ?? "",
            safeContext
          );
        } catch (saveError) {
          console.error("Failed to save test result:", saveError);
          // Don't show error to user, just log it
        }
      }
      
      toast({ title: "LLM test successful", description: "Generated a response using your configured model." })
    } catch (error) {
      let message = "Unable to execute LLM test"
      if (error instanceof ApiError) {
        const detailSource = (() => {
          if (typeof error.data === "object" && error.data !== null) {
            if (Array.isArray(error.data)) {
              return error.data
            }
            if ("detail" in error.data) {
              return (error.data as { detail?: unknown }).detail ?? error.data
            }
            return error.data
          }
          return getApiErrorDetail(error)
        })()

        if (Array.isArray(detailSource)) {
          message = detailSource
            .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
            .join("; ")
        } else if (detailSource && typeof detailSource === "object") {
          message = JSON.stringify(detailSource)
        } else if (typeof detailSource === "string") {
          message = detailSource
        } else {
          message = error.message ?? message
        }
      } else if (error instanceof Error) {
        message = error.message
      }

      toast({ title: "LLM test failed", description: message })
    } finally {
      setIsTesting(false)
    }
  }, [
    chatbotId,
    chunksToRetrieve,
    currentEmbeddingDimension,
    indexName,
    model,
    pineconeKey,
    previewResults,
    provider,
    selectedModel,
    systemPrompt,
    testQuestion,
    toast,
    vectorStore,
  ])

  const shouldShowImprovement = Boolean(
    evaluationMetrics && (evaluationMetrics.accuracy < 85 || evaluationMetrics.evaluationScore < 80)
  )

  const handleNext = React.useCallback(async () => {
    if (activeStep === 0) {
      // Create Chatbot Step - Skip if editing
      if (isEditMode) {
        setActiveStep(1)
        setMaxUnlockedStep((prev) => Math.max(prev, 1))
        return
      }
      await handleCreateChatbot()
      return
    }

    if (activeStep === 1) {
      // Upload Dataset Step
      const successfulPreviews = previewResults.filter((r) => r.status === "success" && r.data)
      if (successfulPreviews.length === 0) {
        toast({ title: "No datasets", description: "Please upload and preview at least one dataset." })
        return
      }
      
      // Save Dataset State - only name, size, and chunks count
      const currentFileUploads = fileUploads[datasetType as FileDatasetType] || [];
      
      const files = successfulPreviews
        .filter(p => p.source !== "website")
        .map(p => {
          const matchingFile = currentFileUploads.find(fu => fu.id === p.id);
          return {
            datasetId: p.id,
            name: p.label,
            size: matchingFile ? matchingFile.file.size : 0,
            chunks: p.data?.total_chunks || 0,
          };
        });

      const urls = successfulPreviews
        .filter(p => p.source === "website")
        .map(p => p.label);

      const datasetState = {
        dataset: {
          type: datasetType,
          files: files,
          urls: urls,
        }
      }
      
      console.log("Saving dataset state:", JSON.stringify(datasetState, null, 2));
      await updateChatbotState(datasetState)
    }

    if (activeStep === 2) {
      // Configure Embedding Step
      if (!embeddingSummary && !isEmbedding) {
        toast({ title: "Embedding required", description: "Please run the embedding process first." })
        return
      }

      // Save Embedding State
      const embeddingState = {
        embedding: {
          model: selectedModel,
          dimension: currentEmbeddingDimension,
          vectorStore: vectorStore,
          pineconeConfig: vectorStore === "pinecone" ? {
            apiKey: pineconeKey,
            indexName: indexName
          } : undefined,
          stats: {
            chunksProcessed: embeddingSummary?.results.reduce((acc, r) => acc + r.chunks_processed, 0) || 0,
            chunksEmbedded: embeddingSummary?.results.reduce((acc, r) => acc + r.chunks_embedded, 0) || 0
          },
          datasetIds: embeddingSummary?.results.map((result) => result.dataset_id) || [],
          datasets:
            embeddingSummary?.results.map((result) => ({
              id: result.dataset_id,
              label: result.label,
              chunksEmbedded: result.chunks_embedded,
              chunksProcessed: result.chunks_processed,
            })) || [],
          isEmbedded: true
        }
      }
      await updateChatbotState(embeddingState)
    }

    if (activeStep === 3) {
      // Choose LLM Step
      if (!model) {
        toast({ title: "Model required", description: "Please select an LLM model." })
        return
      }

      // Save LLM State
      const llmState = {
        llm: {
          provider,
          model,
          topK: chunksToRetrieve,
          systemPrompt
        }
      }
      await updateChatbotState(llmState)
    }

    if (activeStep === 4) {
      // Test & Evaluate Step
      if (evaluationCsv) {
        const evalState: UpdateChatbotData = {
          evaluation: {
            file: {
              name: evaluationCsv.name,
              size: evaluationCsv.size,
              path: evaluationCsv.name,
            },
            rows: evaluationRows,
            justifications: evaluationJustifications,
          },
        }

        if (evaluationMetrics) {
          evalState.evaluation!.metrics = evaluationMetrics
        }
        await updateChatbotState(evalState)
      }

      const finalized = await finalizeChatbot()
      if (!finalized) {
        return
      }
    }

    const nextStep = Math.min(activeStep + 1, STEPS.length - 1)
    setActiveStep(nextStep)
    setMaxUnlockedStep((prev) => Math.max(prev, nextStep))
  }, [
    activeStep, 
    isEditMode,
    handleCreateChatbot, 
    previewResults, 
    datasetType, 
    fileUploads, 
    updateChatbotState, 
    embeddingSummary, 
    isEmbedding, 
    currentEmbeddingDimension,
    selectedModel, 
    vectorStore, 
    pineconeKey, 
    indexName, 
    model, 
    provider, 
    chunksToRetrieve, 
    systemPrompt, 
    evaluationCsv, 
    evaluationMetrics, 
    evaluationRows, 
    evaluationJustifications, 
    finalizeChatbot, 
    toast
  ])

  const handleBack = React.useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0))
  }, [])

  const handleStepChange = React.useCallback((stepIndex: number) => {
    const allowedStep = canJumpFreely ? FINAL_STEP_INDEX : maxUnlockedStep
    if (!canJumpFreely && stepIndex > allowedStep) {
      toast({ title: "Finish previous steps", description: "Complete the current step before continuing." })
      return
    }
    setActiveStep(stepIndex)
  }, [canJumpFreely, maxUnlockedStep, toast])

  const handleSaveDraft = () =>
    toast({ title: "Draft saved", description: "We'll keep your configuration ready for the next session." })

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <CreateChatbotStep
            chatbotNameInput={chatbotNameInput}
            setChatbotNameInput={setChatbotNameInput}
            handleCreateChatbot={handleCreateChatbot}
            isCreatingChatbot={isCreatingChatbot}
            isEditMode={isEditMode}
          />
        )
      case 1:
        return (
          <div className="space-y-6">
            <section className="grid gap-6 lg:grid-cols-2">
              <DatasetUploader
                datasetType={datasetType}
                setDatasetType={handleDatasetTypeChange}
                fileUploads={fileUploads}
                onRemoveFile={handleRemoveFile}
                websiteUrls={websiteUrls}
                onAddUrl={handleAddUrl}
                onRemoveUrl={handleRemoveUrl}
                onUrlChange={handleUrlChange}
                dropzone={{ getRootProps, getInputProps, isDragActive }}
              />
              <TextSplittingCard
                chunkSize={chunkSize}
                chunkOverlap={chunkOverlap}
                setChunkSize={handleChunkSizeChange}
                setChunkOverlap={handleChunkOverlapChange}
                showPreview={showPreview}
                onPreview={handlePreviewChunks}
                isProcessing={isPreviewLoading}
                previewResults={previewResults}
                previewError={previewError}
                disablePreview={!canPreviewDataset}
              />
            </section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" onClick={handleSaveDraft}>
                Save draft
              </Button>
              <Button onClick={handleNext}>
                Next: Configure Embedding
              </Button>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <EmbeddingConfiguration
              selectedModel={selectedModel}
              onSelectModel={(id) => setSelectedModel(id)}
              selectedDimension={currentEmbeddingDimension}
              onSelectDimension={handleSelectDimension}
              vectorStore={vectorStore}
              onVectorStoreChange={handleVectorStoreChange}
              pineconeKey={pineconeKey}
              setPineconeKey={setPineconeKey}
              indexName={indexName}
              setIndexName={setIndexName}
              connectionStatus={connectionStatus}
              onTestConnection={handleTestConnection}
              onStartEmbedding={handleStartEmbedding}
              isEmbedding={isEmbedding}
              embeddingProgress={embeddingProgress}
              embeddingSummary={embeddingSummary}
              allowedModels={planAccess.allowedEmbeddingModels}
              allowedVectorStores={planAccess.allowedVectorStores}
              isPaidPlan={planAccess.isPaid}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" onClick={handleBack}>
                Back to upload
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSaveDraft}>
                  Save draft
                </Button>
                <Button onClick={handleNext}>
                  Next: Choose LLM
                </Button>
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <LLMConfiguration
              provider={provider}
              onProviderChange={handleProviderChange}
              models={availableModels}
              model={model}
              setModel={setModel}
              isModelLoading={isModelLoading}
              modelError={modelError}
              systemPrompt={systemPrompt}
              setSystemPrompt={setSystemPrompt}
              promptHistory={promptHistory}
              onPromptHistoryChange={handlePromptHistorySelect}
              onPromptSave={handlePromptSave}
              selectedPromptHistory={selectedPromptHistory}
              testQuestion={testQuestion}
              setTestQuestion={setTestQuestion}
              onAskQuestion={handleAskQuestion}
              isTesting={isTesting}
              testResponse={testResponse}
              testContext={testContext}
              chunksToRetrieve={chunksToRetrieve}
              setChunksToRetrieve={setChunksToRetrieve}
              testResponseData={testResponseData}
              llmModels={llmModels}
              allowedProviders={planAccess.allowedProviders}
              isPaidPlan={planAccess.isPaid}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" onClick={handleBack}>
                Back to embedding
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSaveDraft}>
                  Save draft
                </Button>
                <Button onClick={handleNext}>
                  Next: Test & Evaluate
                </Button>
              </div>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="space-y-6">
            <EvaluationSection
              csvFile={evaluationCsv}
              csvError={evaluationCsvError}
              onCsvError={setEvaluationCsvError}
              onCsvUpload={handleSelectEvaluationCsv}
              onCsvRemove={handleRemoveEvaluationCsv}
              onDownloadSample={handleDownloadSampleCsv}
              isDownloadingSample={isSampleDownloading}
              onRunEvaluation={handleRunEvaluation}
              isEvaluating={isEvaluating}
              metrics={evaluationMetrics}
              justifications={evaluationJustifications}
              rows={evaluationRows}
              shouldShowImprovement={shouldShowImprovement}
              onSelectResult={setSelectedResult}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" onClick={handleBack}>
                Back to LLM setup
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSaveDraft}>
                  Save draft
                </Button>
                <Button onClick={handleNext} disabled={isFinalizingChatbot} className="gap-2">
                  {isFinalizingChatbot ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Finalizing...
                    </>
                  ) : (
                    "Next: Deploy Chatbot"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )
      case 5:
      default:
        return (
          <div className="space-y-6">
            <DeploymentSection
              appearance={appearance}
              setAppearance={setAppearance}
              behavior={behavior}
              setBehavior={setBehavior}
              branding={branding}
              setBranding={setBranding}
              activeDevice={activePreviewDevice}
              onDeviceChange={setActivePreviewDevice}
              deploymentTab={deploymentTab}
              onDeploymentTabChange={setDeploymentTab}
              codeSnippets={CODE_SNIPPETS}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" onClick={handleBack}>
                Back to evaluation
              </Button>
              <Button variant="outline" onClick={handleSaveDraft}>
                Save draft
              </Button>
            </div>
          </div>
        )
    }
  }

  const resolvedMaxUnlockedStep = canJumpFreely ? FINAL_STEP_INDEX : maxUnlockedStep

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Stepper activeStep={activeStep} maxUnlockedStep={resolvedMaxUnlockedStep} onStepChange={handleStepChange} />
        {renderStepContent()}
      </div>

      <DetailDialog result={selectedResult} onOpenChange={(open) => !open && setSelectedResult(null)} />

    </TooltipProvider>
  )
}
