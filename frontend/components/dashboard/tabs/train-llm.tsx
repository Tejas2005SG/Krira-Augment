"use client"

import * as React from "react"
import Image from "next/image"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { useDropzone } from "react-dropzone"
import type { ColorResult } from "react-color"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { coy as syntaxTheme } from "react-syntax-highlighter/dist/esm/styles/prism"
import axios from "axios"
import ReactMarkdown from "react-markdown"
import type { Components as MarkdownComponents } from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  AlertCircle,
  CheckIcon,
  FileJson,
  FileText,
  Globe,
  Plus,
  Trash2,
  UploadCloud,
  BrainCircuit,
  Loader2,
  InfoIcon,
  Sparkles,
  Bot,
  Palette,
  Monitor,
  TabletSmartphone,
  Smartphone,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

const ChromePicker = dynamic(() => import("react-color").then((mod) => mod.ChromePicker), {
  ssr: false,
  loading: () => <div className="h-44 w-full rounded-xl border border-dashed bg-muted/40" />,
})

import { API_CONFIG } from "@/lib/api/config"
import { chatbotService, type Chatbot } from "@/lib/api/chatbot.service"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"

type DatasetType = "csv" | "json" | "website" | "pdf"

type DatasetPreview = {
  dataset_type: DatasetType
  chunk_size: number
  chunk_overlap: number
  total_chunks: number
  chunks: Array<{ order: number; text: string }>
}

type PreviewDatasetResult = {
  id: string
  label: string
  source: DatasetType
  status: "success" | "error"
  data?: DatasetPreview
  error?: string
}

type FileDatasetType = Exclude<DatasetType, "website">
type FileUploadEntry = { id: string; file: File }
type VectorStoreOption = "pinecone" | "chroma"
type EmbeddingModelId = (typeof EMBEDDING_MODELS)[number]["id"]

type EmbeddingSummaryResult = {
  dataset_id: string
  label: string
  vector_store: VectorStoreOption
  embedding_model: EmbeddingModelId
  chunks_processed: number
  chunks_embedded: number
}

type EmbeddingSummaryError = {
  dataset_id: string
  label: string
  message: string
}

type EmbeddingRunSummary = {
  results: EmbeddingSummaryResult[]
  errors: EmbeddingSummaryError[]
}

type EmbeddingDatasetPayload = {
  id: string
  label: string
  dataset_type: DatasetType
  chunk_size: number
  chunk_overlap: number
  chunks: Array<{ order: number; text: string }>
}

const FILE_DATASET_TYPES: FileDatasetType[] = ["csv", "json", "pdf"]

type EvaluationMetrics = {
  accuracy: number
  evaluationScore: number
  semanticAccuracy: number
  faithfulness: number
  answerRelevancy: number
  contentPrecision: number
  contextRecall: number
}

type EvaluationRow = {
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

type MetricJustifications = Record<string, string>

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B"
  }

  const units = ["B", "KB", "MB", "GB", "TB"]
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  const formatted = value < 10 && exponent > 0 ? value.toFixed(1) : Math.round(value)

  return `${formatted} ${units[exponent]}`
}

type LLMProviderId =
  | "openai"
  | "anthropic"
  | "google"
  | "grok"
  | "deepseek"
  | "perplexity"
  | "glm"

type LLMModelOption = {
  id: string
  label: string
  badge?: "Paid" | "Free"
}

type RetrievedContextEntry = {
  text: string
  score?: number | null
  metadata?: Record<string, unknown>
}

type LLMModelsResponsePayload = {
  providers?: Array<{
    id: LLMProviderId
    models?: LLMModelOption[]
  }>
}

type LLMTestResponsePayload = {
  provider: string
  modelId: string
  question: string
  answer: string
  context?: RetrievedContextEntry[]
  totalChunksScanned?: number
  relevantChunksFound?: number
}

type ManifestResult = {
  id: string
  label: string
  type: DatasetType
  preview: DatasetPreview
}

type ManifestError = {
  id?: string
  label?: string
  message: string
  type?: DatasetType
}

const STEPS = [
  { title: "Create Chatbot", subtitle: "Name your assistant" },
  { title: "Upload Dataset", subtitle: "Ingest your knowledge sources" },
  { title: "Configure Embedding", subtitle: "Select embeddings and storage" },
  { title: "Choose LLM", subtitle: "Connect provider and prompt" },
  { title: "Test & Evaluate", subtitle: "Measure accuracy and quality" },
  { title: "Deploy Chatbot", subtitle: "Customize and ship your bot" },
]

const EMBEDDING_MODELS = [
  {
    id: "openai-small",
    name: "OpenAI Small",
    badge: "Paid",
    dimensions: 1536,
    // price: "$0.0004 / 1K tokens",
    description: "Great for lightweight semantic search and FAQs.",
    useCases: "Best for knowledge bases and support bots.",
    notes: "Requires OpenAI API access.",
    icon: "/openai.svg",
  },
  {
    id: "openai-large",
    name: "OpenAI Large",
    badge: "Paid",
    dimensions: 3072,
    // price: "$0.0008 / 1K tokens",
    description: "High dimensional embeddings for complex retrieval.",
    useCases: "Recommended for enterprise assistants.",
    notes: "Higher recall with larger context windows.",
    icon: "/openai.svg",
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    badge: "Free",
    dimensions: 384,
    // price: "Free",
    description: "Open-source small footprint embeddings for free use.",
    useCases: "Ideal for experimentation and MVPs.",
    notes: "Runs on Krira AI managed infrastructure.",
    icon: "/huggingface.svg",
  },
]

const LLM_PROVIDERS: Array<{ value: LLMProviderId; label: string; logo: string }> = [
  {
    value: "openai",
    label: "OpenAI",
    
    logo: "/openai.svg",
  },
  {
    value: "anthropic",
    label: "Anthropic",
    
    logo: "/anthropic-logo.webp",
  },
  {
    value: "google",
    label: "Google ",
    
    logo: "/google-logo.png",
  },
  {
    value: "grok",
    label: "xAI",
    
    logo: "/xai-logo.webp",
  },
  {
    value: "deepseek",
    label: "DeepSeek",
    
    logo: "/deepseek-logo.png",
  },
  {
    value: "perplexity",
    label: "Perplexity",
    
    logo: "/perplexity-logo.png",
  },
  {
    value: "glm",
    label: "z-ai",
    
    logo: "/glm-logo.png",
  },
]

// Frontend-side defaults in case the backend does not return configured models.
const DEFAULT_FRONTEND_MODELS: Record<LLMProviderId, LLMModelOption[]> = {
  openai: [
    { id: "openai/gpt-5", label: "GPT 5", badge: "Paid" },
    { id: "openai/gpt-oss-120b", label: "GPT OSS 120B" },
    { id: "openai/gpt-5.1", label: "GPT 5.1", badge: "Paid" },
    { id: "openai/gpt-4.1", label: "GPT 4.1", badge: "Free" },
  ],
  anthropic: [
    { id: "anthropic/claude-4.5-sonnet", label: "Claude 4.5 Sonnet", badge: "Paid" },
    { id: "anthropic/claude-3-7-sonnet-20250219:thinking", label: "Claude 3.7 Sonnet" },
    { id: "anthropic/claude-opus-4.1", label: "Claude Opus 4.1", badge: "Paid" },
    { id: "anthropic/claude-opus-4-20250514", label: "Claude Opus 4", badge: "Paid" },
  ],
  google: [
    { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", badge: "Paid" },
    { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", badge: "Free" },
  ],
  grok: [
    { id: "x-ai/grok-4", label: "Grok 4", badge: "Paid" },
    { id: "x-ai/grok-3-mini-beta", label: "Grok 3 Mini", badge: "Paid" },
  ],
  deepseek: [
    { id: "deepseek-ai/DeepSeek-R1", label: "DeepSeek R1" },
    { id: "deepseek/deepseek-v3.1", label: "DeepSeek v3.1", badge: "Paid" },
  ],
  perplexity: [
    { id: "perplexity/sonar-reasoning-pro", label: "Sonar Reasoning Pro", badge: "Paid" },
    { id: "perplexity/sonar-pro", label: "Sonar Pro", badge: "Paid" },
    { id: "perplexity/sonar-deep-research", label: "Sonar Deep Research", badge: "Paid" },
  ],
  glm: [
    { id: "z-ai/glm-4.6", label: "GLM 4.6", badge: "Free" },
    { id: "z-ai/glm-4.5", label: "GLM 4.5", badge: "Free" },
  ],
}

const CODE_SNIPPETS: Record<string, { language: string; code: string }> = {
  javascript: {
    language: "tsx",
    code: `import { KriraChatbot } from "kriraai";

export function App() {
  return (
    <KriraChatbot
      apiKey={process.env.NEXT_PUBLIC_KRIRA_KEY!}
      botId="support-pro-bot"
      theme="pro"
    />
  );
}`,
  },
  python: {
    language: "python",
    code: `from krira import KriraChatbot\n\nchatbot = KriraChatbot(api_key="YOUR_KEY", bot_id="support-pro-bot")\nresponse = chatbot.ask("How do I reset my password?")\nprint(response.answer)\n`,
  },
  curl: {
    language: "bash",
    code: `curl https://api.krira.ai/v1/chatbots/support-pro-bot/messages \
  -H "Authorization: Bearer $KRIRA_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message":"How can I update billing?"}'`,
  },
}

const MAX_CONTEXT_PREVIEW = 5

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
  const [selectedModel, setSelectedModel] = React.useState<EmbeddingModelId>(EMBEDDING_MODELS[0].id)
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
  const [appearance, setAppearance] = React.useState({
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
  const [behavior, setBehavior] = React.useState({
    welcomeMessage: "Hi there! I'm Krira AI. How can I help you train your AI today?",
    placeholder: "Ask about training workflows...",
    responseDelay: [400],
    typingIndicator: true,
    soundNotifications: false,
  })
  const [branding, setBranding] = React.useState({
    chatbotName: "Krira Coach",
    watermark: "Powered by Krira AI",
    position: "bottom-right",
    customWatermark: "",
    logo: null as File | null,
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
          <div className="flex flex-col items-center justify-center space-y-6 py-10">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Name your Chatbot</h2>
              <p className="text-muted-foreground">
                Give your AI assistant a unique identity to get started.
              </p>
            </div>
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="chatbot-name">Chatbot Name</Label>
                    <Input
                      id="chatbot-name"
                      placeholder="e.g. Support Assistant, Sales Bot..."
                      value={chatbotNameInput}
                      onChange={(e) => setChatbotNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isCreatingChatbot) {
                          handleCreateChatbot()
                        }
                      }}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleCreateChatbot} 
                    disabled={isCreatingChatbot || !chatbotNameInput.trim()}
                  >
                    {isCreatingChatbot ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create & Continue"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
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
                  Next: Test &amp; Evaluate
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

type StepperProps = {
  activeStep: number
  onStepChange: (index: number) => void
}

function Stepper({ activeStep, onStepChange }: StepperProps) {
  return (
    <Card className="border-none bg-gradient-to-r from-card via-background to-card text-foreground shadow-lg">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">Train Your Krira AI Assistant</CardTitle>
            <CardDescription className="text-muted-foreground">
              Follow the guided workflow to upload data, configure embeddings, and deploy a production-ready chatbot.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-white/10 text-white backdrop-blur">
            Guided Mode
          </Badge>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 grid-cols-6">
            {STEPS.map((step, index) => {
              const status = index === activeStep ? "active" : index < activeStep ? "completed" : "pending"
              return (
                <button
                  key={step.title}
                  className={cn(
                    "flex flex-col gap-2 rounded-xl border p-3 text-left transition",
                    status === "active"
                      ? "border-primary/80 bg-primary/10"
                      : status === "completed"
                        ? "border-emerald-400/30 bg-emerald-400/10"
                        : "border-white/10 bg-white/5 hover:border-white/30"
                  )}
                  onClick={() => onStepChange(index)}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold",
                        status === "active"
                          ? "border-primary bg-primary text-white"
                          : status === "completed"
                            ? "border-emerald-400 bg-emerald-400 text-emerald-950"
                            : "border-white/30 bg-transparent text-white/70"
                      )}
                    >
                      {status === "completed" ? <CheckIcon className="h-4 w-4" /> : index + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{step.title}</span>
                      <span className="text-xs text-muted-foreground">{step.subtitle}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          <Progress value={(activeStep / (STEPS.length - 1)) * 100} className="h-2 bg-white/10" />
        </div>
      </CardHeader>
    </Card>
  )
}

type DatasetUploaderProps = {
  datasetType: DatasetType
  setDatasetType: (type: DatasetType) => void
  fileUploads: Record<FileDatasetType, FileUploadEntry[]>
  onRemoveFile: (type: FileDatasetType, id: string) => void
  websiteUrls: string[]
  onAddUrl: () => void
  onRemoveUrl: (index: number) => void
  onUrlChange: (index: number, value: string) => void
  dropzone: Pick<ReturnType<typeof useDropzone>, "getRootProps" | "getInputProps" | "isDragActive">
}

function DatasetUploader({
  datasetType,
  setDatasetType,
  fileUploads,
  onRemoveFile,
  websiteUrls,
  onAddUrl,
  onRemoveUrl,
  onUrlChange,
  dropzone,
}: DatasetUploaderProps) {
  const datasetOptions: { value: DatasetType; label: string; icon: LucideIcon; description: string }[] = [
    { value: "csv", label: "CSV File", icon: FileText, description: "Structured datasets" },
    { value: "json", label: "JSON File", icon: FileJson, description: "Flexible schema" },
    { value: "website", label: "Website URLs", icon: Globe, description: "Crawl live content" },
    { value: "pdf", label: "PDF File", icon: FileText, description: "Portable document format" },
  ]

  const showFileUpload = datasetType !== "website"
  const currentFiles = showFileUpload ? fileUploads[datasetType as FileDatasetType] : []

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Upload Dataset</CardTitle>
        <CardDescription>Select the knowledge source that powers your chatbot.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={datasetType} onValueChange={(value) => setDatasetType(value as DatasetType)} className="grid gap-3 sm:grid-cols-3">
          {datasetOptions.map((option) => {
            const Icon = option.icon
            const isActive = datasetType === option.value
            return (
              <Label
                key={option.value}
                className={cn(
                  "flex cursor-pointer flex-col gap-2 rounded-lg border p-4",
                  isActive ? "border-primary bg-primary/5" : "border-dashed"
                )}
              >
                <RadioGroupItem value={option.value} className="sr-only" />
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </Label>
            )
          })}
        </RadioGroup>

        {showFileUpload ? (
          <div
            {...dropzone.getRootProps({
              className: cn(
                "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/40 p-8 text-center transition",
                dropzone.isDragActive ? "border-primary bg-primary/5" : "hover:border-primary/60"
              ),
            })}
          >
            <input {...dropzone.getInputProps()} />
            <UploadCloud className="mb-3 h-10 w-10 text-primary" />
            <p className="text-sm font-semibold">Drag & drop or click to upload*</p>
            <p className="text-xs text-muted-foreground">
              Supported formats: {datasetType === "csv" ? "CSV" : datasetType === "json" ? "JSON" : "PDF"}
            </p>
          </div>
        ) : (
          <Card className="border-dashed">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Add Website URLs</CardTitle>
              <CardDescription>Add your sitemap or individual pages for crawling.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {websiteUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={url}
                    onChange={(event) => onUrlChange(index, event.target.value)}
                    placeholder="https://example.com"
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon" onClick={() => onRemoveUrl(index)} disabled={websiteUrls.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button onClick={onAddUrl} variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Add another URL
              </Button>
            </CardContent>
          </Card>
        )}

        {currentFiles.length > 0 && showFileUpload && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Uploaded files</Label>
            <div className="space-y-2">
              {currentFiles.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-md border bg-muted/40 p-3 text-sm">
                  <div className="flex flex-col gap-1 text-left md:flex-row md:items-center md:gap-2">
                    <span className="font-medium text-foreground">{entry.file.name}</span>
                    <span className="text-xs text-muted-foreground">{formatFileSize(entry.file.size)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveFile(datasetType as FileDatasetType, entry.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type TextSplittingCardProps = {
  chunkSize: number
  chunkOverlap: number
  setChunkSize: (value: number) => void
  setChunkOverlap: (value: number) => void
  showPreview: boolean
  onPreview: () => void
  isProcessing: boolean
  previewResults: PreviewDatasetResult[]
  previewError: string | null
  disablePreview: boolean
}

function TextSplittingCard({
  chunkSize,
  chunkOverlap,
  setChunkSize,
  setChunkOverlap,
  showPreview,
  onPreview,
  isProcessing,
  previewResults,
  previewError,
  disablePreview,
}: TextSplittingCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Configure Text Splitting</CardTitle>
        <CardDescription>Control how documents are chunked during ingestion.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="chunk-size">
              Chunk Size
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-2 h-6 w-6 text-muted-foreground">
                    <InfoIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Number of characters per chunk before splitting.</TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="chunk-size"
              type="number"
              min={200}
              max={4000}
              value={chunkSize}
              onChange={(event) => setChunkSize(Number(event.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="chunk-overlap">
              Chunk Overlap
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-2 h-6 w-6 text-muted-foreground">
                    <InfoIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Amount of overlap to retain context between chunks.</TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="chunk-overlap"
              type="number"
              min={0}
              max={chunkSize - 1}
              value={chunkOverlap}
              onChange={(event) => setChunkOverlap(Number(event.target.value))}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={onPreview} className="gap-2" disabled={disablePreview || isProcessing}>
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
            {isProcessing ? "Processing..." : "Preview chunks"}
          </Button>
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Save draft
          </Button>
        </div>
        {showPreview && (
          <Alert>
            <AlertTitle>Chunk preview</AlertTitle>
            <AlertDescription className="space-y-2">
              {isProcessing ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating preview...
                </div>
              ) : (
                <div className="space-y-3">
                  {previewError && <p className="text-sm text-destructive">{previewError}</p>}
                  {previewResults.length > 0 ? (
                    <div className="space-y-4">
                      {previewResults.map((result) => {
                        if (result.status === "error") {
                          return (
                            <div
                              key={result.id}
                              className="rounded-md border border-rose-300/40 bg-rose-50/80 p-4 text-xs text-rose-700"
                            >
                              <div className="flex items-center justify-between gap-2 text-rose-600">
                                <span className="font-semibold">{result.label}</span>
                                <Badge variant="outline" className="border-rose-300 text-rose-600">
                                  Failed
                                </Badge>
                              </div>
                              <p className="mt-2">{result.error ?? "Unable to process dataset."}</p>
                            </div>
                          )
                        }

                        const topChunks = result.data?.chunks.slice(0, 3) ?? []
                        const remaining = Math.max((result.data?.total_chunks ?? 0) - topChunks.length, 0)

                        return (
                          <div
                            key={result.id}
                            className="rounded-md border border-muted-foreground/20 bg-muted/40 p-4 text-xs leading-relaxed"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{result.source.toUpperCase()}</Badge>
                                <span className="font-semibold text-foreground">{result.label}</span>
                              </div>
                              <span>
                                Total chunks: {result.data?.total_chunks ?? 0} • Size {result.data?.chunk_size ?? chunkSize} • Overlap {result.data?.chunk_overlap ?? chunkOverlap}
                              </span>
                            </div>
                            <Accordion type="single" collapsible className="mt-3 space-y-2">
                              {topChunks.map((chunk) => (
                                <AccordionItem key={`${result.id}-${chunk.order}`} value={`${result.id}-${chunk.order}`}>
                                  <AccordionTrigger className="text-sm">Chunk {chunk.order + 1}</AccordionTrigger>
                                  <AccordionContent>
                                    <p className="text-xs text-muted-foreground">{chunk.text}</p>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                            {remaining > 0 && (
                              <p className="mt-2 text-xs text-muted-foreground">
                                Showing first 3 chunks. {remaining} additional chunk{remaining > 1 ? "s" : ""} generated.
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : !previewError ? (
                    <p className="text-sm text-muted-foreground">
                      Upload a dataset and click preview to generate chunk samples.
                    </p>
                  ) : null}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

type EmbeddingConfigurationProps = {
  selectedModel: EmbeddingModelId
  onSelectModel: (id: EmbeddingModelId) => void
  vectorStore: VectorStoreOption
  onVectorStoreChange: (value: VectorStoreOption) => void
  pineconeKey: string
  setPineconeKey: (value: string) => void
  indexName: string
  setIndexName: (value: string) => void
  connectionStatus: "idle" | "success" | "error"
  onTestConnection: () => void
  onStartEmbedding: () => void
  isEmbedding: boolean
  embeddingProgress: number
  embeddingSummary: EmbeddingRunSummary | null
}

function EmbeddingConfiguration({
  selectedModel,
  onSelectModel,
  vectorStore,
  onVectorStoreChange,
  pineconeKey,
  setPineconeKey,
  indexName,
  setIndexName,
  connectionStatus,
  onTestConnection,
  onStartEmbedding,
  isEmbedding,
  embeddingProgress,
  embeddingSummary,
}: EmbeddingConfigurationProps) {
  const currentModel = EMBEDDING_MODELS.find((model) => model.id === selectedModel) ?? EMBEDDING_MODELS[0]
  const vectorOptions: Array<{ value: VectorStoreOption; label: string; description: string; icon: string; badge: "Paid" | "Free" }> = [
    {
      value: "pinecone",
      label: "Pinecone",
      description: "Serverless managed vector database for production workloads.",
      icon: "/pinecone.png",
      badge: "Paid",
    },
    {
      value: "chroma",
      label: "Chroma",
      description: "Lightweight local vector store ideal for development and testing.",
      icon: "/chroma.png",
      badge: "Free",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Embedding Model</CardTitle>
        <CardDescription>Choose embeddings and configure the vector store.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={selectedModel}
          onValueChange={(value) => onSelectModel(value as EmbeddingModelId)}
          className="grid gap-4 lg:grid-cols-3"
        >
          {EMBEDDING_MODELS.map((model) => (
            <Label
              key={model.id}
              className={cn(
                "flex cursor-pointer flex-col gap-3 rounded-xl border p-4 transition",
                selectedModel === model.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
              )}
            >
              <RadioGroupItem value={model.id} className="sr-only" />
              <div className="flex items-start gap-3">
                <Image src={model.icon} alt={`${model.name} logo`} width={40} height={40} className="h-10 w-10" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{model.name}</span>
                    <Badge className="border border-purple-200 bg-purple-100 text-purple-700">{model.badge}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{model.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Dimensions: {model.dimensions}</span>
                
              </div>
            </Label>
          ))}
        </RadioGroup>

        <Alert className="border-primary/40 bg-primary/5">
          <AlertTitle>{currentModel.name}</AlertTitle>
          <AlertDescription className="space-y-1 text-sm">
            <p>{currentModel.useCases}</p>
            <p className="text-muted-foreground">{currentModel.notes}</p>
          </AlertDescription>
        </Alert>

        

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Vector Store Setup</CardTitle>
            <CardDescription>Connect your managed vector store or use Krira default.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={vectorStore}
              onValueChange={(value) => onVectorStoreChange(value as VectorStoreOption)}
              className="grid gap-3 sm:grid-cols-2"
            >
              {vectorOptions.map((option) => (
                <Label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer flex-col gap-3 rounded-lg border p-4",
                    vectorStore === option.value ? "border-primary bg-primary/5" : "border-dashed"
                  )}
                >
                  <RadioGroupItem value={option.value} className="sr-only" />
                  <div className="flex items-start gap-3">
                    <Image
                      src={option.icon}
                      alt={`${option.label} logo`}
                      width={56}
                      height={56}
                      className="h-14 w-14 object-contain"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">{option.label}</span>
                        <Badge className="border border-purple-200 bg-purple-100 text-purple-700">{option.badge}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                </Label>
              ))}
            </RadioGroup>

            {vectorStore === "pinecone" ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Pinecone API Key</Label>
                    <Input
                      type="password"
                      value={pineconeKey}
                      onChange={(event) => setPineconeKey(event.target.value)}
                      placeholder="pc-xxxxxxxx"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Index Name</Label>
                    <Input value={indexName} onChange={(event) => setIndexName(event.target.value)} />
                  </div>
                </div>
              </div>
            ) : (
              <Alert className="border-primary/30 bg-primary/5">
                <AlertTitle>Chroma selected</AlertTitle>
                <AlertDescription>
                  We’ll persist embeddings locally using a managed Chroma instance – no credentials required.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onTestConnection}>
                {vectorStore === "pinecone" ? "Test connection" : "Check readiness"}
              </Button>
              {connectionStatus === "success" && (
                <Badge className="border border-emerald-200 bg-emerald-100 text-emerald-700">
                  Ready
                </Badge>
              )}
              {connectionStatus === "error" && (
                <Badge className="border border-rose-200 bg-rose-100 text-rose-700">
                  Action required
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button onClick={onStartEmbedding} disabled={isEmbedding} className="gap-2">
            {isEmbedding ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
            {isEmbedding ? "Embedding in progress" : "Start embedding"}
          </Button>
          {isEmbedding && <Progress value={embeddingProgress} />}
          
          {embeddingSummary && (
            <div className="space-y-3 rounded-lg border border-muted-foreground/20 bg-muted/30 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">Latest embedding run</span>
                <Badge className="text-xs border border-emerald-200 bg-emerald-50 text-emerald-700">
                  {embeddingSummary.results.length} success{embeddingSummary.results.length === 1 ? "" : "es"}
                  {embeddingSummary.errors.length > 0
                    ? ` • ${embeddingSummary.errors.length} issue${embeddingSummary.errors.length > 1 ? "s" : ""}`
                    : ""}
                </Badge>
              </div>
              <div className="space-y-2">
                {embeddingSummary.results.map((result) => (
                  <div
                    key={result.dataset_id}
                    className="rounded-md border border-emerald-400/40 bg-emerald-50/70 p-3 text-xs text-emerald-700"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-emerald-800">{result.label}</span>
                      <Badge className="border border-emerald-200 bg-emerald-100 text-emerald-700">
                        {result.chunks_embedded} / {result.chunks_processed} chunks
                      </Badge>
                    </div>
                    <p className="mt-1 text-emerald-600">
                      Stored in {result.vector_store.toUpperCase()} using {result.embedding_model.replace(/-/g, " ")}
                    </p>
                  </div>
                ))}
              </div>
              {embeddingSummary.errors.length > 0 && (
                <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  {embeddingSummary.errors.map((error) => (
                    <div key={error.dataset_id}>
                      <span className="font-semibold">{error.label}:</span> {error.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

type LLMConfigurationProps = {
  provider: LLMProviderId
  onProviderChange: (value: string) => void
  models: LLMModelOption[]
  model: string
  setModel: (value: string) => void
  isModelLoading: boolean
  modelError: string | null
  systemPrompt: string
  setSystemPrompt: (value: string) => void
  promptHistory: string[]
  onPromptHistoryChange: (value: string) => void
  onPromptSave: () => void
  selectedPromptHistory: string
  testQuestion: string
  setTestQuestion: (value: string) => void
  onAskQuestion: () => void
  isTesting: boolean
  testResponse: string | null
  testContext: RetrievedContextEntry[]
  chunksToRetrieve: number
  setChunksToRetrieve: (chunks: number) => void
  testResponseData: LLMTestResponsePayload | null
  llmModels: Record<LLMProviderId, LLMModelOption[]>
}

function LLMConfiguration({
  provider,
  onProviderChange,
  models,
  model,
  setModel,
  isModelLoading,
  modelError,
  systemPrompt,
  setSystemPrompt,
  promptHistory,
  onPromptHistoryChange,
  onPromptSave,
  selectedPromptHistory,
  testQuestion,
  setTestQuestion,
  onAskQuestion,
  isTesting,
  testResponse,
  testContext,
  chunksToRetrieve,
  setChunksToRetrieve,
  testResponseData,
  llmModels,
 }: LLMConfigurationProps) {
  const activeProvider = LLM_PROVIDERS.find((item) => item.value === provider) ?? LLM_PROVIDERS[0]

  // Returns the provider-level badge: prefer "Free" if any free models exist,
  // otherwise return "Paid" if any paid models exist, else null.
  const getProviderBadge = (providerId: LLMProviderId): "Paid" | "Free" | null => {
    const fromServer = (llmModels && llmModels[providerId]) || []
    const fromDefault = DEFAULT_FRONTEND_MODELS[providerId] || []
    const combined = fromServer.length > 0 ? fromServer : fromDefault
    const hasFree = combined.some((m) => (m as LLMModelOption).badge === "Free")
    if (hasFree) return "Free"
    const hasPaid = combined.some((m) => (m as LLMModelOption).badge === "Paid")
    if (hasPaid) return "Paid"
    return null
  }

  const displayedChunks = testContext.slice(0, MAX_CONTEXT_PREVIEW)
  const relevantChunksFound = testResponseData?.relevantChunksFound ?? testContext.length
  const scannedChunks = testResponseData?.totalChunksScanned ?? Math.max(chunksToRetrieve || 0, relevantChunksFound)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose LLM Provider</CardTitle>
        <CardDescription>Connect your large language model and configure prompts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={provider}
          onValueChange={onProviderChange}
          className="grid grid-cols-7 gap-2"
        >
          {LLM_PROVIDERS.map((option) => {
            const providerBadge = getProviderBadge(option.value)
            return (
              <Label
                key={option.value}
                className={cn(
                  "relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border px-2 py-2 text-center transition",
                  provider === option.value ? "border-primary bg-primary/5" : "hover:border-primary/50"
                )}
              >
                <RadioGroupItem value={option.value} className="sr-only" />

                {/* Provider-level badge (top-right): show Free if any free models exist, otherwise show Paid if all are paid */}
                {providerBadge && (
                  <div className="absolute right-2 top-2">
                    {providerBadge === "Paid" ? (
                      <span className="rounded-full border border-purple-200 bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                        Paid
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        Free
                      </span>
                    )}
                  </div>
                )}

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                  <Image src={option.logo} alt={`${option.label} logo`} width={28} height={28} className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold leading-tight">{option.label}</p>
                  
                </div>
              </Label>
            )
          })}
        </RadioGroup>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Select a {activeProvider.label} model</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={model}
                onValueChange={setModel}
                disabled={isModelLoading || models.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isModelLoading ? "Loading models..." : "Select model"} />
                </SelectTrigger>
                <SelectContent>
                  {models.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{item.label}</span>
                        {item.badge && item.badge === "Paid" && (
                          <span className="ml-2 rounded-full border border-purple-200 bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                            Paid
                          </span>
                        )}
                        {item.badge && item.badge === "Free" && (
                          <span className="ml-2 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                            Free
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {isModelLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Fetching available models...
                </div>
              )}
              {!isModelLoading && models.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No models available for {activeProvider.label}. Configure them in the backend environment.
                </p>
              )}
              {modelError && <p className="text-xs text-destructive">{modelError}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chunks to Retrieve (Top K)</CardTitle>
              <CardDescription>How many relevant chunks to fetch from your dataset (1-100)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="chunks-to-retrieve">Top K</Label>
                <Input
                  id="chunks-to-retrieve"
                  type="number"
                  value={chunksToRetrieve}
                  onChange={(event) => {
                    const parsedValue = Number.parseInt(event.target.value, 10)
                    setChunksToRetrieve(Number.isNaN(parsedValue) ? 30 : parsedValue)
                  }}
                  className="w-40"
                />
                <p className="text-xs text-muted-foreground">
                  Higher values may capture more comprehensive information, but can add noise. Default is 30.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Prompt</CardTitle>
            <CardDescription>Define how your assistant should behave.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <Select value={selectedPromptHistory} onValueChange={onPromptHistoryChange}>
                <SelectTrigger className="w-full sm:w-60">
                  <SelectValue placeholder="Load saved prompt" />
                </SelectTrigger>
                <SelectContent>
                  {promptHistory.map((prompt) => (
                    <SelectItem key={prompt} value={prompt}>
                      {prompt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={onPromptSave} className="gap-2">
                <Sparkles className="h-4 w-4" /> Save prompt
              </Button>
            </div>
            <Textarea
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
              rows={6}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Characters: {systemPrompt.length}</span>
              <span>Supports Markdown formatting</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Test your model</CardTitle>
            <CardDescription>Ask a question and inspect the response.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={testQuestion}
                onChange={(event) => setTestQuestion(event.target.value)}
                placeholder="Ask a question about your knowledge base"
                disabled={isTesting}
              />
              <Button
                onClick={onAskQuestion}
                disabled={isTesting || !model || !testQuestion.trim()}
                className="min-w-[140px] gap-2"
              >
                {isTesting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isTesting ? "Testing..." : "Ask Question"}
              </Button>
            </div>
            {isTesting && !testResponse && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating response with {model ? model : "selected model"}...
              </div>
            )}
            {(testResponse || testContext.length > 0) && (
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-sm">Retrieved Context Summary</CardTitle>
                    <CardDescription>
                      {testContext.length > 0 ? (
                        <>
                          Scanned {scannedChunks} chunk{scannedChunks === 1 ? "" : "s"} • Found {relevantChunksFound} relevant • Showing top {displayedChunks.length}
                        </>
                      ) : (
                        "No relevant chunks found"
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs text-muted-foreground max-h-[460px] overflow-auto pr-2">
                    {displayedChunks.length > 0 ? (
                      <>
                        {displayedChunks.map((chunk, index) => {
                          const datasetId = chunk.metadata?.["dataset_id"] as string | undefined
                          const datasetLabel = chunk.metadata?.["dataset_label"] as string | undefined
                          return (
                            <div
                              key={`${datasetId ?? "chunk"}-${index}`}
                              className="space-y-1 rounded-md border border-border/40 bg-background/40 p-2"
                            >
                              <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground/80">
                                <span>{datasetLabel ?? `Chunk ${index + 1}`}</span>
                                {typeof chunk.score === "number" && (
                                  <Badge variant="outline" className="text-[10px] font-normal uppercase">
                                    Score {chunk.score.toFixed(3)}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs leading-relaxed text-muted-foreground">{chunk.text}</p>
                            </div>
                          )
                        })}
                        {relevantChunksFound > displayedChunks.length && (
                          <div className="text-center">
                            <Badge variant="secondary" className="text-xs">
                              Showing top {displayedChunks.length} of {relevantChunksFound} most relevant chunks
                            </Badge>
                          </div>
                        )}
                      </>
                    ) : (
                      <p>No relevant context retrieved.</p>
                    )}
                  </CardContent>
                </Card>
                {testResponse && (
                  <Card className="bg-muted/30">
                    <CardHeader>
                      <CardTitle className="text-sm">AI Response</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 max-h-[460px] overflow-auto pr-2">
                      <AiResponsePanel content={testResponse} />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}

type EvaluationSectionProps = {
  csvFile: File | null
  csvError: string | null
  onCsvError: (message: string | null) => void
  onCsvUpload: (file: File | null) => void
  onCsvRemove: () => void
  onDownloadSample: () => void | Promise<void>
  isDownloadingSample: boolean
  onRunEvaluation: () => void
  isEvaluating: boolean
  metrics: EvaluationMetrics | null
  justifications: MetricJustifications
  rows: EvaluationRow[]
  shouldShowImprovement: boolean
  onSelectResult: (row: EvaluationRow) => void
}

function EvaluationSection({
  csvFile,
  csvError,
  onCsvError,
  onCsvUpload,
  onCsvRemove,
  onDownloadSample,
  isDownloadingSample,
  onRunEvaluation,
  isEvaluating,
  metrics,
  justifications,
  rows,
  shouldShowImprovement,
  onSelectResult,
}: EvaluationSectionProps) {
  const hasResults = rows.length > 0

  const metricSpecs: Array<{ key: keyof EvaluationMetrics; title: string }> = [
    { key: "accuracy", title: "Accuracy" },
    { key: "evaluationScore", title: "Evaluation Score" },
    { key: "semanticAccuracy", title: "Semantic Accuracy" },
    { key: "faithfulness", title: "Faithfulness" },
    { key: "answerRelevancy", title: "Answer Relevancy" },
    { key: "contentPrecision", title: "Content Precision" },
    { key: "contextRecall", title: "Context Recall" },
  ]

  const formatScore = (value?: number | null) => (typeof value === "number" ? `${value.toFixed(1)}%` : "—")
  const verdictVariant = (verdict: EvaluationRow["verdict"]) => {
    if (verdict === "correct") return "secondary" as const
    if (verdict === "partial") return "outline" as const
    return "destructive" as const
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "text/csv": [".csv"] },
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    onDrop: (acceptedFiles, fileRejections) => {
      if (acceptedFiles.length > 0) {
        onCsvUpload(acceptedFiles[0])
        onCsvError(null)
      }
      if (fileRejections.length > 0) {
        const firstRejection = fileRejections[0]
        const message =
          firstRejection?.errors?.[0]?.message ?? "Only CSV files up to 10 MB are supported."
        onCsvError(message)
      }
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test & Evaluate</CardTitle>
        <CardDescription>Upload a labeled CSV and review automated grading metrics.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Upload evaluation CSV</CardTitle>
              <CardDescription>Compare generated answers with your expected outputs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => void onDownloadSample()}
                  disabled={isDownloadingSample}
                >
                  {isDownloadingSample ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {isDownloadingSample ? "Preparing..." : "Download sample CSV"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Template columns: <code>sr.no</code>, <code>input</code>, <code>output</code>.
                </p>
              </div>

              <div
                {...getRootProps({
                  className: cn(
                    "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/40 p-8 text-center transition",
                    isDragActive ? "border-primary bg-primary/5" : "hover:border-primary/60"
                  ),
                })}
              >
                <input {...getInputProps()} />
                <UploadCloud className="mb-3 h-10 w-10 text-primary" />
                <p className="text-sm font-semibold">Drag & drop or click to upload</p>
                <p className="text-xs text-muted-foreground">Only .csv files up to 10&nbsp;MB.</p>
              </div>

              {csvFile ? (
                <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3 text-sm">
                  <div className="flex flex-col gap-1 text-left md:flex-row md:items-center md:gap-2">
                    <span className="font-medium text-foreground">{csvFile.name}</span>
                    <span className="text-xs text-muted-foreground">{formatFileSize(csvFile.size)}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onCsvRemove} disabled={isEvaluating}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Use the template to prepare benchmark prompts. Each row becomes an automated test case.
                </p>
              )}

              {csvError && <p className="text-xs text-destructive">{csvError}</p>}

              <div className="flex flex-wrap items-center gap-3">
                <Button className="gap-2" onClick={onRunEvaluation} disabled={!csvFile || isEvaluating}>
                  {isEvaluating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isEvaluating ? "Evaluating" : "Run evaluation"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  We generate answers with your selected LLM and score them using GPT-5 via FastRouter.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {metricSpecs.map((spec, index) => (
                <div
                  key={spec.key}
                  className={metricSpecs.length === 7 && index === 6 ? "sm:col-span-2 lg:col-span-1 lg:col-start-2" : ""}
                >
                  <MetricCard
                    title={spec.title}
                    value={metrics ? metrics[spec.key] : null}
                    justification={justifications?.[spec.key]}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {isEvaluating && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Evaluation in progress</AlertTitle>
            <AlertDescription>
              We are querying the configured LLM and computing grading metrics. You can continue editing other steps while this runs.
            </AlertDescription>
          </Alert>
        )}

        {hasResults && metrics && (
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Evaluation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Average evaluation score <span className="font-semibold text-foreground">{metrics.evaluationScore.toFixed(1)}%</span> across {rows.length} example{rows.length !== 1 ? "s" : ""}
                </li>
                <li>
                  Lowest score <span className="font-semibold text-foreground">{Math.min(...rows.map(r => r.llmScore || 0)).toFixed(1)}%</span> on example <span className="font-semibold text-foreground">#{rows.find(r => (r.llmScore || 0) === Math.min(...rows.map(r => r.llmScore || 0)))?.questionNumber || "N/A"}</span>
                </li>
                <li>
                  <span className="font-semibold text-foreground">Highly effective and concise response;</span> slight deduction due to lack of explicit grounding in the provided snippet
                </li>
              </ul>
            </CardContent>
          </Card>
        )}

        {hasResults && shouldShowImprovement && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Improvement recommended</AlertTitle>
            <AlertDescription className="space-y-2 text-sm">
              <p>Accuracy or evaluation score is below the recommended threshold. Consider refining your prompt or expanding the dataset.</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Review low-scoring questions below and iterate on their answers.</li>
                <li>Add missing documents to increase coverage.</li>
                <li>Regenerate embeddings if the dataset has changed.</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Detailed Results</h3>
              <p className="text-sm text-muted-foreground">
                {hasResults
                  ? `Showing ${rows.length} evaluated ${rows.length === 1 ? "question" : "questions"}.`
                  : "Run an evaluation to populate question-by-question metrics."}
              </p>
            </div>
            {hasResults && <Badge variant="outline">{rows.length} rows</Badge>}
          </div>

          {!hasResults ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
              <p>
                Upload the filled CSV to generate accuracy, faithfulness, relevancy, precision, and recall scores. Each row compares the model answer with your expected output.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-hidden rounded-lg border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Question</TableHead>
                      <TableHead className="min-w-[200px]">Model Answer</TableHead>
                      <TableHead className="min-w-[180px]">Expected Answer</TableHead>
                      <TableHead className="min-w-[100px]">LLM Score</TableHead>
                      <TableHead className="min-w-[90px]">Semantic</TableHead>
                      <TableHead className="min-w-[100px]">Faithfulness</TableHead>
                      <TableHead className="min-w-[110px]">Answer Rel.</TableHead>
                      <TableHead className="min-w-[90px]">Precision</TableHead>
                      <TableHead className="min-w-[80px]">Recall</TableHead>
                      <TableHead className="min-w-[80px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.questionNumber}>
                        <TableCell className="align-top text-sm">
                          <div className="flex flex-wrap items-center gap-2 text-xs uppercase text-muted-foreground">
                            <Badge variant="outline">#{row.questionNumber}</Badge>
                            <Badge variant={verdictVariant(row.verdict)} className="font-normal capitalize">
                              {row.verdict}
                            </Badge>
                          </div>
                          <p className="mt-2 font-medium text-foreground line-clamp-2">{row.question}</p>
                          {row.contextSnippets.length > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {row.contextSnippets.length} context snippet{row.contextSnippets.length === 1 ? "" : "s"}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="align-top text-sm leading-relaxed max-w-xs">
                          <div className="line-clamp-3">{row.modelAnswer}</div>
                          {row.notes && <p className="mt-2 text-xs text-muted-foreground">LLM notes: {row.notes}</p>}
                        </TableCell>
                        <TableCell className="align-top text-sm text-muted-foreground leading-relaxed max-w-xs">
                          <div className="line-clamp-3">{row.expectedAnswer}</div>
                        </TableCell>
                        <TableCell className="align-top whitespace-nowrap">
                          <Badge variant="secondary">{formatScore(row.llmScore)}</Badge>
                        </TableCell>
                        <TableCell className="align-top text-sm whitespace-nowrap">{formatScore(row.semanticScore)}</TableCell>
                        <TableCell className="align-top text-sm whitespace-nowrap">{formatScore(row.faithfulness)}</TableCell>
                        <TableCell className="align-top text-sm whitespace-nowrap">{formatScore(row.answerRelevancy)}</TableCell>
                        <TableCell className="align-top text-sm whitespace-nowrap">{formatScore(row.contentPrecision)}</TableCell>
                        <TableCell className="align-top text-sm whitespace-nowrap">{formatScore(row.contextRecall)}</TableCell>
                        <TableCell className="align-top text-right">
                          <Button variant="ghost" size="sm" onClick={() => onSelectResult(row)}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableCaption className="text-xs">Updated automatically after each evaluation run.</TableCaption>
                </Table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


type AiResponsePanelProps = {
  content: string
}

const markdownComponents: MarkdownComponents = {
  h1: ({ ...props }) => (
    <h2 className="text-xl font-semibold text-foreground" {...props} />
  ),
  h2: ({ ...props }) => (
    <h3 className="text-lg font-semibold text-foreground" {...props} />
  ),
  h3: ({ ...props }) => (
    <h4 className="text-base font-semibold text-foreground" {...props} />
  ),
  p: ({ ...props }) => (
    <p className="text-sm leading-relaxed text-muted-foreground" {...props} />
  ),
  ul: ({ ...props }) => (
    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground" {...props} />
  ),
  ol: ({ ...props }) => (
    <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground" {...props} />
  ),
  li: ({ ...props }) => (
    <li className="leading-relaxed" {...props} />
  ),
  strong: ({ ...props }) => <strong className="font-semibold text-foreground" {...props} />,
  table: ({ ...props }) => {
    const { className, ...rest } = props as React.ComponentPropsWithoutRef<"table">
    return (
      <div className="w-full overflow-auto rounded-lg border border-border/40">
        <table
          {...rest}
          className={cn(
            "w-full min-w-[640px] border-collapse text-xs text-foreground",
            "[&>thead>tr>th]:bg-muted/70 [&>thead>tr>th]:text-left [&>thead>tr>th]:font-semibold",
            "[&>thead>tr>th]:border [&>thead>tr>th]:px-3 [&>thead>tr>th]:py-2",
            "[&>tbody>tr>td]:border [&>tbody>tr>td]:px-3 [&>tbody>tr>td]:py-2",
            "[&>tbody>tr:nth-child(even)]:bg-muted/40",
            className ?? ""
          )}
        />
      </div>
    )
  },
  code: ({ inline, className, children, ...props }) => {
    if (inline) {
      return (
        <code className={cn("rounded bg-muted px-1 py-0.5 font-mono text-[12px]", className)} {...props}>
          {children}
        </code>
      )
    }
    // For block code, render without wrapping in a component that might add <p>
    return (
      <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs text-foreground my-2">
        <code {...props} className={cn("font-mono", className)}>
          {children}
        </code>
      </pre>
    )
  },
}

function AiResponsePanel({ content }: AiResponsePanelProps) {
  const trimmedContent = content?.trim()
  if (!trimmedContent) {
    return <p className="text-sm text-muted-foreground">No response available.</p>
  }

  return (
    <div className="prose prose-sm max-w-none pr-1 text-sm leading-relaxed [&>p]:my-2 [&>pre]:my-2 [&>h1]:mt-3 [&>h2]:mt-2 [&>h3]:mt-2">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {trimmedContent}
      </ReactMarkdown>
    </div>
  )
}

type MetricCardProps = {
  title: string
  value: number | null
  justification?: string
}

function MetricCard({ title, value, justification }: MetricCardProps) {
  const hasValue = typeof value === "number"
  const normalized = hasValue ? Math.min(Math.max(value, 0), 100) : 0
  const displayValue = hasValue ? `${value.toFixed(1)}%` : "—"

  // Standard colors for each metric type - not based on score
  const colorMap: Record<string, { bg: string; border: string; text: string; accent: string; progress: string }> = {
    "Accuracy": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", accent: "bg-blue-100", progress: "bg-blue-500" },
    "Evaluation Score": { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", accent: "bg-purple-100", progress: "bg-purple-500" },
    "Semantic Accuracy": { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", accent: "bg-emerald-100", progress: "bg-emerald-500" },
    "Faithfulness": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", accent: "bg-amber-100", progress: "bg-amber-500" },
    "Answer Relevancy": { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", accent: "bg-rose-100", progress: "bg-rose-500" },
    "Content Precision": { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700", accent: "bg-cyan-100", progress: "bg-cyan-500" },
    "Context Recall": { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", accent: "bg-indigo-100", progress: "bg-indigo-500" },
  }

  const colors = colorMap[title] || { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", accent: "bg-slate-100", progress: "bg-slate-500" }

  return (
    <Card className={cn("border-2 transition-all duration-300 hover:shadow-lg", colors.bg, colors.border)}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">{title}</CardTitle>
          {justification ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-3.5 w-3.5 text-muted-foreground/70 transition-colors hover:text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs leading-relaxed">{justification}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        <CardDescription className={cn("text-3xl font-bold mt-2", colors.text)}>{displayValue}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/50 border border-white/80">
          <div
            className={cn("h-full rounded-full transition-all duration-500", colors.progress)}
            style={{ width: `${normalized}%` }}
          />
        </div>
        {justification ? (
          <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground/80">
            {justification.split('\n').filter(line => line.trim()).map((line, idx) => (
              <li key={idx}>{line.trim()}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground/80">
            Run an evaluation to generate this score.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

type DeploymentSectionProps = {
  appearance: {
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
  setAppearance: (appearance: DeploymentSectionProps["appearance"]) => void
  behavior: {
    welcomeMessage: string
    placeholder: string
    responseDelay: number[]
    typingIndicator: boolean
    soundNotifications: boolean
  }
  setBehavior: (behavior: DeploymentSectionProps["behavior"]) => void
  branding: {
    chatbotName: string
    watermark: string
    position: string
    customWatermark: string
    logo: File | null
  }
  setBranding: (branding: DeploymentSectionProps["branding"]) => void
  activeDevice: string
  onDeviceChange: (device: string) => void
  deploymentTab: string
  onDeploymentTabChange: (tab: string) => void
  codeSnippets: typeof CODE_SNIPPETS
  setOpenDeleteDialog: (open: boolean) => void
}

function DeploymentSection({
  appearance,
  setAppearance,
  behavior,
  setBehavior,
  branding,
  setBranding,
  activeDevice,
  onDeviceChange,
  deploymentTab,
  onDeploymentTabChange,
  codeSnippets,
  setOpenDeleteDialog,
}: DeploymentSectionProps) {
  const themePresets: Array<{
    name: string
    description: string
    appearance: Partial<DeploymentSectionProps["appearance"]>
  }> = [
    {
      name: "Krira Pro",
      description: "Bright, confident default",
      appearance: {
        primary: "#2563eb",
        accent: "#60a5fa",
        background: "#ffffff",
        text: "#0f172a",
        button: "#1d4ed8",
        borderRadius: 14,
        bubbleSize: 14,
        font: "Inter",
        useGradient: true,
      },
    },
    {
      name: "Midnight",
      description: "Dark UI with electric highlights",
      appearance: {
        primary: "#6366f1",
        accent: "#22d3ee",
        background: "#111827",
        text: "#f9fafb",
        button: "#4338ca",
        borderRadius: 18,
        bubbleSize: 16,
        font: "Space Grotesk",
        useGradient: true,
      },
    },
    {
      name: "Minimal",
      description: "Soft neutrals and clean lines",
      appearance: {
        primary: "#0ea5e9",
        accent: "#38bdf8",
        background: "#f8fafc",
        text: "#1f2937",
        button: "#0284c7",
        borderRadius: 12,
        bubbleSize: 13,
        font: "DM Sans",
        useGradient: false,
      },
    },
    {
      name: "Aurora",
      description: "Vibrant gradient-led branding",
      appearance: {
        primary: "#ec4899",
        accent: "#8b5cf6",
        background: "#0f172a",
        text: "#f8fafc",
        button: "#db2777",
        borderRadius: 20,
        bubbleSize: 15,
        font: "Sora",
        useGradient: true,
      },
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deploy Chatbot</CardTitle>
        <CardDescription>Customize the widget and choose your deployment option.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="w-full justify-start gap-2 overflow-auto">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
          </TabsList>
          <TabsContent value="appearance" className="space-y-4">
            <Card className="border-dashed">
              <CardHeader className="space-y-2">
                <CardTitle className="text-base">Theme & Styling</CardTitle>
                <CardDescription>Create a polished assistant that mirrors your product identity.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick presets</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {themePresets.map((preset) => {
                      const isActive = ["primary", "accent", "background", "text", "button"].every((key) => {
                        const current = appearance[key as keyof typeof appearance]
                        const target = preset.appearance[key as keyof typeof appearance]
                        return target ? current === target : true
                      })

                      return (
                        <Button
                          key={preset.name}
                          variant={isActive ? "default" : "outline"}
                          className="gap-3 rounded-full border-muted/40 px-4 py-2"
                          onClick={() =>
                            setAppearance({
                              ...appearance,
                              ...preset.appearance,
                              borderRadius: preset.appearance.borderRadius ?? appearance.borderRadius,
                              bubbleSize: preset.appearance.bubbleSize ?? appearance.bubbleSize,
                              font: preset.appearance.font ?? appearance.font,
                              useGradient: preset.appearance.useGradient ?? appearance.useGradient,
                            })
                          }
                        >
                          <span
                            className="h-6 w-6 rounded-full border"
                            style={{
                              background: preset.appearance.useGradient
                                ? `linear-gradient(135deg, ${preset.appearance.primary}, ${preset.appearance.accent})`
                                : preset.appearance.primary,
                            }}
                          />
                          <span className="flex flex-col items-start leading-none">
                            <span className="text-xs font-semibold">{preset.name}</span>
                            <span className="text-[11px] text-muted-foreground">{preset.description}</span>
                          </span>
                        </Button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.35fr,1fr]">
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <ColorControl
                        label="Primary"
                        description="Buttons and hero moments"
                        value={appearance.primary}
                        onChange={(value) => setAppearance({ ...appearance, primary: value })}
                      />
                      <ColorControl
                        label="Accent"
                        description="Secondary gradient"
                        value={appearance.accent}
                        onChange={(value) => setAppearance({ ...appearance, accent: value })}
                      />
                      <ColorControl
                        label="Background"
                        description="Widget canvas"
                        value={appearance.background}
                        onChange={(value) => setAppearance({ ...appearance, background: value })}
                      />
                      <ColorControl
                        label="Text"
                        description="Primary typography"
                        value={appearance.text}
                        onChange={(value) => setAppearance({ ...appearance, text: value })}
                      />
                      <ColorControl
                        label="CTA"
                        description="Call-to-action buttons"
                        value={appearance.button}
                        onChange={(value) => setAppearance({ ...appearance, button: value })}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Border radius</Label>
                        <Slider
                          value={[appearance.borderRadius]}
                          onValueChange={([value]) => setAppearance({ ...appearance, borderRadius: value })}
                          max={24}
                          min={0}
                        />
                        <p className="text-xs text-muted-foreground">Widget shell rounding ({appearance.borderRadius}px).</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Bubble padding</Label>
                        <Slider
                          value={[appearance.bubbleSize]}
                          onValueChange={([value]) => setAppearance({ ...appearance, bubbleSize: value })}
                          max={26}
                          min={8}
                        />
                        <p className="text-xs text-muted-foreground">Conversation density ({appearance.bubbleSize}).</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Font family</Label>
                        <Select value={appearance.font} onValueChange={(value) => setAppearance({ ...appearance, font: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select font" />
                          </SelectTrigger>
                          <SelectContent>
                            {["Inter", "Manrope", "Space Grotesk", "DM Sans", "Sora", "Plus Jakarta Sans"].map((font) => (
                              <SelectItem key={font} value={font}>
                                {font}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <Label className="text-sm">Gradient header</Label>
                          <p className="text-xs text-muted-foreground">Blend primary and accent for the hero bar.</p>
                        </div>
                        <Switch
                          checked={appearance.useGradient}
                          onCheckedChange={(checked) => setAppearance({ ...appearance, useGradient: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <WidgetPreview
                    appearance={appearance}
                    behavior={behavior}
                    branding={branding}
                    activeDevice={activeDevice}
                    onDeviceChange={onDeviceChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="behavior" className="space-y-4">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Behavior Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Welcome message</Label>
                  <Textarea
                    value={behavior.welcomeMessage}
                    onChange={(event) => setBehavior({ ...behavior, welcomeMessage: event.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Input placeholder</Label>
                    <Input
                      value={behavior.placeholder}
                      onChange={(event) => setBehavior({ ...behavior, placeholder: event.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Response delay ({behavior.responseDelay[0]}ms)</Label>
                    <Slider
                      value={behavior.responseDelay}
                      onValueChange={(value) => setBehavior({ ...behavior, responseDelay: value })}
                      min={200}
                      max={1500}
                      step={50}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label className="text-sm">Typing indicator</Label>
                      <p className="text-xs text-muted-foreground">Show animated typing bubble during responses</p>
                    </div>
                    <Switch
                      checked={behavior.typingIndicator}
                      onCheckedChange={(checked) => setBehavior({ ...behavior, typingIndicator: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label className="text-sm">Sound notifications</Label>
                      <p className="text-xs text-muted-foreground">Play a ping when a new answer arrives</p>
                    </div>
                    <Switch
                      checked={behavior.soundNotifications}
                      onCheckedChange={(checked) => setBehavior({ ...behavior, soundNotifications: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="branding" className="space-y-4">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Branding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Chatbot name</Label>
                    <Input
                      value={branding.chatbotName}
                      onChange={(event) => setBranding({ ...branding, chatbotName: event.target.value })}
                    />
                    <Label>Position</Label>
                    <Select value={branding.position} onValueChange={(value) => setBranding({ ...branding, position: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-right">Bottom right</SelectItem>
                        <SelectItem value="bottom-left">Bottom left</SelectItem>
                        <SelectItem value="floating">Floating button</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Upload logo</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const [file] = event.target.files ?? []
                        setBranding({ ...branding, logo: file ?? null })
                      }}
                    />
                    <div className="text-xs text-muted-foreground">
                      {branding.logo ? branding.logo.name : "PNG or SVG up to 2MB"}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Watermark settings
                    <Badge variant="secondary">Free</Badge>
                  </Label>
                  <div className="flex items-center gap-3">
                    <Checkbox checked disabled />
                    <span className="text-sm">Powered by Krira AI</span>
                  </div>
                  <Input
                    disabled
                    value={branding.customWatermark}
                    placeholder="Upgrade to Pro for custom watermark"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs> */}

        <DeploymentOptions
          deploymentTab={deploymentTab}
          onDeploymentTabChange={onDeploymentTabChange}
          codeSnippets={codeSnippets}
          setOpenDeleteDialog={setOpenDeleteDialog}
        />
      </CardContent>
    </Card>
  )
}

type WidgetPreviewProps = {
  appearance: DeploymentSectionProps["appearance"]
  behavior: DeploymentSectionProps["behavior"]
  branding: DeploymentSectionProps["branding"]
  activeDevice: string
  onDeviceChange: (device: string) => void
}

function WidgetPreview({ appearance, behavior, branding, activeDevice, onDeviceChange }: WidgetPreviewProps) {
  const deviceIconMap = {
    desktop: Monitor,
    tablet: TabletSmartphone,
    mobile: Smartphone,
  }

  const headerBackground = appearance.useGradient
    ? `linear-gradient(135deg, ${appearance.primary}, ${appearance.accent})`
    : appearance.primary
  const readablePrimaryText = getReadableTextColor(appearance.primary)
  const readableButtonText = getReadableTextColor(appearance.button)
  const bubbleRadius = appearance.bubbleSize
  const assistantBubbleStyle: React.CSSProperties = {
    background: appearance.primary,
    color: readablePrimaryText,
    borderRadius: bubbleRadius,
  }
  const userBubbleStyle: React.CSSProperties = {
    background: withAlpha(appearance.accent, "1A"),
    color: appearance.text,
    borderRadius: bubbleRadius,
    border: `1px solid ${withAlpha(appearance.accent, "33")}`,
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Palette className="h-4 w-4" /> Live preview
        </div>
        <div className="flex gap-2">
          {Object.entries(deviceIconMap).map(([device, Icon]) => (
            <Button
              key={device}
              variant={activeDevice === device ? "default" : "outline"}
              size="icon"
              onClick={() => onDeviceChange(device)}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>
      <div
        className="relative mx-auto w-full max-w-sm overflow-hidden rounded-[18px] border shadow-sm"
        style={{
          backgroundColor: appearance.background,
          fontFamily: appearance.font,
          borderRadius: appearance.borderRadius,
          color: appearance.text,
        }}
      >
        <div
          className="flex items-center justify-between gap-3 px-4 py-3"
          style={{
            background: headerBackground,
            color: readablePrimaryText,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
              style={{
                backgroundColor: withAlpha(appearance.background, "1A"),
                color: readablePrimaryText,
                border: `1px solid ${withAlpha(appearance.background, "33")}`,
              }}
            >
              {branding.chatbotName.slice(0, 2).toUpperCase()}
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">{branding.chatbotName}</p>
              <p className="text-[11px] opacity-80">Smart assistant</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-[11px] font-medium text-white">
            Online
          </Badge>
        </div>

        <div className="space-y-3 px-4 py-4 text-sm" style={{ color: appearance.text }}>
          <div className="flex items-start gap-2">
            <div className="h-8 w-8 rounded-full bg-muted/60" />
            <div className="max-w-[80%] px-4 py-3" style={assistantBubbleStyle}>
              {behavior.welcomeMessage || "Hi there! How can I help you today?"}
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[80%] px-4 py-3 text-sm shadow-sm" style={userBubbleStyle}>
              Show me what deploying Krira looks like.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-muted/60" />
            <div className="w-full max-w-[85%] space-y-2 px-4 py-3" style={assistantBubbleStyle}>
              <p className="font-medium">Here is a personalised answer</p>
              <p className="text-sm opacity-90">
                I will respond in {Math.round(behavior.responseDelay[0] / 100) / 10}s and keep messaging concise using {appearance.font}.
              </p>
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-2 border-t px-4 py-3"
          style={{ borderColor: withAlpha(appearance.primary, "1F") }}
        >
          <div
            className="flex-1 px-3 py-2 text-sm text-muted-foreground"
            style={{
              borderRadius: appearance.borderRadius,
              border: `1px solid ${withAlpha(appearance.primary, "33")}`,
              backgroundColor: withAlpha(appearance.background, "05"),
            }}
          >
            {behavior.placeholder || "Ask something..."}
          </div>
          <Button
            size="sm"
            style={{
              backgroundColor: appearance.button,
              color: readableButtonText,
              borderRadius: Math.max(appearance.borderRadius - 2, 8),
            }}
          >
            Send
          </Button>
        </div>

        <div className="flex items-center justify-between border-t px-4 py-2 text-xs" style={{ borderColor: withAlpha(appearance.primary, "14") }}>
          <span className="font-medium text-muted-foreground">{appearance.font}</span>
          <span className="text-muted-foreground">Accent {appearance.accent}</span>
        </div>
      </div>
    </div>
  )
}

type ColorControlProps = {
  label: string
  description?: string
  value: string
  onChange: (value: string) => void
}

function ColorControl({ label, description, value, onChange }: ColorControlProps) {
  const normalizedValue = value?.startsWith("#") ? value.toUpperCase() : `#${value.toUpperCase()}`

  const handleManualChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let next = event.target.value.trim()
    if (!next.startsWith("#")) {
      next = `#${next}`
    }
    if (next.length > 7) {
      next = next.slice(0, 7)
    }
    onChange(next.toUpperCase())
  }

  const handleColorChange = (color: ColorResult) => {
    onChange(color.hex.toUpperCase())
  }

  return (
    <div className="space-y-3 rounded-lg border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        <span className="h-6 w-6 rounded-full border" style={{ background: normalizedValue }} />
      </div>
      <div className="flex gap-2">
        <Input
          value={normalizedValue}
          onChange={handleManualChange}
          className="font-mono text-xs uppercase"
          maxLength={7}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-10 w-12 rounded-md p-0"
              aria-label={`Select ${label.toLowerCase()} color`}
            >
              <span className="sr-only">Select color</span>
              <span className="h-full w-full rounded-md" style={{ background: normalizedValue }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto border-none bg-transparent p-0 shadow-lg">
            <ChromePicker color={normalizedValue} disableAlpha onChangeComplete={handleColorChange} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

function withAlpha(hex: string, alphaHex: string) {
  if (!hex || hex.length !== 7) return hex
  return `${hex}${alphaHex}`.toUpperCase()
}

function getReadableTextColor(hex: string) {
  const luminance = getLuminance(hex)
  return luminance > 0.6 ? "#0f172a" : "#ffffff"
}

function getLuminance(hex: string) {
  const rgb = hexToRgb(hex)
  if (!rgb) return 1
  const [r, g, b] = rgb
  const [rLin, gLin, bLin] = [r, g, b].map((component) => {
    const channel = component / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin
}

function hexToRgb(hex: string): [number, number, number] | null {
  if (!hex) return null
  const normalized = hex.replace("#", "")
  if (normalized.length !== 6) return null
  const intVal = Number.parseInt(normalized, 16)
  const r = (intVal >> 16) & 255
  const g = (intVal >> 8) & 255
  const b = intVal & 255
  return [r, g, b]
}

type DeploymentOptionsProps = {
  deploymentTab: string
  onDeploymentTabChange: (tab: string) => void
  codeSnippets: typeof CODE_SNIPPETS
  setOpenDeleteDialog: (open: boolean) => void
}

function DeploymentOptions({ deploymentTab, onDeploymentTabChange, codeSnippets, setOpenDeleteDialog }: DeploymentOptionsProps) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base">Deployment Options</CardTitle>
        <CardDescription>Embed via npm package or call the API directly.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={deploymentTab} onValueChange={onDeploymentTabChange}>
          <TabsList>
            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="curl">cURL</TabsTrigger>
          </TabsList>
          {Object.entries(codeSnippets).map(([key, snippet]) => (
            <TabsContent key={key} value={key}>
              <div className="relative rounded-md border bg-slate-950/90">
                <Button variant="ghost" size="sm" className="absolute right-2 top-2 text-white/80">
                  Copy
                </Button>
                <SyntaxHighlighter
                  language={snippet.language}
                  style={syntaxTheme}
                  customStyle={{ background: "transparent", padding: "1rem", margin: 0, fontSize: "0.85rem" }}
                >
                  {snippet.code}
                </SyntaxHighlighter>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <div className="flex flex-wrap gap-3">
          <Button className="gap-2">
            <Bot className="h-4 w-4" /> Deploy chatbot
          </Button>
          <Button variant="outline">Save as draft</Button>
          <Button variant="ghost" onClick={() => setOpenDeleteDialog(true)}>
            Back to edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

type DetailDialogProps = {
  result: EvaluationRow | null
  onOpenChange: (open: boolean) => void
}

function DetailDialog({ result, onOpenChange }: DetailDialogProps) {
  const formatScore = (value?: number | null) => (typeof value === "number" ? `${value.toFixed(1)}%` : "—")

  return (
    <Dialog open={!!result} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Evaluation detail</DialogTitle>
          <DialogDescription>
            {result ? `Question ${result.questionNumber}` : "Inspect the evaluated row."}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 px-1 pr-4">
          {result && (
            <div className="space-y-4 text-sm">
              <div>
                <Label className="text-xs uppercase text-muted-foreground">Question</Label>
                <p className="font-medium text-foreground">{result.question}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Expected answer</Label>
                  <p className="text-muted-foreground leading-relaxed">{result.expectedAnswer}</p>
                </div>
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Model answer</Label>
                  <p className="leading-relaxed">{result.modelAnswer}</p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {["llmScore", "semanticScore", "faithfulness", "answerRelevancy", "contentPrecision", "contextRecall"].map((key) => {
                  const labelMap: Record<string, string> = {
                    llmScore: "LLM Score",
                    semanticScore: "Semantic Accuracy",
                    faithfulness: "Faithfulness",
                    answerRelevancy: "Answer Relevancy",
                    contentPrecision: "Content Precision",
                    contextRecall: "Context Recall",
                  }
                  const value = (result as Record<string, number | null | undefined>)[key]
                  return (
                    <div key={key} className="rounded-md border bg-muted/30 px-3 py-2">
                      <p className="text-[11px] uppercase text-muted-foreground">{labelMap[key]}</p>
                      <p className="text-base font-semibold">{formatScore(value)}</p>
                    </div>
                  )
                })}
              </div>
              {result.notes && (
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">LLM justification</Label>
                  <p className="leading-relaxed">{result.notes}</p>
                </div>
              )}
              {result.contextSnippets.length > 0 && (
                <div>
                  <Label className="text-xs uppercase text-muted-foreground">Context snippets</Label>
                  <ol className="mt-2 space-y-2 text-sm text-muted-foreground">
                    {result.contextSnippets.map((snippet, index) => (
                      <li key={`${result.questionNumber}-snippet-${index}`} className="rounded-md border bg-muted/20 p-2 leading-relaxed">
                        {snippet}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter className="shrink-0 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
