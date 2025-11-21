import * as React from "react"
import { Bot } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { coy as syntaxTheme } from "react-syntax-highlighter/dist/esm/styles/prism"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

import { CODE_SNIPPETS } from "./constants"

type DeploymentOptionsProps = {
  deploymentTab: string
  onDeploymentTabChange: (tab: string) => void
  codeSnippets: typeof CODE_SNIPPETS
  setOpenDeleteDialog: (open: boolean) => void
}

export function DeploymentOptions({ deploymentTab, onDeploymentTabChange, codeSnippets, setOpenDeleteDialog }: DeploymentOptionsProps) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base">Deployment Options</CardTitle>
        <CardDescription>Embed via npm package or call the API directly.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={deploymentTab} onValueChange={onDeploymentTabChange}>
          <TabsList>
            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="curl">cURL</TabsTrigger>
          </TabsList>
          {Object.entries(codeSnippets).map(([key, snippet]) => (
            <TabsContent key={key} value={key}>
              <div className="relative rounded-md border bg-slate-950/90">
                <Button variant="ghost" size="sm" className="absolute right-2 top-2 text-white/80">
                  Copy
                </Button>
                <SyntaxHighlighter
                  language={snippet.language}
                  style={syntaxTheme}
                  customStyle={{ background: "transparent", padding: "1rem", margin: 0, fontSize: "0.85rem" }}
                >
                  {snippet.code}
                </SyntaxHighlighter>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <div className="flex flex-wrap gap-3">
          <Button className="gap-2">
            <Bot className="h-4 w-4" /> Deploy chatbot
          </Button>
          <Button variant="outline">Save as draft</Button>
          <Button variant="ghost" onClick={() => setOpenDeleteDialog(true)}>
            Back to edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
