import assert from 'node:assert/strict'
import { MAX_IDLE_GAP_MS, sessionActiveMs } from '../src/lib/helpers'

const MIN = 60_000
const log = (ts: number) => ({ ts })
const start = Date.UTC(2026, 10, 4, 18, 0)

// Treino normal: séries de 3 em 3 minutos; o tempo ativo é o tempo real.
const normal = { startedAt: start, endedAt: start + 45 * MIN, logs: [3, 6, 9, 12, 20, 30, 40].map((m) => log(start + m * MIN)) }
assert.equal(sessionActiveMs(normal), 45 * MIN)

// Treino deixado aberto por 14 h depois da última série: só conta o intervalo máximo permitido.
const forgotten = { startedAt: start, endedAt: start + 14 * 60 * MIN, logs: [5, 10, 20, 35].map((m) => log(start + m * MIN)) }
assert.equal(sessionActiveMs(forgotten), 35 * MIN + MAX_IDLE_GAP_MS)
assert.ok(sessionActiveMs(forgotten)! < 60 * MIN)

// Pausa longa no meio (almoço) não entra por inteiro.
const paused = { startedAt: start, endedAt: start + 4 * 60 * MIN, logs: [5, 10, 200, 205].map((m) => log(start + m * MIN)) }
assert.equal(sessionActiveMs(paused), 10 * MIN + MAX_IDLE_GAP_MS + 5 * MIN + MAX_IDLE_GAP_MS)

// Sem séries: no máximo o intervalo permitido; sem fim: null; fim antes do início: null.
assert.equal(sessionActiveMs({ startedAt: start, endedAt: start + 3 * 60 * 60 * MIN, logs: [] }), MAX_IDLE_GAP_MS)
assert.equal(sessionActiveMs({ startedAt: start, logs: [log(start + MIN)] }), null)
assert.equal(sessionActiveMs({ startedAt: start, endedAt: start - 1, logs: [] }), null)

// Séries fora do intervalo (backup antigo) são limitadas ao início e ao fim; nunca excede o tempo bruto.
const odd = { startedAt: start, endedAt: start + 20 * MIN, logs: [log(start - 99 * MIN), log(start + 999 * MIN)] }
assert.ok(sessionActiveMs(odd)! <= 20 * MIN)

// Resultado nunca passa do tempo bruto.
for (const s of [normal, forgotten, paused, odd]) assert.ok(sessionActiveMs(s)! <= s.endedAt - s.startedAt)
console.log('Session duration: active time ignores forgotten and idle gaps OK')
