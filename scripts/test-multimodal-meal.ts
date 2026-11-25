import assert from 'node:assert/strict'
import * as multimodal from '../src/lib/multimodalMeal'
assert.equal(typeof multimodal.parseMultimodalMeal,'function','Multimodal output needs strict validation')
const raw={containsFood:true,dishName:'Arroz com feijão',items:[{name:'Arroz',preparation:null,uncertainties:[]},{name:'Feijão',preparation:null,uncertainties:['Tipo de feijão não confirmado']}],questions:['Quanto foi consumido?']}
const result=multimodal.parseMultimodalMeal(raw)
assert.equal(result.candidates.length,2);assert.equal(result.dishName,'Arroz com feijão');assert.equal(result.containsFood,true)
assert.equal(result.candidates[0].portionHypothesis,null)
assert.deepEqual(multimodal.parseMultimodalMeal({containsFood:false,dishName:null,items:[],questions:[]}).candidates,[])
for(const value of [{...raw,kcal:100},{...raw,containsFood:false},{...raw,items:[{...raw.items[0],grams:100}]},{...raw,items:[{...raw.items[0],confidence:.9}]},{...raw,items:[]},{...raw,containsFood:'true'}])assert.throws(()=>multimodal.parseMultimodalMeal(value))
const group='photo-123'
const items=multimodal.applyRecognizedFoods([{id:'blank',name:'',portion:null,kcal:null}],group,result.candidates)
assert.deepEqual(items.map(i=>i.name),['Arroz','Feijão']);assert.equal(items[0].kcal,null)
const repeated=multimodal.applyRecognizedFoods(items,group,result.candidates.slice().reverse())
assert.equal(repeated.length,2);assert.deepEqual(new Set(repeated.map(i=>i.id)),new Set(items.map(i=>i.id)))
const manual={id:'manual',name:'Suco',portion:100,kcal:50}
assert.equal(multimodal.applyRecognizedFoods([...items,manual],group,result.candidates).length,3)
const reviewed={...items[0],name:'Arroz, tipo 1, cozido',portion:150,kcal:195}
const kept=multimodal.applyRecognizedFoods([reviewed,items[1]],group,result.candidates)
assert.equal(kept.find(i=>i.id===reviewed.id)?.kcal,195,'Same recognized food preserves reviewed portion/calories')
assert.equal(multimodal.applyRecognizedFoods(items,group,[result.candidates[0]]).length,2,'Reanalysis cannot silently remove an existing food')
assert.equal(multimodal.applyRecognizedFoods([reviewed,items[1]],group,[result.candidates[1]]).find(i=>i.id===reviewed.id)?.kcal,195,'An omitted reviewed food retains its portion and energy')
assert.deepEqual(multimodal.applyRecognizedFoods([reviewed],group,[{...result.candidates[0],name:'Arroz branco'}]),[reviewed],'A renamed prediction cannot overwrite a human correction')
assert.throws(()=>multimodal.parseMultimodalMeal({...raw,items:[{...raw.items[0],preparation:'frito com óleo'}]}),'The model cannot assert preparation')
console.log('Multimodal meals: strict item contract, non-food, no invented nutrients and idempotent batch review PASS')
