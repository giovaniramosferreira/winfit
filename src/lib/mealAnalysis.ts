export interface MealCandidate { name:string; confidence:number }
export interface MealCandidates { candidates:MealCandidate[] }
/** Only names and confidence are accepted; image analysis must never invent nutrients or portions. */
export function validateCandidates(value:unknown): MealCandidates {
  if(!value || typeof value!=='object' || Object.keys(value).some(k=>k!=='candidates'))throw Error('Resposta de análise inválida')
  const candidates=(value as MealCandidates).candidates
  if(!Array.isArray(candidates) || candidates.length>30 || candidates.some(c=>!c || Object.keys(c).some(k=>k!=='name'&&k!=='confidence') || typeof c.name!=='string' || !c.name.trim() || c.name.length>120 || typeof c.confidence!=='number' || !Number.isFinite(c.confidence) || c.confidence<0 || c.confidence>1))throw Error('Resposta de análise inválida')
  return {candidates:candidates.map(c=>({name:c.name.trim(),confidence:c.confidence}))}
}
export interface NutritionSource {
  source:'user-label'|'USDA-FDC'|'licensed-dataset'
  recordId:string
  description:string
  kcalPer100g:number
  version:string
  license:string
  sourceUrl?:string
}
export interface ConfirmedNutrition { portion:number; kcal:number; provenance:NutritionSource & {confirmedAt:string;gramsConfirmed:true} }
export function calculateConfirmedNutrition(source:NutritionSource,grams:number,confirmed:boolean): ConfirmedNutrition {
  if(!confirmed)throw Error('Confirme o alimento e a quantidade antes de calcular.')
  if(!source || !['user-label','USDA-FDC','licensed-dataset'].includes(source.source) || !source.recordId?.trim() || !source.description?.trim() || !source.version?.trim() || !source.license?.trim() || !Number.isFinite(source.kcalPer100g) || source.kcalPer100g<0 || !Number.isFinite(grams) || grams<=0)throw Error('Fonte e quantidade precisam ser válidas e confirmadas.')
  const kcal=source.kcalPer100g*grams/100
  if(!Number.isFinite(kcal))throw Error('Valor fora do intervalo permitido.')
  return {portion:grams,kcal:Math.round(kcal*100)/100,provenance:{...source,confirmedAt:new Date().toISOString(),gramsConfirmed:true}}
}
