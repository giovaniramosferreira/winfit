import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement as h } from 'react'
import { renderToStaticMarkup as render } from 'react-dom/server'
const { SheetPanel, ConfirmContent } = await import('../src/components/ui')
const { createSheetStack, nextFocusIndex } = await import('../src/components/ui/sheetLogic')

// Foco preso: Tab no último volta ao primeiro; Shift+Tab no primeiro vai ao último; sem foco entra pelas pontas.
assert.equal(nextFocusIndex(2, 3, false), 0)
assert.equal(nextFocusIndex(0, 3, true), 2)
assert.equal(nextFocusIndex(1, 3, false), 2)
assert.equal(nextFocusIndex(1, 3, true), 0)
assert.equal(nextFocusIndex(-1, 3, false), 0)
assert.equal(nextFocusIndex(-1, 3, true), 2)
assert.equal(nextFocusIndex(0, 0, false), -1)

// Pilha: só o painel do topo responde a Esc.
const stack = createSheetStack(); const a = Symbol('a'), b = Symbol('b')
stack.push(a); stack.push(b)
assert.ok(stack.isTop(b) && !stack.isTop(a))
stack.remove(b)
assert.ok(stack.isTop(a)); stack.remove(a)
assert.equal(stack.size, 0)

// Painel: papel de diálogo modal e nome acessível por rótulo ou por título.
const byLabel = render(h(SheetPanel, { label: 'Opções do treino' }, 'x'))
assert.match(byLabel, /role="dialog"/); assert.match(byLabel, /aria-modal="true"/); assert.match(byLabel, /aria-label="Opções do treino"/)
const byTitle = render(h(SheetPanel, { labelledBy: 'titulo' }, 'x'))
assert.match(byTitle, /aria-labelledby="titulo"/); assert.ok(!byTitle.includes('aria-label='))

// Confirmação destrutiva: botão de perigo e foco inicial em Cancelar; neutra: foco no confirmar.
const noop = () => {}
const danger = render(h(ConfirmContent, { title: 'Apagar?', message: 'Sem volta.', confirmLabel: 'Apagar', destructive: true, onChoose: noop }))
assert.match(danger, /btn-danger[^>]*>Apagar</); assert.match(danger, /data-autofocus=""[^>]*>Cancelar</)
const plain = render(h(ConfirmContent, { title: 'Encerrar?', confirmLabel: 'Encerrar', onChoose: noop }))
assert.match(plain, /btn-primary"[^>]*data-autofocus=""[^>]*>Encerrar</)

// Nenhum diálogo nativo restante no código do app.
const files: string[] = []
const walk = (d: string) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.tsx?$/.test(p)) files.push(p) } }
walk(new URL('../src/', import.meta.url).pathname)
const native = files.filter((f) => /(^|[^.\w])(window\.)?(confirm|alert|prompt)\(/.test(readFileSync(f, 'utf8').replace(/confirmEditor\(|confirmDialog\(|confirmOwner\(/g, '')))
assert.deepEqual(native, [], `Use confirmDialog em vez de diálogos nativos: ${native.join(', ')}`)
console.log('Sheet and ConfirmDialog: focus, stack, aria and no native dialogs OK')
