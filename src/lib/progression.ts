import type { Exercise, PlanExercise, Session, SetLog } from '../types'
import { byId } from '../data/exercises'
import { isTimedExercise } from './exerciseRules'

/** Compare one exercise and metric at a time, keeping variations separate. */
export function exerciseProgressSeries(exerciseId: string, sessions: Session[]): { unit: 'kg' | 'reps' | 'seg'; points: { ts: number; value: number }[] } {
  const completed = sessions.filter((s) => s.status === 'completed' || s.status === 'partial')
  const loaded = completed.some((s) => s.logs.some((log) => log.exerciseId === exerciseId && Number.isFinite(log.weight) && log.weight > 0))
  const unit = loaded ? 'kg' : isTimedExercise(exerciseId) ? 'seg' : 'reps'
  const points = [...completed].sort((a, b) => a.startedAt - b.startedAt).flatMap((s) => {
    const values = s.logs.filter((log) => log.exerciseId === exerciseId && (loaded ? log.weight > 0 : log.weight === 0)).map((log) => loaded ? log.weight : log.reps).filter((value) => Number.isFinite(value) && value > 0)
    return values.length ? [{ ts: s.startedAt, value: Math.max(...values) }] : []
  })
  return { unit, points }
}

// Dupla progressão (seção 19 da spec): fechou todas as séries no teto da faixa → sobe carga,
// volta ao piso. Senão → mesma carga, meta é adicionar repetições.

/** Políticas nomeadas de progressão (AURAVIZ-162). A regra aplicada e o motivo ficam sempre visíveis. */
export type ProgressionPolicy = 'double' | 'linear' | 'reps'
export const PROGRESSION_POLICIES: ProgressionPolicy[] = ['double', 'linear', 'reps']
export const POLICY_LABEL: Record<ProgressionPolicy, string> = { double: 'Dupla progressão', linear: 'Progressão linear', reps: 'Só repetições' }
export const POLICY_DESC: Record<ProgressionPolicy, string> = {
  double: 'Fechou todas as séries no teto da faixa: sobe a carga e volta ao piso. Senão, mesma carga e mais repetições.',
  linear: 'Fez todas as séries com pelo menos o piso da faixa: sobe a carga na próxima sessão.',
  reps: 'Nunca sobe a carga sozinha: só sugere mais repetições até o teto (bom para máquinas e isolados).',
}
export function isProgressionPolicy(value: unknown): value is ProgressionPolicy { return value === 'double' || value === 'linear' || value === 'reps' }

export interface Suggestion {
  weight: number | null // null = primeira vez: calibrar
  targetReps: number
  note: string
  isIncrease: boolean
  policy: ProgressionPolicy
  /** false quando a última sessão teve menos séries registradas que o plano: nunca avança carga. */
  lastSessionComplete: boolean
}

/** Últimos sets não-extra de um exercício na sessão mais recente que o contém. */
export function lastPerformance(exerciseId: string, sessions: Session[]): SetLog[] | null {
  const done = sessions
    .filter((s) => (s.status === 'completed' || s.status === 'partial') && s.logs.some((l) => l.exerciseId === exerciseId))
    .sort((a, b) => b.startedAt - a.startedAt)
  if (done.length === 0) return null
  return done[0].logs.filter((l) => l.exerciseId === exerciseId)
}

export function sessionsWithExercise(exerciseId: string, sessions: Session[]): number {
  return sessions.filter(
    (s) => (s.status === 'completed' || s.status === 'partial') && s.logs.some((l) => l.exerciseId === exerciseId),
  ).length
}

/**
 * A próxima prescrição é função pura do histórico (nada guardado). Leitura honesta da sessão:
 * série não registrada conta como falha, então menos séries que o plano nunca avança a carga.
 */
export function suggestFor(planEx: PlanExercise, exercise: Exercise, sessions: Session[], options: { policy?: ProgressionPolicy } = {}): Suggestion {
  const policy = options.policy ?? 'double'
  const last = lastPerformance(planEx.exerciseId, sessions)
  if (!last || last.length === 0) {
    return {
      weight: null,
      targetReps: planEx.repMax,
      note:
        exercise.loadType === 'external'
          ? 'Primeira vez: encontre um peso que desafie nas últimas 2 repetições.'
          : isTimedExercise(exercise.id)
            ? 'Primeira vez: registre quantos segundos sustenta com boa execução.'
            : 'Primeira vez: registre quantas repetições consegue com boa execução.',
      isIncrease: false,
      policy,
      lastSessionComplete: true,
    }
  }
  const complete = last.length >= planEx.sets
  const incompleteNote = complete ? '' : ` Você registrou ${last.length} de ${planEx.sets} séries; série não feita conta como falha, então repita a carga.`
  const maxWeight = Math.max(...last.map((l) => l.weight))
  const bestReps = Math.max(...last.map((l) => l.reps))
  const allTopped = complete && last.every((l) => l.reps >= planEx.repMax)
  const allHitFloor = complete && last.every((l) => l.reps >= planEx.repMin)
  const base = { policy, lastSessionComplete: complete }

  if (exercise.loadType !== 'external') {
    if (allTopped) {
      return { ...base, weight: 0, targetReps: planEx.repMax, note: 'Você fechou a faixa — hora de progredir para uma variação mais difícil (troque o exercício).', isIncrease: true }
    }
    const step = isTimedExercise(exercise.id) ? 5 : 1
    const unit = isTimedExercise(exercise.id) ? 'seg' : 'reps'
    return { ...base, weight: maxWeight, targetReps: Math.min(bestReps + step, planEx.repMax), note: `Última vez: ${bestReps} ${unit}. Meta: +${step}.${incompleteNote}`, isIncrease: false }
  }

  if (policy === 'linear' && allHitFloor && maxWeight > 0) {
    const next = round25(maxWeight + exercise.minIncrementKg)
    return { ...base, weight: next, targetReps: planEx.repMin, note: `Progressão linear: você fez todas as séries com ${fmtKg(maxWeight)}. Sobe para ${fmtKg(next)}.`, isIncrease: true }
  }
  if (policy === 'double' && allTopped && maxWeight > 0) {
    const next = round25(maxWeight + exercise.minIncrementKg)
    return { ...base, weight: next, targetReps: planEx.repMin, note: `Você fechou ${planEx.sets}×${planEx.repMax} com ${fmtKg(maxWeight)}. Sobe para ${fmtKg(next)}.`, isIncrease: true }
  }
  if (policy === 'reps' && allTopped && maxWeight > 0) {
    return { ...base, weight: maxWeight, targetReps: planEx.repMax, note: `Você fechou ${planEx.sets}×${planEx.repMax} com ${fmtKg(maxWeight)}. Nesta política a carga não sobe sozinha: aumente manualmente se quiser.`, isIncrease: false }
  }
  const target = policy === 'linear' ? planEx.repMin : Math.min(bestReps + 1, planEx.repMax)
  const goal = policy === 'linear' ? `fazer todas as séries com ${planEx.repMin}+ reps` : `chegar a ${planEx.repMax} reps`
  return { ...base, weight: maxWeight, targetReps: target, note: `Última vez: ${fmtKg(maxWeight)} × ${bestReps}. Meta: ${goal}.${incompleteNote}`, isIncrease: false }
}

/** PR de carga: peso acima de qualquer registro anterior, apenas a partir da 2ª sessão do exercício. */
export function checkPR(exerciseId: string, weight: number, sessions: Session[]): boolean {
  if (weight <= 0) return false
  const count = sessionsWithExercise(exerciseId, sessions)
  if (count < 1) return false // primeira sessão do exercício = baseline, não PR
  const prevMax = Math.max(
    0,
    ...sessions
      .filter((s) => s.status === 'completed' || s.status === 'partial')
      .flatMap((s) => s.logs.filter((l) => l.exerciseId === exerciseId).map((l) => l.weight)),
  )
  return weight > prevMax
}

export function e1rm(weight: number, reps: number): number {
  return Math.round(weight * (1 + reps / 30) * 10) / 10
}

export function maxWeightFor(exerciseId: string, sessions: Session[]): number {
  return Math.max(
    0,
    ...sessions
      .filter((s) => s.status === 'completed' || s.status === 'partial')
      .flatMap((s) => s.logs.filter((l) => l.exerciseId === exerciseId).map((l) => l.weight)),
  )
}

export function round25(x: number): number {
  return Math.round(x / 2.5) * 2.5
}

export function fmtKg(x: number): string {
  return `${x % 1 === 0 ? x : x.toFixed(1).replace('.', ',')} kg`
}

export function volumeOf(logs: SetLog[]): number {
  return logs.reduce((a, l) => a + l.weight * l.reps, 0)
}

/** Não misturar o tempo das isometrias com repetições ou volume de carga. */
export function activityTotals(logs: SetLog[]) {
  return logs.reduce((total, log) => {
    total.sets += 1
    if (isTimedExercise(log.exerciseId)) total.seconds += log.reps
    else total.reps += log.reps
    total.volume += log.weight * log.reps
    total.hasLoad ||= log.weight > 0 || byId.get(log.exerciseId)?.loadType === 'external'
    return total
  }, { sets: 0, reps: 0, seconds: 0, volume: 0, hasLoad: false })
}
