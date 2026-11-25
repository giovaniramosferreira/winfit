import { calculateConfirmedNutrition, type ConfirmedNutrition } from './mealAnalysis'
import { validateCatalogSource } from './foodCatalog'
/** Estimativa de IA ACEITA pelo usuário (AURAVIZ-160). Nunca vem de proveniência confirmada; fica separada do total confirmado. */
export interface AiEstimateMeta { origin: 'ai'; kcalMin: number; kcalMax: number; macros?: { protein: number; carbohydrate: number; fat: number }; acceptedAt: string }
export interface FoodItem { id: string; name: string; portion: number | null; kcal: number | null; provenance?: ConfirmedNutrition['provenance']; macros?:ConfirmedNutrition['macros']; review?:{preparation:string;notes:string;previousPortion?:number}; recognition?:{groupId:string;name:string}; estimate?: AiEstimateMeta }
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
  for(const item of m.items) {
    if(item.estimate) {
      const e=item.estimate
      if(e.origin!=='ai' || item.provenance || item.macros || !number(item.kcal as number) || !number(e.kcalMin) || !number(e.kcalMax) || e.kcalMin>e.kcalMax || (item.kcal as number)<e.kcalMin || (item.kcal as number)>e.kcalMax || !Number.isFinite(Date.parse(e.acceptedAt)))throw Error('Estimativa de IA inválida: use faixa coerente, sem fonte confirmada, e aceite explícito.')
      if(e.macros && !['protein','carbohydrate','fat'].every(k=>number((e.macros as Record<string,number>)[k]) && Object.keys(e.macros as object).length===3))throw Error('Macros estimados inválidos.')
    }
    if(item.recognition && (!text(item.recognition.groupId) || !item.recognition.groupId.startsWith('photo-') || !text(item.recognition.name)))throw Error('Referência de reconhecimento inválida.')
    if(item.review && (typeof item.review.preparation!=='string' || item.review.preparation.length>500 || typeof item.review.notes!=='string' || item.review.notes.length>1000 || (item.review.previousPortion!==undefined && !number(item.review.previousPortion,false))))throw Error('Revisão de alimento inválida.')
    if(item.macros && !item.provenance)throw Error('Macronutrientes precisam de uma fonte identificada.')
    if(!item.provenance)continue
    validateCatalogSource(item.provenance)
    const calculated=calculateConfirmedNutrition(item.provenance,item.portion ?? NaN,item.provenance.gramsConfirmed===true)
    if(!item.provenance.confirmedAt || !Number.isFinite(Date.parse(item.provenance.confirmedAt)) || calculated.kcal!==item.kcal)throw Error('Proveniência nutricional inválida ou cálculo divergente.')
    if(calculated.macros || item.macros) {
      if(!calculated.macros || !item.macros || Object.keys(item.macros).some(k=>!['protein','carbohydrate','fat'].includes(k)) || (['protein','carbohydrate','fat'] as const).some(k=>item.macros![k]!==calculated.macros![k]))throw Error('Macronutrientes divergentes da fonte e porção confirmadas.')
    }
  }
}
/** Explicit gram corrections retain the source and recalculate; manual identity/kcal edits invalidate it. */
export function editFoodItem(item:FoodItem,patch:Partial<FoodItem>):FoodItem {
  if(Object.keys(patch).length===1 && 'portion' in patch && item.provenance && number(patch.portion,false)) {
    return {...item,...calculateConfirmedNutrition(item.provenance,patch.portion,true),review:{preparation:item.review?.preparation??item.provenance.description,notes:item.review?.notes??'',...(item.portion!==null?{previousPortion:item.portion}:{})}}
  }
  return {...item,...(item.provenance?{kcal:null}:{}),provenance:undefined,macros:undefined,review:undefined,...patch}
}
export function upsertReviewedItem(items:FoodItem[],reviewed:FoodItem):FoodItem[] {
  const oldIndex=items.findIndex(i=>i.id===reviewed.id)
  if(oldIndex>=0)return items.map(i=>i.id===reviewed.id?reviewed:i)
  return [...items.filter(i=>i.name.trim() || i.portion!==null || i.kcal!==null),reviewed]
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
