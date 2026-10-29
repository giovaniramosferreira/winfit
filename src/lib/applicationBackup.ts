import { useStore } from './store'
import { sanitizeEquipmentFreePlan } from './generator'
import { mergeWorkouts, parseWorkoutBackup, type WorkoutBackup } from './backup'
import { exportNutritionData, importNutritionData, parseNutritionData, resetNutritionData } from './nutritionStore'
import { usePelvicStore, validatePelvicData } from './pelvicStore'
import { exportRoutineData, importRoutineData, resetRoutineData, validateRoutineData } from './routineStore'
import { getWorkoutStorageError, resetWorkoutStorageGuard, workoutStorage } from './workoutStorage'

export interface ApplicationBackup extends WorkoutBackup {
  modules?: { nutrition?: ReturnType<typeof parseNutritionData>; pelvic?: ReturnType<typeof validatePelvicData>; routine?: ReturnType<typeof exportRoutineData> }
}
export function applicationSnapshot(includeModules = true): ApplicationBackup {
  if (workoutStorage.health().blocked) throw Error('Treinos salvos ilegíveis. Exporte o conteúdo original pelo aviso de armazenamento.')
  const workout = parseWorkoutBackup(JSON.parse(useStore.getState().exportData()))
  return includeModules ? { ...workout, modules: {
    nutrition: parseNutritionData(exportNutritionData()), pelvic: validatePelvicData(JSON.parse(usePelvicStore.getState().exportData())), routine: exportRoutineData(),
  } } : workout
}
export function parseApplicationBackup(raw: unknown): ApplicationBackup {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
  const workout = parseWorkoutBackup(parsed)
  if (!parsed.modules) return workout
  const modules = parsed.modules
  if (typeof modules !== 'object' || Array.isArray(modules)) throw Error('Módulos do backup inválidos.')
  const result: ApplicationBackup = { ...workout, modules: {} }
  if (modules.nutrition) result.modules!.nutrition = parseNutritionData(JSON.stringify(modules.nutrition))
  if (modules.pelvic) result.modules!.pelvic = validatePelvicData(modules.pelvic)
  if (modules.routine) {
    const routine = validateRoutineData(modules.routine)
    if (!routine) throw Error('Rotina do backup inválida.')
    result.modules!.routine = routine
  }
  return result
}
export function mergeApplications(local: ApplicationBackup, remote: ApplicationBackup, options: { useBackupPlan?: boolean } = {}): ApplicationBackup {
  const result: ApplicationBackup = mergeWorkouts(local, remote)
  if (options.useBackupPlan) {
    result.profile = remote.profile
    result.plan = remote.plan
    result.archivedPlans = [...new Map([...result.archivedPlans, ...(local.plan ? [local.plan] : [])].map(p => [p.id,p])).values()].filter(p => p.id !== remote.plan?.id)
    if (local.activeSession && local.activeSession.id !== remote.activeSession?.id && !result.sessions.some(s => s.id === local.activeSession!.id)) {
      result.sessions.push({ ...local.activeSession, status:'partial', timer:null })
    }
    result.activeSession = remote.activeSession
  }
  result.modules = { ...remote.modules, ...local.modules }
  const ln = local.modules?.nutrition, rn = remote.modules?.nutrition
  if (ln && rn) {
    const items = new Map([...rn.meals.map((meal) => ({ meal, deleted: false })), ...rn.deleted.map((meal) => ({ meal, deleted: true })),
      ...ln.meals.map((meal) => ({ meal, deleted: false })), ...ln.deleted.map((meal) => ({ meal, deleted: true }))].map((item) => [item.meal.id, item]))
    result.modules.nutrition = { version: 1, meals: [...items.values()].filter((x) => !x.deleted).map((x) => x.meal),
      deleted: [...items.values()].filter((x) => x.deleted).map((x) => x.meal),
      goals: [...new Map([...rn.goals, ...ln.goals].map((goal) => [goal.date, goal])).values()] }
  }
  const lp = local.modules?.pelvic, rp = remote.modules?.pelvic
  if (lp && rp) {
    const history = new Map([...rp.history, ...lp.history].map((entry) => [entry.id, entry]))
    if (lp.active && rp.active && lp.active.timer.id !== rp.active.timer.id && !history.has(rp.active.timer.id)) {
      history.set(rp.active.timer.id, { id: rp.active.timer.id, programId: rp.active.programId, programVersion: rp.active.programVersion,
        startedAt: rp.active.startedAt, endedAt: Math.max(Date.now(), rp.active.startedAt), elapsedMs: rp.active.timer.elapsedMs, status: 'interrupted' })
    }
    const active = lp.active ?? rp.active
    result.modules.pelvic = { ...lp, active: active && !history.has(active.timer.id) ? active : null, history: [...history.values()] }
  }
  const lr = local.modules?.routine, rr = remote.modules?.routine
  if (lr && rr) {
    const checklists = { ...rr.checklists }
    for (const [place, items] of Object.entries(lr.checklists)) checklists[place] = [...new Map([...(rr.checklists[place] ?? []), ...items].map((item) => [item.id, item])).values()]
    result.modules.routine = { ...lr, checklists, delivered: [...new Set([...rr.delivered, ...lr.delivered])],
      entries: [...new Map([...rr.entries, ...lr.entries].map((item) => [item.id, item])).values()] }
  }
  return parseApplicationBackup(result)
}
export function applyApplicationBackup(snapshot: ApplicationBackup, originalIncoming: ApplicationBackup = snapshot, options: { workoutOnly?: boolean } = {}): void {
  const next = parseApplicationBackup(options.workoutOnly ? { ...snapshot, modules:undefined } : snapshot)
  // Keep both originals before the first state change; storage failure aborts here.
  const previous = applicationSnapshot(!options.workoutOnly)
  const previousWorkoutState = useStore.getState()
  const rawModules = Object.fromEntries(['winfit-nutrition-v1','winfit-pelvic-v1','winfit-routine-v1'].map(key => [key,localStorage.getItem(key)]))
  localStorage.setItem('winfit-recovery-v2', JSON.stringify({ previous, incoming: originalIncoming, rawModules }))
  try {
    if (next.modules?.nutrition && !importNutritionData(JSON.stringify(next.modules.nutrition))) throw Error('Falha ao salvar alimentação.')
    if (next.modules?.pelvic && !usePelvicStore.getState().importData(JSON.stringify(next.modules.pelvic))) throw Error('Falha ao salvar dados pélvicos.')
    if (next.modules?.routine && !importRoutineData(next.modules.routine)) throw Error('Falha ao salvar rotina.')
    // The snapshot was already reconciled. A second cloud merge would select
    // the old local plan again and undo an explicit backup-plan choice.
    useStore.setState({ profile:next.profile, plan:next.plan ? sanitizeEquipmentFreePlan(next.plan) : null,
      archivedPlans:next.archivedPlans, sessions:next.sessions, activeSession:next.activeSession, prs:next.prs, lastSetUndo:null })
    if (getWorkoutStorageError()) throw Error(getWorkoutStorageError()!)
  } catch (error) {
    // Recovery remains available even if storage quota prevents rollback.
    if (previous.modules?.nutrition) importNutritionData(JSON.stringify(previous.modules.nutrition))
    if (previous.modules?.pelvic) usePelvicStore.getState().importData(JSON.stringify(previous.modules.pelvic))
    if (previous.modules?.routine) importRoutineData(previous.modules.routine)
    try { useStore.setState(previousWorkoutState, true) } catch { /* In-memory state is restored before Zustand persists; recovery remains. */ }
    throw error
  }
}
export function resetApplicationData(): void {
  if (!resetNutritionData() || !resetRoutineData()) throw Error('Não foi possível apagar todos os módulos. Confira o armazenamento.')
  usePelvicStore.getState().resetAll()
  if (usePelvicStore.getState().error) throw Error('Não foi possível apagar os dados pélvicos.')
  if (!resetWorkoutStorageGuard()) throw Error('Não foi possível redefinir os treinos salvos.')
  useStore.getState().resetAll()
  localStorage.removeItem('winfit-data-owner')
  localStorage.removeItem('winfit-recovery-v2')
}
export function downloadBackup(value: unknown, name = 'winfit-backup.json'): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }))
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
