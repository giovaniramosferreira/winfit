import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/design/tokens.css', import.meta.url), 'utf8')
const vars = (block: string) => Object.fromEntries([...block.matchAll(/(--ds-[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))
const light = vars(css.slice(css.indexOf(':root {'), css.indexOf('/* Escuro')))
const dark = vars(css.slice(css.indexOf(':root[data-theme="dark"]'), css.indexOf('@media (prefers-color-scheme: dark)')))
const darkMedia = vars(css.slice(css.indexOf('@media (prefers-color-scheme: dark)'), css.indexOf('@media (prefers-reduced-motion')))

// Todo token escuro existe no claro, e o escuro por preferência do sistema espelha o forçado.
for (const k of Object.keys(dark)) assert.ok(k in light, `${k} existe só no escuro`)
assert.deepEqual(darkMedia, dark, 'escuro por preferência do sistema difere do escuro forçado')
for (const k of ['--ds-bg', '--ds-surface', '--ds-text', '--ds-brand', '--ds-danger']) assert.ok(k in dark, `${k} sem valor escuro`)

const lum = (hex: string) => {
  const c = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)]; return ((x > y ? x : y) + 0.05) / ((x > y ? y : x) + 0.05) }
const pairs: Array<[string, string]> = [
  ['--ds-text', '--ds-bg'], ['--ds-text', '--ds-surface'], ['--ds-text-dim', '--ds-bg'], ['--ds-text-dim', '--ds-surface'],
  ['--ds-text-faint', '--ds-bg'], ['--ds-text-faint', '--ds-surface'], ['--ds-brand-deep', '--ds-surface'], ['--ds-danger', '--ds-surface'],
  ['--ds-success', '--ds-surface'], ['--ds-warning', '--ds-surface'], ['--ds-on-brand', '--ds-brand'],
]
for (const [name, theme] of [['claro', light], ['escuro', { ...light, ...dark }]] as const) {
  for (const [fg, bg] of pairs) {
    const r = ratio(theme[fg], theme[bg])
    assert.ok(r >= 4.5, `${name}: ${fg} sobre ${bg} tem contraste ${r.toFixed(2)}:1 (mínimo 4,5:1)`)
  }
}
console.log('Design tokens: claro/escuro consistentes e contraste mínimo OK')
