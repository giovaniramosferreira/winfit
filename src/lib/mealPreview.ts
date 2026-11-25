// "E se?": prévia do efeito de uma refeição nos totais do dia, antes de registrar (AURAVIZ-161). Puro.
import type { Meal } from './nutrition'
import { dayEnergy } from './aiEstimate'

export interface WhatIf {
  beforeKcal: number
  afterKcal: number
  goalKcal: number | null
  remainingAfter: number | null
  overBy: number
  /** O dia tem itens sem kcal conhecida: o total é parcial. */
  partial: boolean
  message: string
}

/** Compara o dia sem e com a refeição candidata. Não altera nada. */
export function whatIf(meals: Meal[], date: string, candidateKcal: number, goalKcal: number | null): WhatIf {
  if (!Number.isFinite(candidateKcal) || candidateKcal < 0) throw new Error('kcal da refeição inválidas.')
  const day = dayEnergy(meals, date)
  const before = day.confirmedKcal + day.estimatedKcal
  const after = before + Math.round(candidateKcal)
  const partial = day.pending > 0
  if (goalKcal === null) {
    return { beforeKcal: before, afterKcal: after, goalKcal, remainingAfter: null, overBy: 0, partial, message: `O dia iria de ${before} para ${after} kcal. Defina uma meta para comparar.` }
  }
  const remaining = goalKcal - after
  const overBy = Math.max(0, -remaining)
  const message = overBy > 0
    ? `Passaria ${overBy} kcal da meta de ${goalKcal}. Opções: reduzir a porção, trocar parte do prato ou compensar na próxima refeição.`
    : `Ficariam ${remaining} kcal para o resto do dia.`
  return { beforeKcal: before, afterKcal: after, goalKcal, remainingAfter: remaining, overBy, partial, message: partial ? `${message} (total parcial: há itens sem kcal)` : message }
}
