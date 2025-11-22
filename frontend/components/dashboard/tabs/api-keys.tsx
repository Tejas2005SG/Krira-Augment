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

const CodeSnippet = ({ label, code }: { label: string; code: string }) => {
  const handleCopy = React.useCallback(async () => {
    await navigator.clipboard.writeText(code)
  }, [code])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <Button variant="ghost" size="sm" className="gap-2" onClick={handleCopy}>
          <Copy className="h-4 w-4" /> Copy
        </Button>
      </div>
      <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
        <code>{code}</code>
      </pre>
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
  const [selectedBot, setSelectedBot] = React.useState("")
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
        setSelectedBot((current) => current || chatbotResponse.chatbots[0]?._id || "")
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
    if (!keyName || !selectedBot) return
    setIsSubmitting(true)
    try {
      const payload: CreateApiKeyPayload = {
        name: keyName,
        botId: selectedBot,
        permissions,
        rateLimitPerMinute: Number(rateLimit) || 60,
      }
      if (expiration !== "never") {
        payload.expiresInDays = Number(expiration)
      }

      const response = await apiKeysService.create(payload)
      setKeys((prev) => [response.apiKey, ...prev])
      setGeneratedKey(response.key)
      toast({ title: "API key created", description: "Copy the secret now. It will only be shown once." })
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

  const fallbackBotName =
    chatbots.find((bot) => bot._id === selectedBot)?.name ||
    keys[0]?.bot?.name ||
    "your-bot-name"
  const snippetKey = generatedKey ?? "sk-live-your-key"
  const snippetBotIdentifier = fallbackBotName.replace(/"/g, '\\"')
  const curlSnippet = `curl -X POST ${PUBLIC_API_URL}/chat \
  -H "Authorization: Bearer ${snippetKey}" \
  -H "Content-Type: application/json" \
  -d '{"bot_id": "${snippetBotIdentifier}", "query": "What is the status of my order?"}'`

  const pythonSnippet = `from kriralabs import Kriralabs\n\nclient = Kriralabs(api_key="${snippetKey}", bot_id="${snippetBotIdentifier}")\nresponse = client.ask("What is the status of my order?")\nprint(response.answer)`

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">API Key Management</h2>
          <p className="text-sm text-muted-foreground">Generate, rotate, and revoke API keys used by your integrations.</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Generate new API key
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Active keys</CardTitle>
          <CardDescription>Rotate keys regularly and delete unused credentials.</CardDescription>
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
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Bot</TableHead>
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
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>{key.bot?.name ?? "—"}</TableCell>
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
          <CardTitle>Integration examples</CardTitle>
          <CardDescription>Use cURL or the official Python SDK. JavaScript SDK usage has been removed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <CodeSnippet label="cURL" code={curlSnippet} />
          <CodeSnippet label="Python SDK" code={pythonSnippet} />
          <p className="text-sm text-muted-foreground">
            Install the SDK with <code className="rounded bg-muted px-1">pip install kriralabs</code>. Each request must include the
            <code className="rounded bg-muted px-1">Authorization: Bearer &lt;api_key&gt;</code> header and you can set
            <code className="rounded bg-muted px-1">bot_id</code> to either the chatbot&apos;s ID or its exact name (e.g., &quot;{fallbackBotName}&quot;).
          </p>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Usage guidelines</CardTitle>
          <CardDescription>Best practices for managing keys securely.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-2">
            <AccordionItem value="usage">
              <AccordionTrigger>How to use API keys</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Include the <code className="rounded bg-muted px-1 py-0.5">Authorization: Bearer &lt;key&gt;</code> header in every request. Never expose keys in client-side code.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="security">
              <AccordionTrigger>Security best practices</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
                  <li>Rotate keys every 60 days.</li>
                  <li>Use separate keys for staging and production bots.</li>
                  <li>Revoke unused keys immediately.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="limits">
              <AccordionTrigger>Rate limits</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Each key enforces its own per-minute cap. Configure limits during key creation to match your integration profile.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : resetDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate new API key</DialogTitle>
            <DialogDescription>Keys are shown only once. Store them securely.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={keyName} onChange={(event) => setKeyName(event.target.value)} placeholder="Integration name" />
            </div>
            <div className="space-y-1">
              <Label>Chatbot</Label>
              <Select value={selectedBot} onValueChange={setSelectedBot}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a chatbot" />
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
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-3">
                {PERMISSIONS.map((permission) => (
                  <div key={permission.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <Checkbox
                      id={`permission-${permission.id}`}
                      checked={permissions.includes(permission.id)}
                      onCheckedChange={() => handlePermissionToggle(permission.id)}
                    />
                    <div>
                      <label htmlFor={`permission-${permission.id}`} className="text-sm font-medium">
                        {permission.label}
                      </label>
                      <p className="text-xs text-muted-foreground">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Expiration</Label>
                <Select value={expiration} onValueChange={setExpiration}>
                  <SelectTrigger>
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
              <div className="space-y-1">
                <Label>Rate limit (requests/min)</Label>
                <Input type="number" min="1" max="6000" value={rateLimit} onChange={(event) => setRateLimit(event.target.value)} />
              </div>
            </div>
            {generatedKey ? (
              <Alert className="border-primary/40 bg-primary/10">
                <AlertTitle>Save this key now</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span className="font-mono text-sm">{generatedKey}</span>
                  <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(generatedKey)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Confidential</AlertTitle>
                <AlertDescription>New keys are shown only once. Store them securely.</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetDialog}>
              Cancel
            </Button>
            <Button onClick={handleKeyCreation} disabled={!keyName || !selectedBot || isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
