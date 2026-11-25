// Calculadoras (AURAVIZ-166). Puras; entrada em kg e cm. Todas são ESTIMATIVAS e citam a fórmula.
export type OneRmFormula = 'epley' | 'brzycki' | 'lombardi'

function positive(n: number, label: string): void { if (!Number.isFinite(n) || n <= 0) throw new Error(`${label} inválido.`) }

/** 1RM estimado. Epley: w(1+r/30); Brzycki: w·36/(37−r); Lombardi: w·r^0,10. Confiável até ~10 reps. */
export function oneRm(weight: number, reps: number, formula: OneRmFormula = 'epley'): number {
  positive(weight, 'Carga'); positive(reps, 'Repetições')
  if (reps > 30) throw new Error('Repetições acima de 30 não permitem estimar 1RM.')
  if (reps === 1) return weight
  const v = formula === 'brzycki' ? (weight * 36) / (37 - reps) : formula === 'lombardi' ? weight * Math.pow(reps, 0.1) : weight * (1 + reps / 30)
  return Math.round(v * 10) / 10
}

/** % do 1RM em RPE 10 por nº de repetições (tabela de uso comum; 1 ponto de RPE ≈ 1 repetição de folga). */
const RPE10_PCT = [100, 95.5, 92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 70.7, 68]
export function rpePercent(reps: number, rpe: number): number | null {
  if (!Number.isInteger(reps) || reps < 1 || reps > 12 || !Number.isFinite(rpe) || rpe < 6 || rpe > 10 || (rpe * 2) % 1 !== 0) return null
  const idx = reps - 1 + (10 - rpe)
  const lo = Math.floor(idx), hi = Math.ceil(idx)
  if (hi >= RPE10_PCT.length) return null
  return Math.round((RPE10_PCT[lo] + (RPE10_PCT[hi] - RPE10_PCT[lo]) * (idx - lo)) * 10) / 10
}
export function rpeLoad(oneRepMax: number, reps: number, rpe: number, grid = 2.5): number | null {
  positive(oneRepMax, '1RM')
  const pct = rpePercent(reps, rpe)
  return pct === null ? null : Math.floor((oneRepMax * pct) / 100 / grid) * grid
}

export const PCT_STEPS = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 40]
export function percentTable(oneRepMax: number, grid = 2.5, steps: number[] = PCT_STEPS): { pct: number; weight: number }[] {
  positive(oneRepMax, '1RM'); positive(grid, 'Passo')
  return steps.map((pct) => ({ pct, weight: Math.floor((oneRepMax * pct) / 100 / grid) * grid }))
}

export function bmi(kg: number, cm: number): number { positive(kg, 'Peso'); positive(cm, 'Altura'); return Math.round((kg / (cm / 100) ** 2) * 10) / 10 }
export function bmiBand(value: number): 'abaixo do peso' | 'peso normal' | 'sobrepeso' | 'obesidade' { return value < 18.5 ? 'abaixo do peso' : value < 25 ? 'peso normal' : value < 30 ? 'sobrepeso' : 'obesidade' }

/** % de gordura pelo método da Marinha dos EUA (medidas em cm). Estimativa grosseira. */
export function navyBodyFat(p: { sex: 'm' | 'f'; heightCm: number; neckCm: number; waistCm: number; hipCm?: number }): number {
  positive(p.heightCm, 'Altura'); positive(p.neckCm, 'Pescoço'); positive(p.waistCm, 'Cintura')
  let pct: number
  if (p.sex === 'm') {
    if (p.waistCm <= p.neckCm) throw new Error('A cintura deve ser maior que o pescoço.')
    pct = 495 / (1.0324 - 0.19077 * Math.log10(p.waistCm - p.neckCm) + 0.15456 * Math.log10(p.heightCm)) - 450
  } else {
    positive(p.hipCm ?? NaN, 'Quadril')
    if (p.waistCm + p.hipCm! <= p.neckCm) throw new Error('Cintura + quadril deve ser maior que o pescoço.')
    pct = 495 / (1.29579 - 0.35004 * Math.log10(p.waistCm + p.hipCm! - p.neckCm) + 0.221 * Math.log10(p.heightCm)) - 450
  }
  return Math.round(pct * 10) / 10
}

const DOTS_COEF = {
  m: [-307.75076, 24.0900756, -0.1918759221, 0.0007391293, -0.000001093],
  f: [-57.96288, 13.6175032, -0.1126655495, 0.0005158568, -0.0000010706],
} as const
/** Pontuação DOTS (total levantado em kg ÷ coeficiente do peso corporal). */
export function dots(sex: 'm' | 'f', bodyweightKg: number, totalKg: number): number {
  positive(bodyweightKg, 'Peso corporal'); positive(totalKg, 'Total')
  const [a, b, c, d, e] = DOTS_COEF[sex]
  const bw = Math.min(Math.max(bodyweightKg, sex === 'm' ? 40 : 40), sex === 'm' ? 210 : 150)
  return Math.round(((totalKg * 500) / (a + b * bw + c * bw ** 2 + d * bw ** 3 + e * bw ** 4)) * 100) / 100
}
