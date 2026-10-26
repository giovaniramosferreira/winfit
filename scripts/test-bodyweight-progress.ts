import assert from 'node:assert/strict'
import { exerciseProgressSeries } from '../src/lib/progression'
const session = (startedAt: number, exerciseId: string, weight: number, reps: number) => ({ startedAt, status: 'completed', logs: [{ exerciseId, weight, reps }] }) as any
const logs = [session(2, 'flexao', 0, 15), session(1, 'flexao', 0, 10), session(3, 'prancha', 0, 40), session(4, 'flexao-joelhos', 0, 30)]
assert.equal(exerciseProgressSeries('flexao', logs).unit, 'reps')
assert.deepEqual(exerciseProgressSeries('flexao', logs).points.map(p => p.value), [10, 15])
assert.equal(exerciseProgressSeries('prancha', logs).unit, 'seg')
assert.deepEqual(exerciseProgressSeries('prancha', logs).points.map(p => p.value), [40])
assert.deepEqual(exerciseProgressSeries('flexao-joelhos', logs).points.map(p => p.value), [30])
assert.equal(exerciseProgressSeries('supino-reto-halter', [session(1, 'supino-reto-halter', 10, 12)]).unit, 'kg')
assert.equal(exerciseProgressSeries('flexao', [session(1, 'flexao', 0, 10), session(2, 'flexao', 5, 8)]).unit, 'kg')
assert.deepEqual(exerciseProgressSeries('flexao', [session(1, 'flexao', 0, 10), session(2, 'flexao', 5, 8)]).points.map(p => p.value), [5])
assert.deepEqual(exerciseProgressSeries('unknown', logs).points, [])
console.log('Exercise progress: load, reps, seconds and separate variations OK')
