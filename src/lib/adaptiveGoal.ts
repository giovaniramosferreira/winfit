// Meta adaptativa semanal e completude do dia (AURAVIZ-157). Puro; sempre SUGESTÃO, nunca mudança silenciosa.
// Constantes inspiradas em apps de referência e NÃO validadas clinicamente: por isso são configuráveis.
import { KCAL_PER_KG, MIN_CALORIES } from './goals'
import type { Meal } from './nutrition'

export type DayCompleteness = 'missing' | 'likely_partial' | 'likely_complete'
export interface WeightPoint { date: string; kg: number }

export interface AdaptiveConfig {
  minFoodDays: number
  minWeights: number
  minWeightSpanDays: number
  minAdjustment: number
  maxAdjustment: number
  ceilingFactor: number
}
export const DEFAULT_ADAPTIVE_CONFIG: AdaptiveConfig = {
  minFoodDays: 4, minWeights: 3, minWeightSpanDays: 7, minAdjustment: 25, maxAdjustment: 150, ceilingFactor: 1.25,
}

const dayMs = 86_400_000
export const dayNumber = (date: string): number => Math.floor(Date.parse(`${date}T12:00:00Z`) / dayMs)

/**
 * Completude de um dia. Regras (heurística, não prova de jejum):
 * sem itens = missing; itens sem kcal conhecida, uma única refeição ou energia muito abaixo da referência = parcial.
 * `referenceKcal` é a meta do dia, se houver; senão 1.200.
 */
export function dayCompleteness(meals: Meal[], date: string, referenceKcal?: number | null): DayCompleteness {
  const day = meals.filter((m) => m.date === date)
  const items = day.flatMap((m) => m.items)
  if (items.length === 0) return 'missing'
  if (items.some((i) => i.kcal === null)) return 'likely_partial'
  const kcal = items.reduce((s, i) => s + (i.kcal ?? 0), 0)
  const reference = referenceKcal && referenceKcal > 0 ? referenceKcal : MIN_CALORIES
  if (day.length < 2 || kcal < reference * 0.4) return 'likely_partial'
  return 'likely_complete'
}

export interface DayIntake { date: string; kcal: number; completeness: DayCompleteness }

/** Ingestão por dia dentro da janela [endDate - days, endDate), sem o dia corrente (incompleto). */
export function intakeByDay(meals: Meal[], endDate: string, days: number, referenceKcal?: number | null): DayIntake[] {
  const end = dayNumber(endDate)
  const out: DayIntake[] = []
  for (let n = end - days; n < end; n++) {
    const date = new Date(n * dayMs + dayMs / 2).toISOString().slice(0, 10)
    const completeness = dayCompleteness(meals, date, referenceKcal)
    const kcal = meals.filter((m) => m.date === date).flatMap((m) => m.items).reduce((s, i) => s + (i.kcal ?? 0), 0)
    out.push({ date, kcal, completeness })
  }
  return out
}

/** Ritmo observado em kg/semana por regressão linear; null sem pesagens suficientes ou com intervalo curto. */
export function observedWeeklyChange(weights: WeightPoint[], cfg: AdaptiveConfig = DEFAULT_ADAPTIVE_CONFIG): number | null {
  const pts = weights.filter((w) => Number.isFinite(w.kg) && w.kg > 0).map((w) => ({ x: dayNumber(w.date), y: w.kg })).sort((a, b) => a.x - b.x)
  if (pts.length < cfg.minWeights) return null
  if (pts[pts.length - 1].x - pts[0].x < cfg.minWeightSpanDays) return null
  const n = pts.length
  const mx = pts.reduce((s, p) => s + p.x, 0) / n
  const my = pts.reduce((s, p) => s + p.y, 0) / n
  const den = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0)
  if (den === 0) return null
  const slopePerDay = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / den
  return slopePerDay * 7
}

export type AdaptiveReason =
  | 'insufficient-data' | 'on-pace' | 'at-floor' | 'at-ceiling' | 'guardrail' | 'adjusted'

export interface AdaptiveInput {
  currentKcal: number
  bmr: number
  tdee: number
  targetWeeklyChangeKg: number
  observedWeeklyChangeKg: number | null
  completeFoodDays: number
  weightEntries: number
}
export interface AdaptiveSuggestion {
  changed: boolean
  reason: AdaptiveReason
  suggestedKcal: number
  deltaKcal: number
  message: string
}

export function suggestAdaptiveGoal(input: AdaptiveInput, cfg: AdaptiveConfig = DEFAULT_ADAPTIVE_CONFIG): AdaptiveSuggestion {
  const keep = (reason: AdaptiveReason, message: string): AdaptiveSuggestion => ({ changed: false, reason, suggestedKcal: input.currentKcal, deltaKcal: 0, message })
  const floor = Math.max(Math.round(input.bmr), MIN_CALORIES)
  const ceiling = Math.max(floor, Math.round(input.tdee * cfg.ceilingFactor))
  if (input.observedWeeklyChangeKg === null || input.completeFoodDays < cfg.minFoodDays || input.weightEntries < cfg.minWeights) {
    return keep('insufficient-data', `Precisamos de pelo menos ${cfg.minFoodDays} dias completos de registro e ${cfg.minWeights} pesagens em ${cfg.minWeightSpanDays}+ dias para sugerir um ajuste.`)
  }
  const raw = ((input.targetWeeklyChangeKg - input.observedWeeklyChangeKg) * KCAL_PER_KG) / 7
  const limited = Math.max(-cfg.maxAdjustment, Math.min(cfg.maxAdjustment, Math.round(raw)))
  if (Math.abs(limited) < cfg.minAdjustment) return keep('on-pace', 'Seu ritmo recente está perto do objetivo; nenhuma mudança sugerida.')
  if (limited < 0 && input.currentKcal <= floor) return keep('at-floor', 'Não sugerimos reduzir: a meta atual já está no piso de segurança.')
  if (limited > 0 && input.currentKcal >= ceiling) return keep('at-ceiling', 'Não sugerimos aumentar: a meta atual já está no teto de segurança.')
  const next = limited < 0 ? Math.max(input.currentKcal + limited, floor) : Math.min(input.currentKcal + limited, ceiling)
  if (next === input.currentKcal) return keep('guardrail', 'Os limites de segurança mantiveram a meta desta semana.')
  const delta = next - input.currentKcal
  return {
    changed: true, reason: 'adjusted', suggestedKcal: next, deltaKcal: delta,
    message: `Com base no seu ritmo de peso, sugerimos ${delta > 0 ? '+' : ''}${delta} kcal por dia (nova meta: ${next} kcal). É uma estimativa: você decide se aceita.`,
  }
}
