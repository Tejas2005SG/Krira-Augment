"use client"

import * as React from "react"
import { useToast } from "@/components/ui/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

type PreferenceKey = "productUpdates" | "weeklyDigest" | "criticalAlerts" | "betaAccess" | "aiEnhancements"

export function AccountSettingsTab() {
  const { toast } = useToast()
  const [preferences, setPreferences] = React.useState<Record<PreferenceKey, boolean>>({
    productUpdates: true,
    weeklyDigest: false,
    criticalAlerts: true,
    betaAccess: false,
    aiEnhancements: true,
  })
  const [isSaving, setIsSaving] = React.useState(false)

  const togglePreference = (key: PreferenceKey) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 600))
      toast({
        title: "Preferences updated",
        description: "Notification settings saved successfully.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what you want to hear about from Krira AI.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PreferenceToggle
            label="Product updates"
            description="Release notes, new features, and product education delivered occasionally."
            checked={preferences.productUpdates}
            onCheckedChange={() => togglePreference("productUpdates")}
          />
          <PreferenceToggle
            label="Weekly digest"
            description="Performance summaries from your chatbots, emailed every Monday."
            checked={preferences.weeklyDigest}
            onCheckedChange={() => togglePreference("weeklyDigest")}
          />
          <PreferenceToggle
            label="Critical alerts"
            description="Downtime, billing issues, or anomalies that require attention."
            checked={preferences.criticalAlerts}
            onCheckedChange={() => togglePreference("criticalAlerts")}
          />
          <PreferenceToggle
            label="Beta features"
            description="Join early-access programs for upcoming capabilities."
            checked={preferences.betaAccess}
            onCheckedChange={() => togglePreference("betaAccess")}
          />
          <PreferenceToggle
            label="AI enhancements"
            description="Tips and automations that improve model quality inside your projects."
            checked={preferences.aiEnhancements}
            onCheckedChange={() => togglePreference("aiEnhancements")}
          />

          <Separator />
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save preferences"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Workspace controls</CardTitle>
            <CardDescription>Update how Krira AI behaves for your team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• Workspace language and timezone can be configured from the organisation console.</p>
            <p>• Need granular permissions? Contact support to enable role-based access.
            </p>
            <p>• Turn off email summaries at any time using the toggles on this page.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

type PreferenceToggleProps = {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (value: boolean) => void
}

function PreferenceToggle({ label, description, checked, onCheckedChange }: PreferenceToggleProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border bg-card/50 p-4">
      <div>
        <Label className="text-sm font-medium leading-none">{label}</Label>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
