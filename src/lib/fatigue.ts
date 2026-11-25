// Mapa de fadiga por músculo (AURAVIZ-164). Conta séries duras efetivas, não tonelagem. É uma estimativa visual, não médica.
import type { MuscleGroup, Session } from '../types'
import { byId } from '../data/exercises'

export const FATIGUE_SETS_PER_UNIT = 8      // ~8 séries duras numa sessão = 1,0 unidade
export const FATIGUE_MAX_SETS_PER_SESSION = 12
export const SECONDARY_WEIGHT = 0.4
export const HARD_REPS_MIN = 5
export const HARD_REPS_MAX = 30
export const SCAN_MS = 30 * 86_400_000
export type FatigueState = 'fresh' | 'light' | 'moderate' | 'high'
export const FATIGUE_THRESHOLDS = { light: 0.25, moderate: 0.6, high: 1 }

const HOUR = 3_600_000
/** Meia-vida de recuperação (horas): grupos grandes recuperam mais devagar. */
export const HALF_LIFE_H: Record<MuscleGroup, number> = {
  peito: 48, costas: 48, quadriceps: 48, posterior: 48, gluteo: 48, ombro: 36, biceps: 36, triceps: 36, panturrilha: 36, core: 36,
}
export const MUSCLES = Object.keys(HALF_LIFE_H) as MuscleGroup[]

export interface MuscleLookup { primary: MuscleGroup; secondary: MuscleGroup[] }
export type ExerciseMuscles = (exerciseId: string) => MuscleLookup | undefined
const defaultLookup: ExerciseMuscles = (id) => byId.get(id)

export const halfLifeDecay = (elapsedMs: number, halfLifeMs: number): number => (elapsedMs <= 0 ? 1 : Math.pow(0.5, elapsedMs / halfLifeMs))
export const isHardSet = (reps: number): boolean => reps >= HARD_REPS_MIN && reps <= HARD_REPS_MAX

export const stateOf = (level: number): FatigueState =>
  level >= FATIGUE_THRESHOLDS.high ? 'high' : level >= FATIGUE_THRESHOLDS.moderate ? 'moderate' : level >= FATIGUE_THRESHOLDS.light ? 'light' : 'fresh'

export interface MuscleFatigue { level: number; state: FatigueState }

/** Fadiga atual por músculo: cada sessão contribui com séries duras (teto por sessão) que decaem pela meia-vida. */
export function muscleFatigue(sessions: Session[], now: number, lookup: ExerciseMuscles = defaultLookup): Record<MuscleGroup, MuscleFatigue> {
  const level = Object.fromEntries(MUSCLES.map((m) => [m, 0])) as Record<MuscleGroup, number>
  for (const s of sessions) {
    if (s.status !== 'completed' && s.status !== 'partial') continue
    const at = s.endedAt ?? s.startedAt
    if (at > now || now - at > SCAN_MS) continue
    const sets = Object.fromEntries(MUSCLES.map((m) => [m, 0])) as Record<MuscleGroup, number>
    for (const log of s.logs) {
      if (!isHardSet(log.reps)) continue
      const ex = lookup(log.exerciseId)
      if (!ex) continue
      sets[ex.primary] += 1
      for (const m of ex.secondary) sets[m] += SECONDARY_WEIGHT
    }
    for (const m of MUSCLES) {
      const capped = Math.min(sets[m], FATIGUE_MAX_SETS_PER_SESSION)
      level[m] += (capped / FATIGUE_SETS_PER_UNIT) * halfLifeDecay(now - at, HALF_LIFE_H[m] * HOUR)
    }
  }
  return Object.fromEntries(MUSCLES.map((m) => [m, { level: Math.round(level[m] * 100) / 100, state: stateOf(level[m]) }])) as Record<MuscleGroup, MuscleFatigue>
}
