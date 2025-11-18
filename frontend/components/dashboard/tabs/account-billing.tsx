"use client"

import * as React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const PLAN_BENEFITS: Record<string, string[]> = {
  free: [
    "Up to 1 chatbot",
    "30 monthly questions",
    "Community support",
  ],
  "pro_monthly": [
    "Unlimited chatbots",
    "Priority support",
    "Advanced analytics",
  ],
}

export function AccountBillingTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const planKey = (user?.plan ?? "free").toLowerCase()
  const benefits = PLAN_BENEFITS[planKey] ?? PLAN_BENEFITS.free

  const handleManageBilling = async () => {
    toast({
      title: "Redirecting to billing portal",
      description: "Billing management is coming soon.",
    })
  }

  const handleUpgrade = async () => {
    toast({
      title: "Upgrade flow",
      description: "Plan upgrades will be available shortly.",
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Current plan</CardTitle>
            <CardDescription>Manage subscriptions and review your allowance.</CardDescription>
          </div>
          <Badge variant="outline" className="text-sm capitalize">
            {user?.plan ?? "free"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">Usage summary</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <UsageStat label="Chatbots" value={`${user?.chatbotsCreated ?? 0}/${user?.chatbotLimit ?? 1}`} />
              <UsageStat label="Questions" value={`${user?.questionsUsed ?? 0}/${user?.questionLimit ?? 30}`} />
              <UsageStat label="Team seats" value={`${user?.teamMembers ?? 0}`} />
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium">Plan benefits</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              {benefits.map((benefit) => (
                <li key={benefit}>• {benefit}</li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleManageBilling} variant="outline">
              Manage billing
            </Button>
            <Button onClick={handleUpgrade}>Upgrade plan</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment method</CardTitle>
            <CardDescription>Secure payments processed via Stripe.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>No card on file yet.</p>
            <p className="mt-1">Add a payment method when you upgrade to a paid plan.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice history</CardTitle>
            <CardDescription>Access downloadable receipts for your records.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>No invoices to display.</p>
            <p className="mt-1">You&apos;ll receive receipts via email after each renewal.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

type UsageStatProps = {
  label: string
  value: string
}

function UsageStat({ label, value }: UsageStatProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  )
}
