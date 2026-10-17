import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { EXERCISES } from '../src/data/exercises'
import { MOVEMENT_DEMOS } from '../src/data/movementDemos'
import { inkFigurePaths } from '../src/lib/inkFigure'
import ExerciseDemo from '../src/components/ExerciseDemo'
import BodyPlate from '../src/components/BodyPlate'
import ExerciseEquipment from '../src/components/ExerciseEquipment'
import { EXERCISE_ILLUSTRATIONS } from '../src/data/exerciseIllustrations'

test('catálogo inteiro tem execução ilustrada, sem mídia externa', () => {
  assert.equal(Object.keys(MOVEMENT_DEMOS).length, EXERCISES.length)
  for (const exercise of EXERCISES) {
    const demo = MOVEMENT_DEMOS[exercise.id]
    assert.ok(demo, exercise.id)
    const html = renderToStaticMarkup(createElement(ExerciseDemo, { exerciseId: exercise.id, name: exercise.name }))
    assert.match(html, /Demonstração ilustrada/)
    assert.ok(EXERCISE_ILLUSTRATIONS[exercise.id], `Arte do catálogo ausente: ${exercise.id}`)
    assert.match(html, /\/media\/(pilots|catalog)\//)
    assert.ok(!html.includes('<svg') && !html.includes('<video') && !/https?:/.test(html), 'Personagem usa atlas locais')
    assert.ok(demo.hold ? !html.includes('<animate') : html.includes('Reproduzir demonstração'))
  }
})

test('poses preservam topologia e coordenadas finitas ao animar contornos', () => {
  for (const [id, demo] of Object.entries(MOVEMENT_DEMOS)) {
    const start = inkFigurePaths(demo.start), end = inkFigurePaths(demo.end)
    assert.deepEqual(start.map((part) => part.id), end.map((part) => part.id), id)
    for (let index = 0; index < start.length; index++) {
      assert.ok(!/NaN|Infinity/.test(start[index].d + end[index].d), id)
      assert.deepEqual(start[index].d.match(/[A-Z]/g), end[index].d.match(/[A-Z]/g), `Interpolação inválida: ${id}`)
    }
    assert.ok(start.some((part) => part.material === 'cloth'))
    assert.ok(start.some((part) => part.material === 'shoe'))
  }
})

test('figura anatômica mantém identificação muscular e hachura original', () => {
  const html = renderToStaticMarkup(createElement(BodyPlate, { primary: 'peito', secondary: ['triceps'] }))
  assert.match(html, /rg pri/)
  assert.match(html, /rg sec/)
  assert.match(html, /pattern/)
  assert.match(html, /ink-contour/)
})

test('exercícios específicos preservam apoios, âncoras e execução unilateral', () => {
  const demos = MOVEMENT_DEMOS
  assert.ok(demos['triceps-elastico'].equipment!.anchor![1] < 20)
  for (const id of ['rosca-polia', 'elevacao-lateral-polia']) assert.ok(demos[id].equipment!.anchor![1] > 140)
  assert.equal(demos['flexora-elastico'].equipment!.anchorAt, 'feet')
  assert.equal(demos['flexora-elastico'].start.torso, demos['rosca-martelo'].start.torso)
  assert.equal(demos['coice-polia'].equipment!.anchorAt, 'feet')
  assert.equal(demos['abducao-elastico'].equipment!.loopAt, 'knees')
  assert.equal(demos['rosca-alternada'].start.otherArm, demos['rosca-alternada'].end.otherArm)
  assert.notEqual(demos['rosca-alternada'].start.arm, demos['rosca-alternada'].end.arm)
  assert.ok(demos['mesa-flexora'].equipment!.bench)
  assert.ok(demos['cadeira-extensora'].equipment!.bench)
  for (const id of ['band-pull-apart', 'abducao-elastico']) {
    const html = renderToStaticMarkup(createElement(ExerciseEquipment, { demo: demos[id] }))
    assert.match(html, /ink-band/)
    assert.match(html, /<animate/)
  }
  assert.equal(demos['panturrilha-corporal'].end.toeSupport, 'leg')
  assert.notEqual(demos['panturrilha-corporal'].start.leg, demos['panturrilha-corporal'].start.otherLeg)
  for (const id of ['prancha', 'prancha-joelhos', 'prancha-lateral', 'prancha-lateral-joelhos']) {
    const [shoulder, elbow] = demos[id].start.arm.split(' ').map(p => p.split(',').map(Number))
    assert.ok(Math.hypot(elbow[0] - shoulder[0], elbow[1] - shoulder[1]) < 45, id)
  }
})
