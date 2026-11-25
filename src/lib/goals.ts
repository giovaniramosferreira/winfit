// Metas calculadas por fórmula (AURAVIZ-156). Funções puras, sem I/O.
// Fórmulas públicas: Mifflin-St Jeor (1990) e Katch-McArdle. Resultados são ESTIMATIVAS, não medição.

export type Sex = 'f' | 'm' | 'na'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | 'extra_active'
export type GoalKind = 'lose' | 'maintain' | 'gain'
export type Macro = 'protein' | 'carbs' | 'fat'

/** 7.700 kcal ≈ 1 kg de massa corporal: aproximação usada por vários apps; não é exata. */
export const KCAL_PER_KG = 7700
export const MIN_CALORIES = 1200
export const KCAL_PER_GRAM: Record<Macro, number> = { protein: 4, carbs: 4, fat: 9 }

/** Multiplicadores de atividade (escolha do WinFit; descrevem trabalho e treino, não contagem de passos). */
export const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9, extra_active: 2.1,
}

export interface GoalProfile {
  sex: Sex
  age: number
  weightKg: number
  heightCm: number
  activity: ActivityLevel
  /** Percentual de gordura corporal (3–60). Quando informado, usa Katch-McArdle. */
  bodyFatPct?: number | null
}

function fail(message: string): never { throw new Error(message) }
const inRange = (n: unknown, min: number, max: number): n is number => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max

export function validateGoalProfile(p: GoalProfile): void {
  if (!['f', 'm', 'na'].includes(p.sex)) fail('Sexo inválido.')
  if (!inRange(p.age, 14, 100)) fail('Idade fora do intervalo (14–100).')
  if (!inRange(p.weightKg, 25, 400)) fail('Peso fora do intervalo (25–400 kg).')
  if (!inRange(p.heightCm, 100, 250)) fail('Altura fora do intervalo (100–250 cm).')
  if (!(p.activity in ACTIVITY_MULTIPLIER)) fail('Nível de atividade inválido.')
  if (p.bodyFatPct != null && !inRange(p.bodyFatPct, 3, 60)) fail('Gordura corporal fora do intervalo (3–60%).')
}

/** Taxa metabólica basal em kcal/dia. */
export function bmr(p: GoalProfile): number {
  validateGoalProfile(p)
  if (p.bodyFatPct != null) return 370 + 21.6 * (1 - p.bodyFatPct / 100) * p.weightKg
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age
  return base + (p.sex === 'm' ? 5 : p.sex === 'f' ? -161 : -78)
}

export const tdee = (p: GoalProfile): number => bmr(p) * ACTIVITY_MULTIPLIER[p.activity]

export interface GoalIntent { kind: GoalKind; weeklyChangeKg?: number }

/** Variação semanal alvo em kg (negativa ao perder). Padrão 0,5 kg/semana. */
export function targetWeeklyChangeKg(intent: GoalIntent): number {
  if (intent.kind === 'maintain') return 0
  const pace = intent.weeklyChangeKg ?? 0.5
  if (!inRange(pace, 0.1, 1)) fail('Ritmo semanal fora do intervalo (0,1–1 kg).')
  return intent.kind === 'lose' ? -pace : pace
}

/** Meta calórica diária: TDEE + ajuste do objetivo, nunca abaixo do maior entre BMR e 1.200 kcal. */
export function calorieTarget(p: GoalProfile, intent: GoalIntent): number {
  const adjustment = (targetWeeklyChangeKg(intent) * KCAL_PER_KG) / 7
  const floor = Math.max(Math.round(bmr(p)), MIN_CALORIES)
  return Math.max(Math.round(tdee(p) + adjustment), floor)
}

export type PinnedMacros = Partial<Record<Macro, number>>
export type MacroTargets = Record<Macro, number>

/** Fórmula base: proteína por kg (mais alta em déficit), gordura 0,6 g/kg, carboidrato = restante. */
export function formulaMacros(weightKg: number, calories: number, kind: GoalKind): MacroTargets {
  const protein = Math.round((kind === 'lose' ? 2 : 1.6) * weightKg)
  const fat = Math.round(0.6 * weightKg)
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4))
  return { protein, carbs, fat }
}

/**
 * Macros com valores fixados pelo usuário. Os não fixados dividem as calorias restantes em
 * proporção às calorias da fórmula; a soma continua perto da meta.
 */
export function balanceMacros(calories: number, base: MacroTargets, pinned: PinnedMacros = {}): MacroTargets {
  const macros: Macro[] = ['protein', 'carbs', 'fat']
  for (const m of macros) {
    const v = pinned[m]
    if (v !== undefined && !inRange(v, 0, 2000)) fail('Macro fixado fora do intervalo.')
  }
  const free = macros.filter((m) => pinned[m] === undefined)
  const pinnedKcal = macros.reduce((s, m) => s + (pinned[m] !== undefined ? pinned[m]! * KCAL_PER_GRAM[m] : 0), 0)
  const remaining = Math.max(0, calories - pinnedKcal)
  const result = { ...base } as MacroTargets
  for (const m of macros) if (pinned[m] !== undefined) result[m] = pinned[m]!
  if (free.length === 0) return result
  const formulaKcal = free.reduce((s, m) => s + base[m] * KCAL_PER_GRAM[m], 0)
  for (const m of free) {
    const share = formulaKcal > 0 ? (base[m] * KCAL_PER_GRAM[m]) / formulaKcal : 1 / free.length
    result[m] = Math.round((remaining * share) / KCAL_PER_GRAM[m])
  }
  return result
}

export interface CalculatedGoals { bmr: number; tdee: number; calories: number; macros: MacroTargets; weeklyChangeKg: number }

/** Resultado completo, pronto para exibir como "estimativa". */
export function calculateGoals(p: GoalProfile, intent: GoalIntent, pinned: PinnedMacros = {}): CalculatedGoals {
  const calories = calorieTarget(p, intent)
  const base = formulaMacros(p.weightKg, calories, intent.kind)
  return {
    bmr: Math.round(bmr(p)), tdee: Math.round(tdee(p)), calories,
    macros: balanceMacros(calories, base, pinned), weeklyChangeKg: targetWeeklyChangeKg(intent),
  }
}
