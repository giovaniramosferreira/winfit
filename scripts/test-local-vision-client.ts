import assert from 'node:assert/strict'
import * as client from '../src/lib/localMealService'
assert.equal(typeof client.connectLocalMealService,'function')
let calls=0,analyzed=0
const fetcher:typeof fetch=async(url,options)=>{
 calls++
 if(String(url).endsWith('/session'))return new Response(JSON.stringify({model:'qwen3-vl:4b-instruct',digest:'a'.repeat(64),modelBytes:3300000000,destination:'Este Mac — Ollama local',token:'b'.repeat(64)}))
 analyzed++;const body=JSON.parse(options!.body as string);assert.equal(body.consent.analysis,true);assert.equal(body.image,'/9j/4A==');assert.equal((options!.headers as Record<string,string>)['X-Winfit-Poc-Token'],'b'.repeat(64))
 return new Response(JSON.stringify({elapsedMs:25,result:{containsFood:true,dishName:'Arroz',candidates:[{name:'Arroz',preparation:null,portionHypothesis:null,uncertainties:[]}],questions:[]}}))
}
const model=await client.connectLocalMealService(fetcher)
assert.equal(calls,1);assert.equal(model.metadata.model,'qwen3-vl:4b-instruct')
const photo=new Blob([new Uint8Array([255,216,255,224])],{type:'image/jpeg'})
await assert.rejects(()=>model.analyze(photo,false));assert.equal(analyzed,0)
const result=await model.analyze(photo,true);assert.equal(result.candidates[0].name,'Arroz');assert.equal(model.analysisMs,25)
await model.dispose();await assert.rejects(()=>model.analyze(photo,true));assert.equal(analyzed,1)
const altered=await client.connectLocalMealService(async(url,options)=>{const response=await fetcher(url,options);const data=await response.json();if(data.result)data.result.candidates[0].preparation='frito';return new Response(JSON.stringify(data))})
await assert.rejects(()=>altered.analyze(photo,true),'Browser also rejects unconfirmed preparation')
await altered.dispose()
await assert.rejects(()=>client.connectLocalMealService(async()=>new Response('{}',{status:503})))
console.log('Local vision browser adapter: explicit consent, candidate validation, no upload before consent and disposal PASS')

// AURAVIZ-159: um 503 transitório recebe um único retry rápido; erro definitivo não é repetido.
{
  let analyzeCalls = 0
  const flaky: typeof fetch = async (url) => {
    if (String(url).endsWith('/session')) return new Response(JSON.stringify({ model: 'qwen3-vl:4b-instruct', digest: 'a'.repeat(64), modelBytes: 3300000000, destination: 'Este Mac — Ollama local', token: 'b'.repeat(64) }))
    analyzeCalls++
    if (analyzeCalls === 1) return new Response('{}', { status: 503 })
    return new Response(JSON.stringify({ elapsedMs: 30, result: { containsFood: true, dishName: 'Arroz', candidates: [{ name: 'Arroz', preparation: null, portionHypothesis: null, uncertainties: [] }], questions: [] } }))
  }
  const retried = await client.connectLocalMealService(flaky)
  const started = Date.now()
  const ok = await retried.analyze(photo, true)
  assert.equal(ok.candidates[0].name, 'Arroz')
  assert.equal(analyzeCalls, 2, 'repetiu uma vez após 503')
  assert.ok(Date.now() - started >= 1400, 'esperou o atraso do fluxo interativo (1,5 s)')
  let hard = 0
  const broken: typeof fetch = async (url) => {
    if (String(url).endsWith('/session')) return new Response(JSON.stringify({ model: 'qwen3-vl:4b-instruct', digest: 'a'.repeat(64), modelBytes: 3300000000, destination: 'Este Mac — Ollama local', token: 'b'.repeat(64) }))
    hard++; return new Response('{}', { status: 500 })
  }
  await assert.rejects(() => (async () => (await client.connectLocalMealService(broken)).analyze(photo, true))(), /A análise local falhou/)
  assert.equal(hard, 1, '500 não é repetido')
  console.log('Local vision: retry interativo de 503 (1 vez) e erro definitivo sem repetição PASS')
}
