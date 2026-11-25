import assert from 'node:assert/strict'
import { BODY_KEY, DEFAULT_SETTINGS, createBodyStore, parseBodyState } from '../src/lib/bodyMetricsStore'

let raw: string | null = null
const mem = { getItem: () => raw, setItem: (_: string, v: string) => { raw = v }, removeItem: () => { raw = null } }
let store = createBodyStore(mem)
assert.equal(store.getState().blocked, false)
assert.equal(store.getState().settings.activity, 'light')

// pesagens: valida, substitui no mesmo dia, ordena, apaga
assert.equal(store.upsertWeight('2026-11-02', 80), true)
assert.equal(store.upsertWeight('2026-11-01', 81), true)
assert.equal(store.upsertWeight('2026-11-02', 79.5), true, 'mesmo dia substitui')
assert.deepEqual(store.getState().weights, [{ date: '2026-11-01', kg: 81 }, { date: '2026-11-02', kg: 79.5 }])
assert.equal(store.upsertWeight('2026-02-30', 80), false, 'data inexistente')
assert.match(store.getState().error ?? '', /inválid/)
assert.equal(store.upsertWeight('2026-11-03', 5), false, 'peso fora da faixa')
assert.equal(store.upsertWeight('2026-11-03', NaN), false)
assert.equal(store.getState().weights.length, 2, 'falha não altera o estado')
assert.equal(store.deleteWeight('2026-11-01'), true)
assert.equal(store.getState().weights.length, 1)

// ajustes
assert.equal(store.setSettings({ sex: 'm', age: 30, heightCm: 180, kind: 'lose', activity: 'moderate' }), true)
assert.equal(store.setSettings({ age: 5 }), false)
assert.equal(store.setSettings({ weeklyChangeKg: 3 }), false)
assert.equal(store.setSettings({ pinned: { protein: -1 } }), false)
assert.equal(store.setSettings({ pinned: { protein: 150 } }), true)
assert.equal(store.getState().settings.age, 30)
assert.equal(store.setStreakRule('gentle'), true)
assert.equal(store.setStreakRule('xyz' as never), false)
assert.equal(store.setWeekStart('sun'), true)
assert.equal(store.markStreakSeen(4), true)
assert.equal(store.markStreakSeen(4), true)
assert.deepEqual(store.getState().streakSeen, [4], 'sem marcos repetidos')

// persistência: outra instância lê o mesmo
store = createBodyStore(mem)
assert.equal(store.getState().settings.kind, 'lose')
assert.equal(store.getState().weekStart, 'sun')
assert.equal(store.getState().weights.length, 1)

// notificações
let n = 0
const off = store.subscribe(() => n++)
store.upsertWeight('2026-11-04', 78); off(); store.upsertWeight('2026-11-05', 78)
assert.equal(n, 1)

// falha de gravação mantém o estado anterior
const failing = createBodyStore({ ...mem, setItem: () => { throw Error('quota') } })
assert.equal(failing.upsertWeight('2026-11-06', 70), false)
assert.equal(failing.getState().weights.length, 3, 'estado anterior preservado (lido do disco)')
assert.match(failing.getState().error ?? '', /salvar/)

// dados corrompidos: bloqueia, preserva o bruto e só o reset libera
raw = '{quebrado'
store = createBodyStore(mem)
assert.equal(store.getState().blocked, true)
assert.equal(store.upsertWeight('2026-11-06', 70), false)
assert.equal(raw, '{quebrado', 'o conteúdo ilegível não foi sobrescrito')
assert.equal(store.exportData(), '{quebrado')
assert.equal(store.reset(), true)
assert.equal(store.getState().blocked, false)
raw = JSON.stringify({ version: 2 })
assert.equal(createBodyStore(mem).getState().blocked, true, 'versão desconhecida bloqueia')

// parser estrito
const good = { version: 1, settings: { ...DEFAULT_SETTINGS }, weights: [], streakRule: 'generous', weekStart: 'mon', streakSeen: [] }
assert.doesNotThrow(() => parseBodyState(good))
assert.throws(() => parseBodyState({ ...good, weights: [{ date: '2026-11-01', kg: 80 }, { date: '2026-11-01', kg: 81 }] }), /pesagem/, 'dia duplicado')
assert.throws(() => parseBodyState({ ...good, settings: { ...DEFAULT_SETTINGS, sex: 'x' } }))
assert.throws(() => parseBodyState({ ...good, settings: { ...DEFAULT_SETTINGS, activity: 'turbo' } }))
assert.throws(() => parseBodyState({ ...good, streakSeen: [0] }))
assert.throws(() => parseBodyState(null))
assert.equal(BODY_KEY, 'winfit-body-v1')

console.log('body store: pesagens, ajustes, persistência, falhas e dados corrompidos OK')
