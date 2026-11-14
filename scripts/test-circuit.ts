import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cardioCoreCircuit as program } from '../src/data/circuits'
import {
  advanceCircuit, buildPhases, createCircuitTimer, pauseCircuit, positionAt, resolveMove, resumeCircuit, roundsDone, skipCircuitPhase,
  suggestProgression, totalSeconds, workDoneMs, workSeconds, type CircuitSettings,
} from '../src/lib/circuit'
import { CIRCUIT_STORAGE_KEY, createCircuitStore, validateCircuitData } from '../src/lib/circuitStore'
import { EXERCISES } from '../src/data/exercises'

const advanced: CircuitSettings = { level: 'advanced', rounds: 1, lowImpact: false, warmup: false }

test('sequência e tempos do circuito original', () => {
  assert.deepEqual(program.moves.map((m) => m.id), ['polichinelo', 'rotacao-russa', 'elevacao-pernas', 'abdominal-estrela', 'prancha-giro', 'escalador', 'chute-sentado', 'bicicleta', 'joelho-alto'])
  const phases = buildPhases(program, advanced, [])
  assert.equal(workSeconds(phases), 9 * 45, '9 × 45 s = 6 min 45 s de trabalho')
  assert.equal(phases.filter((p) => p.kind === 'rest').length, 8, 'descanso entre estações, não depois da última')
  assert.equal(totalSeconds(phases), 10 + 9 * 45 + 8 * 15)
  assert.ok(phases.every((p) => !p.modified), 'avançado sem limitações usa as versões originais')
  // A volta em si cabe nos ~10 min do título; aquecimento (2–3 min) e desaquecimento vêm à parte.
  const full = totalSeconds(buildPhases(program, { ...advanced, warmup: true }, []))
  assert.equal(full - totalSeconds(phases), 5 * 30 + 4 * 30)
})

test('voltas extras têm descanso entre voltas e contam separadamente', () => {
  const phases = buildPhases(program, { ...advanced, rounds: 3 }, [])
  assert.equal(phases.filter((p) => p.kind === 'work').length, 27)
  assert.equal(phases.filter((p) => p.kind === 'round_rest').length, 2)
  const endOfRound1 = (10 + 9 * 45 + 8 * 15) * 1000
  assert.equal(roundsDone(phases, endOfRound1 - 1), 0)
  assert.equal(roundsDone(phases, endOfRound1), 1)
  assert.equal(roundsDone(phases, totalSeconds(phases) * 1000), 3)
})

test('versões modificadas: iniciante, baixo impacto e limitações do perfil', () => {
  const by = (id: string) => program.moves.find((m) => m.id === id)!
  assert.ok(program.moves.every((m) => resolveMove(m, { ...advanced, level: 'beginner' }, []).modified), 'iniciante modifica todas')
  const low = { ...advanced, lowImpact: true }
  assert.deepEqual(program.moves.filter((m) => resolveMove(m, low, []).modified).map((m) => m.id), ['polichinelo', 'joelho-alto'])
  assert.equal(resolveMove(by('polichinelo'), low, []).name, 'Polichinelo sem salto')
  assert.equal(resolveMove(by('joelho-alto'), advanced, ['joelho']).name, 'Marcha alta com toque')
  assert.deepEqual(resolveMove(by('elevacao-pernas'), advanced, ['lombar']).reasons, ['limitation'])
  assert.ok(resolveMove(by('escalador'), advanced, ['ombro']).modified)
  assert.ok(!resolveMove(by('escalador'), advanced, ['lombar']).modified)
  // Iniciante: 20–30 s de trabalho, com mais descanso que o avançado.
  assert.ok(program.levels.beginner.workSec >= 20 && program.levels.beginner.workSec <= 30)
  assert.ok(program.levels.beginner.restSec > program.levels.advanced.restSec)
  // Sem equipamento e fora do catálogo principal (gerador e artes não mudam).
  const ids = new Set(EXERCISES.map((e) => e.id))
  assert.ok(program.moves.every((m) => !ids.has(m.id)))
})

test('cronômetro com âncora absoluta, pausa e pular', () => {
  const phases = buildPhases(program, advanced, [])
  let t = createCircuitTimer('a', phases, 1000)
  t = advanceCircuit(t, 1000 + 12_000)
  assert.deepEqual(positionAt(phases, t.elapsedMs).index, 1, 'depois do preparo de 10 s vem o polichinelo')
  assert.equal(positionAt(phases, t.elapsedMs).remainingSec, 43)
  t = pauseCircuit(t, 1000 + 20_000)
  assert.equal(advanceCircuit(t, 1000 + 999_000).elapsedMs, 20_000, 'pausado não avança')
  t = resumeCircuit(t, 50_000)
  t = skipCircuitPhase(t, phases, 50_000)
  assert.equal(positionAt(phases, t.elapsedMs).index, 2)
  assert.equal(t.skippedWorkMs, 35_000)
  assert.equal(workDoneMs(phases, t), 10_000, 'trabalho pulado não conta')
  t = advanceCircuit(t, 50_000 + 10 ** 7)
  assert.equal(t.status, 'completed')
  assert.equal(advanceCircuit(createCircuitTimer('b', phases, 5000), 4000).status, 'paused', 'relógio para trás pausa')
})

test('progressão depois de duas sessões completas', () => {
  const planned = 9 * 25_000
  const done = (endedAt: number, settings: CircuitSettings, workMs = planned) => ({ status: 'completed' as const, settings, workMs, plannedWorkMs: planned, endedAt })
  const beginner: CircuitSettings = { ...advanced, level: 'beginner' }
  assert.equal(suggestProgression(program, [done(1, beginner)], beginner), null)
  assert.equal(suggestProgression(program, [done(1, beginner), done(2, beginner, planned / 2)], beginner), null, 'pulou demais')
  assert.equal(suggestProgression(program, [done(1, beginner), done(2, beginner)], beginner)!.settings.level, 'intermediate')
  assert.equal(suggestProgression(program, [done(1, advanced), done(2, advanced)], advanced)!.settings.rounds, 2)
  const max = { ...advanced, rounds: 3 }
  assert.equal(suggestProgression(program, [done(1, max), done(2, max)], max), null)
})

test('store: aviso de saúde, reload pausado, registro, backup validado e reset', () => {
  const map = new Map<string, string>()
  const storage = { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => { map.set(k, v) }, removeItem: (k: string) => { map.delete(k) } }
  const store = createCircuitStore(storage)
  assert.equal(store.getState().start(program.id, [], 1000), false, 'exige aviso de saúde')
  store.getState().acknowledgeHealth(500)
  store.getState().setSettings({ level: 'advanced', warmup: false })
  store.getState().setSettings({ rounds: 9 })
  assert.equal(store.getState().settings.rounds, 1, 'ajuste inválido é ignorado')
  assert.equal(store.getState().start(program.id, ['joelho'], 1000), true)
  assert.equal(store.getState().start(program.id, [], 1000), false, 'não sobrescreve sessão ativa')
  store.getState().tick(31_000)
  const reloaded = createCircuitStore(storage)
  assert.equal(reloaded.getState().active!.timer.status, 'paused')
  assert.equal(reloaded.getState().active!.timer.elapsedMs, 30_000)
  reloaded.getState().resume(100_000)
  reloaded.getState().tick(100_000 + 10 ** 7)
  const [record] = reloaded.getState().history
  assert.equal(record.status, 'completed')
  assert.equal(record.workMs, 9 * 45_000)
  assert.equal(record.rounds, 1)
  assert.deepEqual(record.limitations, ['joelho'])
  reloaded.getState().start(program.id, [], 200_000)
  reloaded.getState().stop(215_000)
  assert.equal(reloaded.getState().history[0].status, 'interrupted')
  assert.equal(reloaded.getState().history[0].workMs, 5000)
  const backup = reloaded.getState().exportData()
  assert.deepEqual(validateCircuitData(JSON.parse(backup)), JSON.parse(backup))
  const forged = JSON.parse(backup); forged.history[0].workMs = 10 ** 9
  assert.equal(reloaded.getState().importData(JSON.stringify(forged)), false)
  assert.equal(reloaded.getState().exportData(), backup)
  assert.equal(reloaded.getState().importData(backup), true)
  map.set(CIRCUIT_STORAGE_KEY, '{broken')
  const broken = createCircuitStore(storage)
  assert.match(broken.getState().error!, /preservado/)
  assert.equal(broken.getState().exportData(), '{broken', 'exporta o original ilegível')
  broken.getState().setSignals(false, false)
  assert.equal(map.get(CIRCUIT_STORAGE_KEY), '{broken', 'não sobrescreve dados ilegíveis')
  broken.getState().resetAll()
  assert.equal(map.has(CIRCUIT_STORAGE_KEY), false)
  const failing = createCircuitStore({ ...storage, setItem() { throw new Error('quota') } })
  failing.getState().setSignals(true, false)
  assert.match(failing.getState().error!, /salvar/)
})
