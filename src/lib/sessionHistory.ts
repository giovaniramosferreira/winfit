import type { Session } from '../types'
import { byId } from '../data/exercises'
import { isTimedExercise } from './exerciseRules'

export function historyRows(session: Session) {
  const logs = Array.isArray(session.logs) ? session.logs : []
  const exercises = Array.isArray(session.exercises) ? session.exercises : []
  const rows = exercises.map((ex) => ({
    ...ex, legacy: false, name: byId.get(ex.exerciseId)?.name ?? ex.exerciseId,
    logs: logs.filter((log) => log.planExerciseId === ex.planExerciseId).map((log) => ({ ...log, unit: isTimedExercise(log.exerciseId) ? 'seg' : 'reps' })),
  }))
  const attached = new Set(rows.flatMap((row) => row.logs.map((log) => log.id)))
  for (const log of logs.filter((item) => !attached.has(item.id))) {
    rows.push({ planExerciseId: log.planExerciseId, exerciseId: log.exerciseId, sets: 0, repMin: 0, repMax: 0, restSec: 0, optional: false, skipped: false, legacy: true,
      name: byId.get(log.exerciseId)?.name ?? log.exerciseId, logs: [{ ...log, unit: isTimedExercise(log.exerciseId) ? 'seg' : 'reps' }] })
  }
  return rows
}
