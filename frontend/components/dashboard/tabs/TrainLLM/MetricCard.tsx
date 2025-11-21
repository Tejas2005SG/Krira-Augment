import * as React from "react"
import { InfoIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type MetricCardProps = {
  title: string
  value: number | null
  justification?: string
}

export function MetricCard({ title, value, justification }: MetricCardProps) {
  const hasValue = typeof value === "number"
  const normalized = hasValue ? Math.min(Math.max(value, 0), 100) : 0
  const displayValue = hasValue ? `${value.toFixed(1)}%` : "—"

  // Standard colors for each metric type - not based on score
  const colorMap: Record<string, { bg: string; border: string; text: string; accent: string; progress: string }> = {
    "Accuracy": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", accent: "bg-blue-100", progress: "bg-blue-500" },
    "Evaluation Score": { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", accent: "bg-purple-100", progress: "bg-purple-500" },
    "Semantic Accuracy": { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", accent: "bg-emerald-100", progress: "bg-emerald-500" },
    "Faithfulness": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", accent: "bg-amber-100", progress: "bg-amber-500" },
    "Answer Relevancy": { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", accent: "bg-rose-100", progress: "bg-rose-500" },
    "Content Precision": { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700", accent: "bg-cyan-100", progress: "bg-cyan-500" },
    "Context Recall": { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", accent: "bg-indigo-100", progress: "bg-indigo-500" },
  }

  const colors = colorMap[title] || { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", accent: "bg-slate-100", progress: "bg-slate-500" }

  return (
    <Card className={cn("border-2 transition-all duration-300 hover:shadow-lg", colors.bg, colors.border)}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">{title}</CardTitle>
          {justification ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-3.5 w-3.5 text-muted-foreground/70 transition-colors hover:text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs leading-relaxed">{justification}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        <CardDescription className={cn("text-3xl font-bold mt-2", colors.text)}>{displayValue}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/50 border border-white/80">
          <div
            className={cn("h-full rounded-full transition-all duration-500", colors.progress)}
            style={{ width: `${normalized}%` }}
          />
        </div>
        {justification ? (
          <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground/80">
            {justification.split('\n').filter(line => line.trim()).map((line, idx) => (
              <li key={idx}>{line.trim()}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground/80">
            Run an evaluation to generate this score.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
