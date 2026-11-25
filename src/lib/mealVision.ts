export interface PortionHypothesis { minGrams:number; maxGrams:number; assumption:string }
export interface VisionCandidate {
  name:string
  preparation:string | null
  portionHypothesis:PortionHypothesis | null
  uncertainties:string[]
}
export interface VisionResult { candidates:VisionCandidate[]; questions:string[]; dishName?:string|null; containsFood?:boolean }
/** An adapter receives pixels only. No diary, profile, location, calories or nutrients. */
export interface LocalVisionAdapter {
  analyze(photo:Blob):Promise<VisionResult>
  dispose():Promise<void>
}
function record(value:unknown, keys:string[]):value is Record<string,unknown> {
  return !!value && typeof value==='object' && !Array.isArray(value) && Object.keys(value).every(k=>keys.includes(k))
}
function text(value:unknown):value is string { return typeof value==='string' && !!value.trim() && value.length<=500 }
function texts(value:unknown):value is string[] { return Array.isArray(value) && value.length<=20 && value.every(text) }
export function validateVisionResult(value:unknown):VisionResult {
  if(!record(value,['candidates','questions','dishName','containsFood']) || !Array.isArray(value.candidates) || value.candidates.length>30 || !texts(value.questions) || (value.dishName!==undefined && value.dishName!==null && !text(value.dishName)) || (value.containsFood!==undefined && typeof value.containsFood!=='boolean') || (value.containsFood===false && value.candidates.length>0) || (value.containsFood===true && value.candidates.length===0)) throw Error('Resposta de visão inválida. Continue pelo registro manual.')
  const candidates=value.candidates.map(c=>{
    if(!record(c,['name','preparation','portionHypothesis','uncertainties']) || !text(c.name) || (c.preparation!==null && !text(c.preparation)) || !texts(c.uncertainties)) throw Error('Candidato inválido. Revise o alimento manualmente.')
    const p=c.portionHypothesis
    if(p!==null && (!record(p,['minGrams','maxGrams','assumption']) || typeof p.minGrams!=='number' || typeof p.maxGrams!=='number' || !Number.isFinite(p.minGrams) || !Number.isFinite(p.maxGrams) || p.minGrams<=0 || p.maxGrams<p.minGrams || !text(p.assumption))) throw Error('Hipótese de porção inválida.')
    return {name:c.name.trim(),preparation:c.preparation,portionHypothesis:p,uncertainties:c.uncertainties} as VisionCandidate
  })
  return {candidates,questions:value.questions,...(value.dishName!==undefined?{dishName:value.dishName as string|null}:{}),...(value.containsFood!==undefined?{containsFood:value.containsFood as boolean}:{})}
}
/** Ranking is not calibrated confidence. Food-101 cannot reliably reject non-foods. */
export function candidatesFromLogits(logits:ArrayLike<number>,labels:string[]):VisionResult {
  if(!labels.length || labels.length>1000 || logits.length!==labels.length || !labels.every(text) || !Array.from(logits).every(Number.isFinite)) throw Error('Saída do modelo incompatível com os rótulos.')
  return validateVisionResult({
    candidates:Array.from(logits,(score,index)=>({score,index})).sort((a,b)=>b.score-a.score).slice(0,3).map(({index})=>({
      name:labels[index],preparation:null,portionHypothesis:null,
      uncertainties:['Alternativa de classificação do prato inteiro; não identifica todos os ingredientes.','A foto não determina peso, óleo, molhos ou quantidade consumida.'],
    })),
    questions:['A imagem contém comida? Se não, descarte as sugestões.','Quais alimentos, carnes, acompanhamentos, óleo e molhos foram consumidos?','Confirme o preparo e informe o peso consumido em gramas.'],
  })
}
