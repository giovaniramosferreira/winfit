import {readFile,writeFile} from 'node:fs/promises'
import path from 'node:path'
import {tmpdir} from 'node:os'
import {MEAL_VISION_PROMPT,MEAL_VISION_SCHEMA,parseMultimodalMeal} from '../src/lib/multimodalMeal'
const model=process.env.WINFIT_PROBE_MODEL||'qwen3-vl:4b-instruct'
if(!/^qwen3-vl:(4b|8b)-instruct$/.test(model))throw Error('Only explicitly local evaluation models are accepted')
const rows=[]
const tags=await fetch('http://127.0.0.1:11435/api/tags').then(r=>r.json())
const metadata=tags.models.find((m:{name:string})=>m.name===model)
for(const id of (process.env.WINFIT_PROBE_IDS||'cc-23,cc-24,cc-21,br-01,br-02,br-03,br-04').split(',')){
 if(!/^(cc|br)-\d{2}$/.test(id))throw Error('Invalid public fixture ID')
 const image=(await readFile(path.join(tmpdir(),'winfit-meal-vision-poc',id+'.jpg'))).toString('base64'),started=performance.now()
 const response=await fetch('http://127.0.0.1:11435/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(180000),body:JSON.stringify({model,stream:false,format:MEAL_VISION_SCHEMA,options:{temperature:0,num_ctx:4096,num_predict:1000,seed:42},keep_alive:'5m',messages:[{role:'user',content:MEAL_VISION_PROMPT,images:[image]}]})})
 const data=await response.json()
 const row={id,status:response.status,model,digest:metadata?.digest,modelBytes:metadata?.size,latencyMs:Math.round(performance.now()-started),result:data.message?.content?parseMultimodalMeal(JSON.parse(data.message.content)):null,error:data.error,loadDuration:data.load_duration,doneReason:data.done_reason}
 rows.push(row);console.log(JSON.stringify(row));await writeFile(`/tmp/winfit-probe-${model.replace(':','-')}.json`,JSON.stringify(rows,null,2))
}
