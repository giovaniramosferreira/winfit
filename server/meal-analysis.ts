import { hasImageSignature, MAX_MEAL_PHOTO_BYTES, validateImageFile } from '../src/lib/mealPhoto'
import { validateCandidates, type MealCandidates } from '../src/lib/mealAnalysis'
export type CoordinationResult = {kind:'done';value:MealCandidates}|{kind:'conflict'|'busy'|'rate-limited'}
export interface AnalysisCoordinator {
  /** Must atomically reserve user/key + fingerprint, enforce per-user quotas and persist result. No per-process production fallback. */
  run(userId:string,key:string,fingerprint:string,task:()=>Promise<MealCandidates>): Promise<CoordinationResult>
}
export interface MealAnalysisDependencies {
  /** Validate bearer with the auth authority; decoding JWT without verification is forbidden. */
  authenticate:(bearer:string)=>Promise<{id:string}|null>
  readOwnedPhoto:(userId:string,path:string)=>Promise<{bytes:Uint8Array;type:string}|null>
  destination:string
  coordinator:AnalysisCoordinator|null
  provider:((photo:{bytes:Uint8Array;type:string})=>Promise<unknown>)|null
  /** Trusted backend decoder/re-encoder: strip EXIF/metadata independently of the client. Required before activation. */
  sanitizePhoto?: ((photo:{bytes:Uint8Array;type:string})=>Promise<{bytes:Uint8Array;type:string}>)|null
}
const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})
async function readSmallJson(request:Request):Promise<unknown> {
  if(!request.headers.get('content-type')?.startsWith('application/json'))throw Error('content-type')
  const reader=request.body?.getReader();if(!reader)throw Error('body')
  let size=0;let text='';const decoder=new TextDecoder()
  try {while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>4096){await reader.cancel();throw Error('size')}text+=decoder.decode(part.value,{stream:true})}text+=decoder.decode();return JSON.parse(text)}finally{reader.releaseLock()}
}
export function createMealAnalysisHandler(deps:MealAnalysisDependencies) {
  return async(request:Request):Promise<Response>=>{
    if(request.method!=='POST')return response({error:'Método não permitido'},405)
    const match=/^Bearer (\S+)$/.exec(request.headers.get('authorization')??'')
    if(!match)return response({error:'Autenticação necessária'},401)
    let user:{id:string}|null
    try{user=await deps.authenticate(match[1])}catch{return response({error:'Autenticação indisponível'},503)}
    if(!user)return response({error:'Sessão inválida'},401)
    let body: {path?:unknown;consent?:{analysis?:unknown;destination?:unknown}}
    try{body=await readSmallJson(request) as typeof body;if(!body || typeof body!=='object')throw Error()}catch{return response({error:'Requisição inválida ou maior que 4 KB'},400)}
    const path=body.path
    if(typeof path!=='string' || path.length>250 || !path.startsWith(`${user.id}/`) || !/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(jpg|png|webp)$/.test(path))return response({error:'Foto fora da pasta do usuário'},403)
    if(body.consent?.analysis!==true || !deps.destination || body.consent.destination!==deps.destination)return response({error:'Confirme o envio ao destino configurado'},403)
    if(!deps.provider || !deps.coordinator || !deps.sanitizePhoto)return response({error:'Análise indisponível. Continue com o registro manual.'},503)
    const key=request.headers.get('idempotency-key')??''
    if(!/^[a-zA-Z0-9_-]{12,128}$/.test(key))return response({error:'Chave de idempotência inválida'},400)
    try{
      const photo=await deps.readOwnedPhoto(user.id,path)
      if(!photo)return response({error:'Foto não encontrada'},404)
      try{validateImageFile({size:photo.bytes.byteLength,type:photo.type});if(!hasImageSignature(photo.bytes,photo.type))throw Error()}catch{return response({error:`Imagem inválida. Limite ${MAX_MEAL_PHOTO_BYTES/1024/1024} MB; use JPG, PNG ou WebP.`},415)}
      const photoHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(photo.bytes)))).map(b=>b.toString(16).padStart(2,'0')).join('')
      const fingerprint=`${path}:${photo.type}:${photoHash}:${deps.destination}`
      const result=await deps.coordinator.run(user.id,key,fingerprint,async()=>{
        const sanitized=await deps.sanitizePhoto!(photo)
        validateImageFile({size:sanitized.bytes.byteLength,type:sanitized.type})
        if(!hasImageSignature(sanitized.bytes,sanitized.type))throw Error('invalid sanitized image')
        return validateCandidates(await deps.provider!(sanitized))
      })
      if(result.kind==='conflict')return response({error:'Chave já utilizada para outra foto'},409)
      if(result.kind==='busy')return response({error:'Análise em andamento'},409)
      if(result.kind==='rate-limited')return response({error:'Limite temporário atingido'},429)
      if(result.kind==='done')return response(validateCandidates(result.value))
      return response({error:'Análise indisponível'},503)
    }catch{return response({error:'Não foi possível analisar. Continue manualmente.'},502)}
  }
}

export async function signOwnedMealPhoto(
  userId:string,
  path:string,
  sign:(bucket:string,path:string,expiresIn:number)=>Promise<string>,
):Promise<{url:string;expiresIn:60}> {
  if(!userId || !path.startsWith(`${userId}/`) || !/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.(jpg|png|webp)$/.test(path))throw Error('Foto fora da pasta do usuário')
  // userId must come from the already validated auth context, never from a request body.
  return {url:await sign('winfit-meals-private',path,60),expiresIn:60}
}
