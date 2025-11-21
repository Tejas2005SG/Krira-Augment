import * as React from "react"
import {
  FileText,
  FileJson,
  Globe,
  UploadCloud,
  Trash2,
  Plus,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useDropzone } from "react-dropzone"

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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { DatasetType, FileDatasetType, FileUploadEntry } from "./types"
import { formatFileSize } from "./utils"

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

export function DatasetUploader({
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
