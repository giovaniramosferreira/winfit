import { useEffect, useRef, useState } from 'react'
import { prepareMealPhoto } from '../lib/mealPhoto'
import { calculateConfirmedNutrition, type ConfirmedNutrition } from '../lib/mealAnalysis'
import { Button } from './ui'
export default function MealPhotoDraft() {
  const camera=useRef<HTMLInputElement>(null), gallery=useRef<HTMLInputElement>(null)
  const [photo,setPhoto]=useState<Blob|null>(null), [preview,setPreview]=useState(''), [busy,setBusy]=useState(false), [saveConsent,setSaveConsent]=useState(false), [message,setMessage]=useState('')
  useEffect(()=>{if(!photo){setPreview('');return}const url=URL.createObjectURL(photo);setPreview(url);return()=>URL.revokeObjectURL(url)},[photo])
  const choose=async(file:File|undefined)=>{if(!file)return;setBusy(true);setMessage('');setSaveConsent(false);try{setPhoto(await prepareMealPhoto(file))}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}
  const download=()=>{if(!photo || !saveConsent)return;const url=URL.createObjectURL(photo);const a=document.createElement('a');a.href=url;a.download=`winfit-refeicao-${Date.now()}.jpg`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('Download solicitado. A foto não foi anexada ao diário. Confira seus arquivos.')}
  return <details className="card more-card nutrition-photo" style={{marginTop:12}}><summary>Foto da refeição</summary>
    <p className="small muted" style={{marginTop:4}}>Foto apenas para consulta: ela não será anexada à refeição. Salvar, cancelar ou fechar este formulário, sair ou recarregar descarta o rascunho. Nada será enviado. Você pode baixar uma cópia antes de fechar.</p>
    <p className="tiny muted">JPG, PNG ou WebP, até 5 MB. A cópia é redimensionada e recriada sem os metadados originais de localização.</p>
    <input ref={camera} hidden aria-label="Tirar foto da refeição" type="file" capture="environment" accept="image/jpeg,image/png,image/webp" onChange={e=>{void choose(e.target.files?.[0]);e.target.value=''}}/>
    <input ref={gallery} hidden aria-label="Escolher foto da refeição" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{void choose(e.target.files?.[0]);e.target.value=''}}/>
    <div className="row" style={{flexWrap:'wrap',marginTop:12}}><Button variant="secondary" disabled={busy} onClick={()=>camera.current?.click()}>Tirar foto</Button><Button variant="secondary" disabled={busy} onClick={()=>gallery.current?.click()}>Escolher imagem</Button></div>
    {busy&&<p role="status">Preparando foto…</p>}
    {preview&&<><img src={preview} alt="Rascunho da refeição, ainda não salvo" style={{display:'block',maxWidth:'100%',maxHeight:320,borderRadius:12,marginTop:12}}/>
      <label style={{display:'flex',alignItems:'start',gap:8,marginTop:12}}><input type="checkbox" checked={saveConsent} onChange={e=>setSaveConsent(e.target.checked)}/>Quero salvar uma cópia JPG nos arquivos deste aparelho por download. O arquivo fica fora do diário; a limpeza do Winfit não o apaga.</label>
      <div className="row" style={{marginTop:12,flexWrap:'wrap'}}><Button variant="primary" disabled={!saveConsent} onClick={download}>Baixar cópia sem metadados</Button><Button variant="secondary" onClick={()=>{setPhoto(null);setSaveConsent(false);setMessage('Rascunho descartado.')}}>Descartar foto</Button></div>
    </>}
    {message&&<p role="status">{message}</p>}

  </details>
}
export function NutritionLabelCalculator({name,onConfirm}:{name:string;onConfirm:(value:ConfirmedNutrition)=>void}) {
  const [open,setOpen]=useState(false),[per100,setPer100]=useState(''),[grams,setGrams]=useState(''),[confirmed,setConfirmed]=useState(false),[error,setError]=useState('')
  useEffect(()=>setConfirmed(false),[name])
  const calculate=()=>{try{
    const value=calculateConfirmedNutrition({source:'user-label',recordId:crypto.randomUUID(),description:name,kcalPer100g:per100.trim()?Number(per100):NaN,version:new Date().toISOString().slice(0,10),license:'user-provided'},grams.trim()?Number(grams):NaN,confirmed)
    onConfirm(value);setOpen(false);setError('')
  }catch(e){setError((e as Error).message)}}
  return <div style={{marginTop:8}}><Button variant="secondary" small onClick={()=>setOpen(!open)}>{open?'Fechar cálculo':'Calcular com meu rótulo'}</Button>{open&&<div>
    <p className="small muted">Copie o valor do rótulo do alimento correspondente. Este cálculo usa seu rótulo; as referências TACO ficam no catálogo.</p>
    <label>Energia do rótulo por 100 g (kcal)<input type="number" min="0" step="any" style={{width:'100%',minHeight:44}} value={per100} onChange={e=>{setPer100(e.target.value);setConfirmed(false)}}/></label>
    <label>Quantidade consumida (g)<input type="number" min="0.01" step="any" style={{width:'100%',minHeight:44}} value={grams} onChange={e=>{setGrams(e.target.value);setConfirmed(false)}}/></label>
    <label style={{display:'flex',gap:8,marginTop:8}}><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>Confirmo o alimento, o valor do rótulo e a quantidade em gramas.</label>
    {error&&<p role="alert">{error}</p>}<Button variant="secondary" small disabled={!confirmed} onClick={calculate}>Aplicar cálculo ao item</Button>
  </div>}</div>
}
