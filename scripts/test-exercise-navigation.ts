import assert from 'node:assert/strict'
import { useStore } from '../src/lib/store'
import type { TrainingProfile } from '../src/types'

const data = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: (key: string) => data.get(key) ?? null,
  setItem: (key: string, value: string) => data.set(key, value),
  removeItem: (key: string) => data.delete(key),
} })
const profile: TrainingProfile = {
  goal: 'hypertrophy', experience: 'intermediate', currentState: 'active',
  location: 'gym_full', equipment: [], frequency: 4, sessionTimeMin: 45,
  limitations: [], biometrics: {}, version: 1,
}
useStore.getState().completeOnboarding(profile)
useStore.getState().startSession(useStore.getState().plan!.days[0].id)
useStore.getState().logSet(0, 20, 10)
const before = useStore.getState().activeSession!
assert.ok(before.exercises.length > 1)
const last = before.exercises.length - 1
for (const index of [last, 0, 1, 0]) {
  useStore.getState().setCurrentIndex(index)
  const session = useStore.getState().activeSession!
  assert.equal(session.currentIndex, index)
  assert.deepEqual(session.logs, before.logs, 'Navigation preserves sets')
  assert.deepEqual(session.timer, before.timer, 'Navigation preserves rest deadline')
}
for (const index of [-1, before.exercises.length, 0.5, NaN, Infinity]) {
  const session = useStore.getState().activeSession
  useStore.getState().setCurrentIndex(index)
  assert.equal(useStore.getState().activeSession, session, 'Invalid index is ignored')
}
useStore.getState().skipExercise(1)
useStore.getState().setCurrentIndex(1)
useStore.getState().logSet(1, 10, 8)
assert.equal(useStore.getState().activeSession!.exercises[1].skipped, false,
  'Registering a set after returning resumes a skipped exercise')
assert.equal(useStore.getState().activeSession!.logs.length, 2)
console.log('Exercise navigation: sets, rest, boundaries and skipped exercise return OK')
