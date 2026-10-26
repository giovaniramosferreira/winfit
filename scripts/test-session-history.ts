import assert from 'node:assert/strict'
import { historyRows } from '../src/lib/sessionHistory'
const rows = historyRows({ exercises: [{ planExerciseId: 'a', exerciseId: 'prancha', skipped: true, substitutedFrom: 'old' }], logs: [{ id: 'l', planExerciseId: 'a', exerciseId: 'prancha', weight: 0, reps: 30, setNumber: 1 }] } as any)
assert.equal(rows[0].logs[0].unit, 'seg')
assert.equal(rows[0].skipped, true)
assert.equal(rows[0].substitutedFrom, 'old')
assert.equal(historyRows({ exercises: [], logs: [{ id: 'x', exerciseId: 'unknown', reps: 8, weight: 2 }] } as any)[0].legacy, true)
assert.equal(historyRows({ logs: [{ id: 'x', exerciseId: 'unknown', reps: 8, weight: 2 }] } as any)[0].legacy, true)
assert.deepEqual(historyRows({} as any), [])
console.log('History snapshot, timed units and orphan legacy logs OK')
