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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function AccountProfileTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [fullName, setFullName] = React.useState(user?.name ?? "")
  const [headline, setHeadline] = React.useState("")
  const [bio, setBio] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    // Placeholder for future API integration
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      toast({
        title: "Profile updated",
        description: "Your personal details were saved successfully.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <CardHeader>
            <CardTitle>Personal information</CardTitle>
            <CardDescription>
              Update how your profile appears across the dashboard and customer-facing experiences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="full-name">Full name</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="John Carter"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Email address</Label>
              <Input value={user?.email ?? ""} disabled className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={headline}
                onChange={(event) => setHeadline(event.target.value)}
                placeholder="AI Product Lead"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">About you</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Write a short introduction that highlights your goals with Krira AI."
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                This information is shared with teammates and collaborators inside your workspace.
              </p>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account overview</CardTitle>
            <CardDescription>Quick stats pulled from your subscription and usage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{user?.role ?? "user"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Verification</span>
              <span className="font-medium">{user?.isVerified ? "Verified" : "Pending"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">{user?.plan ?? "free"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security tips</CardTitle>
            <CardDescription>Keep your account resilient.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• Enable two-factor authentication (coming soon) for another layer of protection.</p>
            <p>• Use a unique password that you don&apos;t share with other services.</p>
            <p>• Review active sessions regularly and sign out from unfamiliar devices.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
