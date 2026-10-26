import assert from 'node:assert/strict'
import { localExplanation, proposeAdaptation } from '../src/lib/assistantContext'
assert.match(localExplanation('Treino curto', false), /Ative/)
assert.match(localExplanation('Treino curto', true), /local/)
const day = { exercises: [{ id: 'a', optional: false }, { id: 'b', optional: true }], estMin: 45 } as any
assert.equal(proposeAdaptation(day, 20).exercises.length, 1)
assert.equal(day.exercises.length, 2)
assert.equal(proposeAdaptation(day, 60).exercises.length, 2)
console.log('Explicit assistant opt-in and immutable adaptation proposal OK')
