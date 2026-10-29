import assert from 'node:assert/strict'
import { byId } from '../src/data/exercises'
import { maximumInputLoad } from '../src/lib/setInputLimits'
import { dialValue } from '../src/lib/numberDial'
assert.equal(dialValue(161.59, 0, true, 600), 162)
assert.equal(dialValue(2000, 0, true, 600), 600)
assert.equal(dialValue(31, 0, true, 30), 30)
assert.equal(dialValue(0, 0, true, 30), 0)
assert.equal(dialValue(90, 1, true), 90, 'timed exercises preserve seconds')
assert.equal(maximumInputLoad(byId.get('leg-press')!), 600)
assert.equal(maximumInputLoad(byId.get('supino-halteres')!), 100)
assert.equal(maximumInputLoad(byId.get('leg-press')!, [650]), 780, 'existing heavier loads remain reachable')
console.log('Set input limits OK')
