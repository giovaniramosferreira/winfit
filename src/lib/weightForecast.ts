// Previsão de peso por balanço energético + regressão (AURAVIZ-158). Puro, sem LLM. É estimativa, não promessa.
import { KCAL_PER_KG } from './goals'
import { dayNumber, observedWeeklyChange, type DayIntake, type WeightPoint } from './adaptiveGoal'

export const MAX_LOOKBACK_DAYS = 90

export interface ForecastInput {
  weights: WeightPoint[]
  intake: DayIntake[]
  tdee: number
  bmr: number
  goalWeightKg?: number | null
}
export interface WeightForecast {
  hasEnoughData: boolean
  completeDays: number
  weightEntries: number
  avgDailyKcal: number | null
  dailyBalance: number | null
  predictedWeeklyChangeKg: number | null
  observedWeeklyChangeKg: number | null
  currentWeightKg: number | null
  predicted30dKg: number | null
  predicted60dKg: number | null
  predicted90dKg: number | null
  daysToGoal: number | null
  trendsDisagree: boolean
  likelyUnderLogging: boolean
}

export function forecastWeight(input: ForecastInput): WeightForecast {
  const weights = [...input.weights].filter((w) => w.kg > 0).sort((a, b) => dayNumber(a.date) - dayNumber(b.date))
  const lastDay = weights.length ? dayNumber(weights[weights.length - 1].date) : null
  const recent = lastDay === null ? [] : weights.filter((w) => lastDay - dayNumber(w.date) <= MAX_LOOKBACK_DAYS)
  const complete = input.intake.filter((d) => d.completeness === 'likely_complete')
  const observed = observedWeeklyChange(recent)
  const hasEnoughData = complete.length >= 4 && recent.length >= 3 && observed !== null
  const avg = complete.length ? complete.reduce((s, d) => s + d.kcal, 0) / complete.length : null
  const balance = avg === null ? null : avg - input.tdee
  const predictedWeekly = balance === null ? null : (balance * 7) / KCAL_PER_KG
  const current = recent.length ? recent[recent.length - 1].kg : null
  const at = (days: number) => (current !== null && predictedWeekly !== null ? round1(current + (predictedWeekly / 7) * days) : null)
  let daysToGoal: number | null = null
  if (current !== null && predictedWeekly !== null && input.goalWeightKg && predictedWeekly !== 0) {
    const days = ((input.goalWeightKg - current) / predictedWeekly) * 7
    if (days > 0 && days <= 3650) daysToGoal = Math.ceil(days)
  }
  const trendsDisagree = predictedWeekly !== null && observed !== null &&
    (Math.sign(predictedWeekly) !== Math.sign(observed) && Math.abs(predictedWeekly - observed) > 0.2 || Math.abs(predictedWeekly - observed) > 0.5)
  const likelyUnderLogging = avg !== null && avg < input.bmr * 0.8 && observed !== null && observed >= -0.1
  return {
    hasEnoughData, completeDays: complete.length, weightEntries: recent.length,
    avgDailyKcal: avg === null ? null : Math.round(avg), dailyBalance: balance === null ? null : Math.round(balance),
    predictedWeeklyChangeKg: predictedWeekly === null ? null : round2(predictedWeekly),
    observedWeeklyChangeKg: observed === null ? null : round2(observed), currentWeightKg: current,
    predicted30dKg: at(30), predicted60dKg: at(60), predicted90dKg: at(90), daysToGoal, trendsDisagree, likelyUnderLogging,
  }
}
const round1 = (n: number) => Math.round(n * 10) / 10
const round2 = (n: number) => Math.round(n * 100) / 100
