import assert from 'node:assert/strict'
import { ACTIVITY_MULTIPLIER, balanceMacros, bmr, calculateGoals, calorieTarget, formulaMacros, tdee, validateGoalProfile, type GoalProfile } from '../src/lib/goals'
import { DEFAULT_ADAPTIVE_CONFIG, dayCompleteness, intakeByDay, observedWeeklyChange, suggestAdaptiveGoal, type AdaptiveInput } from '../src/lib/adaptiveGoal'
import { forecastWeight } from '../src/lib/weightForecast'
import type { Meal } from '../src/lib/nutrition'

const man: GoalProfile = { sex: 'm', age: 30, weightKg: 80, heightCm: 180, activity: 'moderate' }
const woman: GoalProfile = { sex: 'f', age: 30, weightKg: 60, heightCm: 165, activity: 'light' }

// --- BMR / TDEE (valores calculados à mão)
assert.equal(bmr(man), 1780)
assert.equal(Math.round(bmr(woman) * 100) / 100, 1320.25)
assert.equal(Math.round(bmr({ ...man, bodyFatPct: 20 }) * 10) / 10, 1752.4, 'Katch-McArdle quando há % de gordura')
assert.equal(tdee(man), 1780 * ACTIVITY_MULTIPLIER.moderate)
assert.throws(() => validateGoalProfile({ ...man, age: 5 }))
assert.throws(() => validateGoalProfile({ ...man, weightKg: NaN }))
assert.throws(() => validateGoalProfile({ ...man, bodyFatPct: 1 }))
assert.throws(() => validateGoalProfile({ ...man, sex: 'x' as never }))

// --- Meta calórica: déficit, superávit, manutenção e piso
assert.equal(calorieTarget(man, { kind: 'maintain' }), Math.round(tdee(man)))
assert.equal(calorieTarget(man, { kind: 'lose' }), Math.round(tdee(man) - 550))
assert.equal(calorieTarget(man, { kind: 'gain', weeklyChangeKg: 0.25 }), Math.round(tdee(man) + 275))
assert.equal(calorieTarget({ ...woman, activity: 'sedentary' }, { kind: 'lose', weeklyChangeKg: 1 }), Math.round(bmr({ ...woman, activity: 'sedentary' })), 'nunca abaixo do BMR (e 1.200)')
assert.throws(() => calorieTarget(man, { kind: 'lose', weeklyChangeKg: 3 }))

// --- Macros: fórmula e fixação com rebalanceio
const goals = calculateGoals(man, { kind: 'lose' })
assert.equal(goals.macros.protein, 160)
assert.equal(goals.macros.fat, 48)
const kcalOf = (m: typeof goals.macros) => m.protein * 4 + m.carbs * 4 + m.fat * 9
assert.ok(Math.abs(kcalOf(goals.macros) - goals.calories) <= 8, 'macros somam perto da meta')
const pinned = calculateGoals(man, { kind: 'lose' }, { protein: 200 })
assert.equal(pinned.macros.protein, 200)
assert.ok(pinned.macros.carbs < goals.macros.carbs && pinned.macros.fat < goals.macros.fat, 'os livres cedem calorias ao fixado')
assert.ok(Math.abs(kcalOf(pinned.macros) - pinned.calories) <= 8)
const allPinned = balanceMacros(2000, formulaMacros(80, 2000, 'maintain'), { protein: 100, carbs: 100, fat: 50 })
assert.deepEqual(allPinned, { protein: 100, carbs: 100, fat: 50 })
assert.deepEqual(balanceMacros(100, formulaMacros(80, 100, 'maintain'), { fat: 100 }).fat, 100)
assert.ok(Object.values(balanceMacros(100, formulaMacros(80, 100, 'maintain'), { fat: 100 })).every((v) => v >= 0), 'sem valores negativos')
assert.throws(() => balanceMacros(2000, formulaMacros(80, 2000, 'maintain'), { protein: -1 }))

// --- Completude do dia
const item = (kcal: number | null) => ({ id: `i${Math.random()}`, name: 'x', portion: null, kcal })
const meal = (date: string, id: string, kcals: (number | null)[]): Meal => ({ id, date, time: '12:00', type: 'Almoço', items: kcals.map(item) })
assert.equal(dayCompleteness([], '2026-11-01'), 'missing')
assert.equal(dayCompleteness([meal('2026-11-01', 'a', [null])], '2026-11-01'), 'likely_partial', 'kcal pendente = parcial')
assert.equal(dayCompleteness([meal('2026-11-01', 'a', [800])], '2026-11-01'), 'likely_partial', 'uma refeição só = parcial')
assert.equal(dayCompleteness([meal('2026-11-01', 'a', [600]), meal('2026-11-01', 'b', [500])], '2026-11-01', 2000), 'likely_complete')
assert.equal(dayCompleteness([meal('2026-11-01', 'a', [100]), meal('2026-11-01', 'b', [100])], '2026-11-01', 2000), 'likely_partial', 'muito abaixo da referência = parcial')
assert.equal(dayCompleteness([meal('2026-11-01', 'a', [0]), meal('2026-11-01', 'b', [0])], '2026-11-01'), 'likely_partial', '0 kcal explícito não vira completo')

// --- Ritmo observado
const w = (date: string, kg: number) => ({ date, kg })
assert.equal(observedWeeklyChange([w('2026-11-01', 80), w('2026-11-08', 79.5)]), null, 'menos de 3 pesagens')
assert.equal(observedWeeklyChange([w('2026-11-01', 80), w('2026-11-02', 79.9), w('2026-11-03', 79.8)]), null, 'intervalo curto')
const lin = observedWeeklyChange([w('2026-11-01', 80), w('2026-11-08', 79.5), w('2026-11-15', 79)])
assert.ok(lin !== null && Math.abs(lin + 0.5) < 1e-9, `esperava -0,5 kg/semana, veio ${lin}`)

// --- Meta adaptativa
const base: AdaptiveInput = { currentKcal: 2200, bmr: 1780, tdee: 2759, targetWeeklyChangeKg: -0.5, observedWeeklyChangeKg: -0.1, completeFoodDays: 6, weightEntries: 5 }
assert.equal(suggestAdaptiveGoal({ ...base, completeFoodDays: 3 }).reason, 'insufficient-data')
assert.equal(suggestAdaptiveGoal({ ...base, weightEntries: 2 }).reason, 'insufficient-data')
assert.equal(suggestAdaptiveGoal({ ...base, observedWeeklyChangeKg: null }).reason, 'insufficient-data')
const cut = suggestAdaptiveGoal(base)
assert.equal(cut.changed, true)
assert.equal(cut.deltaKcal, -150, 'limitado a -150 (cru seria -440)')
assert.equal(cut.suggestedKcal, 2050)
assert.equal(suggestAdaptiveGoal({ ...base, observedWeeklyChangeKg: -0.48 }).reason, 'on-pace', 'ajuste abaixo de 25 kcal é ignorado')
assert.equal(suggestAdaptiveGoal({ ...base, currentKcal: 1780 }).reason, 'at-floor')
assert.equal(suggestAdaptiveGoal({ ...base, currentKcal: 1790 }).suggestedKcal, 1780, 'não passa do piso')
const nearCeiling = suggestAdaptiveGoal({ ...base, targetWeeklyChangeKg: 0.5, observedWeeklyChangeKg: 0, currentKcal: 3400 })
assert.equal(nearCeiling.suggestedKcal, 3449, 'teto = 1,25 × TDEE (3.449)')
assert.equal(suggestAdaptiveGoal({ ...base, targetWeeklyChangeKg: 0.5, observedWeeklyChangeKg: 0, currentKcal: 3449 }).reason, 'at-ceiling')
assert.equal(DEFAULT_ADAPTIVE_CONFIG.maxAdjustment, 150)
assert.equal(suggestAdaptiveGoal({ ...base }, { ...DEFAULT_ADAPTIVE_CONFIG, maxAdjustment: 50 }).deltaKcal, -50, 'configurável')

// --- Janela de ingestão exclui o dia corrente
const meals: Meal[] = []
for (let d = 1; d <= 9; d++) { const date = `2026-11-0${d}`; meals.push(meal(date, `a${d}`, [1200]), meal(date, `b${d}`, [700])) }
const intake = intakeByDay(meals, '2026-11-09', 7, 2000)
assert.equal(intake.length, 7)
assert.equal(intake[0].date, '2026-11-02')
assert.equal(intake[6].date, '2026-11-08')
assert.ok(intake.every((x) => x.completeness === 'likely_complete' && x.kcal === 1900))

// --- Previsão de peso
const pts = [w('2026-11-01', 80), w('2026-11-08', 79.6), w('2026-11-15', 79.2)]
const fc = forecastWeight({ weights: pts, intake, tdee: 2400, bmr: 1780, goalWeightKg: 75 })
assert.equal(fc.hasEnoughData, true)
assert.equal(fc.avgDailyKcal, 1900)
assert.equal(fc.dailyBalance, -500)
assert.equal(fc.predictedWeeklyChangeKg, -0.45)
assert.equal(fc.currentWeightKg, 79.2)
assert.ok(fc.predicted30dKg! < 79.2 && fc.predicted90dKg! < fc.predicted60dKg! && fc.predicted60dKg! < fc.predicted30dKg!)
assert.ok(fc.daysToGoal !== null && fc.daysToGoal > 0)
assert.equal(fc.trendsDisagree, false)
assert.equal(forecastWeight({ weights: pts.slice(0, 2), intake, tdee: 2400, bmr: 1780 }).hasEnoughData, false, 'poucos dados')
assert.equal(forecastWeight({ weights: pts, intake: intake.map((x) => ({ ...x, completeness: 'likely_partial' as const })), tdee: 2400, bmr: 1780 }).predictedWeeklyChangeKg, null, 'dias parciais não geram previsão')
const disagree = forecastWeight({ weights: [w('2026-11-01', 80), w('2026-11-08', 80.5), w('2026-11-15', 81)], intake, tdee: 2400, bmr: 1780 })
assert.equal(disagree.trendsDisagree, true, 'déficit previsto vs ganho observado')
const under = forecastWeight({ weights: [w('2026-11-01', 80), w('2026-11-08', 80), w('2026-11-15', 80.1)], intake: intake.map((x) => ({ ...x, kcal: 1200 })), tdee: 2400, bmr: 1780 })
assert.equal(under.likelyUnderLogging, true, 'baixa ingestão registrada com peso estável sugere sub-registro')
assert.equal(forecastWeight({ weights: [], intake: [], tdee: 2400, bmr: 1780 }).currentWeightKg, null)

console.log('goals: BMR/TDEE, macros fixados, completude, meta adaptativa e previsão de peso OK')
