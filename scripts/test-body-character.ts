import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import BodyPlate from '../src/components/BodyPlate'
import type { MuscleGroup } from '../src/types'

const groups: MuscleGroup[] = ['peito', 'costas', 'ombro', 'biceps', 'triceps', 'quadriceps', 'posterior', 'gluteo', 'panturrilha', 'core']
const render = (props: Parameters<typeof BodyPlate>[0] = {}) => renderToStaticMarkup(createElement(BodyPlate, props))
const paths = (html: string) => html.match(/<path\b[^>]*>/g) ?? []

test('as duas vistas usam o personagem local aprovado e arquivos WebP válidos', () => {
  const html = render()
  assert.equal((html.match(/<image\b/g) ?? []).length, 2)
  for (const view of ['front', 'back']) {
    const path = `/media/anatomy/body-${view}.webp`
    assert.ok(html.includes(path))
    const file = new URL(`../public${path}`, import.meta.url)
    assert.ok(existsSync(file), path)
    const bytes = readFileSync(file)
    assert.equal(bytes.subarray(0, 4).toString(), 'RIFF')
    assert.equal(bytes.subarray(8, 12).toString(), 'WEBP')
  }
})

test('cada um dos dez grupos mantém destaque principal bilateral com hachura', () => {
  for (const group of groups) {
    const html = render({ primary: group })
    const selected = paths(html).filter(path => path.includes(`data-muscle="${group}"`) && path.includes('rg pri'))
    assert.ok(selected.length >= 2, group)
    assert.ok(selected.every(path => path.includes('fill:url(#fibers-')), group)
    assert.ok(selected.every(path => path.includes('mix-blend-mode:multiply')), group)
    assert.ok(!paths(html).some(path => path.includes('rg pri') && !path.includes(`data-muscle="${group}"`)), group)
  }
})

test('secundários são claros, o principal prevalece e regiões inativas ficam transparentes', () => {
  const html = render({ primary: 'peito', secondary: ['peito', 'ombro', 'triceps'] })
  for (const group of ['ombro', 'triceps']) {
    const selected = paths(html).filter(path => path.includes(`data-muscle="${group}"`))
    assert.ok(selected.length >= 2)
    assert.ok(selected.every(path => path.includes('rg sec') && path.includes('fill:rgba(')))
  }
  assert.ok(paths(html).filter(path => path.includes('data-muscle="peito"')).every(path => path.includes('rg pri')))
  assert.ok(paths(html).filter(path => path.includes('data-muscle="quadriceps"')).every(path => path.includes('fill:transparent')))
})

test('filtros de vista e rótulos acessíveis continuam funcionando', () => {
  for (const [view, caption, omitted] of [['front', 'Anterior', 'Posterior'], ['back', 'Posterior', 'Anterior']] as const) {
    const html = render({ views: view, label: 'Mapa muscular personalizado' })
    assert.equal((html.match(/<image\b/g) ?? []).length, 1)
    assert.match(html, new RegExp(`>${caption}<`))
    assert.ok(!html.includes(`>${omitted}<`))
    assert.match(html, /aria-label="Mapa muscular personalizado"/)
  }
  const html = renderToStaticMarkup(createElement('div', null,
    createElement(BodyPlate, { primary: 'peito' }), createElement(BodyPlate, { primary: 'core' })))
  const ids = [...html.matchAll(/<pattern id="([^"]+)"/g)].map(match => match[1])
  assert.equal(new Set(ids).size, 2)
})
