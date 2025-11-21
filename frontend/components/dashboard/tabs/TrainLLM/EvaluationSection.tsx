import * as React from "react"
import { Loader2, FileText, UploadCloud, Trash2, AlertCircle } from "lucide-react"
import { useDropzone } from "react-dropzone"

import { cn } from "@/lib/utils"
import { formatFileSize } from "./utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { EvaluationMetrics, EvaluationRow, MetricJustifications } from "./types"
import { MetricCard } from "./MetricCard"

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

export function EvaluationSection({
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
