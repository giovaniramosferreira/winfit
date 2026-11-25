import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Cores opacas em hex só vivem em src/design/tokens.css. Exceções: ilustrações em tinta (fill/stroke/mask),
// cores com transparência (#rrggbbaa) e arquivos *-usability.css, que não são importados.
const root = new URL('../src/', import.meta.url).pathname
const files: string[] = []
const walk = (dir: string) => { for (const e of readdirSync(dir, { withFileTypes: true })) { const p = join(dir, e.name); if (e.isDirectory()) walk(p); else if (p.endsWith('.css')) files.push(p) } }
walk(root)

const offenders: string[] = []
for (const file of files) {
  if (file.endsWith('design/tokens.css') || file.includes('-usability.css')) continue
  const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  for (const m of css.matchAll(/(?<![\w-])([a-z-]+)\s*:\s*([^;{}]*)/g)) {
    const [, prop, value] = m
    if (['fill', 'stroke', 'mask-image', 'mask'].includes(prop)) continue
    for (const hex of value.match(/#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b/g) ?? []) offenders.push(`${file.replace(root, 'src/')}: ${prop}: ${hex}`)
  }
}
assert.equal(offenders.length, 0, `Use tokens --ds-* em vez de hex:\n${offenders.slice(0, 20).join('\n')}`)
console.log('Raw colors: nenhum hex opaco fora de src/design/tokens.css OK')
