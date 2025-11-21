import * as React from "react"
import { Monitor, TabletSmartphone, Smartphone, Palette } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { withAlpha, getReadableTextColor } from "./utils"
import { AppearanceConfig, BehaviorConfig, BrandingConfig } from "./types"

type WidgetPreviewProps = {
  appearance: AppearanceConfig
  behavior: BehaviorConfig
  branding: BrandingConfig
  activeDevice: string
  onDeviceChange: (device: string) => void
}

export function WidgetPreview({ appearance, behavior, branding, activeDevice, onDeviceChange }: WidgetPreviewProps) {
  const deviceIconMap: Record<string, React.ElementType> = {
    desktop: Monitor,
    tablet: TabletSmartphone,
    mobile: Smartphone,
  }

  const headerBackground = appearance.useGradient
    ? `linear-gradient(135deg, ${appearance.primary}, ${appearance.accent})`
    : appearance.primary
  const readablePrimaryText = getReadableTextColor(appearance.primary)
  const readableButtonText = getReadableTextColor(appearance.button)
  const bubbleRadius = appearance.bubbleSize
  const assistantBubbleStyle: React.CSSProperties = {
    background: appearance.primary,
    color: readablePrimaryText,
    borderRadius: bubbleRadius,
  }
  const userBubbleStyle: React.CSSProperties = {
    background: withAlpha(appearance.accent, "1A"),
    color: appearance.text,
    borderRadius: bubbleRadius,
    border: `1px solid ${withAlpha(appearance.accent, "33")}`,
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Palette className="h-4 w-4" /> Live preview
        </div>
        <div className="flex gap-2">
          {Object.entries(deviceIconMap).map(([device, Icon]) => (
            <Button
              key={device}
              variant={activeDevice === device ? "default" : "outline"}
              size="icon"
              onClick={() => onDeviceChange(device)}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>
      <div
        className="relative mx-auto w-full max-w-sm overflow-hidden rounded-[18px] border shadow-sm"
        style={{
          backgroundColor: appearance.background,
          fontFamily: appearance.font,
          borderRadius: appearance.borderRadius,
          color: appearance.text,
        }}
      >
        <div
          className="flex items-center justify-between gap-3 px-4 py-3"
          style={{
            background: headerBackground,
            color: readablePrimaryText,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
              style={{
                backgroundColor: withAlpha(appearance.background, "1A"),
                color: readablePrimaryText,
                border: `1px solid ${withAlpha(appearance.background, "33")}`,
              }}
            >
              {branding.chatbotName.slice(0, 2).toUpperCase()}
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">{branding.chatbotName}</p>
              <p className="text-[11px] opacity-80">Smart assistant</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-[11px] font-medium text-white">
            Online
          </Badge>
        </div>

        <div className="space-y-3 px-4 py-4 text-sm" style={{ color: appearance.text }}>
          <div className="flex items-start gap-2">
            <div className="h-8 w-8 rounded-full bg-muted/60" />
            <div className="max-w-[80%] px-4 py-3" style={assistantBubbleStyle}>
              {behavior.welcomeMessage || "Hi there! How can I help you today?"}
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[80%] px-4 py-3 text-sm shadow-sm" style={userBubbleStyle}>
              Show me what deploying Krira looks like.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-muted/60" />
            <div className="w-full max-w-[85%] space-y-2 px-4 py-3" style={assistantBubbleStyle}>
              <p className="font-medium">Here is a personalised answer</p>
              <p className="text-sm opacity-90">
                I will respond in {Math.round(behavior.responseDelay[0] / 100) / 10}s and keep messaging concise using {appearance.font}.
              </p>
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-2 border-t px-4 py-3"
          style={{ borderColor: withAlpha(appearance.primary, "1F") }}
        >
          <div
            className="flex-1 px-3 py-2 text-sm text-muted-foreground"
            style={{
              borderRadius: appearance.borderRadius,
              border: `1px solid ${withAlpha(appearance.primary, "33")}`,
              backgroundColor: withAlpha(appearance.background, "05"),
            }}
          >
            {behavior.placeholder || "Ask something..."}
          </div>
          <Button
            size="sm"
            style={{
              backgroundColor: appearance.button,
              color: readableButtonText,
              borderRadius: Math.max(appearance.borderRadius - 2, 8),
            }}
          >
            Send
          </Button>
        </div>

        <div className="flex items-center justify-between border-t px-4 py-2 text-xs" style={{ borderColor: withAlpha(appearance.primary, "14") }}>
          <span className="font-medium text-muted-foreground">{appearance.font}</span>
          <span className="text-muted-foreground">Accent {appearance.accent}</span>
        </div>
      </div>
    </div>
  )
}
