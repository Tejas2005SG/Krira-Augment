"use client"

import * as React from "react"
import { Copy, Plus, ShieldAlert, Trash2 } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type ApiKey = {
  id: string
  name: string
  value: string
  created: string
  lastUsed: string
  usage: number
  status: "active" | "revoked"
  permissions: string[]
}

const KEYS: ApiKey[] = [
  {
    id: "support-ops",
    name: "Support Ops",
    value: "sk-•••••••••••5e33",
    created: "Aug 02, 2025",
    lastUsed: "2 hours ago",
    usage: 2345,
    status: "active",
    permissions: ["Read", "Write"],
  },
  {
    id: "analytics-pipeline",
    name: "Analytics Pipeline",
    value: "sk-•••••••••••a114",
    created: "Jun 15, 2025",
    lastUsed: "1 day ago",
    usage: 8120,
    status: "active",
    permissions: ["Read"],
  },
  {
    id: "deprecated-key",
    name: "Deprecated Key",
    value: "sk-•••••••••••9911",
    created: "Dec 22, 2024",
    lastUsed: "90 days ago",
    usage: 0,
    status: "revoked",
    permissions: ["Read"],
  },
]

export function ApiKeysTab() {
  const [openDialog, setOpenDialog] = React.useState(false)
  const [keyName, setKeyName] = React.useState("")
  const [permissions, setPermissions] = React.useState<string[]>(["read"])
  const [expiration, setExpiration] = React.useState("never")
  const [showSuccess, setShowSuccess] = React.useState(false)

  const handlePermissionToggle = (value: string) => {
    setPermissions((prev) =>
      prev.includes(value) ? prev.filter((permission) => permission !== value) : [...prev, value]
    )
  }

  const handleGenerate = () => {
    if (!keyName) return
    setShowSuccess(true)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">API Key Management</h2>
          <p className="text-sm text-muted-foreground">Generate and control API keys used by your integrations.</p>
        </div>
        <Button className="gap-2" onClick={() => setOpenDialog(true)}>
          <Plus className="h-4 w-4" /> Generate new API key
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Active keys</CardTitle>
          <CardDescription>Rotate keys regularly to maintain security best practices.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                {/* Permissions Column Removed */}
                <TableHead>Created</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {KEYS.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell className="font-mono text-sm">{key.value}</TableCell>
                  {/* Permissions Cell Removed */}
                  <TableCell>{key.created}</TableCell>
                  <TableCell>{key.lastUsed}</TableCell>
                  <TableCell>{key.usage.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        key.status === "active"
                          ? "bg-emerald-50 border-emerald-600 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-400 dark:text-emerald-300"
                          : "bg-zinc-50 border-zinc-600 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-500 dark:text-zinc-300"
                      }
                    >
                      {key.status.charAt(0).toUpperCase() + key.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Button variant="ghost" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                  Include the <code className="rounded bg-muted px-1 py-0.5">Authorization: Bearer &lt;key&gt;</code> header in every request. Never expose keys in public clients.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="security">
              <AccordionTrigger>Security best practices</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
                  <li>Rotate keys every 60 days.</li>
                  <li>Restrict keys by environment and feature.</li>
                  <li>Revoke unused keys immediately.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="limits">
              <AccordionTrigger>Rate limits</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Pro plans allow 100 requests/minute per key. Contact support for enterprise burst limits.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate new API key</DialogTitle>
            <DialogDescription>Name the key and select permissions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={keyName} onChange={(event) => setKeyName(event.target.value)} placeholder="Integration name" />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-3">
                {[
                  { id: "read", label: "Read access", description: "Query chatbots and logs" },
                  { id: "write", label: "Write access", description: "Modify knowledge stores" },
                  { id: "admin", label: "Admin access", description: "Manage keys and billing" },
                ].map((permission) => (
                  <div key={permission.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <Checkbox
                      id={permission.id}
                      checked={permissions.includes(permission.id)}
                      onCheckedChange={() => handlePermissionToggle(permission.id)}
                    />
                    <div>
                      <Label htmlFor={permission.id} className="text-sm font-medium">
                        {permission.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Expiration</Label>
              <Select value={expiration} onValueChange={setExpiration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select expiration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                  <SelectItem value="1y">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {showSuccess ? (
              <Alert className="border-primary/40 bg-primary/10">
                <AlertTitle>Save this key now</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span className="font-mono">sk-live-24fd3-example-key</span>
                  <Button variant="ghost" size="icon">
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
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={!keyName}>
              Generate key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}