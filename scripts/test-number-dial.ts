import assert from 'node:assert/strict'
import { dialMotion, dialValue } from '../src/lib/numberDial'

assert.equal(dialValue(7.25, 0), 7.25, 'Exact typed weights are preserved')
assert.equal(dialValue(-1, 0), 0)
assert.equal(dialValue(0, 1), 1)
assert.equal(dialValue(12.7, 1, true), 13, 'Reps and seconds are integers')
assert.equal(dialValue(Infinity, 0), null)
assert.equal(dialValue(NaN, 0), null)
assert.equal(dialMotion(8, 200, false), 0.1, 'Slow drag adjusts tenths of kg')
assert.equal(dialMotion(-8, 200, false), -0.1)
assert.ok(dialMotion(80, 40, false) > dialMotion(80, 1000, false), 'Fast gesture travels farther')
assert.equal(dialMotion(12, 200, true), 1)
assert.ok(Number.isFinite(dialMotion(20, 0, false)))
assert.equal(dialMotion(0, 100, false), 0)
let raw = 7.25
for (let i = 0; i < 8; i++) raw += dialMotion(1, 50, false)
assert.equal(dialValue(raw, 0), 7.35, 'Sub-pixel adjustments accumulate without being lost')
console.log('Number dial: fine drag, acceleration, bounds, precision and integer reps OK')
