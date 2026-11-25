import { fetchWithRetry, INTERACTIVE_DELAYS_MS } from './fetchWithRetry'
import {LOCAL_MEAL_DESTINATION,LOCAL_MEAL_MODEL} from './multimodalMeal'
import {validateVisionResult,type VisionResult} from './mealVision'
import {validateImageFile} from './mealPhoto'
export interface LocalMealMetadata {model:string;digest:string;modelBytes:number;destination:string}
export interface LocalMealService {
 metadata:LocalMealMetadata
 analysisMs:number|null
 analyze:(photo:Blob,authorized:boolean)=>Promise<VisionResult>
 dispose:()=>Promise<void>
}
export async function connectLocalMealService(fetcher:typeof fetch=fetch):Promise<LocalMealService> {
 const response=await fetcher('/api/poc-meal-vision/session',{cache:'no-store'})
 if(!response.ok)throw Error('O modelo de visão local não está disponível. Inicie a POC com o servidor local do Mac.')
 const info=await response.json()
 if(info.model!==LOCAL_MEAL_MODEL || info.destination!==LOCAL_MEAL_DESTINATION || !/^[a-f0-9]{64}$/.test(info.digest) || !/^[a-f0-9]{64}$/.test(info.token) || !Number.isFinite(info.modelBytes) || info.modelBytes<1)throw Error('Sessão de visão local inválida.')
 let disposed=false,busy=false
 const requests=new Set<AbortController>()
 const service:LocalMealService={
  metadata:{model:info.model,digest:info.digest,modelBytes:info.modelBytes,destination:info.destination},analysisMs:null,
  async analyze(photo,authorized) {
   if(!authorized)throw Error('Confirme a análise da imagem neste Mac antes de continuar.')
   if(disposed || busy)throw Error('O analisador local está ocupado ou foi encerrado.')
   validateImageFile(photo)
   const controller=new AbortController();requests.add(controller);busy=true
   try {
    const bytes=new Uint8Array(await photo.arrayBuffer()),chunks:string[]=[]
    for(let offset=0;offset<bytes.length;offset+=0x8000)chunks.push(String.fromCharCode(...bytes.subarray(offset,offset+0x8000)))
    if(disposed)throw Error('Análise descartada.')
    let response:Response
    try{response=await fetchWithRetry('/api/poc-meal-vision/analyze',{method:'POST',headers:{'Content-Type':'application/json','X-Winfit-Poc-Token':info.token},signal:AbortSignal.any([controller.signal,AbortSignal.timeout(125_000)]),body:JSON.stringify({image:btoa(chunks.join('')),mimeType:photo.type,consent:{analysis:true,destination:LOCAL_MEAL_DESTINATION}})},{delaysMs:INTERACTIVE_DELAYS_MS,fetcher})}
    catch{if(disposed)throw Error('Análise descartada.');throw Error('A análise local falhou. Continue manualmente ou tente novamente.')}
    const data=await response.json()
    if(disposed)throw Error('Análise descartada.')
    if(!Number.isFinite(data.elapsedMs) || data.elapsedMs<0)throw Error('Medição de análise inválida.')
    const result=validateVisionResult(data.result)
    if(typeof result.containsFood!=='boolean' || result.candidates.some(c=>c.preparation!==null||c.portionHypothesis!==null))throw Error('A resposta deve identificar alimentos sem afirmar preparo ou porção.')
    service.analysisMs=data.elapsedMs
    return result
   }finally{requests.delete(controller);busy=false}
  },
  async dispose(){disposed=true;requests.forEach(c=>c.abort());requests.clear()},
 }
 return service
}
