"use client"

import * as React from "react"
import { Send, X, MessageSquare, Loader2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export type KriraChatbotProps = {
  apiKey: string
  botId: string
  theme?: "pro" | "light" | "dark"
  position?: "bottom-right" | "bottom-left" | "inline"
  welcomeMessage?: string
  placeholder?: string
  className?: string
}

const THEME_STYLES = {
  pro: {
    container: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
    header: "bg-gradient-to-r from-blue-600 to-purple-600 text-white",
    userBubble: "bg-blue-600 text-white",
    assistantBubble: "bg-slate-700 text-slate-100",
    input: "bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-400",
    button: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  light: {
    container: "bg-white",
    header: "bg-blue-500 text-white",
    userBubble: "bg-blue-500 text-white",
    assistantBubble: "bg-slate-100 text-slate-900",
    input: "bg-white border-slate-300",
    button: "bg-blue-500 hover:bg-blue-600 text-white",
  },
  dark: {
    container: "bg-slate-950",
    header: "bg-slate-800 text-slate-100",
    userBubble: "bg-slate-700 text-slate-100",
    assistantBubble: "bg-slate-800 text-slate-200",
    input: "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500",
    button: "bg-slate-700 hover:bg-slate-600 text-slate-100",
  },
}

export function KriraChatbot({
  apiKey,
  botId,
  theme = "pro",
  position = "bottom-right",
  welcomeMessage = "Hi! I'm your Krira AI assistant. How can I help you today?",
  placeholder = "Type your message...",
  className,
}: KriraChatbotProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [inputValue, setInputValue] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const styles = THEME_STYLES[theme]

  // Add welcome message on mount
  React.useEffect(() => {
    if (messages.length === 0 && welcomeMessage) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: welcomeMessage,
          timestamp: new Date(),
        },
      ])
    }
  }, [welcomeMessage, messages.length])

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const sendMessage = React.useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInputValue("")
      setIsLoading(true)

      try {
        const response = await fetch(`https://api.krira.ai/v1/chatbots/${botId}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: content.trim() }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.detail || errorData.message || `API error: ${response.status}`
          )
        }

        const data = await response.json()
        const answer = data.answer || data.response || data.message || "I'm sorry, I couldn't generate a response."

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: answer,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch (error) {
        console.error("Krira AI error:", error)
        
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: error instanceof Error 
            ? `Sorry, I encountered an error: ${error.message}` 
            : "Sorry, I encountered an unexpected error. Please try again.",
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    },
    [apiKey, botId, isLoading]
  )

  const handleSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      void sendMessage(inputValue)
    },
    [inputValue, sendMessage]
  )

  const handleKeyPress = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        void sendMessage(inputValue)
      }
    },
    [inputValue, sendMessage]
  )

  // Position classes for floating widget
  const positionClasses = {
    "bottom-right": "fixed bottom-4 right-4 z-50",
    "bottom-left": "fixed bottom-4 left-4 z-50",
    "inline": "",
  }

  if (position !== "inline") {
    return (
      <div className={positionClasses[position]}>
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            className={cn(
              "h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-110",
              styles.button
            )}
            size="icon"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        )}

        {isOpen && (
          <Card
            className={cn(
              "w-[380px] h-[600px] shadow-2xl border-2 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300",
              styles.container,
              className
            )}
          >
            <CardHeader className={cn("flex flex-row items-center justify-between p-4", styles.header)}>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Krira AI</h3>
                  <p className="text-xs opacity-80">Always here to help</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-white hover:bg-white/20"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full px-4 py-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-4 py-2 text-sm break-words",
                          message.role === "user" ? styles.userBubble : styles.assistantBubble
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className={cn("rounded-lg px-4 py-2", styles.assistantBubble)}>
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>

            <CardFooter className="p-4 border-t">
              <form onSubmit={handleSubmit} className="flex w-full gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={placeholder}
                  disabled={isLoading}
                  className={cn("flex-1", styles.input)}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim() || isLoading}
                  className={styles.button}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </CardFooter>
          </Card>
        )}
      </div>
    )
  }

  // Inline version
  return (
    <Card
      className={cn(
        "w-full max-w-2xl mx-auto h-[600px] shadow-xl flex flex-col",
        styles.container,
        className
      )}
    >
      <CardHeader className={cn("flex flex-row items-center gap-2 p-4", styles.header)}>
        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
          <MessageSquare className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-semibold">Krira AI</h3>
          <p className="text-xs opacity-80">Always here to help</p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full px-4 py-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2 text-sm break-words",
                    message.role === "user" ? styles.userBubble : styles.assistantBubble
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className={cn("rounded-lg px-4 py-2", styles.assistantBubble)}>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading}
            className={cn("flex-1", styles.input)}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || isLoading}
            className={styles.button}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
