import { calculateConfirmedNutrition, type NutritionSource } from './mealAnalysis'
import type { FoodItem, Meal } from './nutrition'
export const CATALOG_VERSION='TACO-4-2011-subset-1'
export const TACO_URL='https://nepa.unicamp.br/wp-content/uploads/sites/27/2023/10/taco_4_edicao_ampliada_e_revisada.pdf'
export const CATALOG_ATTRIBUTION='NEPA/UNICAMP. Tabela Brasileira de Composição de Alimentos — TACO. 4ª ed. revisada e ampliada. Campinas, 2011.'
export interface CatalogFood extends NutritionSource { preparation:string }
// Published rounded values per 100 g of edible portion, Table 1. No household conversions.
function food(id:number,description:string,preparation:string,kcal:number,protein:number,carbohydrate:number,fat:number):CatalogFood {
  return {source:'licensed-dataset',recordId:`TACO-${id}`,description,preparation,kcalPer100g:kcal,macrosPer100g:{protein,carbohydrate,fat},version:CATALOG_VERSION,license:'Reprodução permitida com citação da fonte — NEPA/UNICAMP, 2011, p. ii–iii',sourceUrl:TACO_URL}
}
export const FOOD_CATALOG:ReadonlyArray<CatalogFood>=[
  food(3,'Arroz, tipo 1, cozido','cozido',128,2.5,28.1,.2),
  food(561,'Feijão, carioca, cozido','cozido, sem ingredientes adicionados',76,4.8,13.6,.5),
  food(410,'Frango, peito, sem pele, grelhado','grelhado, sem pele',159,32,0,2.5),
  food(78,'Alface, crespa, crua','crua, sem molho',11,1.3,1.7,.2),
  food(540,'Feijoada','receita padronizada TACO; pode diferir da sua',117,8.7,11.6,6.5),
]
export function validateCatalogSource(source:NutritionSource):void {
  if(!source.recordId?.startsWith('TACO-') && source.version!==CATALOG_VERSION)return
  const canonical=FOOD_CATALOG.find(f=>f.recordId===source.recordId && f.version===source.version)
  if(!canonical || (['source','description','kcalPer100g','license','sourceUrl'] as const).some(k=>source[k]!==canonical[k]) || !source.macrosPer100g || (['protein','carbohydrate','fat'] as const).some(k=>source.macrosPer100g![k]!==canonical.macrosPer100g![k]))throw Error('A fonte do catálogo foi alterada ou não corresponde à versão de referência.')
}
const normalized=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
export function searchFoods(query:string):CatalogFood[] {
  const terms=normalized(query).trim().split(/\s+/).filter(Boolean)
  return FOOD_CATALOG.filter(f=>terms.every(t=>normalized(f.description).includes(t)))
}
export function confirmCatalogItem({id,source,grams,confirmed,notes}:{id:string;source:CatalogFood;grams:number;confirmed:boolean;notes:string}):FoodItem {
  const canonical=FOOD_CATALOG.find(f=>f.recordId===source.recordId && f.version===source.version)
  if(!canonical || !id.trim() || typeof notes!=='string' || notes.length>1000)throw Error('Escolha uma correspondência do catálogo e confira as observações.')
  return {id,name:canonical.description,...calculateConfirmedNutrition(canonical,grams,confirmed),review:{preparation:canonical.preparation,notes:notes.trim()}}
}
export function dayMacros(meals:Meal[],date:string) {
  const items=meals.filter(m=>m.date===date).flatMap(m=>m.items)
  const total=items.reduce((sum,i)=>({protein:sum.protein+(i.macros?.protein??0),carbohydrate:sum.carbohydrate+(i.macros?.carbohydrate??0),fat:sum.fat+(i.macros?.fat??0)}),{protein:0,carbohydrate:0,fat:0})
  return {...Object.fromEntries(Object.entries(total).map(([k,v])=>[k,Math.round(v*100)/100])) as typeof total,pending:items.filter(i=>!i.macros).length}
}
