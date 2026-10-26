import assert from 'node:assert/strict'
import { createTimer, advanceTimer, pauseTimer, resumeTimer, restoreTimer } from '../src/lib/pelvicTimer'
import { pelvicPrograms } from '../src/data/pelvicPrograms'
const phases = [{ kind: 'prepare' as const, seconds: 2 }, { kind: 'contract' as const, seconds: 2 }, { kind: 'relax' as const, seconds: 3 }, { kind: 'rest' as const, seconds: 1 }]
const t = createTimer('test', phases, 1000)
assert.equal(advanceTimer(t, 3500).phaseIndex, 1)
const paused = pauseTimer(t, 2000)
assert.equal(advanceTimer(paused, 999999).elapsedMs, 1000)
assert.equal(advanceTimer(resumeTimer(paused, 10000), 11000).phaseIndex, 1)
assert.equal(restoreTimer(t).status, 'paused')
assert.equal(advanceTimer(t, 0).elapsedMs, 0)
assert.equal(advanceTimer(t, NaN).status, 'paused')
assert.equal(advanceTimer(t, 10000).status, 'completed')
assert.deepEqual(advanceTimer(advanceTimer(t, 10000), 20000), advanceTimer(t, 10000))
assert.throws(() => createTimer('bad', [{ kind: 'rest', seconds: -1 }], 1000))
assert.ok(pelvicPrograms.filter(p => p.kind === 'contraction').every(p => p.reviewStatus === 'pending-professional-review' && !p.available))
assert.ok(pelvicPrograms.filter(p => p.available).every(p => p.phases.every(f => f.kind !== 'contract')))
console.log('Pelvic timer: phase anchors, pause, restore, invalid clocks, completion, review gate OK')
