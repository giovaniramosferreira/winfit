import { useState } from 'react'
import { CATALOG_ATTRIBUTION, FOOD_CATALOG, confirmCatalogItem, searchFoods } from '../lib/foodCatalog'
import type { FoodItem } from '../lib/nutrition'
import { Button } from './ui'

export default function NutritionCatalogReview({item,onConfirm}:{item:FoodItem;onConfirm:(item:FoodItem)=>void}) {
  const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[selected,setSelected]=useState('')
  const [grams,setGrams]=useState(item.portion?.toString()??''),[notes,setNotes]=useState(item.review?.notes??''),[confirmed,setConfirmed]=useState(false),[error,setError]=useState('')
  const source=FOOD_CATALOG.find(f=>f.recordId===selected)
  const options=searchFoods(query)
  const apply=()=>{try{if(!source)throw Error('Escolha um alimento e preparo do catálogo.');onConfirm(confirmCatalogItem({id:item.id,source,grams:grams.trim()?Number(grams):NaN,confirmed,notes}));setOpen(false);setConfirmed(false);setError('')}catch(e){setError((e as Error).message)}}
  return <div style={{marginTop:8}}><Button variant="secondary" small onClick={()=>{setOpen(!open);setConfirmed(false)}}>{open?'Fechar catálogo':'Calcular com catálogo de referência'}</Button>{open&&<div className="nutrition-catalog-review">
    <p className="small muted">Escolha o alimento e o preparo que correspondem ao que consumiu. A foto não fornece o peso. Este catálogo inicial tem apenas cinco referências; farofa e outras receitas precisam de registro manual ou rótulo.</p>
    <label>Buscar alimento no catálogo<input type="search" style={{width:'100%',minHeight:44}} value={query} onChange={e=>{setQuery(e.target.value);setSelected('');setConfirmed(false)}}/></label>
    <label>Alimento e preparo de referência<select style={{width:'100%',minHeight:44}} value={selected} onChange={e=>{setSelected(e.target.value);setConfirmed(false)}}><option value="">Selecione uma correspondência</option>{options.map(f=><option key={f.recordId} value={f.recordId}>{f.description}</option>)}</select></label>
    {!options.length&&<p role="status">Sem correspondência. Use o rótulo ou o registro manual; as calorias podem ficar pendentes.</p>}
    {source&&<p className="tiny muted">{source.recordId} · {source.version} · {source.preparation}. Base: 100 g de parte comestível. {source.kcalPer100g} kcal; P {source.macrosPer100g!.protein} g; C {source.macrosPer100g!.carbohydrate} g; G {source.macrosPer100g!.fat} g. <a href={source.sourceUrl} target="_blank" rel="noreferrer">Publicação original</a></p>}
    <label>Peso consumido confirmado (g)<input type="number" min="0.01" step="any" style={{width:'100%',minHeight:44}} value={grams} onChange={e=>{setGrams(e.target.value);setConfirmed(false)}}/></label>
    <label>Preparo, carnes, óleo, molhos e acompanhamentos<textarea maxLength={1000} style={{width:'100%',minHeight:70}} value={notes} onChange={e=>{setNotes(e.target.value);setConfirmed(false)}}/></label>
    <p className="tiny muted">Feijoada varia por receita. Registre arroz, farofa e outros acompanhamentos em itens separados. Se a referência não corresponder, mantenha o item manual e peça mais informação.</p>
    <label style={{display:'flex',gap:8,marginTop:8}}><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>Revisei o alimento, o preparo, a referência e os gramas consumidos. Entendo que o resultado é estimado.</label>
    {error&&<p role="alert">{error}</p>}
    <Button variant="primary" small disabled={!confirmed || !source} onClick={apply}>Aplicar item revisado</Button>
    <p className="tiny muted">{CATALOG_ATTRIBUTION} Reprodução com citação da fonte.</p>
  </div>}</div>
}
