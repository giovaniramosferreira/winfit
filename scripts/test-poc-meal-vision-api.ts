import assert from 'node:assert/strict'
import * as api from '../server/poc-meal-vision'
assert.equal(typeof api.createPocMealVisionHandler,'function','A local authenticated development route is required')
const origin='http://127.0.0.1:5176',token='a'.repeat(64)
let calls=0
const raw={containsFood:true,dishName:'Arroz com feijão',items:[{name:'Arroz',preparation:null,uncertainties:[]},{name:'Feijão',preparation:null,uncertainties:[]}],questions:['Quanto consumiu?']}
const handler=api.createPocMealVisionHandler({origin,token,info:async()=>({model:'qwen3-vl:4b-instruct',digest:'local-sha',modelBytes:3300000000}),analyze:async(bytes,mime)=>{calls++;assert.deepEqual([...bytes],[255,216,255,224]);assert.equal(mime,'image/jpeg');return {raw,elapsedMs:20}}})
const request=(body:unknown,headers:Record<string,string>={},method='POST')=>new Request(origin+'/api/poc-meal-vision/analyze',{method,headers:{Origin:origin,'Content-Type':'application/json','X-Winfit-Poc-Token':token,...headers},...(method==='POST'?{body:JSON.stringify(body)}:{})})
const body={image:Buffer.from([255,216,255,224]).toString('base64'),mimeType:'image/jpeg',consent:{analysis:true,destination:'Este Mac — Ollama local'}}
assert.equal((await handler(request(body,{Origin:'https://evil.test'}))).status,403)
assert.equal((await handler(request(body,{'X-Winfit-Poc-Token':'bad'}))).status,403)
assert.equal((await handler(request(body,{'X-Winfit-Poc-Token':'é'.repeat(64)}))).status,403)
assert.equal((await handler(request({...body,consent:{analysis:false,destination:body.consent.destination}}))).status,403)
assert.equal((await handler(request({...body,consent:{analysis:true,destination:'cloud'}}))).status,403)
assert.equal((await handler(request({...body,profile:{name:'secret'}}))).status,400)
assert.equal((await handler(request({...body,image:'invalid'}))).status,400)
assert.equal((await handler(request({...body,mimeType:'image/svg+xml'}))).status,415)
assert.equal(calls,0)
const response=await handler(request(body));assert.equal(response.status,200)
const data=await response.json();assert.equal(data.result.candidates.length,2);assert.equal(data.result.candidates[0].portionHypothesis,null)
assert.equal(calls,1)
assert.equal((await handler(new Request(origin+'/api/poc-meal-vision/session',{headers:{Origin:origin}}))).status,200)
assert.equal((await handler(new Request(origin+'/api/poc-meal-vision/session',{headers:{Origin:'https://evil.test'}}))).status,403)
const invalid=api.createPocMealVisionHandler({origin,token,info:async()=>{throw Error('unavailable')},analyze:async()=>({raw:{...raw,kcal:100},elapsedMs:1})})
assert.equal((await invalid(new Request(origin+'/api/poc-meal-vision/session',{headers:{Origin:origin}}))).status,503)
assert.equal((await invalid(request(body))).status,502)
assert.equal((await handler(request(null,{},'GET'))).status,405)
console.log('Local multimodal API: origin/token/consent, minimal schema, file validation, provider errors and candidates-only output PASS')
