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

import { EmbeddingModelId, VectorStoreOption, EmbeddingRunSummary } from "./types"
import { EMBEDDING_MODELS } from "./constants"

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

export function EmbeddingConfiguration({
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
