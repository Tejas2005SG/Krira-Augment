"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import jsPDF from "jspdf"
import {
  Edit2,
  FileText,
  Loader2,
  MoreHorizontal,
  Search,
  Trash2,
  Download,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { chatbotService, type Chatbot } from "@/lib/api/chatbot.service"

type ChatbotStatus = "active" | "inactive" | "draft"

export function PreviousChatbotsTab() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [chatbots, setChatbots] = React.useState<Chatbot[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | ChatbotStatus>("all")
  const [sort, setSort] = React.useState("newest")
  const [deleteChatbot, setDeleteChatbot] = React.useState<Chatbot | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = React.useState("")

  // Fetch chatbots on mount
  React.useEffect(() => {
    loadChatbots()
  }, [])

  const loadChatbots = async () => {
    try {
      setIsLoading(true)
      const response = await chatbotService.getAllChatbots()
      setChatbots(response.chatbots)
    } catch (error: any) {
      console.error("Failed to load chatbots:", error)
      toast({
        title: "Error loading chatbots",
        description: error.message || "Failed to fetch your chatbots"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteChatbot = async () => {
    if (!deleteChatbot) return

    try {
      setIsDeleting(true)
      await chatbotService.deleteChatbot(deleteChatbot._id)
      
      toast({
        title: "Chatbot deleted",
        description: `${deleteChatbot.name} has been deleted successfully`,
      })

      // Remove from list
      setChatbots(prev => prev.filter(bot => bot._id !== deleteChatbot._id))
      setDeleteChatbot(null)
    } catch (error: any) {
      console.error("Failed to delete chatbot:", error)
      toast({
        title: "Error deleting chatbot",
        description: error.message || "Failed to delete the chatbot"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditChatbot = (chatbot: Chatbot) => {
    // Navigate to train-llm tab with chatbot ID as query parameter
    router.push(`/dashboard?tab=train-llm&editId=${chatbot._id}`)
  }

  const handleExportDetails = (chatbot: Chatbot) => {
    try {
      const doc = new jsPDF()
      
      // Add title
      doc.setFontSize(20)
      doc.setTextColor(37, 99, 235) // Blue color
      doc.text("Chatbot Configuration Details", 20, 20)
      
      // Reset for body text
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      
      let yPosition = 35
      
      // Basic Information
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Basic Information", 20, yPosition)
      yPosition += 8
      
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Name: ${chatbot.name}`, 25, yPosition)
      yPosition += 6
      doc.text(`ID: ${chatbot._id}`, 25, yPosition)
      yPosition += 6
      doc.text(`Created: ${new Date(chatbot.createdAt).toLocaleString()}`, 25, yPosition)
      yPosition += 6
      doc.text(`Last Updated: ${new Date(chatbot.updatedAt).toLocaleString()}`, 25, yPosition)
      yPosition += 10
      
      // Dataset Information
      if (chatbot.dataset) {
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Dataset Information", 20, yPosition)
        yPosition += 8
        
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text(`Type: ${chatbot.dataset.type || "N/A"}`, 25, yPosition)
        yPosition += 6
        
        if (chatbot.dataset.files && chatbot.dataset.files.length > 0) {
          doc.text(`Files (${chatbot.dataset.files.length}):`, 25, yPosition)
          yPosition += 6
          chatbot.dataset.files.forEach((file, idx) => {
            const fileText = `  ${idx + 1}. ${file.name} - ${file.chunks || 0} chunks, ${(file.size / 1024).toFixed(2)} KB`
            doc.text(fileText, 30, yPosition)
            yPosition += 5
          })
        }
        
        if (chatbot.dataset.urls && chatbot.dataset.urls.length > 0) {
          yPosition += 2
          doc.text(`URLs (${chatbot.dataset.urls.length}):`, 25, yPosition)
          yPosition += 6
          chatbot.dataset.urls.forEach((url, idx) => {
            doc.text(`  ${idx + 1}. ${url}`, 30, yPosition)
            yPosition += 5
          })
        }
        yPosition += 5
      }
      
      // Embedding Configuration
      if (chatbot.embedding) {
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }
        
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Embedding Configuration", 20, yPosition)
        yPosition += 8
        
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text(`Model: ${chatbot.embedding.model || "N/A"}`, 25, yPosition)
        yPosition += 6
        doc.text(`Vector Store: ${chatbot.embedding.vectorStore || "N/A"}`, 25, yPosition)
        yPosition += 6
        doc.text(`Status: ${chatbot.embedding.isEmbedded ? "✓ Embedded" : "✗ Not Embedded"}`, 25, yPosition)
        yPosition += 6
        
        if (chatbot.embedding.pineconeConfig) {
          doc.text(`Pinecone Index: ${chatbot.embedding.pineconeConfig.indexName || "N/A"}`, 25, yPosition)
          yPosition += 6
        }
        
        if (chatbot.embedding.stats) {
          doc.text(`Chunks Processed: ${chatbot.embedding.stats.chunksProcessed || 0}`, 25, yPosition)
          yPosition += 6
          doc.text(`Chunks Embedded: ${chatbot.embedding.stats.chunksEmbedded || 0}`, 25, yPosition)
          yPosition += 6
        }
        yPosition += 5
      }
      
      // LLM Configuration
      if (chatbot.llm) {
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }
        
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("LLM Configuration", 20, yPosition)
        yPosition += 8
        
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text(`Provider: ${chatbot.llm.provider || "N/A"}`, 25, yPosition)
        yPosition += 6
        doc.text(`Model: ${chatbot.llm.model || "N/A"}`, 25, yPosition)
        yPosition += 6
        doc.text(`Top-K Chunks: ${chatbot.llm.topK || "N/A"}`, 25, yPosition)
        yPosition += 6
        
        if (chatbot.llm.systemPrompt) {
          doc.text("System Prompt:", 25, yPosition)
          yPosition += 6
          const splitPrompt = doc.splitTextToSize(chatbot.llm.systemPrompt, 160)
          doc.text(splitPrompt, 30, yPosition)
          yPosition += (splitPrompt.length * 5) + 5
        }
        yPosition += 5
      }
      
      // Test Results
      if (chatbot.tests && chatbot.tests.length > 0) {
        if (yPosition > 220) {
          doc.addPage()
          yPosition = 20
        }
        
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text(`Test Results (${chatbot.tests.length} tests)`, 20, yPosition)
        yPosition += 8
        
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        chatbot.tests.slice(0, 5).forEach((test, idx) => {
          if (yPosition > 270) {
            doc.addPage()
            yPosition = 20
          }
          doc.text(`Test ${idx + 1}:`, 25, yPosition)
          yPosition += 5
          doc.text(`Q: ${test.question}`, 30, yPosition)
          yPosition += 5
          const splitAnswer = doc.splitTextToSize(`A: ${test.answer}`, 150)
          doc.text(splitAnswer, 30, yPosition)
          yPosition += (splitAnswer.length * 5) + 5
        })
        
        if (chatbot.tests.length > 5) {
          doc.text(`... and ${chatbot.tests.length - 5} more tests`, 25, yPosition)
          yPosition += 10
        }
      }
      
      // Evaluation Metrics
      if (chatbot.evaluation && chatbot.evaluation.metrics) {
        if (yPosition > 230) {
          doc.addPage()
          yPosition = 20
        }
        
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Evaluation Metrics", 20, yPosition)
        yPosition += 8
        
        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        const metrics = chatbot.evaluation.metrics
        doc.text(`Accuracy: ${metrics.accuracy?.toFixed(2)}%`, 25, yPosition)
        yPosition += 6
        doc.text(`Evaluation Score: ${metrics.evaluationScore?.toFixed(2)}%`, 25, yPosition)
        yPosition += 6
        doc.text(`Semantic Accuracy: ${metrics.semanticAccuracy?.toFixed(2)}%`, 25, yPosition)
        yPosition += 6
        doc.text(`Faithfulness: ${metrics.faithfulness?.toFixed(2)}%`, 25, yPosition)
        yPosition += 6
        doc.text(`Answer Relevancy: ${metrics.answerRelevancy?.toFixed(2)}%`, 25, yPosition)
        yPosition += 6
        doc.text(`Content Precision: ${metrics.contentPrecision?.toFixed(2)}%`, 25, yPosition)
        yPosition += 6
        doc.text(`Context Recall: ${metrics.contextRecall?.toFixed(2)}%`, 25, yPosition)
      }
      
      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(`Page ${i} of ${pageCount}`, 180, 285)
        doc.text(`Generated on ${new Date().toLocaleString()}`, 20, 285)
      }
      
      // Save the PDF
      doc.save(`${chatbot.name.replace(/[^a-z0-9]/gi, '_')}_details.pdf`)
      
      toast({
        title: "PDF exported successfully",
        description: `Downloaded details for "${chatbot.name}"`
      })
    } catch (error: any) {
      console.error("Failed to export PDF:", error)
      toast({
        title: "Export failed",
        description: error.message || "Failed to export chatbot details"
      })
    }
  }

  const getChatbotStatus = (chatbot: Chatbot): ChatbotStatus => {
    // Determine status based on chatbot completion
    if (chatbot.embedding?.isEmbedded && chatbot.llm?.model) {
      return "active"
    }
    if (chatbot.dataset) {
      return "inactive"
    }
    return "draft"
  }

  const filteredChatbots = React.useMemo(() => {
    return chatbots.filter((bot) => {
      const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase())
      const botStatus = getChatbotStatus(bot)
      const matchesStatus = statusFilter === "all" ? true : botStatus === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [chatbots, searchTerm, statusFilter])

  const sortedChatbots = React.useMemo(() => {
    switch (sort) {
      case "oldest":
        return [...filteredChatbots].reverse()
      case "name":
        return [...filteredChatbots].sort((a, b) => a.name.localeCompare(b.name))
      default:
        return filteredChatbots
    }
  }, [filteredChatbots, sort])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Your Chatbots</h2>
          <p className="text-sm text-muted-foreground">
            Manage active assistants, edit configurations, and iterate quickly.
          </p>
        </div>
        <Button className="gap-2" onClick={() => router.push("/dashboard?tab=train-llm")}>
          <FileText className="h-4 w-4" /> Create new chatbot
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-full flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full items-center gap-2 lg:max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chatbots"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ChatbotStatus | "all") }>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {sortedChatbots.length === 0 ? (
        <Card className="border-dashed py-12 text-center">
          <CardHeader>
            <CardTitle>No chatbots {searchTerm || statusFilter !== "all" ? "found" : "yet"}</CardTitle>
            <CardDescription>
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your filters" 
                : "Create your first assistant to see it here"}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => router.push("/dashboard?tab=train-llm")}>
              Create your first chatbot
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedChatbots.map((bot) => (
            <ChatbotCard
              key={bot._id}
              chatbot={bot}
              status={getChatbotStatus(bot)}
              onEdit={() => handleEditChatbot(bot)}
              onDelete={() => setDeleteChatbot(bot)}
              onExport={() => handleExportDetails(bot)}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteChatbot} onOpenChange={(open) => {
        if (!open) {
          setDeleteChatbot(null)
          setDeleteConfirmName("")
        }
      }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-xl">Delete chatbot?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete <span className="font-semibold text-foreground">"{deleteChatbot?.name}"</span> and all its data.
            </AlertDialogDescription>
            <div className="space-y-2">
              <label htmlFor="confirm-name" className="text-sm font-medium text-foreground">
                Type <span className="font-mono font-semibold">{deleteChatbot?.name}</span> to confirm:
              </label>
              <Input
                id="confirm-name"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder="Enter chatbot name"
                disabled={isDeleting}
                className="font-mono"
              />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-3 flex-col sm:flex-row">
            <AlertDialogCancel disabled={isDeleting} className="mt-0 w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 mt-0 w-full sm:w-auto px-4 py-2"
              onClick={handleDeleteChatbot}
              disabled={isDeleting || deleteConfirmName !== deleteChatbot?.name}
            >
              <div className="flex items-center justify-center gap-2">
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Chatbot</span>
                  </>
                )}
              </div>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

type ChatbotCardProps = {
  chatbot: Chatbot
  status: ChatbotStatus
  onEdit: () => void
  onDelete: () => void
  onExport: () => void
}

function ChatbotCard({ chatbot, status, onEdit, onDelete, onExport }: ChatbotCardProps) {
  const datasetInfo = chatbot.dataset
  const embeddingInfo = chatbot.embedding
  const llmInfo = chatbot.llm
  
  // Calculate metrics
  const totalChunks = datasetInfo?.files?.reduce((acc, f) => acc + (f.chunks || 0), 0) || 0
  const testCount = chatbot.testHistory?.length || 0
  
  const createdDate = new Date(chatbot.createdAt).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
  
  const updatedDate = new Date(chatbot.updatedAt).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })

  return (
    <Card className="flex h-full flex-col border-border/60">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-lg font-semibold">{chatbot.name}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Created {createdDate} · Updated {updatedDate}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onEdit}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit chatbot
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <StatusBadge status={status} />
          {totalChunks > 0 && (
            <Badge variant="secondary">{totalChunks.toLocaleString()} chunks</Badge>
          )}
        </div>
        
        <div className="space-y-3">
          {/* LLM Provider and Model */}
          {llmInfo?.model && (
            <div className="text-sm">
              <span className="font-medium text-foreground">Model: </span>
              <span className="text-muted-foreground">
                {llmInfo.provider} · {llmInfo.model}
              </span>
            </div>
          )}

          {/* Dataset */}
          {datasetInfo && (
            <div className="space-y-1.5">
              <div className="text-sm">
                <span className="font-medium text-foreground">Dataset: </span>
                {datasetInfo.files && datasetInfo.files.length > 0 ? (
                  <span className="text-muted-foreground">
                    {datasetInfo.files[0].name}
                  </span>
                ) : datasetInfo.urls && datasetInfo.urls.length > 0 ? (
                  <span className="text-muted-foreground">
                    {datasetInfo.urls[0]}
                  </span>
                ) : (
                  <span className="text-muted-foreground">No data</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground pl-[68px]">
                Type: {datasetInfo.type?.toUpperCase() || 'Unknown'}
              </div>
            </div>
          )}

          {/* Embedding Model with Logo */}
          {embeddingInfo?.model && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground">Embedding:</span>
              <div className="flex items-center gap-1.5">
                <Image
                  src={getEmbeddingLogo(embeddingInfo.model)}
                  alt={embeddingInfo.model}
                  width={16}
                  height={16}
                  className="rounded"
                />
                <span className="text-muted-foreground">{embeddingInfo.model}</span>
              </div>
            </div>
          )}

          {/* Vector Store with Logo */}
          {embeddingInfo?.vectorStore && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground">Vector Store:</span>
              <div className="flex items-center gap-1.5">
                <Image
                  src={getVectorStoreLogo(embeddingInfo.vectorStore)}
                  alt={embeddingInfo.vectorStore}
                  width={16}
                  height={16}
                  className="rounded"
                />
                <span className="text-muted-foreground">{embeddingInfo.vectorStore}</span>
              </div>
            </div>
          )}

          {/* System Prompt */}
          {llmInfo?.systemPrompt && (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">System prompt</p>
              <div className="max-h-[100px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40">
                <p className="whitespace-pre-wrap">{llmInfo.systemPrompt}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="mt-auto flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" className="gap-2" onClick={onEdit}>
          <Edit2 className="h-4 w-4" />
          Edit
        </Button>
        <Button variant="ghost" size="sm" className="gap-2" onClick={onExport}>
          <Download className="h-4 w-4" /> Export Details
        </Button>
      </CardFooter>
    </Card>
  )
}

function StatusBadge({ status }: { status: ChatbotStatus }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  
  if (status === "active") {
    return (
      <Badge 
        className="bg-green-50 text-green-700 border-green-600 hover:bg-green-100 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
      >
        {label}
      </Badge>
    )
  }
  
  if (status === "inactive") {
    return (
      <Badge 
        className="bg-red-50 text-red-700 border-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
      >
        {label}
      </Badge>
    )
  }
  
  return <Badge variant="outline">{label}</Badge>
}

// Helper functions to get provider logos
function getEmbeddingLogo(model: string): string {
  const modelLower = model.toLowerCase()
  
  // Check for HuggingFace
  if (modelLower.includes('hugging') || modelLower.includes('hf')) {
    return '/huggingface.svg'
  }
  
  // Check for OpenAI
  if (modelLower.includes('openai') || modelLower.includes('text-embedding')) {
    return '/openai.svg'
  }
  
  // Default fallback
  return '/openai.svg'
}

function getVectorStoreLogo(vectorStore: string): string {
  const storeLower = vectorStore.toLowerCase()
  
  // Check for Pinecone
  if (storeLower.includes('pinecone')) {
    return '/pinecone.png'
  }
  
  // Check for Chroma
  if (storeLower.includes('chroma')) {
    return '/chroma.png'
  }
  
  // Default to chroma
  return '/chroma.png'
}
