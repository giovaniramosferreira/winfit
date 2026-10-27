export interface SpriteMotion {
  columns: number
  rows: number
  frameCount: number
  duration: number
}

/** The atlas already contains a complete repetition, including the return. */
export function spriteMotion({ columns, rows, frameCount, duration }: SpriteMotion) {
  if (![columns, rows, frameCount].every(n => Number.isInteger(n) && n > 0) || frameCount > columns * rows || !Number.isFinite(duration) || duration <= 0) {
    throw new Error('Invalid sprite motion metadata')
  }
  const name = `sprite-${columns}-${rows}-${frameCount}`
  const position = (frame: number) => `${columns === 1 ? 0 : frame % columns / (columns - 1) * 100}% ${rows === 1 ? 0 : Math.floor(frame / columns) / (rows - 1) * 100}%`
  const keyframes = `@keyframes ${name}{${Array.from({ length: frameCount }, (_, frame) => `${frame / frameCount * 100}%{background-position:${position(frame)}}`).join('')}100%{background-position:0% 0%}}`
  return { name, keyframes, backgroundSize: `${columns * 100}% ${rows * 100}%`, duration: `${duration}s` }
}
