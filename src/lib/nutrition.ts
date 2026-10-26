import { calculateConfirmedNutrition, type ConfirmedNutrition } from './mealAnalysis'
export interface FoodItem { id: string; name: string; portion: number | null; kcal: number | null; provenance?: ConfirmedNutrition['provenance'] }
export interface Meal { id: string; date: string; time: string; type: string; items: FoodItem[] }
export type NutritionGoal = { id: string; date: string; mode: 'direct'; kcal: number } | { id: string; date: string; mode: 'calculated'; maintenance: number; deficit: number }
export function localDate(now = new Date()): string { return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}` }
export function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(`${value}T12:00:00`)
  return !Number.isNaN(d.getTime()) && localDate(d) === value
}
function text(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0 && value.length <= 200 }
function number(value: unknown, zero = true): value is number { return typeof value === 'number' && Number.isFinite(value) && (zero ? value >= 0 : value > 0) }
export function validateMeal(value: unknown): asserts value is Meal {
  const m = value as Meal
  if (!m || !text(m.id) || !validDate(m.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(m.time) || !text(m.type) || !Array.isArray(m.items) || !m.items.length || m.items.some(i => !i || !text(i.id) || !text(i.name) || (i.portion !== null && !number(i.portion,false)) || (i.kcal !== null && !number(i.kcal))) || new Set(m.items.map(i=>i.id)).size !== m.items.length) throw Error('Refeição inválida: confira data, horário e itens. Porção deve ser positiva e kcal não podem ser negativas.')
  for(const item of m.items) if(item.provenance) {
    const calculated=calculateConfirmedNutrition(item.provenance,item.portion ?? NaN,item.provenance.gramsConfirmed===true)
    if(!item.provenance.confirmedAt || !Number.isFinite(Date.parse(item.provenance.confirmedAt)) || calculated.kcal!==item.kcal)throw Error('Proveniência nutricional inválida ou cálculo divergente.')
  }
}
export function validateGoal(value: unknown): asserts value is NutritionGoal {
  const g = value as NutritionGoal
  if (!g || !text(g.id) || !validDate(g.date) || (g.mode === 'direct' ? !number(g.kcal,false) : g.mode !== 'calculated' || !number(g.maintenance,false) || !number(g.deficit) || g.deficit >= g.maintenance)) throw Error('Meta inválida: informe valores válidos e uma data de início. O déficit deve ser menor que a manutenção.')
}
export function daySummary(meals: Meal[], date: string) {
  const items = meals.filter(m=>m.date===date).flatMap(m=>m.items)
  const pending = items.filter(i=>i.kcal===null).length
  return {kcal:items.reduce((s,i)=>s+(i.kcal ?? 0),0),pending,partial:pending>0}
}
export function goalForDate(goals: NutritionGoal[], date: string): number | null {
  const g = goals.filter(g=>g.date<=date).sort((a,b)=>b.date.localeCompare(a.date)).at(0)
  return g ? g.mode==='direct' ? g.kcal : g.maintenance-g.deficit : null
}
