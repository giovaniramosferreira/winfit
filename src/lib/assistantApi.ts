import type { Equipment } from '../types'
export const ASSISTANT_CONSENT_VERSION = 'assistant-consent-v1'
export interface AssistantPayload {
  version:1
  question:string
  context:{mode:'gym'|'home';availableMinutes:number;equipment:Equipment[]}
  consent:{send:boolean;destination:string;version:typeof ASSISTANT_CONSENT_VERSION}
}
export interface AssistantAnswer { answer:string }
const equipmentNames:Equipment[]=['halteres','barra','banco','elasticos','barra_fixa','kettlebell','maquinas','polia','peso_corporal']
function keys(value:unknown,allowed:string[]): value is Record<string,unknown> {
  return !!value && typeof value==='object' && !Array.isArray(value) && Object.keys(value).every(key=>allowed.includes(key))
}
export function validateAssistantPayload(value:unknown): AssistantPayload {
  if(!keys(value,['version','question','context','consent']) || value.version!==1 || typeof value.question!=='string' || !value.question.trim() || value.question.length>1000)throw Error('Consulta inválida: informe uma pergunta de até 1000 caracteres.')
  const c=value.context,s=value.consent
  if(!keys(c,['mode','availableMinutes','equipment']) || !['gym','home'].includes(c.mode as string) || !Number.isInteger(c.availableMinutes) || (c.availableMinutes as number)<5 || (c.availableMinutes as number)>180 || !Array.isArray(c.equipment) || c.equipment.length>9 || c.equipment.some(e=>!equipmentNames.includes(e)) || new Set(c.equipment).size!==c.equipment.length)throw Error('Contexto inválido: envie apenas ambiente, tempo e equipamentos.')
  if(!keys(s,['send','destination','version']) || typeof s.send!=='boolean' || typeof s.destination!=='string' || !s.destination.trim() || s.destination.length>200 || s.version!==ASSISTANT_CONSENT_VERSION)throw Error('Consentimento inválido.')
  return {version:1,question:value.question,context:{mode:c.mode as 'gym'|'home',availableMinutes:c.availableMinutes as number,equipment:[...c.equipment]},consent:{send:s.send,destination:s.destination,version:ASSISTANT_CONSENT_VERSION}}
}
export function validateAssistantAnswer(value:unknown):AssistantAnswer {
  if(!keys(value,['answer']) || typeof value.answer!=='string' || !value.answer.trim() || value.answer.length>4000)throw Error('Resposta do assistente inválida.')
  return {answer:value.answer}
}
export interface AssistantApiConfig {endpoint:string;destination:string}
type FetchPort=(input:RequestInfo|URL,init?:RequestInit)=>Promise<Response>
export function createAssistantApi(config:AssistantApiConfig|null,fetcher:FetchPort=fetch) {
  const validConfig=!!config && !!config.destination.trim() && config.destination.length<=200 && (config.endpoint==='/api/assistant' || (()=>{try{const u=new URL(config.endpoint);return u.protocol==='https:' && !u.username && !u.password && !u.search && !u.hash}catch{return false}})())
  return {
    available:validConfig,
    destination:validConfig?config!.destination:null,
    async ask(input:AssistantPayload,accessToken:string,idempotencyKey:string,signal?:AbortSignal):Promise<AssistantAnswer> {
      if(!validConfig || !config)throw Error('IA remota indisponível: serviço autenticado ainda não configurado.')
      const payload=validateAssistantPayload(input)
      if(!accessToken || /\s/.test(accessToken) || !payload.consent.send || payload.consent.destination!==config.destination || !/^[a-zA-Z0-9_-]{12,128}$/.test(idempotencyKey))throw Error('Confirme o destino e use uma sessão autenticada antes de enviar.')
      const response=await fetcher(config.endpoint,{method:'POST',headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json','Idempotency-Key':idempotencyKey},body:JSON.stringify(payload),signal,redirect:'error',cache:'no-store'})
      if(!response.ok)throw Error(response.status===503?'IA remota indisponível. Continue com as explicações locais.':response.status===429?'Limite temporário de consultas atingido. Tente novamente depois.':'Não foi possível consultar o assistente. Seu plano continua igual.')
      if(Number(response.headers.get('Content-Length'))>20000)throw Error('Resposta do assistente excedeu o limite.')
      const reader=response.body?.getReader();if(!reader)throw Error('Resposta vazia do assistente.')
      let size=0,text='';const decoder=new TextDecoder()
      try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>20000){await reader.cancel();throw Error('Resposta do assistente excedeu o limite.')}text+=decoder.decode(part.value,{stream:true})}text+=decoder.decode()}finally{reader.releaseLock()}
      return validateAssistantAnswer(JSON.parse(text))
    },
  }
}
// No endpoint/provider is configured by default. UI must not offer remote send while unavailable.
export const assistantApi = createAssistantApi(null)
