import {useEffect,useRef,useState} from 'react'
import {prepareMealPhoto} from '../lib/mealPhoto'
import {photoReviewId} from '../lib/mealVisionArtifacts'
import {connectLocalMealService,type LocalMealService} from '../lib/localMealService'
import type {VisionCandidate,VisionResult} from '../lib/mealVision'
import { Button } from './ui'

export default function MealVisionLab({onRecognized}:{onRecognized:(groupId:string,foods:VisionCandidate[])=>boolean}) {
 const [service,setService]=useState<LocalMealService|null>(null),[photo,setPhoto]=useState<Blob|null>(null),[preview,setPreview]=useState('')
 const [authorized,setAuthorized]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('Preparando reconhecimento local…')
 const [result,setResult]=useState<VisionResult|null>(null),[elapsed,setElapsed]=useState<number|null>(null)
 const adapter=useRef<LocalMealService|null>(null),generation=useRef(0),mounted=useRef(true),groupId=useRef('')
 const connect=async()=>{
  const ticket=++generation.current;setBusy(true);setResult(null);setMessage('Preparando reconhecimento local…')
  await adapter.current?.dispose();adapter.current=null;setService(null)
  try {
   const next=await connectLocalMealService()
   if(!mounted.current||ticket!==generation.current){await next.dispose();return}
   adapter.current=next;setService(next);setMessage('Modelo pronto no Mac. Escolha uma foto e autorize a análise.')
  }catch{if(mounted.current&&ticket===generation.current)setMessage('O modelo local não está disponível. Inicie a POC com o servidor local do Mac; o diário manual continua disponível.')}
  finally{if(mounted.current&&ticket===generation.current)setBusy(false)}
 }
 useEffect(()=>{mounted.current=true;void connect();return()=>{mounted.current=false;generation.current++;void adapter.current?.dispose();adapter.current=null}},[])
 useEffect(()=>{if(!photo){setPreview('');return}const url=URL.createObjectURL(photo);setPreview(url);return()=>URL.revokeObjectURL(url)},[photo])
 const choose=async(file:File|undefined)=>{
  if(!file||busy)return
  const ticket=++generation.current;setBusy(true);setPhoto(null);setAuthorized(false);setResult(null);setElapsed(null);setMessage('Preparando foto…')
  try {
   const prepared=await prepareMealPhoto(file),id=await photoReviewId(prepared)
   if(mounted.current&&ticket===generation.current){groupId.current=id;setPhoto(prepared);setMessage('Foto preparada somente na memória. Autorize o processamento no Mac para reconhecer os alimentos.')}
  }catch(e){if(mounted.current&&ticket===generation.current)setMessage((e as Error).message)}
  finally{if(mounted.current&&ticket===generation.current)setBusy(false)}
 }
 const analyze=async()=>{
  if(!photo||!authorized||!adapter.current||busy)return
  const ticket=++generation.current;setBusy(true);setResult(null);setElapsed(null);setMessage('Reconhecendo alimentos no Mac…')
  try {
   const current=adapter.current,output=await current.analyze(photo,authorized)
   if(!mounted.current||ticket!==generation.current)return
   setResult(output);setElapsed(current.analysisMs);setMessage(output.containsFood?'Alimentos reconhecidos. Confira a lista antes de usar no diário.':'Não encontrei alimentos nesta imagem. Escolha uma foto de comida ou continue manualmente.')
  }catch(e){if(mounted.current&&ticket===generation.current)setMessage((e as Error).message)}
  finally{if(mounted.current&&ticket===generation.current)setBusy(false)}
 }
 const cancel=()=>{generation.current++;void adapter.current?.dispose();adapter.current=null;setService(null);setBusy(false);setAuthorized(false);setResult(null);setMessage('Análise cancelada. O diário e os itens já revisados foram preservados.')}
 return <section className="card nutrition-vision-lab" style={{marginTop:16}}>
  <h3>Reconhecer alimentos pela foto</h3>
  <p className="small muted">A foto será processada pelo Ollama neste Mac, sem serviço de IA na nuvem. Foto e análise ficam temporariamente na memória do navegador e do Mac; não são anexadas ao diário. Apenas alimentos que você revisar e salvar entram no registro.</p>
  {service&&<p className="tiny muted">Modelo local: {service.metadata.model} · {(service.metadata.modelBytes/1024**3).toFixed(2)} GiB no Mac. A imagem não mede peso nem revela todos os ingredientes.</p>}
  {!service&&<Button variant="secondary" disabled={busy} onClick={()=>void connect()}>Conectar modelo no Mac</Button>}
  <label style={{display:'block',marginTop:12}}>Foto da refeição para reconhecimento<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{void choose(e.target.files?.[0]);e.target.value=''}}/></label>
  <p className="tiny muted">JPG, PNG ou WebP até 5 MiB. A imagem é redimensionada e recriada sem copiar os metadados originais.</p>
  {preview&&<img src={preview} alt="Foto da refeição para análise local" style={{display:'block',maxWidth:'100%',maxHeight:320,borderRadius:12,marginTop:8}}/>}
  <label style={{display:'flex',gap:8,marginTop:12}}><input type="checkbox" checked={authorized} disabled={busy||!photo} onChange={e=>{setAuthorized(e.target.checked);setResult(null)}}/>Autorizo analisar esta foto no Ollama deste Mac. Ela não será enviada a serviços de IA externos nem guardada no diário.</label>
  <div className="row" style={{flexWrap:'wrap',marginTop:12}}>
   <Button variant="primary" disabled={!photo||!authorized||!service||busy} onClick={()=>void analyze()}>Reconhecer alimentos</Button>
   {busy&&<Button variant="secondary" onClick={cancel}>Cancelar análise</Button>}
   <Button variant="secondary" disabled={busy} onClick={()=>{generation.current++;setPhoto(null);setAuthorized(false);setResult(null);setElapsed(null);setMessage('Foto e sugestões descartadas.')}}>Descartar foto</Button>
  </div>
  <p role="status">{message}</p>
  {elapsed!==null&&<p className="tiny muted">Análise local: {(elapsed/1000).toFixed(1)} s. Nenhuma caloria foi fornecida pelo modelo.</p>}
  {result?.containsFood&&<div className="nutrition-recognition-result">
   {result.dishName&&<h4>Prato reconhecido: {result.dishName}</h4>}
   <ul>{result.candidates.map((food,index)=><li key={`${index}-${food.name}`}><strong>{food.name}</strong>{food.uncertainties.length>0&&<p className="tiny muted">A confirmar: {food.uncertainties.join(' ')}</p>}</li>)}</ul>
   <p className="small muted">Confira e corrija os alimentos no formulário. Porções, preparo, carnes, óleo e molhos precisam da sua confirmação; calorias permanecem pendentes até serem informadas ou calculadas por uma referência.</p>
   {result.questions.map((q,index)=><p className="small muted" key={index}>{q}</p>)}
   <Button variant="primary" onClick={()=>{const added=onRecognized(groupId.current,result.candidates);setResult(null);setMessage(added?'Alimentos adicionados ao rascunho para revisão. Revise as porções e salve a refeição para atualizar o total.':'Esta foto já tem alimentos no diário. Mantivemos os itens e suas correções; faça ajustes no formulário para não perder dados ou duplicar consumo.')}}>Revisar alimentos no diário</Button>
  </div>}
 </section>
}
