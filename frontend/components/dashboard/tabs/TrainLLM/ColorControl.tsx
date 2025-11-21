import * as React from "react"
import dynamic from "next/dynamic"
import { ColorResult } from "react-color"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const ChromePicker = dynamic(() => import("react-color").then((mod) => mod.ChromePicker), {
  ssr: false,
  loading: () => <div className="h-44 w-full rounded-xl border border-dashed bg-muted/40" />,
})

type ColorControlProps = {
  label: string
  description?: string
  value: string
  onChange: (value: string) => void
}

export function ColorControl({ label, description, value, onChange }: ColorControlProps) {
  const normalizedValue = value?.startsWith("#") ? value.toUpperCase() : `#${value.toUpperCase()}`

  const handleManualChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let next = event.target.value.trim()
    if (!next.startsWith("#")) {
      next = `#${next}`
    }
    if (next.length > 7) {
      next = next.slice(0, 7)
    }
    onChange(next.toUpperCase())
  }

  const handleColorChange = (color: ColorResult) => {
    onChange(color.hex.toUpperCase())
  }

  return (
    <div className="space-y-3 rounded-lg border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        <span className="h-6 w-6 rounded-full border" style={{ background: normalizedValue }} />
      </div>
      <div className="flex gap-2">
        <Input
          value={normalizedValue}
          onChange={handleManualChange}
          className="font-mono text-xs uppercase"
          maxLength={7}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-10 w-12 rounded-md p-0"
              aria-label={`Select ${label.toLowerCase()} color`}
            >
              <span className="sr-only">Select color</span>
              <span className="h-full w-full rounded-md" style={{ background: normalizedValue }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto border-none bg-transparent p-0 shadow-lg">
            <ChromePicker color={normalizedValue} disableAlpha onChangeComplete={handleColorChange} />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
