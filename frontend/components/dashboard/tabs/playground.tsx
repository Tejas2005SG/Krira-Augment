"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  Bot,
  Send,
  Loader2,
  Trash2,
  RefreshCw,
  User,
  ChevronDown,
  Clock,
  MessageSquare,
  MessageCircle,
  History,
  PenSquare,
  PanelRightOpen,
  PanelRightClose,
  Plus,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { chatbotService, type Chatbot } from "@/lib/api/chatbot.service"
import { playgroundService } from "@/lib/api/playground.service"
import { ApiError } from "@/lib/api/client"
import { cn } from "@/lib/utils"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isLoading?: boolean
}

type ConversationSession = {
  id: string
  chatbotId: string
  chatbotName: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

const STORAGE_KEY = "krira_playground_sessions"

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function loadSessions(): ConversationSession[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored) as ConversationSession[]
    return parsed.map((s) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
      messages: s.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
    }))
  } catch {
    return []
  }
}

function saveSessions(sessions: ConversationSession[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

export function PlaygroundTab() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [chatbots, setChatbots] = React.useState<Chatbot[]>([])
  const [selectedChatbot, setSelectedChatbot] = React.useState<Chatbot | null>(null)
  const [sessions, setSessions] = React.useState<ConversationSession[]>([])
  const [activeSession, setActiveSession] = React.useState<ConversationSession | null>(null)
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isLoadingChatbots, setIsLoadingChatbots] = React.useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)

  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const skipSessionEffectRef = React.useRef(false)

  // Get sessions for the selected chatbot (only show sessions with messages)
  const chatbotSessions = React.useMemo(() => {
    if (!selectedChatbot) return []
    return sessions
      .filter((s) => s.chatbotId === selectedChatbot._id && s.messages.length > 0)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }, [sessions, selectedChatbot])

  // Get a preview title for a session
  const getSessionTitle = (session: ConversationSession) => {
    const firstUserMessage = session.messages.find((m) => m.role === "user")
    if (firstUserMessage) {
      return firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? "..." : "")
    }
    return "New conversation"
  }

  // Handle selecting a session from history
  const handleSelectSession = (session: ConversationSession) => {
    skipSessionEffectRef.current = true
    setActiveSession(session)
    setIsSidebarOpen(false)
  }

  // Handle deleting a session
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // Skip the useEffect when we modify sessions
    skipSessionEffectRef.current = true
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== sessionId)
      saveSessions(updated)
      return updated
    })
    if (activeSession?.id === sessionId) {
      // Create a new session if we deleted the active one
      if (selectedChatbot) {
        const newSession: ConversationSession = {
          id: generateId(),
          chatbotId: selectedChatbot._id,
          chatbotName: selectedChatbot.name,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        setActiveSession(newSession)
        setSessions((prev) => {
          const updated = [...prev, newSession]
          saveSessions(updated)
          return updated
        })
      }
    }
    toast({
      title: "Chat deleted",
      description: "The conversation has been removed.",
    })
  }

  // Load chatbots
  React.useEffect(() => {
    const loadChatbots = async () => {
      try {
        setIsLoadingChatbots(true)
        const response = await chatbotService.getAllChatbots()
        const activeBots = response.chatbots.filter(
          (bot) => bot.embedding?.isEmbedded && bot.llm?.model
        )
        setChatbots(activeBots)

        // Check for pipelineId in URL params
        const pipelineId = searchParams.get("pipelineId")
        if (pipelineId) {
          const bot = activeBots.find((b) => b._id === pipelineId)
          if (bot) {
            setSelectedChatbot(bot)
          }
        }
      } catch (error) {
        console.error("Failed to load chatbots:", error)
        toast({
          title: "Error loading chatbots",
          description: "Could not fetch your chatbots. Please try again.",
        })
      } finally {
        setIsLoadingChatbots(false)
      }
    }
    void loadChatbots()
  }, [searchParams, toast])

  // Load sessions from localStorage
  React.useEffect(() => {
    const stored = loadSessions()
    setSessions(stored)
  }, [])

  // Update active session when selected chatbot changes
  React.useEffect(() => {
    // Skip if we just manually set a session (e.g., from handleNewChat)
    if (skipSessionEffectRef.current) {
      skipSessionEffectRef.current = false
      return
    }

    if (selectedChatbot) {
      // Find most recent session or create new one
      const existingSessions = sessions.filter((s) => s.chatbotId === selectedChatbot._id)
      if (existingSessions.length > 0) {
        // Get the most recently updated session
        const mostRecent = [...existingSessions].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]
        setActiveSession(mostRecent)
      } else {
        const newSession: ConversationSession = {
          id: generateId(),
          chatbotId: selectedChatbot._id,
          chatbotName: selectedChatbot.name,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        setActiveSession(newSession)
        setSessions((prev) => {
          const updated = [...prev, newSession]
          saveSessions(updated)
          return updated
        })
      }
    } else {
      setActiveSession(null)
    }
  }, [selectedChatbot, sessions])

  // Scroll to bottom on new messages
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activeSession?.messages])

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedChatbot || !activeSession || isLoading) return

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    const loadingMessage: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    }

    // Update session with user message and loading indicator
    const updatedMessages = [...activeSession.messages, userMessage, loadingMessage]
    const updatedSession = {
      ...activeSession,
      messages: updatedMessages,
      updatedAt: new Date(),
    }
    setActiveSession(updatedSession)
    setInput("")
    setIsLoading(true)

    try {
      const data = await playgroundService.chat({
        pipelineId: selectedChatbot._id,
        message: userMessage.content,
        sessionId: activeSession.id,
      })

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: data.answer || "I apologize, but I could not generate a response.",
        timestamp: new Date(),
      }

      // Replace loading message with actual response
      const finalMessages = [
        ...activeSession.messages,
        userMessage,
        assistantMessage,
      ]
      const finalSession = {
        ...activeSession,
        messages: finalMessages,
        updatedAt: new Date(),
      }
      setActiveSession(finalSession)
      skipSessionEffectRef.current = true
      setSessions((prev) => {
        const updated = prev.map((s) =>
          s.id === activeSession.id ? finalSession : s
        )
        saveSessions(updated)
        return updated
      })
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to get a response"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      // Remove loading message on error
      const errorMessages = [...activeSession.messages, userMessage]
      setActiveSession({ ...activeSession, messages: errorMessages })
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSendMessage()
    }
  }

  const handleClearChat = () => {
    if (!activeSession) return
    const clearedSession = {
      ...activeSession,
      messages: [],
      updatedAt: new Date(),
    }
    setActiveSession(clearedSession)
    skipSessionEffectRef.current = true
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === activeSession.id ? clearedSession : s
      )
      saveSessions(updated)
      return updated
    })
    toast({
      title: "Chat cleared",
      description: "Conversation history has been cleared.",
    })
  }

  const handleSelectChatbot = (chatbotId: string) => {
    const bot = chatbots.find((b) => b._id === chatbotId)
    if (bot) {
      setSelectedChatbot(bot)
      router.push(`/dashboard?tab=playground&pipelineId=${chatbotId}`)
    }
  }

  if (isLoadingChatbots) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (chatbots.length === 0) {
    return (
      <Card className="border-dashed py-12 text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 space-mono-regular">
            <Bot className="h-6 w-6" />
            No Active Pipelines
          </CardTitle>
          <CardDescription className="fira-mono-regular">
            You need to create and deploy a pipeline first before using the playground.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/dashboard?tab=train-llm")} className="space-mono-regular">
            Create Your First Pipeline
          </Button>
        </CardContent>
      </Card>
    )
  }

  const handleNewChat = () => {
    if (!selectedChatbot) return

    // Check if there's already an empty session for this chatbot
    const existingEmptySession = sessions.find(
      (s) => s.chatbotId === selectedChatbot._id && s.messages.length === 0
    )

    if (existingEmptySession) {
      // Reuse the existing empty session
      skipSessionEffectRef.current = true
      setActiveSession(existingEmptySession)
      setIsSidebarOpen(false)
      return
    }

    // Create new session only if no empty session exists
    const newSession: ConversationSession = {
      id: generateId(),
      chatbotId: selectedChatbot._id,
      chatbotName: selectedChatbot.name,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    skipSessionEffectRef.current = true
    setActiveSession(newSession)
    setSessions((prev) => {
      const updated = [...prev, newSession]
      saveSessions(updated)
      return updated
    })
    setIsSidebarOpen(false)
    toast({
      title: "New chat started",
      description: "You can now start a fresh conversation.",
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {!selectedChatbot ? (
        <Card className="flex-1 flex items-center justify-center border-dashed m-4">
          <div className="text-center space-y-4 p-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold space-mono-regular">Select a Pipeline</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4 fira-mono-regular">
                Choose a pipeline to start chatting.
              </p>
              <Select value="" onValueChange={handleSelectChatbot}>
                <SelectTrigger className="w-[240px] mx-auto">
                  <SelectValue placeholder="Select a pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {chatbots.map((bot) => (
                    <SelectItem key={bot._id} value={bot._id}>
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-primary" />
                        <span className="space-mono-regular">{bot.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="flex-1 flex overflow-hidden relative border-0 rounded-none sm:border sm:rounded-xl p-0 gap-0">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center border border-border overflow-hidden">
                  <Image
                    src="/krira-augment-logo3.jpeg"
                    alt="Krira"
                    width={28}
                    height={28}
                    className="object-contain rounded-full"
                  />
                </div>
                <Select value={selectedChatbot._id} onValueChange={handleSelectChatbot}>
                  <SelectTrigger className="h-auto w-auto border-0 bg-transparent p-0 hover:bg-transparent focus:ring-0 shadow-none data-[placeholder]:text-foreground [&>svg]:hidden">
                    <div className="text-left">
                      <h3 className="font-semibold flex items-center gap-2 space-mono-regular">
                        {selectedChatbot.name}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-normal fira-mono-regular">
                        <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                          {selectedChatbot.llm?.provider}
                        </Badge>
                        <span>{selectedChatbot.llm?.model}</span>
                      </div>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {chatbots.map((bot) => (
                      <SelectItem key={bot._id} value={bot._id}>
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-primary" />
                          <span>{bot.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 fira-mono-regular">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                  Active
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                >
                  {isSidebarOpen ? (
                    <PanelRightClose className="h-4 w-4" />
                  ) : (
                    <PanelRightOpen className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Messages area */}
            <div
              ref={scrollRef}
              data-lenis-prevent
              className="flex-1 overflow-y-auto p-4 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-muted/50 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50"
            >
              {activeSession?.messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-4 max-w-md">
                    <div className="mx-auto w-20 h-20 rounded-full bg-white dark:bg-zinc-800 border border-border flex items-center justify-center overflow-hidden">
                      <Image
                        src="/krira-augment-logo3.jpeg"
                        alt="Krira"
                        width={48}
                        height={48}
                        className="object-contain rounded-full"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold space-mono-regular">Start a Conversation</h3>
                      <p className="text-sm text-muted-foreground mt-2 fira-mono-regular">
                        Ask anything about the knowledge base that powers{" "}
                        <span className="font-medium text-foreground">
                          {selectedChatbot.name}
                        </span>
                        .
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 pt-2">
                      {["What can you help me with?", "Tell me about your features"].map(
                        (suggestion) => (
                          <Button
                            key={suggestion}
                            variant="outline"
                            size="sm"
                            className="text-xs fira-mono-regular"
                            onClick={() => {
                              setInput(suggestion)
                              inputRef.current?.focus()
                            }}
                          >
                            {suggestion}
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSession?.messages.map((message) => (
                    <ChatMessageItem key={message.id} message={message} />
                  ))}
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="border-t p-4 bg-background">
              <div className="flex gap-3">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="min-h-[52px] max-h-32 resize-none fira-mono-regular"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => void handleSendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="h-auto px-4"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center fira-mono-regular">
                Responses are generated using your configured RAG pipeline
              </p>
            </div>
          </div>

          {/* Right Sidebar for History */}
          <div
            className={cn(
              "absolute right-0 top-0 h-full bg-background border-l flex flex-col transition-all duration-300 ease-in-out z-10",
              isSidebarOpen ? "w-72 opacity-100" : "w-0 opacity-0 overflow-hidden"
            )}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <h4 className="font-semibold text-sm space-mono-regular">Chat History</h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* New Chat Button */}
            <div className="p-3 border-b">
              <Button
                onClick={handleNewChat}
                className="w-full gap-2 space-mono-regular"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {chatbotSessions.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No chat history yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Start a conversation to see it here
                  </p>
                </div>
              ) : (
                chatbotSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session)}
                    className={cn(
                      "group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                      activeSession?.id === session.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate space-mono-regular">
                        {getSessionTitle(session)}
                      </p>
                      <p className="text-xs text-muted-foreground fira-mono-regular">
                        {session.messages.length} messages
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={(e) => handleDeleteSession(session.id, e)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

type ChatMessageItemProps = {
  message: ChatMessage
}

function ChatMessageItem({ message }: ChatMessageItemProps) {
  const isUser = message.role === "user"

  if (message.isLoading) {
    return (
      <div className="flex gap-3 items-start">
        <div className="h-8 w-8 shrink-0 rounded-full bg-white dark:bg-zinc-800 border border-border flex items-center justify-center overflow-hidden">
          <Image
            src="/krira-augment-logo3.jpeg"
            alt="Krira"
            width={20}
            height={20}
            className="object-contain rounded-full"
          />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium space-mono-regular">Assistant</span>
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
            <span
              className="w-2 h-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: "0.1s" }}
            />
            <span
              className="w-2 h-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex gap-3 items-start", isUser && "flex-row-reverse")}>
      {isUser ? (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-muted text-muted-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="h-8 w-8 shrink-0 rounded-full bg-white dark:bg-zinc-800 border border-border flex items-center justify-center overflow-hidden">
          <Image
            src="/krira-augment-logo3.jpeg"
            alt="Krira"
            width={20}
            height={20}
            className="object-contain rounded-full"
          />
        </div>
      )}
      <div
        className={cn(
          "flex-1 space-y-1.5 max-w-[85%]",
          isUser && "flex flex-col items-end"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium space-mono-regular">
            {isUser ? "You" : "Assistant"}
          </span>
          <span className="text-xs text-muted-foreground fira-mono-regular">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div
          className={cn(
            "rounded-xl px-4 py-2.5 text-sm",
            isUser
              ? "bg-primary text-primary-foreground ml-auto"
              : "bg-muted prose prose-sm dark:prose-invert max-w-none"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3">
                    <table className="w-full border-collapse border border-border rounded-lg">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-muted/50">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="border border-border px-3 py-2 text-left font-semibold text-sm">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-border px-3 py-2 text-sm">
                    {children}
                  </td>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>
                ),
                li: ({ children }) => <li className="text-sm">{children}</li>,
                p: ({ children }) => <p className="my-1.5 leading-relaxed">{children}</p>,
                h1: ({ children }) => (
                  <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-bold mt-3 mb-1.5">{children}</h3>
                ),
                code: ({ className, children, ...props }) => {
                  const isInline = !className
                  return isInline ? (
                    <code className="bg-muted-foreground/10 px-1.5 py-0.5 rounded text-xs font-mono">
                      {children}
                    </code>
                  ) : (
                    <code
                      className={cn(
                        "block bg-slate-900 dark:bg-slate-800 text-slate-50 p-3 rounded-lg overflow-x-auto text-xs font-mono my-2",
                        className
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
                pre: ({ children }) => (
                  <pre className="bg-transparent p-0 m-0">{children}</pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary/50 pl-4 italic my-2 text-muted-foreground">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  )
}
