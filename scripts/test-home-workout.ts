import assert from 'node:assert/strict'
import { useStore } from '../src/lib/store'
import { byId } from '../src/data/exercises'
import { homeWorkout } from '../src/lib/homeWorkout'
import type { Limitation, TrainingProfile } from '../src/types'

const profile: TrainingProfile = {
  goal: 'hypertrophy', experience: 'intermediate', currentState: 'active',
  location: 'gym_full', equipment: [], frequency: 4, sessionTimeMin: 45,
  limitations: ['punho'], biometrics: {}, version: 1,
}
useStore.getState().completeOnboarding(profile)
const original = JSON.stringify(useStore.getState().plan)
const limits: Limitation[] = ['joelho', 'lombar', 'ombro', 'punho']
for (let mask = 0; mask < 16; mask++) {
  const p = { ...profile, limitations: limits.filter((_, i) => mask & (1 << i)) }
  const generated = homeWorkout(p, useStore.getState().plan!, 'test', [])
  for (const day of generated.plan.days) {
    assert.ok(day.exercises.length > 0)
    assert.ok(day.estMin <= 30 * 1.15)
    for (const item of day.exercises) {
      const ex = byId.get(item.exerciseId)!
      assert.deepEqual(ex.equipment, ['peso_corporal'])
      assert.ok(!ex.contraindications.some((lim) => p.limitations.includes(lim)))
      assert.ok(!['remada-toalha', 'flexora-deslizante', 'flexao-inclinada', 'flexao-declinada', 'panturrilha-corporal'].includes(ex.id))
    }
  }
}
assert.equal(typeof useStore.getState().startHomeSession, 'function', 'Deve iniciar treino em casa')
useStore.getState().startHomeSession()
const home = useStore.getState().activeSession!
assert.equal(home.source, 'home')
assert.notEqual(home.planId, useStore.getState().plan!.id)
assert.ok(home.exercises.length > 0)
for (const item of home.exercises) {
  const ex = byId.get(item.exerciseId)!
  assert.deepEqual(ex.equipment, ['peso_corporal'])
  assert.ok(!ex.contraindications.includes('punho'))
  assert.ok(!['remada-toalha', 'flexora-deslizante', 'flexao-inclinada', 'flexao-declinada', 'panturrilha-corporal'].includes(ex.id))
}
useStore.getState().logSet(0, 0, 12)
useStore.getState().startSession(useStore.getState().plan!.days[0].id)
useStore.getState().startHomeSession()
assert.equal(useStore.getState().activeSession!.id, home.id, 'Não sobrescrever treino em andamento')
assert.equal(useStore.getState().activeSession!.logs.length, 1)
const beforeSwap = JSON.stringify(useStore.getState().activeSession!.exercises)
useStore.getState().substitute(0, 'supino-reto-barra', 'today')
assert.equal(JSON.stringify(useStore.getState().activeSession!.exercises), beforeSwap, 'Bloquear equipamento da academia')
await useStore.persist.rehydrate()
assert.equal(useStore.getState().activeSession!.source, 'home')
assert.equal(useStore.getState().activeSession!.logs.length, 1)
assert.equal(useStore.getState().resumeOrExpireSession(), 'resumable')
useStore.getState().finishSession()
assert.equal(useStore.getState().sessions[0].source, 'home')
assert.equal(JSON.stringify(useStore.getState().plan), original)
assert.deepEqual(useStore.getState().profile, profile)
useStore.getState().startSession(useStore.getState().plan!.days[0].id)
assert.equal(useStore.getState().activeSession!.planId, useStore.getState().plan!.id)
const gymId = useStore.getState().activeSession!.id
useStore.getState().startHomeSession()
assert.equal(useStore.getState().activeSession!.id, gymId, 'Não sobrescrever treino de academia')
console.log('Treino em casa: filtros, histórico, retomada e plano preservado OK')
