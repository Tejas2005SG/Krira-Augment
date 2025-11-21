export const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B"
  }

  const units = ["B", "KB", "MB", "GB", "TB"]
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  const formatted = value < 10 && exponent > 0 ? value.toFixed(1) : Math.round(value)

  return `${formatted} ${units[exponent]}`
}

export function withAlpha(hex: string, alphaHex: string) {
  if (!hex || hex.length !== 7) return hex
  return `${hex}${alphaHex}`.toUpperCase()
}

export function getReadableTextColor(hex: string) {
  const luminance = getLuminance(hex)
  return luminance > 0.6 ? "#0f172a" : "#ffffff"
}

export function getLuminance(hex: string) {
  const rgb = hexToRgb(hex)
  if (!rgb) return 1
  const [r, g, b] = rgb
  const [rLin, gLin, bLin] = [r, g, b].map((component) => {
    const channel = component / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin
}

export function hexToRgb(hex: string): [number, number, number] | null {
  if (!hex) return null
  const normalized = hex.replace("#", "")
  if (normalized.length !== 6) return null
  const intVal = Number.parseInt(normalized, 16)
  const r = (intVal >> 16) & 255
  const g = (intVal >> 8) & 255
  const b = intVal & 255
  return [r, g, b]
}
