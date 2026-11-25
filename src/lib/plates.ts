// Contas de anilhas, aquecimento, balanço push/pull e supersets (AURAVIZ-166). Puro.
import type { Exercise, Session, SlotType } from '../types'
import { byId } from '../data/exercises'

export const DEFAULT_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25]
export const DEFAULT_BAR_KG = 20

export interface PlateSplit { perSide: number[]; perSideKg: number; loadedKg: number; remainderKg: number; exact: boolean }

/** Quanto colocar de cada lado da barra. A carga registrada continua sendo o TOTAL na barra. */
export function plateSplit(totalKg: number, barKg = DEFAULT_BAR_KG, plates: number[] = DEFAULT_PLATES_KG): PlateSplit {
  if (!Number.isFinite(totalKg) || totalKg < 0 || !Number.isFinite(barKg) || barKg < 0) throw new Error('Carga ou barra inválida.')
  const valid = [...new Set(plates.filter((p) => Number.isFinite(p) && p > 0))].sort((a, b) => b - a)
  if (totalKg <= barKg) return { perSide: [], perSideKg: 0, loadedKg: barKg, remainderKg: Math.max(0, Math.round((totalKg - barKg) * 100) / 100), exact: totalKg === barKg }
  let side = (totalKg - barKg) / 2
  const perSide: number[] = []
  for (const p of valid) while (side + 1e-9 >= p) { perSide.push(p); side = Math.round((side - p) * 1000) / 1000 }
  const used = perSide.reduce((s, p) => s + p, 0)
  const remainder = Math.round((totalKg - barKg - used * 2) * 100) / 100
  return { perSide, perSideKg: used, loadedKg: barKg + used * 2, remainderKg: remainder, exact: remainder === 0 }
}

/** Rampa de aquecimento: 40%·8, 60%·5, 80%·3, 90%·1 da carga de trabalho, arredondada para baixo na grade e nunca abaixo da barra. */
export function warmupSets(workKg: number, barKg = DEFAULT_BAR_KG, grid = 2.5): { weight: number; reps: number }[] {
  if (!Number.isFinite(workKg) || workKg <= 0) throw new Error('Carga de trabalho inválida.')
  if (workKg <= barKg) return []
  const ramp: [number, number][] = [[0.4, 8], [0.6, 5], [0.8, 3], [0.9, 1]]
  const out: { weight: number; reps: number }[] = []
  for (const [pct, reps] of ramp) {
    const w = Math.max(barKg, Math.floor((workKg * pct) / grid) * grid)
    if (w >= workKg || out.some((s) => s.weight === w)) continue
    out.push({ weight: w, reps })
  }
  return out
}

// ---- Balanço push/pull (séries por semana). Aviso informativo, não prescrição.
export type PushPull = 'push' | 'pull' | 'other'
export function pushPullOf(slots: SlotType[]): PushPull {
  if (slots.some((s) => s.startsWith('push_') || s === 'iso_peito' || s === 'iso_triceps' || s === 'iso_ombro_lat')) return 'push'
  if (slots.some((s) => s.startsWith('pull_') || s === 'iso_biceps' || s === 'iso_ombro_post')) return 'pull'
  return 'other'
}
export interface PushPullBalance { push: number; pull: number; ratio: number | null; status: 'balanced' | 'push_heavy' | 'pull_heavy' | 'insufficient' }
export function pushPullBalance(sessions: Session[], from: number, to: number, lookup: (id: string) => Pick<Exercise, 'slotTypes'> | undefined = (id) => byId.get(id)): PushPullBalance {
  let push = 0, pull = 0
  for (const s of sessions) {
    if ((s.status !== 'completed' && s.status !== 'partial') || s.startedAt < from || s.startedAt > to) continue
    for (const l of s.logs) {
      const kind = pushPullOf(lookup(l.exerciseId)?.slotTypes ?? [])
      if (kind === 'push') push++
      else if (kind === 'pull') pull++
    }
  }
  if (push + pull < 6) return { push, pull, ratio: null, status: 'insufficient' }
  const ratio = Math.round((push / Math.max(pull, 1)) * 100) / 100
  return { push, pull, ratio, status: ratio > 1.5 ? 'push_heavy' : ratio < 0.67 ? 'pull_heavy' : 'balanced' }
}

// ---- Supersets: alterna as séries dos exercícios do grupo e só descansa ao fim de cada rodada
export interface SupersetStep { exerciseId: string; setNumber: number; restAfter: boolean }
export function supersetOrder(group: { exerciseId: string; sets: number }[]): SupersetStep[] {
  if (group.length < 2) throw new Error('Superset precisa de pelo menos 2 exercícios.')
  if (group.some((g) => !Number.isInteger(g.sets) || g.sets < 1)) throw new Error('Número de séries inválido.')
  const rounds = Math.max(...group.map((g) => g.sets))
  const steps: SupersetStep[] = []
  for (let round = 1; round <= rounds; round++) {
    const inRound = group.filter((g) => g.sets >= round)
    inRound.forEach((g, i) => steps.push({ exerciseId: g.exerciseId, setNumber: round, restAfter: i === inRound.length - 1 }))
  }
  return steps
}
