import assert from 'node:assert/strict'
const disk = new Map<string, string>()
let failWorkoutWrite = false
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: (key: string) => disk.get(key) ?? null,
  setItem: (key: string, value: string) => { if (failWorkoutWrite && key === 'winfit-v1') throw Error('QuotaExceededError'); disk.set(key, value) },
  removeItem: (key: string) => disk.delete(key),
} })
const { applicationSnapshot, parseApplicationBackup, mergeApplications, applyApplicationBackup } = await import('../src/lib/applicationBackup')
const { useStore } = await import('../src/lib/store')
const { nutritionStore } = await import('../src/lib/nutritionStore')
useStore.getState().completeOnboarding({ goal:'health',experience:'intermediate',currentState:'active',location:'gym_full',equipment:[],frequency:3,sessionTimeMin:45,limitations:[],biometrics:{},version:1 })
useStore.getState().startSession(useStore.getState().plan!.days[0].id)
useStore.getState().logSet(0,7.25,12)
nutritionStore.upsertMeal({ id:'meal',date:'2026-10-26',time:'12:00',type:'Almoço',items:[{id:'food',name:'Arroz',portion:null,kcal:null}] })
const local = applicationSnapshot()
assert.deepEqual(parseApplicationBackup(JSON.stringify(local)),local)
const remote = structuredClone(local)
remote.modules!.routine!.entries.push({ id:'remote-entry',ts:1,energy:3,note:'fictício' })
remote.modules!.routine!.checklists.casa.push({ id:'remote-item',text:'Garrafa',done:false })
remote.modules!.nutrition!.meals[0].id = 'remote-meal'
const merged = mergeApplications(local,remote)
assert.equal(merged.modules!.nutrition!.meals.length,2)
assert.equal(merged.modules!.routine!.entries.length,1)
assert.equal(merged.modules!.routine!.checklists.casa.length,1)
assert.deepEqual(mergeApplications(merged,remote),merged)
const oldState = useStore.getState()
failWorkoutWrite = true
assert.throws(() => applyApplicationBackup(merged,remote), /salvar os treinos/)
assert.deepEqual(useStore.getState().activeSession,oldState.activeSession,'Quota rollback restores in-memory workout')
assert.equal(nutritionStore.getState().meals.length,1,'Other module rolled back on workout quota failure')
assert.ok(disk.has('winfit-recovery-v2'),'Both originals retained for recovery')
failWorkoutWrite = false
applyApplicationBackup(merged,remote)
assert.equal(nutritionStore.getState().meals.length,2)
assert.equal(JSON.parse(disk.get('winfit-recovery-v2')!).incoming.modules.nutrition.meals[0].id,'remote-meal')
assert.throws(()=>parseApplicationBackup({...local,modules:{nutrition:{version:999}}}))
console.log('Application backup: module union, original recovery, validated import and quota rollback OK')
