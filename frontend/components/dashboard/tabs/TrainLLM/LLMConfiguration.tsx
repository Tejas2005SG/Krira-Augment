import * as React from "react"
import Image from "next/image"
import { Loader2, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

import { AiResponsePanel } from "./AiResponsePanel"
import { LLMProviderId, LLMModelOption, RetrievedContextEntry, LLMTestResponsePayload } from "./types"
import { LLM_PROVIDERS, DEFAULT_FRONTEND_MODELS, MAX_CONTEXT_PREVIEW } from "./constants"

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
  allowedProviders: string[]
  isPaidPlan: boolean
}

export function LLMConfiguration({
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
  allowedProviders,
  isPaidPlan,
}: LLMConfigurationProps) {
  const activeProvider = LLM_PROVIDERS.find((item) => item.value === provider) ?? LLM_PROVIDERS[0]
  const handleProviderChange = (value: string) => {
    if (!allowedProviders.includes(value)) return
    onProviderChange(value)
  }

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
        <CardTitle className="space-mono-regular">Choose LLM Provider</CardTitle>
        <CardDescription className="fira-mono-regular">Connect your large language model and configure prompts.</CardDescription>
        {!isPaidPlan && (
          <div className="text-xs font-medium text-rose-500 fira-mono-regular">
            Upgrade to unlock Anthropic, Perplexity, xAI, and additional managed providers.
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={provider}
          onValueChange={handleProviderChange}
          className="grid grid-cols-7 gap-2"
        >
          {LLM_PROVIDERS.map((option) => {
            const disabled = !allowedProviders.includes(option.value)
            const providerBadge = isPaidPlan ? null : getProviderBadge(option.value)
            return (
              <Label
                key={option.value}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-2xl border px-2 py-2 text-center transition",
                  provider === option.value ? "border-foreground bg-secondary/50" : "hover:border-foreground/50",
                  disabled && "cursor-not-allowed opacity-60"
                )}
                aria-disabled={disabled}
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

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted overflow-hidden">
                  <Image
                    src={option.logo}
                    alt={`${option.label} logo`}
                    width={28}
                    height={28}
                    className={cn(
                      "h-7 w-7 object-contain",
                      option.value === 'glm' && "bg-white p-0.5"
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold leading-tight space-mono-regular">{option.label}</p>
                  {disabled && (
                    <p className="text-[10px] font-medium text-rose-500 fira-mono-regular">Upgrade plan to unlock</p>
                  )}

                </div>
              </Label>
            )
          })}
        </RadioGroup>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base space-mono-regular">Select a {activeProvider.label} model</CardTitle>
              <CardDescription className="fira-mono-regular">Choose the AI model that will power your assistant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        {!isPaidPlan && item.badge === "Paid" && (
                          <span className="ml-2 rounded-full border border-purple-200 bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                            Paid
                          </span>
                        )}
                        {!isPaidPlan && item.badge === "Free" && (
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
                  {isPaidPlan
                    ? `No models available for ${activeProvider.label}. Configure them in the backend environment.`
                    : `No free models available for ${activeProvider.label}. Upgrade to unlock premium models like GPT-5 and Gemini Pro.`}
                </p>
              )}
              {modelError && <p className="text-xs text-destructive">{modelError}</p>}

              {/* Selected model info */}
              {model && !isModelLoading && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Image
                      src={activeProvider.logo}
                      alt={`${activeProvider.label} logo`}
                      width={20}
                      height={20}
                      className={cn(
                        "h-5 w-5 object-contain",
                        activeProvider.value === 'glm' && "bg-white p-0.5 rounded-sm"
                      )}
                    />
                    <span className="text-sm font-medium">{models.find(m => m.id === model)?.label || model}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This model will be used to generate responses based on your knowledge base and system prompt.
                  </p>
                </div>
              )}

              {/* Available models count */}
              {!isModelLoading && models.length > 0 && (
                <p className="text-xs text-muted-foreground fira-mono-regular">
                  {models.length} model{models.length !== 1 ? 's' : ''} available from {activeProvider.label}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base space-mono-regular">Chunks to Retrieve (Top K)</CardTitle>
              <CardDescription className="fira-mono-regular">How many relevant chunks to fetch from your dataset (1-100)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="chunks-to-retrieve" className="space-mono-regular">Top K</Label>
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
              </div>

              {/* Recommendation hints */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground space-mono-regular">Recommended values:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setChunksToRetrieve(10)}
                    className={cn(
                      "rounded-md border px-2 py-1.5 text-xs transition-colors",
                      chunksToRetrieve === 10
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    10 - Fast
                  </button>
                  <button
                    type="button"
                    onClick={() => setChunksToRetrieve(30)}
                    className={cn(
                      "rounded-md border px-2 py-1.5 text-xs transition-colors",
                      chunksToRetrieve === 30
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    30 - Balanced
                  </button>
                  <button
                    type="button"
                    onClick={() => setChunksToRetrieve(50)}
                    className={cn(
                      "rounded-md border px-2 py-1.5 text-xs transition-colors",
                      chunksToRetrieve === 50
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    50 - Deep
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Higher values provide more context but may add noise.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base space-mono-regular">System Prompt</CardTitle>
            <CardDescription className="fira-mono-regular">Define how your assistant should behave.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3">
              {promptHistory.length > 0 && (
                <Select value={selectedPromptHistory} onValueChange={onPromptHistoryChange}>
                  <SelectTrigger className="w-full sm:w-60">
                    <SelectValue placeholder="Load saved prompt" />
                  </SelectTrigger>
                  <SelectContent className="max-w-[400px]">
                    {promptHistory.map((prompt) => (
                      <SelectItem
                        key={prompt}
                        value={prompt}
                        className="cursor-pointer"
                        title={prompt}
                      >
                        <span className="block truncate max-w-[350px]">
                          {prompt.length > 50 ? `${prompt.slice(0, 50)}...` : prompt}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button onClick={onPromptSave} className="gap-2">
                <Sparkles className="h-4 w-4" /> Save prompt
              </Button>
            </div>
            <Textarea
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
              rows={6}
              className="fira-mono-regular"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground fira-mono-regular">
              <span>Characters: {systemPrompt.length}</span>
              <span>Supports Markdown formatting</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base space-mono-regular">Test your model</CardTitle>
            <CardDescription className="fira-mono-regular">Ask a question and inspect the response.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={testQuestion}
                onChange={(event) => setTestQuestion(event.target.value)}
                placeholder="Ask a question about your knowledge base"
                disabled={isTesting}
                className="fira-mono-regular"
              />
              <Button
                onClick={onAskQuestion}
                disabled={isTesting || !model || !testQuestion.trim()}
                className="min-w-[140px] gap-2 space-mono-regular"
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
                    <CardTitle className="text-sm space-mono-regular">Retrieved Context Summary</CardTitle>
                    <CardDescription className="fira-mono-regular">
                      {testContext.length > 0 ? (
                        <>
                          Scanned {scannedChunks} chunk{scannedChunks === 1 ? "" : "s"} • Found {relevantChunksFound} relevant • Showing top {displayedChunks.length}
                        </>
                      ) : (
                        "No relevant chunks found"
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs text-muted-foreground max-h-[460px] overflow-auto pr-2" data-lenis-prevent>
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
                      <CardTitle className="text-sm space-mono-regular">AI Response</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 max-h-[460px] overflow-auto pr-2" data-lenis-prevent>
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
