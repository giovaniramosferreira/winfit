import {timingSafeEqual} from 'node:crypto'
import {LOCAL_MEAL_DESTINATION,parseMultimodalMeal} from '../src/lib/multimodalMeal'
import {hasImageSignature,MAX_MEAL_PHOTO_BYTES,MEAL_PHOTO_TYPES} from '../src/lib/mealPhoto'
export interface LocalModelInfo {model:string;digest:string;modelBytes:number}
interface Dependencies {origin:string;token:string;info:()=>Promise<LocalModelInfo>;analyze:(bytes:Uint8Array,mime:string,signal:AbortSignal)=>Promise<{raw:unknown;elapsedMs:number}>}
export const MAX_POC_BODY_BYTES=7*1024*1024
const json=(status:number,value:unknown)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})
export function createPocMealVisionHandler(deps:Dependencies) {
 let busy=false
 return async(request:Request):Promise<Response>=>{
  let caller=request.headers.get('origin')
  if(!caller){try{caller=new URL(request.headers.get('referer')??'').origin}catch{}}
  if(caller!==deps.origin || request.headers.get('sec-fetch-site')==='cross-site')return json(403,{error:'Esta análise só está disponível no servidor local do Winfit.'})
  const pathname=new URL(request.url).pathname
  if(pathname==='/api/poc-meal-vision/session' && request.method==='GET') {
   try{return json(200,{...await deps.info(),destination:LOCAL_MEAL_DESTINATION,token:deps.token})}catch{return json(503,{error:'O modelo de visão local não está disponível. O diário manual continua funcionando.'})}
  }
  if(pathname!=='/api/poc-meal-vision/analyze')return json(404,{error:'Rota indisponível.'})
  if(request.method!=='POST')return json(405,{error:'Use POST.'})
  const token=request.headers.get('X-Winfit-Poc-Token')??''
  const provided=Buffer.from(token),expected=Buffer.from(deps.token)
  if(provided.length!==expected.length || !timingSafeEqual(provided,expected))return json(403,{error:'Reconecte o modelo local e confirme a análise.'})
  if(!request.headers.get('content-type')?.startsWith('application/json'))return json(415,{error:'Formato de requisição inválido.'})
  if(Number(request.headers.get('content-length'))>MAX_POC_BODY_BYTES)return json(413,{error:'Imagem grande demais.'})
  let body:{image:string;mimeType:string;consent:{analysis:boolean;destination:string}}
  try {
   const raw=await request.text();if(Buffer.byteLength(raw)>MAX_POC_BODY_BYTES)return json(413,{error:'Imagem grande demais.'})
   body=JSON.parse(raw)
   if(!body || Array.isArray(body) || Object.keys(body).some(k=>!['image','mimeType','consent'].includes(k)) || typeof body.image!=='string' || !body.image || body.image.length%4!==0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(body.image) || typeof body.mimeType!=='string')throw Error('invalid')
  }catch{return json(400,{error:'Requisição de análise inválida.'})}
  if(body.consent?.analysis!==true || body.consent.destination!==LOCAL_MEAL_DESTINATION)return json(403,{error:'Confirme a análise da imagem somente neste Mac.'})
  if(!MEAL_PHOTO_TYPES.includes(body.mimeType as typeof MEAL_PHOTO_TYPES[number]))return json(415,{error:'Use JPG, PNG ou WebP.'})
  const bytes=new Uint8Array(Buffer.from(body.image,'base64'))
  if(!bytes.length || bytes.length>MAX_MEAL_PHOTO_BYTES)return json(413,{error:'A imagem deve ter até 5 MiB.'})
  if(!hasImageSignature(bytes,body.mimeType))return json(415,{error:'O conteúdo da foto não corresponde ao formato informado.'})
  if(busy)return json(429,{error:'Já existe uma análise neste Mac. Aguarde ou cancele antes de tentar novamente.'})
  busy=true
  try {
   const output=await deps.analyze(bytes,body.mimeType,AbortSignal.any([request.signal,AbortSignal.timeout(120_000)]))
   return json(200,{result:parseMultimodalMeal(output.raw),elapsedMs:output.elapsedMs})
  }catch{return json(502,{error:'Não foi possível analisar a foto no modelo local. Tente novamente ou continue manualmente.'})}
  finally{busy=false}
 }
}
