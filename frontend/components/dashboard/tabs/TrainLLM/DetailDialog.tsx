import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

import { EvaluationRow } from "./types"

type DetailDialogProps = {
  result: EvaluationRow | null
  onOpenChange: (open: boolean) => void
}

export function DetailDialog({ result, onOpenChange }: DetailDialogProps) {
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
