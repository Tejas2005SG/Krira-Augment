import * as React from "react"
import ReactMarkdown from "react-markdown"
import type { Components as MarkdownComponents } from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

type AiResponsePanelProps = {
  content: string
}

const markdownComponents: MarkdownComponents = {
  h1: ({ ...props }) => (
    <h2 className="text-xl font-semibold text-foreground" {...props} />
  ),
  h2: ({ ...props }) => (
    <h3 className="text-lg font-semibold text-foreground" {...props} />
  ),
  h3: ({ ...props }) => (
    <h4 className="text-base font-semibold text-foreground" {...props} />
  ),
  p: ({ ...props }) => (
    <p className="text-sm leading-relaxed text-muted-foreground" {...props} />
  ),
  ul: ({ ...props }) => (
    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground" {...props} />
  ),
  ol: ({ ...props }) => (
    <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground" {...props} />
  ),
  li: ({ ...props }) => (
    <li className="leading-relaxed" {...props} />
  ),
  strong: ({ ...props }) => <strong className="font-semibold text-foreground" {...props} />,
  table: ({ ...props }) => {
    const { className, ...rest } = props as React.ComponentPropsWithoutRef<"table">
    return (
      <div className="w-full overflow-auto rounded-lg border border-border/40">
        <table
          {...rest}
          className={cn(
            "w-full min-w-[640px] border-collapse text-xs text-foreground",
            "[&>thead>tr>th]:bg-muted/70 [&>thead>tr>th]:text-left [&>thead>tr>th]:font-semibold",
            "[&>thead>tr>th]:border [&>thead>tr>th]:px-3 [&>thead>tr>th]:py-2",
            "[&>tbody>tr>td]:border [&>tbody>tr>td]:px-3 [&>tbody>tr>td]:py-2",
            "[&>tbody>tr:nth-child(even)]:bg-muted/40",
            className ?? ""
          )}
        />
      </div>
    )
  },
  code: ({ inline, className, children, ...props }) => {
    if (inline) {
      return (
        <code className={cn("rounded bg-muted px-1 py-0.5 font-mono text-[12px]", className)} {...props}>
          {children}
        </code>
      )
    }
    // For block code, render without wrapping in a component that might add <p>
    return (
      <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs text-foreground my-2">
        <code {...props} className={cn("font-mono", className)}>
          {children}
        </code>
      </pre>
    )
  },
}

export function AiResponsePanel({ content }: AiResponsePanelProps) {
  const trimmedContent = content?.trim()
  if (!trimmedContent) {
    return <p className="text-sm text-muted-foreground">No response available.</p>
  }

  return (
    <div className="prose prose-sm max-w-none pr-1 text-sm leading-relaxed [&>p]:my-2 [&>pre]:my-2 [&>h1]:mt-3 [&>h2]:mt-2 [&>h3]:mt-2">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {trimmedContent}
      </ReactMarkdown>
    </div>
  )
}
