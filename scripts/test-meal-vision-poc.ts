import assert from 'node:assert/strict'
import * as vision from '../src/lib/mealVision'
import * as catalog from '../src/lib/foodCatalog'
import { validateMeal, daySummary } from '../src/lib/nutrition'
import * as nutrition from '../src/lib/nutrition'
import { createNutritionStore } from '../src/lib/nutritionStore'
import { execFileSync } from 'node:child_process'

assert.equal(typeof vision.validateVisionResult, 'function', 'Local vision needs a strict candidate-only contract')
const candidate = {name:'Arroz',preparation:'cozido',portionHypothesis:null,uncertainties:['Peso desconhecido']}
assert.deepEqual(vision.validateVisionResult({candidates:[candidate],questions:['Quanto consumiu?']}),{candidates:[candidate],questions:['Quanto consumiu?']})
for (const patch of [{kcal:150},{confidence:.9},{protein:20},{portionHypothesis:{minGrams:0,maxGrams:100,assumption:'prato'}}]) {
  assert.throws(()=>vision.validateVisionResult({candidates:[{...candidate,...patch}],questions:[]}))
}
assert.throws(()=>vision.validateVisionResult({candidates:[],questions:[],calories:20}))
assert.throws(()=>vision.validateVisionResult({candidates:[{...candidate,name:''}],questions:[]}))
assert.throws(()=>vision.validateVisionResult({candidates:Array(31).fill(candidate),questions:[]}))
assert.deepEqual(vision.validateVisionResult({candidates:[],questions:['A foto tem comida?']}),{candidates:[],questions:['A foto tem comida?']})
const range={minGrams:50,maxGrams:150,assumption:'Hipótese de uma concha, sem peso medido'}
vision.validateVisionResult({candidates:[{...candidate,portionHypothesis:range}],questions:[]})
assert.throws(()=>vision.validateVisionResult({candidates:[{...candidate,portionHypothesis:{...range,maxGrams:NaN}}],questions:[]}))
assert.equal(vision.candidatesFromLogits([0,10,1],['apple_pie','rice','steak']).candidates[0].name,'rice')
assert.equal(vision.candidatesFromLogits([0,10,1],['apple_pie','rice','steak']).candidates[0].portionHypothesis,null)
assert.throws(()=>vision.candidatesFromLogits([NaN],['rice']))
assert.throws(()=>vision.candidatesFromLogits([1,2],['rice']))
const rice=catalog.FOOD_CATALOG.find(f=>f.recordId==='TACO-3')!
assert.ok(rice)
assert.equal(catalog.searchFoods('arroz').length>=1,true)
assert.equal(catalog.searchFoods('inexistente-xyz').length,0)
const reviewed=catalog.confirmCatalogItem({id:'item-1',source:rice,grams:150,confirmed:true,notes:'Sem molho; peso informado'})
assert.equal(reviewed.kcal,192)
assert.deepEqual(reviewed.macros,{protein:3.75,carbohydrate:42.15,fat:.3})
assert.equal(reviewed.provenance?.version,'TACO-4-2011-subset-1')
assert.equal(reviewed.provenance?.recordId,'TACO-3')
assert.equal(reviewed.review?.notes,'Sem molho; peso informado')
for (const grams of [NaN,Infinity,0,-1]) assert.throws(()=>catalog.confirmCatalogItem({id:'i',source:rice,grams,confirmed:true,notes:''}))
assert.throws(()=>catalog.confirmCatalogItem({id:'i',source:rice,grams:100,confirmed:false,notes:''}))
assert.throws(()=>catalog.confirmCatalogItem({id:'i',source:{...rice,recordId:'missing'},grams:100,confirmed:true,notes:''}))
const meal={id:'m',date:'2026-11-04',time:'23:59',type:'Jantar',items:[reviewed]}
validateMeal(meal)
assert.throws(()=>validateMeal({...meal,items:[{...reviewed,kcal:300,provenance:{...reviewed.provenance,kcalPer100g:200}}]}),'Catalog identity must not permit altered source values')
assert.equal(nutrition.editFoodItem(reviewed,{portion:200}).kcal,256,'Editing confirmed grams recalculates the source-based nutrients')
assert.equal(nutrition.editFoodItem(reviewed,{name:'Outro alimento'}).provenance,undefined)
assert.equal(nutrition.editFoodItem(reviewed,{name:'Outro alimento'}).kcal,null,'Changing identity invalidates the derived estimate')
assert.equal(nutrition.editFoodItem(reviewed,{portion:null}).kcal,null)
assert.equal(nutrition.upsertReviewedItem([reviewed],reviewed).length,1,'Reviewing the same photo item twice cannot duplicate consumption')
assert.equal(nutrition.upsertReviewedItem([{id:'blank',name:'',portion:null,kcal:null}],reviewed).length,1)
for (const patch of [{kcal:0},{macros:{...reviewed.macros,protein:999}},{portion:200},{provenance:{...reviewed.provenance,gramsConfirmed:false}}]) assert.throws(()=>validateMeal({...meal,items:[{...reviewed,...patch}]}))
let raw:string|null=null
const storage={getItem:()=>raw,setItem:(_k:string,v:string)=>{raw=v},removeItem:()=>{raw=null}}
const store=createNutritionStore(storage)
store.upsertMeal(meal);store.upsertMeal(meal)
assert.equal(store.getState().meals.length,1)
assert.equal(daySummary(store.getState().meals,meal.date).kcal,192)
const edited=catalog.confirmCatalogItem({id:'item-1',source:rice,grams:200,confirmed:true,notes:'Porção corrigida'})
store.upsertMeal({...meal,items:[edited]})
assert.equal(daySummary(store.getState().meals,meal.date).kcal,256)
store.deleteMeal('m'); assert.equal(daySummary(store.getState().meals,meal.date).kcal,0)
store.restoreMeal('m'); assert.equal(daySummary(store.getState().meals,meal.date).kcal,256)
assert.equal(createNutritionStore(storage).getState().meals[0].items[0].macros?.carbohydrate,56.2)
assert.equal(catalog.dayMacros([...store.getState().meals,{...meal,id:'manual',items:[{id:'x',name:'Sem kcal',portion:null,kcal:null}]}],meal.date).pending,1)
assert.equal(catalog.dayMacros(store.getState().meals,'2026-11-05').protein,0)
for (const [zone,expected] of [['America/Sao_Paulo','2026-11-04'],['UTC','2026-11-05']]) {
  const date=execFileSync(process.execPath,['--import','tsx','--input-type=module','-e',"import {localDate} from './src/lib/nutrition.ts';process.stdout.write(localDate(new Date('2026-11-05T02:30:00Z')))"],{env:{...process.env,TZ:zone},encoding:'utf8'})
  assert.equal(date,expected,'A meal near UTC midnight uses the selected device timezone')
}
console.log('Meal vision POC: strict candidates, catalog, confirmed macros, provenance, persistence and idempotency PASS')
