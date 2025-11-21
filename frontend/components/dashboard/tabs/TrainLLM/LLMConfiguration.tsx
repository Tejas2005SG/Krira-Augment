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
