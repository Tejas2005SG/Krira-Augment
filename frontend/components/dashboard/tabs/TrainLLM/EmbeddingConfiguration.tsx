import * as React from "react"
import Image from "next/image"
import { Loader2, BrainCircuit } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { EmbeddingModelId, VectorStoreOption, EmbeddingRunSummary } from "./types"
import { EMBEDDING_MODELS } from "./constants"

type EmbeddingConfigurationProps = {
  selectedModel: EmbeddingModelId
  onSelectModel: (id: EmbeddingModelId) => void
  selectedDimension: number
  onSelectDimension: (dimension: number) => void
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
  allowedModels: string[]
  allowedVectorStores: string[]
  isPaidPlan: boolean
}

export function EmbeddingConfiguration({
  selectedModel,
  onSelectModel,
  vectorStore,
  onVectorStoreChange,
  selectedDimension,
  onSelectDimension,
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
  allowedModels,
  allowedVectorStores,
  isPaidPlan,
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
        <CardTitle className="space-mono-regular">Select Embedding Model</CardTitle>
        <CardDescription className="fira-mono-regular">Choose embeddings and configure the vector store.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={selectedModel}
          onValueChange={(value) => onSelectModel(value as EmbeddingModelId)}
          className="grid gap-4 lg:grid-cols-3"
        >
          {EMBEDDING_MODELS.map((model) => {
            const disabled = !allowedModels.includes(model.id)
            return (
              <Label
                key={model.id}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border p-4 transition",
                  selectedModel === model.id ? "border-foreground bg-secondary/50" : "hover:border-foreground/50",
                  disabled && "cursor-not-allowed opacity-60"
                )}
                aria-disabled={disabled}
              >
                <RadioGroupItem value={model.id} className="sr-only" />
                <div className="flex items-start gap-3">
                  <Image
                    src={model.icon}
                    alt={`${model.name} logo`}
                    width={40}
                    height={40}
                    className={cn(
                      "h-10 w-10 object-contain",
                      model.id.includes('pinecone') && "bg-white p-1 rounded-lg"
                    )}
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold space-mono-regular">{model.name}</span>
                      {!isPaidPlan && (
                        <Badge className={model.badge === "Free" ? "border border-yellow-200 bg-yellow-100 text-yellow-700 fira-mono-regular" : "border border-purple-200 bg-purple-100 text-purple-700 fira-mono-regular"}>{model.badge}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground fira-mono-regular">{model.description}</p>
                    {disabled && (
                      <p className="text-xs font-medium text-rose-500 fira-mono-regular">Upgrade to unlock this embedding model.</p>
                    )}
                  </div>
                  {selectedModel === model.id && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs fira-mono-regular">
                  <span>
                    Dimensions:
                    {Array.isArray(model.dimensionOptions)
                      ? ` ${model.dimensionOptions.join(" / ")}`
                      : " Unknown"}
                  </span>

                </div>
              </Label>
            )
          })}
        </RadioGroup>

        {Array.isArray(currentModel.dimensionOptions) && currentModel.dimensionOptions.length > 1 && (
          <div className="space-y-2">
            <Label className="space-mono-regular">Embedding dimension</Label>
            <Select
              value={String(selectedDimension)}
              onValueChange={(value) => onSelectDimension(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select dimension" />
              </SelectTrigger>
              <SelectContent>
                {currentModel.dimensionOptions.map((dimension) => (
                  <SelectItem key={dimension} value={String(dimension)}>
                    {dimension} dimensions
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}



        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg space-mono-regular">Vector Store Setup</CardTitle>
            <CardDescription className="fira-mono-regular">Connect your managed vector store or use Krira default.</CardDescription>
            {!isPaidPlan && (
              <p className="text-xs font-medium text-amber-600 fira-mono-regular">
                Upgrade to unlock Pinecone and additional managed vector databases.
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={vectorStore}
              onValueChange={(value) => onVectorStoreChange(value as VectorStoreOption)}
              className="grid gap-3 sm:grid-cols-2"
            >
              {vectorOptions.map((option) => {
                const disabled = !allowedVectorStores.includes(option.value)
                return (
                  <Label
                    key={option.value}
                    className={cn(
                      "flex flex-col gap-3 rounded-lg border p-4",
                      vectorStore === option.value ? "border-foreground bg-secondary/50" : "border-dashed",
                      disabled && "cursor-not-allowed opacity-60"
                    )}
                    aria-disabled={disabled}
                  >
                    <RadioGroupItem value={option.value} className="sr-only" />
                    <div className="flex items-start gap-3">
                      <Image
                        src={option.icon}
                        alt={`${option.label} logo`}
                        width={56}
                        height={56}
                        className={cn(
                          "h-14 w-14 object-contain",
                          option.value === 'pinecone' && "bg-white p-2 rounded-xl"
                        )}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold space-mono-regular">{option.label}</span>
                          {!isPaidPlan && (
                            <Badge className={option.badge === "Free" ? "border border-yellow-200 bg-yellow-100 text-yellow-700 fira-mono-regular" : "border border-purple-200 bg-purple-100 text-purple-700 fira-mono-regular"}>{option.badge}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground fira-mono-regular">{option.description}</p>
                        {disabled && (
                          <p className="text-xs font-medium text-rose-500 fira-mono-regular">Available on paid plans.</p>
                        )}
                      </div>
                      {vectorStore === option.value && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Label>
                )
              })}
            </RadioGroup>

            {vectorStore === "pinecone" ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="space-mono-regular">Pinecone API Key</Label>
                    <Input
                      type="password"
                      value={pineconeKey}
                      onChange={(event) => setPineconeKey(event.target.value)}
                      placeholder="pc-xxxxxxxx"
                      className="fira-mono-regular"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="space-mono-regular">Index Name</Label>
                    <Input value={indexName} onChange={(event) => setIndexName(event.target.value)} className="fira-mono-regular" />
                  </div>
                </div>
              </div>
            ) : (
              <Alert className="border-primary/30 bg-primary/5">
                <AlertTitle className="space-mono-regular">Chroma selected</AlertTitle>
                <AlertDescription className="fira-mono-regular">
                  We'll persist embeddings locally using a managed Chroma instance – no credentials required.
                </AlertDescription>
              </Alert>
            )}


          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button onClick={onStartEmbedding} disabled={isEmbedding} className="gap-2 space-mono-regular">
            {isEmbedding ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
            {isEmbedding ? "Embedding in progress" : "Start embedding"}
          </Button>
          {isEmbedding && <Progress value={embeddingProgress} />}

          {embeddingSummary && (
            <div className="space-y-3 rounded-lg border border-muted-foreground/20 bg-muted/30 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold space-mono-regular">Latest embedding run</span>
                <Badge className="text-xs border border-emerald-200 bg-emerald-50 text-emerald-700 fira-mono-regular">
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
                      <span className="font-semibold text-emerald-800 space-mono-regular">{result.label}</span>
                      <Badge className="border border-emerald-200 bg-emerald-100 text-emerald-700 fira-mono-regular">
                        {result.chunks_embedded} / {result.chunks_processed} chunks
                      </Badge>
                    </div>
                    <p className="mt-1 text-emerald-600 fira-mono-regular">
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
