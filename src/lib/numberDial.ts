/** Keep typed hundredths; gesture precision is finer than the displayed tenth. */
export function dialValue(value: number, min: number, integer = false): number | null {
  if (!Number.isFinite(value)) return null
  return Math.max(min, integer ? Math.round(value) : Math.round(value * 100) / 100)
}

/** Slow movement is precise; acceleration is continuous and bounded. */
export function dialMotion(pixels: number, elapsedMs: number, integer: boolean): number {
  const speed = Math.abs(pixels) / Math.max(elapsedMs, 1)
  const gain = 1 + Math.min(9, Math.max(0, speed - 0.25) * 4)
  return pixels * gain / (integer ? 12 : 80)
}
