"use client"

import * as React from "react"
import { Copy, Loader2, Plus, ShieldAlert, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { apiKeysService, ApiKeyRecord, CreateApiKeyPayload } from "@/lib/api/api-keys.service"
import { chatbotService, Chatbot } from "@/lib/api/chatbot.service"
import { ApiError } from "@/lib/api/client"
import { useToast } from "@/components/ui/use-toast"

const PUBLIC_API_URL = process.env.NEXT_PUBLIC_PUBLIC_API_URL ?? "https://rag-python-backend.onrender.com/v1"

const EXPIRATIONS = [
  { label: "Never", value: "never" },
  { label: "30 days", value: "30" },
  { label: "90 days", value: "90" },
  { label: "1 year", value: "365" },
]

const PERMISSIONS = [
  { id: "chat", label: "Chat access", description: "Allow querying chatbots" },
  { id: "manage", label: "Admin actions", description: "Manage bots and keys" },
]

const formatDate = (value?: string) => {
  if (!value) return "—"
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value))
  } catch {
    return value
  }
}

const formatRelative = (value?: string) => {
  if (!value) return "Never"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const diff = Date.now() - date.getTime()
  if (diff < 60_000) return "Just now"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} minutes ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hours ago`
  return `${Math.floor(diff / 86_400_000)} days ago`
}

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeSnippet = ({ label, code, language }: { label: string; code: string; language: string }) => {
  const handleCopy = React.useCallback(async () => {
    await navigator.clipboard.writeText(code)
  }, [code])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium space-mono-regular">{label}</p>
        <Button variant="ghost" size="sm" className="gap-2 space-mono-regular" onClick={handleCopy}>
          <Copy className="h-4 w-4" /> Copy
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{ margin: 0, borderRadius: '0.5rem', fontSize: '0.875rem' }}
          wrapLongLines={true}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

export function ApiKeysTab() {
  const { toast } = useToast()
  const [keys, setKeys] = React.useState<ApiKeyRecord[]>([])
  const [chatbots, setChatbots] = React.useState<Chatbot[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [keyName, setKeyName] = React.useState("")
  const [selectedPipeline, setSelectedPipeline] = React.useState("")
  const [expiration, setExpiration] = React.useState("never")
  const [rateLimit, setRateLimit] = React.useState("60")
  const [permissions, setPermissions] = React.useState<string[]>(["chat"])
  const [generatedKey, setGeneratedKey] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [revokingId, setRevokingId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const load = async () => {
      try {
        const [keysResponse, chatbotResponse] = await Promise.all([
          apiKeysService.list(),
          chatbotService.getAllChatbots(),
        ])
        setKeys(keysResponse.keys)
        setChatbots(chatbotResponse.chatbots)
        setSelectedPipeline((current) => current || chatbotResponse.chatbots[0]?._id || "")
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Failed to load API keys"
        toast({ title: "Could not load keys", description: message, variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [toast])

  const handlePermissionToggle = (value: string) => {
    setPermissions((prev) =>
      prev.includes(value) ? prev.filter((permission) => permission !== value) : [...prev, value]
    )
  }

  const handleKeyCreation = async () => {
    if (!keyName || !selectedPipeline) return

    // Check if key name already exists (case-insensitive)
    const isDuplicate = keys.some(
      (k) => k.name.toLowerCase() === keyName.trim().toLowerCase()
    )

    if (isDuplicate) {
      toast({
        title: "API key already exists",
        description: `A key named "${keyName}" already exists. Please use a unique name.`,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const payload: CreateApiKeyPayload = {
        name: keyName,
        pipelineId: selectedPipeline,
        permissions,
        rateLimitPerMinute: Number(rateLimit) || 60,
      }
      if (expiration !== "never") {
        payload.expiresInDays = Number(expiration)
      }

      const response = await apiKeysService.create(payload)
      setKeys((prev) => [response.apiKey, ...prev])

      // Auto-copy to clipboard
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(response.key)
      }

      toast({
        title: "API key created & copied!",
        description: "The secret key has been copied to your clipboard. Store it securely as it won't be shown again."
      })

      resetDialog()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to create API key"
      toast({ title: "Could not create key", description: message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRevoke = async (id: string) => {
    setRevokingId(id)
    try {
      await apiKeysService.revoke(id)
      setKeys((prev) => prev.map((key) => (key.id === id ? { ...key, status: "revoked" } : key)))
      toast({ title: "API key revoked" })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to revoke API key"
      toast({ title: "Could not revoke key", description: message, variant: "destructive" })
    } finally {
      setRevokingId(null)
    }
  }

  const resetDialog = () => {
    setDialogOpen(false)
    setKeyName("")
    setGeneratedKey(null)
    setPermissions(["chat"])
    setExpiration("never")
    setRateLimit("60")
  }

  const fallbackPipelineName =
    chatbots.find((bot) => bot._id === selectedPipeline)?.name ||
    keys[0]?.pipeline?.name ||
    "your-pipeline-name"
  const snippetKey = generatedKey ?? "sk-live-your-key"
  const snippetPipelineIdentifier = fallbackPipelineName.replace(/"/g, '\\"')
  const curlSnippet = `curl -X POST ${PUBLIC_API_URL}/chat \\
  -H "Authorization: Bearer ${snippetKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"pipeline_name": "${snippetPipelineIdentifier}", "query": "What is the status of my order?"}'`

  const pythonSnippet = `from krira_augment import KriraAugment\n\nclient = KriraAugment(api_key="${snippetKey}", pipeline_name="${snippetPipelineIdentifier}")\nresponse = client.ask("What can you help me with?")\nprint(response.answer)`

  return (
    <div className="space-y-6 overflow-x-hidden">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold space-mono-regular">API Key Management</h2>
          <p className="text-sm text-muted-foreground fira-mono-regular">Generate, rotate, and revoke API keys used by your integrations.</p>
        </div>
        <Button className="gap-2 space-mono-regular" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Generate new API key
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="space-mono-regular">Active keys</CardTitle>
          <CardDescription className="fira-mono-regular">Rotate keys regularly and delete unused credentials.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading keys…
            </div>
          ) : keys.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">No API keys yet. Generate one to start integrating.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="space-mono-regular">
                  <TableHead>Name</TableHead>
                  <TableHead>Pipeline</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last used</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id} className="fira-mono-regular">
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>{key.pipeline?.name ?? "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{key.maskedKey}</TableCell>
                    <TableCell>{formatDate(key.createdAt)}</TableCell>
                    <TableCell>{formatRelative(key.lastUsedAt)}</TableCell>
                    <TableCell>{key.usageCount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          key.status === "active"
                            ? "border-emerald-500/60 text-emerald-600"
                            : "border-destructive/60 text-destructive"
                        }
                      >
                        {key.status.charAt(0).toUpperCase() + key.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(key.maskedKey)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRevoke(key.id)}
                          disabled={revokingId === key.id || key.status === "revoked"}
                        >
                          {revokingId === key.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="space-mono-regular">Integration Guide</CardTitle>
          <CardDescription className="fira-mono-regular">Complete guide to integrate your pipeline into your applications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Step 1: Installation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</div>
              <h3 className="font-medium">Installation</h3>
            </div>
            <div className="pl-8">
              <CodeSnippet label="Terminal" code="pip install krira-augment-sdk" language="bash" />
            </div>
          </div>

          {/* Step 2: Configuration */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</div>
              <h3 className="font-medium space-mono-regular">Configuration</h3>
            </div>
            <div className="grid gap-4 pl-8 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground space-mono-regular">Authorization Header</Label>
                <CodeSnippet label="Header" code={`Authorization: Bearer ${snippetKey}`} language="bash" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground space-mono-regular">Pipeline Name</Label>
                <CodeSnippet label="Name" code={snippetPipelineIdentifier} language="text" />
              </div>
            </div>
          </div>

          {/* Step 3: Usage */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</div>
              <h3 className="font-medium">Usage Examples</h3>
            </div>
            <div className="pl-8">
              <Tabs defaultValue="python" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="python" className="space-mono-regular">Python SDK</TabsTrigger>
                  <TabsTrigger value="curl" className="space-mono-regular">cURL</TabsTrigger>
                </TabsList>
                <TabsContent value="python" className="mt-0">
                  <CodeSnippet label="Python" code={pythonSnippet} language="python" />
                </TabsContent>
                <TabsContent value="curl" className="mt-0">
                  <CodeSnippet label="cURL" code={curlSnippet} language="bash" />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="space-mono-regular">Usage guidelines</CardTitle>
          <CardDescription className="fira-mono-regular">Best practices for managing keys securely.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-2">
            <AccordionItem value="usage">
              <AccordionTrigger className="space-mono-regular">How to use API keys</AccordionTrigger>
              <AccordionContent className="fira-mono-regular">
                <p className="text-sm text-muted-foreground">
                  Include the <code className="rounded bg-muted px-1 py-0.5">Authorization: Bearer &lt;key&gt;</code> header in every request. Never expose keys in client-side code.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="security">
              <AccordionTrigger className="space-mono-regular">Security best practices</AccordionTrigger>
              <AccordionContent className="fira-mono-regular">
                <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
                  <li>Rotate keys every 60 days.</li>
                  <li>Use separate keys for staging and production pipelines.</li>
                  <li>Revoke unused keys immediately.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="limits">
              <AccordionTrigger className="space-mono-regular">Rate limits</AccordionTrigger>
              <AccordionContent className="fira-mono-regular">
                <p className="text-sm text-muted-foreground">
                  Each key enforces its own per-minute cap. Configure limits during key creation to match your integration profile.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : resetDialog())}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="space-mono-regular text-xl">Generate new API key</DialogTitle>
            <DialogDescription className="fira-mono-regular">
              Keys are shown only once. Store them securely to maintain access.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-2">
            <div className="grid gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                Key Name
              </Label>
              <Input
                value={keyName}
                onChange={(event) => setKeyName(event.target.value)}
                placeholder="e.g. Production Frontend"
                className="h-10"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                Associated Pipeline
              </Label>
              <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {chatbots.map((bot) => (
                    <SelectItem key={bot._id} value={bot._id}>
                      {bot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                Permissions
              </Label>
              <div className="grid gap-3">
                {PERMISSIONS.map((permission) => (
                  <label
                    key={permission.id}
                    className="flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all hover:bg-muted/50 has-[:checked]:border-primary/50 has-[:checked]:bg-primary/[0.02]"
                  >
                    <Checkbox
                      id={`permission-${permission.id}`}
                      checked={permissions.includes(permission.id)}
                      onCheckedChange={() => handlePermissionToggle(permission.id)}
                      className="mt-1 rounded-full"
                    />
                    <div className="grid gap-1.5">
                      <span className="text-sm font-semibold leading-none">{permission.label}</span>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {permission.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Expiration
                </Label>
                <Select value={expiration} onValueChange={setExpiration}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select expiration" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRATIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Rate Limit
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    max="6000"
                    value={rateLimit}
                    onChange={(event) => setRateLimit(event.target.value)}
                    className="h-10 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground">
                    RPM
                  </span>
                </div>
              </div>
            </div>

            {generatedKey ? (
              <div className="mt-2 space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-primary/80">
                  Your New Secret Key
                </Label>
                <div className="relative flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <code className="flex-1 break-all font-mono text-sm font-medium leading-relaxed text-primary">
                      {generatedKey}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 hover:bg-primary/10 hover:text-primary"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedKey)
                        toast({ title: "Copied to clipboard" })
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="flex items-center gap-2 text-[11px] text-amber-600 font-medium bg-amber-50/50 p-2 rounded-md border border-amber-100/50">
                  <ShieldAlert className="h-3 w-3" />
                  Warning: This key will only be shown once.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-muted-foreground/20 p-4 bg-muted/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/20">
                    <ShieldAlert className="h-4 w-4 text-muted-foreground/60" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">Security Notice</p>
                    <p className="text-[11px] text-muted-foreground">
                      New keys are generated instantly and shown once.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4 gap-2 sm:gap-2">
            <Button variant="outline" onClick={resetDialog} className="flex-1 sm:flex-none px-8">
              Cancel
            </Button>
            <Button
              onClick={handleKeyCreation}
              disabled={!keyName || !selectedBot || isSubmitting}
              className="flex-1 sm:flex-none px-8 shadow-sm shadow-primary/20"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
