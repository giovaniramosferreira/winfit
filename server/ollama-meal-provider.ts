import {LOCAL_MEAL_MODEL,MEAL_VISION_PROMPT,MEAL_VISION_SCHEMA} from '../src/lib/multimodalMeal'
import type {LocalModelInfo} from './poc-meal-vision'
const BASE='http://127.0.0.1:11435'
export function createOllamaMealProvider() {
 let cached:LocalModelInfo|null=null
 return {
  async info():Promise<LocalModelInfo> {
   if(cached)return cached
   const [tags,show]=await Promise.all([
    fetch(BASE+'/api/tags',{signal:AbortSignal.timeout(10_000)}).then(r=>{if(!r.ok)throw Error('offline');return r.json()}),
    fetch(BASE+'/api/show',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:LOCAL_MEAL_MODEL}),signal:AbortSignal.timeout(10_000)}).then(r=>{if(!r.ok)throw Error('missing');return r.json()}),
   ])
   const model=tags.models?.find((m:{name:string})=>m.name===LOCAL_MEAL_MODEL)
   if(!model || !show.capabilities?.includes('vision') || !/^[a-f0-9]{64}$/.test(model.digest) || !Number.isFinite(model.size) || model.size<1)throw Error('Modelo de visão local inválido.')
   cached={model:LOCAL_MEAL_MODEL,digest:model.digest,modelBytes:model.size};return cached
  },
  async analyze(bytes:Uint8Array,_mime:string,signal:AbortSignal) {
   const started=performance.now()
   const response=await fetch(BASE+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal,body:JSON.stringify({model:LOCAL_MEAL_MODEL,stream:false,format:MEAL_VISION_SCHEMA,options:{temperature:0,num_ctx:4096,num_predict:1000,seed:42},keep_alive:'10m',messages:[{role:'user',content:MEAL_VISION_PROMPT,images:[Buffer.from(bytes).toString('base64')]}]})})
   if(!response.ok)throw Error('Modelo local indisponível.')
   const value=await response.json()
   if(value.done!==true || value.done_reason==='length' || typeof value.message?.content!=='string')throw Error('Resposta incompleta do modelo local.')
   return {raw:JSON.parse(value.message.content),elapsedMs:performance.now()-started}
  },
 }
}
