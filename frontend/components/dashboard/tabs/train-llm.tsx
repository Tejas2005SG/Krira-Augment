"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useDropzone } from "react-dropzone"
import axios from "axios"

import { API_CONFIG } from "@/lib/api/config"
import { chatbotService } from "@/lib/api/chatbot.service"
import { Button } from "@/components/ui/button"
import {
  TooltipProvider,
} from "@/components/ui/tooltip"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"

import {
  DatasetType,
  FileDatasetType,
  DatasetPreview,
  PreviewDatasetResult,
  FileUploadEntry,
  VectorStoreOption,
  EmbeddingModelId,
  EmbeddingSummaryResult,
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

export function TrainLLMTab() {
  const { toast } = useToast()
  const [activeStep, setActiveStep] = React.useState(0)
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
  const [pineconeKey, setPineconeKey] = React.useState("")
  const [indexName, setIndexName] = React.useState("krira-pro-index")
  const [connectionStatus, setConnectionStatus] = React.useState<"idle" | "success" | "error">("idle")
  const [isEmbedding, setIsEmbedding] = React.useState(false)
  const [embeddingProgress, setEmbeddingProgress] = React.useState(0)
  const [vectorStore, setVectorStore] = React.useState<VectorStoreOption>("pinecone")
  const [embeddingSummary, setEmbeddingSummary] = React.useState<EmbeddingRunSummary | null>(null)
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
  const [deploymentTab, setDeploymentTab] = React.useState("javascript")
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

  const searchParams = useSearchParams()
  const editId = searchParams.get('editId')
  
  const [chatbotId, setChatbotId] = React.useState<string | null>(null)
  const [chatbotNameInput, setChatbotNameInput] = React.useState("")
  const [isCreatingChatbot, setIsCreatingChatbot] = React.useState(false)
  const [isEditMode, setIsEditMode] = React.useState(false)
  const [isLoadingChatbot, setIsLoadingChatbot] = React.useState(false)

  const clearPreview = React.useCallback(() => {
    setPreviewResults([])
    setPreviewError(null)
    setShowPreview(false)
    setEmbeddingSummary(null)
  }, [])

  // Load existing chatbot data if editId is present
  React.useEffect(() => {
    if (!editId) return

    const loadChatbot = async () => {
      try {
        setIsLoadingChatbot(true)
        const chatbot = await chatbotService.getChatbot(editId)
        
        // Set edit mode and chatbot ID
        setIsEditMode(true)
        setChatbotId(chatbot._id)
        setChatbotNameInput(chatbot.name)

        // Pre-fill dataset data and create preview results to show files
        if (chatbot.dataset) {
          if (chatbot.dataset.type) {
            setDatasetType(chatbot.dataset.type as DatasetType)
          }
          
          // Create preview results from saved files
          if (chatbot.dataset.files && chatbot.dataset.files.length > 0) {
            const filePreviewResults: PreviewDatasetResult[] = chatbot.dataset.files.map((file, idx) => ({
              id: `saved-file-${idx}`,
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
            setSelectedModel(chatbot.embedding.model as EmbeddingModelId)
          }
          if (chatbot.embedding.vectorStore) {
            setVectorStore(chatbot.embedding.vectorStore as VectorStoreOption)
          }
          if (chatbot.embedding.pineconeConfig?.indexName) {
            setIndexName(chatbot.embedding.pineconeConfig.indexName)
          }
          if (chatbot.embedding.isEmbedded) {
            setEmbeddingSummary({
              results: chatbot.dataset?.files?.map((f, idx) => ({
                dataset_id: `file-${idx}`,
                label: f.name,
                vector_store: chatbot.embedding!.vectorStore as VectorStoreOption,
                embedding_model: chatbot.embedding!.model as EmbeddingModelId,
                chunks_processed: f.chunks || 0,
                chunks_embedded: f.chunks || 0,
              })) || [],
              errors: []
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
          setEvaluationMetrics(chatbot.evaluation.metrics)
          if (chatbot.evaluation.rows) {
            setEvaluationRows(chatbot.evaluation.rows)
          }
          if (chatbot.evaluation.justifications) {
            setEvaluationJustifications(chatbot.evaluation.justifications)
          }
        }

        // Start from step 0 so user can edit bot name
        setActiveStep(0)

        toast({
          title: "Editing chatbot",
          description: `Loaded configuration for "${chatbot.name}"`
        })
      } catch (error: any) {
        console.error("Failed to load chatbot:", error)
        toast({
          title: "Error loading chatbot",
          description: error.message || "Failed to load chatbot data"
        })
      } finally {
        setIsLoadingChatbot(false)
      }
    }

    loadChatbot()
  }, [editId, toast])

  const handleCreateChatbot = React.useCallback(async () => {
    if (!chatbotNameInput.trim()) {
      toast({ title: "Name required", description: "Please enter a name for your chatbot." })
      return
    }

    setIsCreatingChatbot(true)
    try {
      const response = await axios.post(
        `${API_CONFIG.BASE_URL.replace(/\/$/, "")}/chatbots`,
        { name: chatbotNameInput },
        { withCredentials: true }
      )
      setChatbotId(response.data._id)
      toast({ title: "Chatbot created", description: `Started training pipeline for ${response.data.name}` })
      setActiveStep(1)
    } catch (error) {
      console.error("Failed to create chatbot:", error)
      toast({ title: "Creation failed", description: "Could not create chatbot. Please try again." })
    } finally {
      setIsCreatingChatbot(false)
    }
  }, [chatbotNameInput, toast])

  const updateChatbotState = React.useCallback(async (data: any) => {
    if (!chatbotId) {
      console.error("Cannot update chatbot: No chatbotId");
      return;
    }

    console.log("updateChatbotState called with:", JSON.stringify(data, null, 2));
    console.log("chatbotId:", chatbotId);

    try {
      const response = await axios.put(
        `${API_CONFIG.BASE_URL.replace(/\/$/, "")}/chatbots/${chatbotId}`,
        data,
        { withCredentials: true }
      );
      
      console.log("Update successful:", response.data);
      toast({ title: "Progress saved" });
    } catch (error) {
      console.error("Error updating chatbot state:", error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : "Failed to save progress";
      toast({ title: "Save failed", description: message });
    }
  }, [chatbotId, toast]);

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
      const response = await axios.get(
        `${API_CONFIG.BASE_URL.replace(/\/$/, "")}/llm/eval/sample`,
        {
          responseType: "blob",
          withCredentials: true,
        }
      )

      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8" })
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
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? error.message ?? "Unable to download sample CSV"
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

      const response = await axios.post(
        `${API_CONFIG.BASE_URL.replace(/\/$/, "")}/llm/evaluate`,
        formData,
        {
          withCredentials: true,
          timeout: 600000,
        }
      )

      const data = response.data as {
        metrics?: EvaluationMetrics
        rows?: EvaluationRow[]
        justifications?: MetricJustifications
      }

      setEvaluationMetrics(data.metrics ?? null)
      setEvaluationRows(Array.isArray(data.rows) ? data.rows : [])
      setEvaluationJustifications(data.justifications ?? {})
      
      // Save evaluation results to MongoDB
      if (chatbotId) {
        await updateChatbotState({
          evaluation: {
            file: {
              name: evaluationCsv.name,
              size: evaluationCsv.size,
              path: evaluationCsv.name
            },
            metrics: data.metrics ?? null,
            rows: Array.isArray(data.rows) ? data.rows : [],
            justifications: data.justifications ?? {}
          }
        })
      }
      
      toast({ title: "Evaluation complete", description: "Generated scores from your evaluation dataset." })
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? error.message ?? "Evaluation failed"
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

  const availableModels = React.useMemo(() => llmModels[provider] ?? [], [llmModels, provider])

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
      const response = await axios.post(
        `${API_CONFIG.BASE_URL.replace(/\/$/, "")}/datasets/process`,
        formData,
        {
          withCredentials: true,
        }
      )

      const payload = response.data as {
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
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.detail ?? error.response?.data?.message ?? error.message ?? "Unable to process datasets")
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
      return {}
    }
    if (datasetType === "csv") {
      return { "text/csv": [".csv"] }
    }
    if (datasetType === "json") {
      return { "application/json": [".json"] }
    }
    return { "application/pdf": [".pdf"] }
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
        const response = await axios.get<LLMModelsResponsePayload>(
          `${API_CONFIG.BASE_URL.replace(/\/$/, "")}/llm/models`,
          { withCredentials: true }
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

        response.data.providers?.forEach((entry) => {
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

        const message = axios.isAxiosError(error)
          ? (error.response?.data?.detail ?? error.message ?? "Unable to fetch LLM models")
          : error instanceof Error
            ? error.message
            : "Unable to fetch LLM models"

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
    const options = llmModels[provider] ?? []
    if (options.length === 0) {
      setModel("")
      return
    }

    setModel((current) => (options.some((option) => option.id === current) ? current : options[0].id))
  }, [llmModels, provider])

  React.useEffect(() => {
    setTestResponse(null)
    setTestContext([])
    setTestResponseData(null)
  }, [provider, model])

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
      vectorDatabase: VectorStoreOption
      datasets: EmbeddingDatasetPayload[]
      pineconeConfig?: { apiKey: string; indexName: string }
    } = {
      embeddingModel: selectedModel,
      vectorDatabase: vectorStore,
      datasets: datasetsPayload,
    }

    if (vectorStore === "pinecone") {
      requestPayload.pineconeConfig = { apiKey: pineconeKey.trim(), indexName: indexName.trim() }
    }

    try {
      const response = await axios.post(
        `${API_CONFIG.BASE_URL.replace(/\/$/, "")}/embeddings/start`,
        requestPayload,
        {
          withCredentials: true,
          timeout: 600000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      )

      const summary = response.data as EmbeddingRunSummary
      setEmbeddingSummary(summary)
      setEmbeddingProgress(100)
      if (vectorStore === "pinecone") {
        setConnectionStatus("success")
      }
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? error.response?.data?.detail ?? error.message ?? "Embedding failed")
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
  }, [indexName, isEmbedding, pineconeKey, previewResults, selectedModel, toast, vectorStore])

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
      const response = await axios.post<LLMTestResponsePayload>(
        `${API_CONFIG.BASE_URL.replace(/\/$/, "")}/llm/test`,
        payload,
        { withCredentials: true }
      )

      const data = response.data
      setTestResponse(data.answer ?? "")
      setTestResponseData(data)

      const safeContext: RetrievedContextEntry[] = Array.isArray(data.context)
        ? data.context.map((entry) => {
            const contextEntry = entry as RetrievedContextEntry
            const text =
              typeof contextEntry?.text === "string"
                ? contextEntry.text
                : String(contextEntry?.text ?? "")

            const rawScore = contextEntry?.score
            let score: number | null | undefined
            if (typeof rawScore === "number") {
              score = rawScore
            } else if (typeof rawScore === "string") {
              const parsed = Number.parseFloat(rawScore)
              score = Number.isNaN(parsed) ? null : parsed
            } else {
              score = null
            }

            const metadata =
              contextEntry?.metadata && typeof contextEntry.metadata === "object" && !Array.isArray(contextEntry.metadata)
                ? (contextEntry.metadata as Record<string, unknown>)
                : {}

            return {
              text,
              score,
              metadata,
            }
          })
        : []

      setTestContext(safeContext)
      
      // Save test question and answer to MongoDB
      if (chatbotId) {
        try {
          await axios.post(
            `${API_CONFIG.BASE_URL.replace(/\/$/, "")}/chatbots/${chatbotId}/test-result`,
            {
              question: trimmedQuestion,
              answer: data.answer || "",
              context: safeContext,
            },
            { withCredentials: true }
          );
          console.log("Test result saved to MongoDB");
        } catch (saveError) {
          console.error("Failed to save test result:", saveError);
          // Don't show error to user, just log it
        }
      }
      
      toast({ title: "LLM test successful", description: "Generated a response using your configured model." })
    } catch (error) {
      let message = "Unable to execute LLM test"
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail
        if (detail && typeof detail === "object") {
          if (Array.isArray(detail)) {
            message = detail.map((item) => (typeof item === "string" ? item : JSON.stringify(item))).join("; ")
          } else {
            message = JSON.stringify(detail)
          }
        } else {
          message = detail ?? error.response?.data?.message ?? error.message ?? message
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
          vectorStore: vectorStore,
          pineconeConfig: vectorStore === "pinecone" ? {
            apiKey: pineconeKey,
            indexName: indexName
          } : undefined,
          stats: {
            chunksProcessed: embeddingSummary?.results.reduce((acc, r) => acc + r.chunks_processed, 0) || 0,
            chunksEmbedded: embeddingSummary?.results.reduce((acc, r) => acc + r.chunks_embedded, 0) || 0
          },
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
         const evalState = {
           evaluation: {
             file: {
               name: evaluationCsv.name,
               size: evaluationCsv.size,
               path: evaluationCsv.name
             },
             metrics: evaluationMetrics,
             rows: evaluationRows,
             justifications: evaluationJustifications
           }
         }
         await updateChatbotState(evalState)
       }
    }

    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1))
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
    toast
  ])

  const handleBack = React.useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0))
  }, [])

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
                <Button onClick={handleNext}>
                  Next: Deploy Chatbot
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
              setOpenDeleteDialog={setShowDeleteConfirm}
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

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Stepper activeStep={activeStep} onStepChange={setActiveStep} />
        {renderStepContent()}
      </div>

      <DetailDialog result={selectedResult} onOpenChange={(open) => !open && setSelectedResult(null)} />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete deployment draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all unsaved appearance and behavior changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
              Delete draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
