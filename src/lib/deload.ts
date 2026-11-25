// Deload sugerido (AURAVIZ-164). Puro e sempre SUGESTÃO: o usuário decide.
import type { Session } from '../types'
import { e1rm, round25 } from './progression'

export const DEFAULT_DELOAD_AFTER = 3
export const DEFAULT_DELOAD_FACTOR = 0.9
export const MIN_DELOAD_FACTOR = 0.5
export const MAX_DELOAD_FACTOR = 0.95

export interface DeloadConfig { after: number; factor: number }
export interface DeloadSuggestion { suggest: boolean; weightKg: number | null; reason: string; stalledSessions: number }

export const isValidDeloadFactor = (f: unknown): f is number => typeof f === 'number' && Number.isFinite(f) && f >= MIN_DELOAD_FACTOR && f <= MAX_DELOAD_FACTOR

/** Melhor e1RM de cada sessão que contém o exercício, em ordem cronológica. */
export function bestE1rmBySession(exerciseId: string, sessions: Session[]): { ts: number; e1rm: number; topWeight: number }[] {
  return sessions
    .filter((s) => s.status === 'completed' || s.status === 'partial')
    .sort((a, b) => a.startedAt - b.startedAt)
    .flatMap((s) => {
      const logs = s.logs.filter((l) => l.exerciseId === exerciseId && l.weight > 0 && l.reps > 0)
      if (!logs.length) return []
      return [{ ts: s.startedAt, e1rm: Math.max(...logs.map((l) => e1rm(l.weight, l.reps))), topWeight: Math.max(...logs.map((l) => l.weight)) }]
    })
}

/**
 * Sem progresso = nas últimas `after` sessões nenhuma superou o melhor e1RM anterior a elas.
 * Precisa de pelo menos `after + 1` sessões com carga.
 */
export function suggestDeload(exerciseId: string, sessions: Session[], config: Partial<DeloadConfig> = {}): DeloadSuggestion {
  const after = Math.max(2, Math.floor(config.after ?? DEFAULT_DELOAD_AFTER))
  const factor = config.factor ?? DEFAULT_DELOAD_FACTOR
  if (!isValidDeloadFactor(factor)) throw new Error('Fator de deload fora do intervalo (0,5–0,95).')
  const series = bestE1rmBySession(exerciseId, sessions)
  if (series.length < after + 1) return { suggest: false, weightKg: null, reason: `Precisa de ${after + 1} sessões com carga para avaliar.`, stalledSessions: 0 }
  const recent = series.slice(-after)
  const baseline = Math.max(...series.slice(0, -after).map((p) => p.e1rm))
  const stalled = recent.every((p) => p.e1rm <= baseline)
  if (!stalled) return { suggest: false, weightKg: null, reason: 'Você ainda está progredindo.', stalledSessions: 0 }
  const top = recent[recent.length - 1].topWeight
  const weightKg = Math.max(0, round25(top * factor))
  return {
    suggest: true, weightKg, stalledSessions: after,
    reason: `Sem progresso em ${after} sessões seguidas. Sugestão: uma semana mais leve (${Math.round(factor * 100)}% da carga, ${weightKg} kg), depois retomar.`,
  }
}
