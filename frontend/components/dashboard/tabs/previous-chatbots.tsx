"use client"

import * as React from "react"
import Image from "next/image"
import {
  ArrowUpDown,
  Edit2,
  FileText,
  MoreHorizontal,
  Search,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

type ChatbotStatus = "active" | "inactive" | "draft"

type Chatbot = {
  id: string
  name: string
  status: ChatbotStatus
  created: string
  updated: string
  queries: number
  successRate: number
  responseTime: string
  thumbnail: string
  systemPrompt: string
}

const CHATBOTS: Chatbot[] = [
  {
    id: "support-pro",
    name: "Support Pro",
    status: "active",
    created: "Feb 12, 2025",
    updated: "Nov 10, 2025",
    queries: 8240,
    successRate: 94,
    responseTime: "842ms",
    thumbnail: "/hero-light.webp",
    systemPrompt: "You are Support Pro, an empathetic assistant helping users troubleshoot quickly.",
  },
  {
    id: "sales-advisor",
    name: "Sales Advisor",
    status: "active",
    created: "Apr 4, 2025",
    updated: "Nov 9, 2025",
    queries: 5421,
    successRate: 88,
    responseTime: "910ms",
    thumbnail: "/hero-dark.webp",
    systemPrompt: "You are a sales enablement expert guiding prospects through product features.",
  },
  {
    id: "onboarding-coach",
    name: "Onboarding Coach",
    status: "inactive",
    created: "Jan 8, 2025",
    updated: "Oct 25, 2025",
    queries: 3398,
    successRate: 91,
    responseTime: "1.2s",
    thumbnail: "/hero-light.webp",
    systemPrompt: "Coach new teammates on how to use Krira AI effectively.",
  },
  {
    id: "pricing-demo",
    name: "Pricing Demo",
    status: "draft",
    created: "Nov 2, 2025",
    updated: "Nov 2, 2025",
    queries: 0,
    successRate: 0,
    responseTime: "-",
    thumbnail: "/hero-dark.webp",
    systemPrompt: "Explain Krira pricing tiers with clarity.",
  },
]

export function PreviousChatbotsTab() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | ChatbotStatus>("all")
  const [sort, setSort] = React.useState("newest")
  const [selectedChatbot, setSelectedChatbot] = React.useState<Chatbot | null>(null)
  const [promptDraft, setPromptDraft] = React.useState("")
  const [deleteChatbot, setDeleteChatbot] = React.useState<Chatbot | null>(null)

  const filteredChatbots = React.useMemo(() => {
    return CHATBOTS.filter((bot) => {
      const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" ? true : bot.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchTerm, statusFilter])

  const sortedChatbots = React.useMemo(() => {
    switch (sort) {
      case "oldest":
        return [...filteredChatbots].reverse()
      case "most-used":
        return [...filteredChatbots].sort((a, b) => b.queries - a.queries)
      case "name":
        return [...filteredChatbots].sort((a, b) => a.name.localeCompare(b.name))
      default:
        return filteredChatbots
    }
  }, [filteredChatbots, sort])

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Your Chatbots</h2>
          <p className="text-sm text-muted-foreground">Manage active assistants, duplicate success, and iterate quickly.</p>
        </div>
        <Button className="gap-2">
          <FileText className="h-4 w-4" /> Create new chatbot
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-full flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full items-center gap-2 lg:max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chatbots"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ChatbotStatus | "all") }>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="most-used">Most used</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {sortedChatbots.length === 0 ? (
        <Card className="border-dashed py-12 text-center">
          <CardHeader>
            <CardTitle>No chatbots yet</CardTitle>
            <CardDescription>Create your first assistant to see analytics here.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button>Create your first chatbot</Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedChatbots.map((bot) => (
            <ChatbotCard
              key={bot.id}
              chatbot={bot}
              onEditPrompt={() => {
                setSelectedChatbot(bot)
                setPromptDraft(bot.systemPrompt)
              }}
              onDelete={() => setDeleteChatbot(bot)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!selectedChatbot} onOpenChange={(open) => !open && setSelectedChatbot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit system prompt - {selectedChatbot?.name}</DialogTitle>
            <DialogDescription>Update instructions that guide this assistant.</DialogDescription>
          </DialogHeader>
          <Textarea rows={6} value={promptDraft} onChange={(event) => setPromptDraft(event.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedChatbot(null)}>
              Cancel
            </Button>
            <Button onClick={() => setSelectedChatbot(null)}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteChatbot} onOpenChange={(open) => !open && setDeleteChatbot(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chatbot?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {deleteChatbot?.name} and its history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

type ChatbotCardProps = {
  chatbot: Chatbot
  onEditPrompt: () => void
  onDelete: () => void
}

function ChatbotCard({ chatbot, onEditPrompt, onDelete }: ChatbotCardProps) {
  return (
    <Card className="flex h-full flex-col border-border/60">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-lg font-semibold">{chatbot.name}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Created {chatbot.created} · Updated {chatbot.updated}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onEditPrompt}>Edit system prompt</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuItem>View analytics</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative overflow-hidden rounded-lg border">
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/40 via-transparent to-primary/20" />
          <Image src={chatbot.thumbnail} alt={chatbot.name} width={640} height={240} className="h-40 w-full object-cover" />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <StatusBadge status={chatbot.status} />
          <Badge variant="secondary">{chatbot.queries.toLocaleString()} queries</Badge>
          <Badge variant="outline">{chatbot.successRate}% success</Badge>
          <Badge variant="outline">{chatbot.responseTime}</Badge>
        </div>
        <div className="space-y-1 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">System prompt</p>
          <p>{chatbot.systemPrompt}</p>
        </div>
      </CardContent>
      <CardFooter className="mt-auto flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" className="gap-2" onClick={onEditPrompt}>
          <Edit2 className="h-4 w-4" />
          Edit prompt
        </Button>
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowUpDown className="h-4 w-4" /> View details
        </Button>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Active</span>
          <Switch checked={chatbot.status === "active"} onCheckedChange={() => {}} />
        </div>
      </CardFooter>
    </Card>
  )
}

function StatusBadge({ status }: { status: ChatbotStatus }) {
  const variant = status === "active" ? "default" : status === "inactive" ? "secondary" : "outline"
  return <Badge variant={variant}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
}
