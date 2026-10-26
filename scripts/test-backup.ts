import assert from 'node:assert/strict'
import { useStore } from '../src/lib/store'
import { parseWorkoutBackup, mergeWorkouts } from '../src/lib/backup'
import type { TrainingProfile } from '../src/types'

const profile: TrainingProfile = { goal: 'health', experience: 'intermediate', currentState: 'active',
  location: 'gym_full', equipment: [], frequency: 3, sessionTimeMin: 45,
  limitations: [], biometrics: {}, version: 1 }
useStore.getState().completeOnboarding(profile)
useStore.getState().startSession(useStore.getState().plan!.days[0].id)
useStore.getState().logSet(0, 7.25, 12)
const before = useStore.getState().activeSession!
const snapshot = parseWorkoutBackup(JSON.parse(useStore.getState().exportData()))
assert.deepEqual(snapshot.activeSession, before, 'Export includes active workout and rest')
const old = { app: 'winfit', profile, plan: useStore.getState().plan, sessions: [], prs: [], archivedPlans: [] }
useStore.getState().importCloudData(old)
assert.deepEqual(useStore.getState().activeSession, before, 'Legacy cloud import preserves active workout')
const merged = mergeWorkouts(snapshot, parseWorkoutBackup({ ...old, sessions: [{ ...before, id: 'remote', status: 'partial' }] }))
assert.equal(merged.sessions.length, 1)
assert.deepEqual(merged.activeSession, before)
assert.deepEqual(mergeWorkouts(merged, merged), merged, 'Reconciliation is idempotent')
const differentActive = { ...snapshot, activeSession: { ...before, id: 'other-active' } }
const activeConflict = mergeWorkouts(snapshot, differentActive)
assert.equal(activeConflict.activeSession!.id, before.id)
assert.equal(activeConflict.sessions.find((s) => s.id === 'other-active')!.status, 'partial', 'Other active workout is recovered, not lost')
const completed = { ...snapshot, activeSession: null, sessions: [{ ...before, status: 'completed' as const, timer: null }] }
assert.equal(mergeWorkouts(completed, snapshot).activeSession, null, 'Completed workouts cannot be resurrected')
assert.throws(() => parseWorkoutBackup({ ...old, sessions: [completed.sessions[0], completed.sessions[0]] }), 'Duplicate session IDs rejected')
for (const bad of [{ schemaVersion: 999 }, { app: 'other' }, { sessions: [{}] }, { profile: { frequency: 'oops' } },
  { ...old, activeSession: { ...before, currentIndex: 999 } }, { ...old, plan: { days: [] } }]) {
  assert.throws(() => parseWorkoutBackup(bad), 'Malformed backup is rejected')
}
const original = JSON.stringify(useStore.getState().activeSession)
assert.throws(() => useStore.getState().importCloudData({ sessions: [{}] }))
assert.equal(JSON.stringify(useStore.getState().activeSession), original)
console.log('Backup: legacy migration, active rest preserved, union, idempotence, invalid input rejection OK')
