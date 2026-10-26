import { validateGoal, validateMeal, type Meal, type NutritionGoal } from './nutrition'
export const NUTRITION_STORAGE_KEY = 'winfit-nutrition-v1'
export interface NutritionData { version: 1; meals: Meal[]; goals: NutritionGoal[]; deleted: Meal[] }
interface State extends NutritionData { error: string | null; blocked: boolean }
type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
const empty = (): NutritionData => ({version:1,meals:[],goals:[],deleted:[]})
export function parseNutritionData(raw: string): NutritionData {
  const d = JSON.parse(raw)
  if (!d || d.version!==1 || !Array.isArray(d.meals) || !Array.isArray(d.goals) || !Array.isArray(d.deleted)) throw Error('Dados inválidos')
  d.meals.forEach(validateMeal); d.deleted.forEach(validateMeal); d.goals.forEach(validateGoal)
  if (new Set([...d.meals,...d.deleted].map((m:Meal)=>m.id)).size!==d.meals.length+d.deleted.length || new Set(d.goals.map((g:NutritionGoal)=>g.id)).size!==d.goals.length) throw Error('IDs inválidos')
  return {version:1,meals:d.meals,goals:d.goals,deleted:d.deleted}
}
export function createNutritionStore(storage: StoragePort | null) {
  let state: State = {...empty(),error:null,blocked:false}
  const listeners = new Set<()=>void>()
  const notify = () => listeners.forEach(fn=>fn())
  try { const raw=storage?.getItem(NUTRITION_STORAGE_KEY); if(raw) state={...parseNutritionData(raw),error:null,blocked:false} } catch { state={...state,error:'Dados alimentares inválidos ou indisponíveis. Exporte uma cópia antes de redefinir; o conteúdo original foi preservado.',blocked:true} }
  function persist(data: NutritionData, force=false) {
    if(state.blocked && !force) return false
    try { if(!storage) throw Error('unavailable'); storage.setItem(NUTRITION_STORAGE_KEY,JSON.stringify(data)); state={...data,error:null,blocked:false}; notify(); return true }
    catch { state={...state,error:'Não foi possível salvar a alimentação neste dispositivo. Libere espaço ou permita armazenamento e tente novamente.'}; notify(); return false }
  }
  const data=(): NutritionData => ({version:1,meals:state.meals,goals:state.goals,deleted:state.deleted})
  return {
    getState:()=>state,
    subscribe:(fn:()=>void)=>{listeners.add(fn);return ()=>{listeners.delete(fn)}},
    upsertMeal:(meal:Meal)=>{validateMeal(meal);return persist({...data(),meals:[...state.meals.filter(m=>m.id!==meal.id),structuredClone(meal)],deleted:state.deleted.filter(m=>m.id!==meal.id)})},
    deleteMeal:(id:string)=>{const meal=state.meals.find(m=>m.id===id);return meal ? persist({...data(),meals:state.meals.filter(m=>m.id!==id),deleted:[...state.deleted,meal]}) : false},
    restoreMeal:(id:string)=>{const meal=state.deleted.find(m=>m.id===id);return meal ? persist({...data(),meals:[...state.meals,meal],deleted:state.deleted.filter(m=>m.id!==id)}) : false},
    upsertGoal:(goal:NutritionGoal)=>{validateGoal(goal);return persist({...data(),goals:[...state.goals.filter(g=>g.id!==goal.id && g.date!==goal.date),structuredClone(goal)]})},
    deleteGoal:(id:string)=>persist({...data(),goals:state.goals.filter(g=>g.id!==id)}),
    exportData:()=>{if(state.blocked) {try{return storage?.getItem(NUTRITION_STORAGE_KEY) ?? JSON.stringify(data())}catch{return JSON.stringify(data())}}return JSON.stringify(data())},
    importData:(raw:string)=>{try{return persist(parseNutritionData(raw))}catch{state={...state,error:'Arquivo alimentar inválido. Seus dados atuais foram preservados.'};notify();return false}},
    reset:()=>persist(empty(),true),
  }
}
let storage: StoragePort | null = null
try { storage = typeof localStorage === 'undefined' ? null : localStorage } catch { /* visible on write */ }
export const nutritionStore = createNutritionStore(storage)
export const exportNutritionData = () => nutritionStore.exportData()
export const importNutritionData = (raw:string) => nutritionStore.importData(raw)
export const resetNutritionData = () => nutritionStore.reset()
