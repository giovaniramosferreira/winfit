import assert from 'node:assert/strict'
import { profileWithEquipment } from '../src/lib/profilePreferences'
import type { TrainingProfile } from '../src/types'
const initial: TrainingProfile = { goal:'health', experience:'little',currentState:'active', location:'gym_full', equipment:['barra','halteres'],frequency:3,sessionTimeMin:45,limitations:['joelho'],biometrics:{},version:1 }
const original = structuredClone(initial)
const edited = profileWithEquipment(initial,'gym_basic',['halteres','halteres'])
assert.deepEqual(edited.equipment,['halteres','peso_corporal'])
assert.equal(edited.location,'gym_basic')
assert.deepEqual(edited.limitations,initial.limitations)
assert.equal(edited.goal,initial.goal)
assert.deepEqual(profileWithEquipment(initial,'home_none',['barra']).equipment,['peso_corporal'])
assert.ok(profileWithEquipment(initial,'gym_full',[]).equipment.includes('polia'))
assert.deepEqual(initial,original,'Preparing or cancelling edits leaves current profile intact')
console.log('Profile equipment: explicit location, deduplication, preservation and immutable draft OK')
