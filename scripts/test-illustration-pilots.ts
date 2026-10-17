import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { EXERCISES } from '../src/data/exercises'
import { ILLUSTRATION_PILOTS } from '../src/data/illustrationPilots'
import { EXERCISE_ILLUSTRATIONS } from '../src/data/exerciseIllustrations'
import ExerciseDemo from '../src/components/ExerciseDemo'
import IllustratedExerciseDemo from '../src/components/IllustratedExerciseDemo'

const holds = ['prancha', 'prancha-joelhos', 'prancha-lateral', 'prancha-lateral-joelhos']

test('os três pilotos aprovados preservam arquivo, proporção, ciclo e instrução originais', () => {
  assert.deepEqual(Object.keys(ILLUSTRATION_PILOTS).sort(), ['agachamento-corporal', 'flexao', 'leg-press'])
  const hashes: Record<string, string> = {
    'agachamento-corporal': '42d8d1a24935834e0995fb9b12a643f2a9cc346208926c23a03aecfb1efd2c90',
    flexao: 'adfd8b9fe68b2a20f0ddd416347d71045067e5d0a2744fd7b911e5938310b541',
    'leg-press': '18b40171bb6d8d55a57b9416d7db8e67284a98da70b288a80fcee35b16cdd0d1',
  }
  for (const [id, pilot] of Object.entries(ILLUSTRATION_PILOTS)) {
    assert.deepEqual(EXERCISE_ILLUSTRATIONS[id], pilot)
    assert.equal(createHash('sha256').update(readFileSync(`public${pilot.sprite}`)).digest('hex'), hashes[id])
  }
})

test('todos os 78 exercícios usam o personagem aprovado com arquivos locais presentes', () => {
  assert.equal(EXERCISES.length, 78)
  assert.deepEqual(Object.keys(EXERCISE_ILLUSTRATIONS).sort(), EXERCISES.map(exercise => exercise.id).sort())
})

test('artes concluídas usam o atlas local, instruções do catálogo e sustentação estática', () => {
  for (const [id, art] of Object.entries(EXERCISE_ILLUSTRATIONS)) {
    const exercise = EXERCISES.find(exercise => exercise.id === id)
    assert.ok(exercise, `Id desconhecido: ${id}`)
    assert.match(art.sprite, /^\/media\/(pilots|catalog)\/[a-z0-9-]+\.webp$/)
    assert.ok(existsSync(`public${art.sprite}`), `Arquivo ausente: ${exercise.id}`)
    const html = renderToStaticMarkup(createElement(ExerciseDemo, { exerciseId: exercise.id, name: exercise.name }))
    assert.match(html, /Demonstração ilustrada/)
    assert.match(html, /role="img"/)
    assert.ok(!html.includes('movement-illustration') && !html.includes('<svg'), `Personagem antigo em ${exercise.id}`)
    assert.ok(!/https?:|\.png/.test(html), exercise.id)
    if (holds.includes(exercise.id)) {
      assert.equal(art.hold, true)
      assert.match(html, /Posição de sustentação · conte o tempo em segundos/)
      assert.match(html, /pilot-hold/)
      assert.ok(!html.includes('Reproduzir demonstração') && !html.includes('aria-pressed'))
    } else {
      assert.match(html, /Sequência ilustrada/)
      assert.match(html, /animation-play-state:paused/)
      assert.match(html, /aria-pressed="false"/)
    }
    if (!ILLUSTRATION_PILOTS[exercise.id]) assert.equal(art.cue, exercise.instructions.join(' '))
  }
  assert.deepEqual(Object.entries(EXERCISE_ILLUSTRATIONS).filter(([, art]) => art.hold).map(([id]) => id).sort(), holds.sort())
})

test('sustentação fica estática mesmo com sequência disponível no componente', () => {
  const html = renderToStaticMarkup(createElement(IllustratedExerciseDemo, {
    name: 'Prancha', pilot: { sprite: '/media/catalog/prancha.webp', aspectRatio: '1', cycle: 'return', cue: 'Sustente a posição.', hold: true },
  }))
  assert.match(html, /pilot-hold/)
  assert.match(html, /Posição de sustentação/)
  assert.match(html, /aria-label="Prancha: Sustente a posição./)
  assert.ok(!html.includes('<button'))
})

test('os atlas publicados correspondem às fontes e seleções da revisão visual final', () => {
  const reviews = JSON.parse(readFileSync('docs/media/catalog/review-final.json', 'utf8'))
  const packing = JSON.parse(readFileSync('docs/media/catalog/packing.json', 'utf8')).assets
  assert.equal(reviews.length, 75)
  for (const review of reviews) {
    const metadata = JSON.parse(readFileSync(`docs/media/catalog/generated/${review.id}.json`, 'utf8'))
    const sourceHash = createHash('sha256').update(readFileSync(metadata.sourcePath)).digest('hex')
    assert.equal(sourceHash, review.sourceSha256, `Fonte mudou após revisão: ${review.id}`)
    assert.equal(packing[review.id].fileHash, sourceHash, `Atlas desatualizado: ${review.id}`)
    assert.equal(packing[review.id].metadataHash, createHash('sha256').update(JSON.stringify(metadata)).digest('hex'))
    assert.deepEqual(packing[review.id].selectedFrames, review.selectedFrames, review.id)
    assert.equal(packing[review.id].illustration.cycle, metadata.cycle ?? 'return')
  }
})

test('artes WebP entram no precache para a demonstração continuar disponível offline', () => {
  assert.match(readFileSync('vite.config.ts', 'utf8'), /globPatterns:[^\n]*webp/)
})
