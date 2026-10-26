import assert from 'node:assert/strict'
import { adaptationWarnings, applyFutureDay, buildAssistantContext, localExplanation, proposeAdaptation } from '../src/lib/assistantContext'
import { EXERCISES } from '../src/data/exercises'
assert.match(localExplanation('Treino curto', false), /Ative/)
assert.match(localExplanation('Treino curto', true), /local/)
const day = { exercises: [{ id: 'a', optional: false, sets: 3, restSec: 60 }, { id: 'b', optional: true, sets: 3, restSec: 60 }], estMin: 45 } as any
assert.equal(proposeAdaptation(day, 20).exercises.length, 1)
assert.ok(proposeAdaptation(day, 20).estMin < proposeAdaptation(day, 60).estMin, 'Estimate includes actual remaining sets and rests')
assert.equal(day.exercises.length, 2)
assert.equal(proposeAdaptation(day, 60).exercises.length, 2)
const profile = { equipment: ['peso_corporal'], limitations: [], location: 'home_none' } as any
const unsupported = EXERCISES.find((ex) => ex.id === 'flexao-inclinada')!
const unsupportedDay = { id: 'day', estMin: 20, exercises: [{ id: 'entry', exerciseId: unsupported.id, slotType: unsupported.slotTypes[0], optional: false, sets: 3 }] } as any
const proposal = proposeAdaptation(unsupportedDay, 20, profile, ['peso_corporal'])
if (proposal.exercises[0].exerciseId === unsupported.id) assert.equal(adaptationWarnings(proposal, profile, ['peso_corporal']).length, 1)
else assert.equal(adaptationWarnings(proposal, profile, ['peso_corporal']).length, 0)
assert.equal(applyFutureDay({ days: [unsupportedDay] } as any, { ...proposal, id: 'other' }), null)
assert.equal(applyFutureDay({ days: [unsupportedDay] } as any, { ...proposal, exercises: [] }), null)
assert.equal(applyFutureDay({ days: [unsupportedDay] } as any, proposal)?.days[0], proposal)
const context = buildAssistantContext(null, [], null)
assert.match(context, /Perfil não informado/)
assert.match(context, /Plano atual não disponível/)
const limited = buildAssistantContext(null, [1, 2, 3, 4].map(n => ({ id: String(n), dayLabel: `Treino ${n}`, startedAt: n, status: 'completed', logs: [] })) as any, null)
assert.match(limited, /Treino 4/)
assert.doesNotMatch(limited, /Treino 1/)
console.log('Explicit assistant opt-in and immutable adaptation proposal OK')
