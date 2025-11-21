import * as React from "react"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

import { DeploymentOptions } from "./DeploymentOptions"
import { ColorControl } from "./ColorControl"
import { WidgetPreview } from "./WidgetPreview"
import { AppearanceConfig, BehaviorConfig, BrandingConfig } from "./types"
import { CODE_SNIPPETS } from "./constants"

type DeploymentSectionProps = {
  appearance: AppearanceConfig
  setAppearance: (appearance: AppearanceConfig) => void
  behavior: BehaviorConfig
  setBehavior: (behavior: BehaviorConfig) => void
  branding: BrandingConfig
  setBranding: (branding: BrandingConfig) => void
  activeDevice: string
  onDeviceChange: (device: string) => void
  deploymentTab: string
  onDeploymentTabChange: (tab: string) => void
  codeSnippets: typeof CODE_SNIPPETS
  setOpenDeleteDialog: (open: boolean) => void
}

export function DeploymentSection({
  appearance,
  setAppearance,
  behavior,
  setBehavior,
  branding,
  setBranding,
  activeDevice,
  onDeviceChange,
  deploymentTab,
  onDeploymentTabChange,
  codeSnippets,
  setOpenDeleteDialog,
}: DeploymentSectionProps) {
  const themePresets: Array<{
    name: string
    description: string
    appearance: Partial<AppearanceConfig>
  }> = [
    {
      name: "Krira Pro",
      description: "Bright, confident default",
      appearance: {
        primary: "#2563eb",
        accent: "#60a5fa",
        background: "#ffffff",
        text: "#0f172a",
        button: "#1d4ed8",
        borderRadius: 14,
        bubbleSize: 14,
        font: "Inter",
        useGradient: true,
      },
    },
    {
      name: "Midnight",
      description: "Dark UI with electric highlights",
      appearance: {
        primary: "#6366f1",
        accent: "#22d3ee",
        background: "#111827",
        text: "#f9fafb",
        button: "#4338ca",
        borderRadius: 18,
        bubbleSize: 16,
        font: "Space Grotesk",
        useGradient: true,
      },
    },
    {
      name: "Minimal",
      description: "Soft neutrals and clean lines",
      appearance: {
        primary: "#0ea5e9",
        accent: "#38bdf8",
        background: "#f8fafc",
        text: "#1f2937",
        button: "#0284c7",
        borderRadius: 12,
        bubbleSize: 13,
        font: "DM Sans",
        useGradient: false,
      },
    },
    {
      name: "Aurora",
      description: "Vibrant gradient-led branding",
      appearance: {
        primary: "#ec4899",
        accent: "#8b5cf6",
        background: "#0f172a",
        text: "#f8fafc",
        button: "#db2777",
        borderRadius: 20,
        bubbleSize: 15,
        font: "Sora",
        useGradient: true,
      },
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deploy Chatbot</CardTitle>
        <CardDescription>Customize the widget and choose your deployment option.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="w-full justify-start gap-2 overflow-auto">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
          </TabsList>
          <TabsContent value="appearance" className="space-y-4">
            <Card className="border-dashed">
              <CardHeader className="space-y-2">
                <CardTitle className="text-base">Theme & Styling</CardTitle>
                <CardDescription>Create a polished assistant that mirrors your product identity.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick presets</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {themePresets.map((preset) => {
                      const isActive = ["primary", "accent", "background", "text", "button"].every((key) => {
                        const current = appearance[key as keyof typeof appearance]
                        const target = preset.appearance[key as keyof typeof appearance]
                        return target ? current === target : true
                      })

                      return (
                        <Button
                          key={preset.name}
                          variant={isActive ? "default" : "outline"}
                          className="gap-3 rounded-full border-muted/40 px-4 py-2"
                          onClick={() =>
                            setAppearance({
                              ...appearance,
                              ...preset.appearance,
                              borderRadius: preset.appearance.borderRadius ?? appearance.borderRadius,
                              bubbleSize: preset.appearance.bubbleSize ?? appearance.bubbleSize,
                              font: preset.appearance.font ?? appearance.font,
                              useGradient: preset.appearance.useGradient ?? appearance.useGradient,
                            })
                          }
                        >
                          <span
                            className="h-6 w-6 rounded-full border"
                            style={{
                              background: preset.appearance.useGradient
                                ? `linear-gradient(135deg, ${preset.appearance.primary}, ${preset.appearance.accent})`
                                : preset.appearance.primary,
                            }}
                          />
                          <span className="flex flex-col items-start leading-none">
                            <span className="text-xs font-semibold">{preset.name}</span>
                            <span className="text-[11px] text-muted-foreground">{preset.description}</span>
                          </span>
                        </Button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.35fr,1fr]">
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <ColorControl
                        label="Primary"
                        description="Buttons and hero moments"
                        value={appearance.primary}
                        onChange={(value) => setAppearance({ ...appearance, primary: value })}
                      />
                      <ColorControl
                        label="Accent"
                        description="Secondary gradient"
                        value={appearance.accent}
                        onChange={(value) => setAppearance({ ...appearance, accent: value })}
                      />
                      <ColorControl
                        label="Background"
                        description="Widget canvas"
                        value={appearance.background}
                        onChange={(value) => setAppearance({ ...appearance, background: value })}
                      />
                      <ColorControl
                        label="Text"
                        description="Primary typography"
                        value={appearance.text}
                        onChange={(value) => setAppearance({ ...appearance, text: value })}
                      />
                      <ColorControl
                        label="CTA"
                        description="Call-to-action buttons"
                        value={appearance.button}
                        onChange={(value) => setAppearance({ ...appearance, button: value })}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Border radius</Label>
                        <Slider
                          value={[appearance.borderRadius]}
                          onValueChange={([value]) => setAppearance({ ...appearance, borderRadius: value })}
                          max={24}
                          min={0}
                        />
                        <p className="text-xs text-muted-foreground">Widget shell rounding ({appearance.borderRadius}px).</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Bubble padding</Label>
                        <Slider
                          value={[appearance.bubbleSize]}
                          onValueChange={([value]) => setAppearance({ ...appearance, bubbleSize: value })}
                          max={26}
                          min={8}
                        />
                        <p className="text-xs text-muted-foreground">Conversation density ({appearance.bubbleSize}).</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Font family</Label>
                        <Select value={appearance.font} onValueChange={(value) => setAppearance({ ...appearance, font: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select font" />
                          </SelectTrigger>
                          <SelectContent>
                            {["Inter", "Manrope", "Space Grotesk", "DM Sans", "Sora", "Plus Jakarta Sans"].map((font) => (
                              <SelectItem key={font} value={font}>
                                {font}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <Label className="text-sm">Gradient header</Label>
                          <p className="text-xs text-muted-foreground">Blend primary and accent for the hero bar.</p>
                        </div>
                        <Switch
                          checked={appearance.useGradient}
                          onCheckedChange={(checked) => setAppearance({ ...appearance, useGradient: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <WidgetPreview
                    appearance={appearance}
                    behavior={behavior}
                    branding={branding}
                    activeDevice={activeDevice}
                    onDeviceChange={onDeviceChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="behavior" className="space-y-4">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Behavior Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Welcome message</Label>
                  <Textarea
                    value={behavior.welcomeMessage}
                    onChange={(event) => setBehavior({ ...behavior, welcomeMessage: event.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Input placeholder</Label>
                    <Input
                      value={behavior.placeholder}
                      onChange={(event) => setBehavior({ ...behavior, placeholder: event.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Response delay ({behavior.responseDelay[0]}ms)</Label>
                    <Slider
                      value={behavior.responseDelay}
                      onValueChange={(value) => setBehavior({ ...behavior, responseDelay: value })}
                      min={200}
                      max={1500}
                      step={50}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label className="text-sm">Typing indicator</Label>
                      <p className="text-xs text-muted-foreground">Show animated typing bubble during responses</p>
                    </div>
                    <Switch
                      checked={behavior.typingIndicator}
                      onCheckedChange={(checked) => setBehavior({ ...behavior, typingIndicator: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label className="text-sm">Sound notifications</Label>
                      <p className="text-xs text-muted-foreground">Play a ping when a new answer arrives</p>
                    </div>
                    <Switch
                      checked={behavior.soundNotifications}
                      onCheckedChange={(checked) => setBehavior({ ...behavior, soundNotifications: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="branding" className="space-y-4">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Branding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Chatbot name</Label>
                    <Input
                      value={branding.chatbotName}
                      onChange={(event) => setBranding({ ...branding, chatbotName: event.target.value })}
                    />
                    <Label>Position</Label>
                    <Select value={branding.position} onValueChange={(value) => setBranding({ ...branding, position: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-right">Bottom right</SelectItem>
                        <SelectItem value="bottom-left">Bottom left</SelectItem>
                        <SelectItem value="floating">Floating button</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Upload logo</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const [file] = event.target.files ?? []
                        setBranding({ ...branding, logo: file ?? null })
                      }}
                    />
                    <div className="text-xs text-muted-foreground">
                      {branding.logo ? branding.logo.name : "PNG or SVG up to 2MB"}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Watermark settings
                    <Badge variant="secondary">Free</Badge>
                  </Label>
                  <div className="flex items-center gap-3">
                    <Checkbox checked disabled />
                    <span className="text-sm">Powered by Krira AI</span>
                  </div>
                  <Input
                    disabled
                    value={branding.customWatermark}
                    placeholder="Upgrade to Pro for custom watermark"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs> */}

        <DeploymentOptions
          deploymentTab={deploymentTab}
          onDeploymentTabChange={onDeploymentTabChange}
          codeSnippets={codeSnippets}
          setOpenDeleteDialog={setOpenDeleteDialog}
        />
      </CardContent>
    </Card>
  )
}
