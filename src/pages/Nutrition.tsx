import { useState, useSyncExternalStore } from 'react'
import MealPhotoDraft, { NutritionLabelCalculator } from '../components/MealPhotoDraft'
import { daySummary, goalForDate, localDate, type Meal, type FoodItem, type NutritionGoal } from '../lib/nutrition'
import { nutritionStore } from '../lib/nutritionStore'
import PageTop from '../components/PageTop'
import Icon from '../components/Icon'
import EmptyState from '../components/EmptyState'
import TimeField from '../components/TimeField'
const uid = () => crypto.randomUUID()
const freshItem = (): FoodItem => ({id:uid(),name:'',portion:null,kcal:null})
const freshMeal = (date:string): Meal => ({id:uid(),date,time:new Date().toTimeString().slice(0,5),type:'Almoço',items:[freshItem()]})
const inputStyle = {width:'100%',minHeight:44,marginTop:4}
const shift = (date:string, days:number) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate()+days); return localDate(d) }
function dayLabel(date:string){ const today=localDate(); if(date===today) return 'Hoje'; if(date===shift(today,-1)) return 'Ontem'; return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR',{weekday:'short',day:'numeric',month:'short'}) }
export default function Nutrition() {
  const state=useSyncExternalStore(nutritionStore.subscribe,nutritionStore.getState,nutritionStore.getState)
  const [date,setDate]=useState(localDate())
  const [meal,setMeal]=useState<Meal|null>(null)
  const [message,setMessage]=useState('')
  const [goalOpen,setGoalOpen]=useState(false)
  const [goalDate,setGoalDate]=useState(localDate())
  const [mode,setMode]=useState<'direct'|'calculated'>('direct')
  const [direct,setDirect]=useState('')
  const [maintenance,setMaintenance]=useState('')
  const [deficit,setDeficit]=useState('')
  const summary=daySummary(state.meals,date)
  const target=goalForDate(state.goals,date)
  const meals=state.meals.filter(m=>m.date===date).sort((a,b)=>a.time.localeCompare(b.time))
  const updateItem=(id:string,patch:Partial<FoodItem>)=>setMeal(m=>m?{...m,items:m.items.map(i=>i.id===id?{...i,provenance:undefined,...patch}:i)}:m)
  const saveMeal=()=>{try{if(meal && nutritionStore.upsertMeal(meal)){setMeal(null);setMessage('Refeição salva neste dispositivo.')}}catch(e){setMessage((e as Error).message)}}
  const saveGoal=()=>{try{
    const goal: NutritionGoal=mode==='direct'?{id:uid(),date:goalDate,mode,kcal:direct.trim()?Number(direct):NaN}:{id:uid(),date:goalDate,mode,maintenance:maintenance.trim()?Number(maintenance):NaN,deficit:deficit.trim()?Number(deficit):NaN}
    if(nutritionStore.upsertGoal(goal)){setGoalOpen(false);setMessage('Meta salva com vigência a partir da data informada.')}
  }catch(e){setMessage((e as Error).message)}}
  return <div className="page nutrition-page fade-in">
    <PageTop title="Alimentação" />
    <header className="wellness-heading" hidden><div className="screen-topline"><span className="screen-kicker">Alimentação</span><span className="wellness-badge">Diário manual</span></div><div className="wellness-heading-copy"><div><h1 className="screen-title">Seu diário <em>alimentar.</em></h1><p className="screen-subtitle">Um espaço para acompanhar suas refeições, no seu ritmo.</p></div><span className="wellness-art" aria-hidden="true"><svg viewBox="0 0 80 80" fill="none"><circle cx="40" cy="43" r="25" fill="#ddd1f5"/><circle cx="40" cy="43" r="17" stroke="currentColor" strokeWidth="2"/><path d="M37 39c-7-15 9-24 15-21-1 12-6 21-15 21Zm-19-13v34m-5-34v13h10V26m41 0v34m0-34c-8 6-8 18 0 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span></div></header>
    {state.error && <div role="alert" className="card" style={{marginTop:12}}>{state.error}</div>}
    {message && <p role="status" style={{marginTop:12}}>{message}</p>}
    <section className="card nutrition-overview" style={{marginTop:16}}>
      <div className="day-switch">
        <button type="button" className="top-back" aria-label="Dia anterior" onClick={()=>setDate(shift(date,-1))}><Icon name="back" /></button>
        <label className="day-switch-label"><span>{dayLabel(date)}</span><input aria-label="Dia do diário" type="date" value={date} onChange={e=>e.target.value&&setDate(e.target.value)}/></label>
        <button type="button" className="top-back" aria-label="Próximo dia" style={{transform:'scaleX(-1)'}} disabled={date>=localDate()} onClick={()=>setDate(shift(date,1))}><Icon name="back" /></button>
      </div>
      <p className="nutrition-total num">{summary.kcal.toLocaleString('pt-BR')}<span> {target===null?'kcal':`de ${target.toLocaleString('pt-BR')} kcal`}</span></p>
      {target!==null && <div className="progressbar" style={{margin:'10px 0 4px'}}><div style={{width:`${Math.min(100,summary.kcal/target*100)}%`}}/></div>}
      {summary.pending>0 && <p className="small muted">{summary.pending===1?'1 item sem calorias':`${summary.pending} itens sem calorias`}</p>}
      <button className="btn btn-primary train-cta" disabled={state.blocked} onClick={()=>{setMeal(freshMeal(date));setMessage('')}}><Icon name="plus" />Adicionar refeição</button>
      <button className="btn btn-quiet" disabled={state.blocked} onClick={()=>{setGoalDate(date);setGoalOpen(!goalOpen)}}>{target===null?'Definir meta diária':'Mudar meta'}</button>
    </section>
    {goalOpen && <section className="card" style={{marginTop:12}}><h2>Meta diária</h2>
      <label className="field-row"><span>A partir de</span><span className="time-field"><span aria-hidden="true">{dayLabel(goalDate)}</span><input type="date" aria-label="A partir de" value={goalDate} onChange={e=>e.target.value&&setGoalDate(e.target.value)}/></span></label>
      <label>Como informar<select style={inputStyle} value={mode} onChange={e=>setMode(e.target.value as typeof mode)}><option value="direct">Valor em kcal</option><option value="calculated">Manutenção menos déficit</option></select></label>
      {mode==='direct'?<label>Meta (kcal)<input type="number" min="1" step="any" style={inputStyle} value={direct} onChange={e=>setDirect(e.target.value)}/></label>:<>
        <label>Manutenção informada (kcal)<input type="number" min="1" step="any" style={inputStyle} value={maintenance} onChange={e=>setMaintenance(e.target.value)}/></label>
        <label>Déficit planejado informado (kcal)<input type="number" min="0" step="any" style={inputStyle} value={deficit} onChange={e=>setDeficit(e.target.value)}/></label>
      </>}
      <button className="btn btn-primary" style={{marginTop:12}} onClick={saveGoal}>Salvar meta</button>
      <button className="btn btn-ghost" onClick={()=>setGoalOpen(false)}>Cancelar</button>
    </section>}
    {meal && <section className="card" style={{marginTop:12}}><h2>Refeição</h2><form onSubmit={e=>{e.preventDefault();saveMeal()}}>
      <div className="seg meal-type" role="group" aria-label="Tipo">{['Café da manhã','Almoço','Jantar','Lanche','Outro'].map(t=><button type="button" key={t} aria-pressed={meal.type===t} onClick={()=>setMeal({...meal,type:t})}>{t.replace('Café da manhã','Café')}</button>)}</div>
      <label className="field-row"><span>Dia</span><span className="time-field"><span aria-hidden="true">{dayLabel(meal.date)}</span><input required type="date" aria-label="Dia" max={localDate()} value={meal.date} onChange={e=>e.target.value&&setMeal({...meal,date:e.target.value})}/></span></label>
      <TimeField label="Horário" value={meal.time} onChange={time=>setMeal({...meal,time})} />
      {meal.items.map((item,index)=><fieldset key={item.id} className="meal-item"><legend className="sr-only">Alimento {index+1}</legend>
        <label>Alimento<input required maxLength={200} style={inputStyle} value={item.name} onChange={e=>updateItem(item.id,{name:e.target.value})}/></label>
        <label>Porção (g)<input type="number" min="0.01" step="any" style={inputStyle} value={item.portion??''} onChange={e=>updateItem(item.id,{portion:e.target.value===''?null:Number(e.target.value)})}/></label>
        <label>Calorias (kcal)<input type="number" min="0" step="any" style={inputStyle} value={item.kcal??''} onChange={e=>updateItem(item.id,{kcal:e.target.value===''?null:Number(e.target.value)})}/></label>
        <NutritionLabelCalculator name={item.name} onConfirm={value=>updateItem(item.id,{portion:value.portion,kcal:value.kcal,provenance:value.provenance})}/>
        {meal.items.length>1 && <button type="button" className="btn btn-quiet btn-sm" onClick={()=>setMeal({...meal,items:meal.items.filter(i=>i.id!==item.id)})}>Remover alimento</button>}
      </fieldset>)}
      <button type="button" className="btn btn-ghost" onClick={()=>setMeal({...meal,items:[...meal.items,freshItem()]})}>+ Outro alimento</button>
      <button type="submit" className="btn btn-primary" style={{marginTop:12}}>Salvar refeição</button><button type="button" className="btn btn-quiet" onClick={()=>setMeal(null)}>Cancelar</button>
    </form></section>}
    <h2 className="hub-section">Refeições</h2>
    {!meals.length && <EmptyState icon="meal" title="Nenhuma refeição neste dia." />}
    {meals.map(m=><article key={m.id} className="card nutrition-meal" style={{marginTop:12}}><h3>{m.time} · {m.type}</h3>{m.items.map(i=><p key={i.id}>{i.name}{i.portion!==null?` · ${i.portion} g`:''} · {i.kcal===null?'kcal pendentes':`${i.kcal} kcal`}</p>)}<div className="row"><button className="btn btn-ghost btn-sm" disabled={state.blocked} onClick={()=>setMeal(structuredClone(m))}>Editar</button><button className="btn btn-quiet btn-sm" disabled={state.blocked} onClick={()=>{if(nutritionStore.deleteMeal(m.id))setMessage('Refeição excluída. Dá para restaurar em “Refeições excluídas”.')}}>Excluir</button></div></article>)}
    <MealPhotoDraft/>
    {state.deleted.length>0 && <details className="more"><summary>Refeições excluídas ({state.deleted.length})</summary>{state.deleted.map(m=><div className="card" key={m.id} style={{marginTop:8}}>{m.date} · {m.time} · {m.type}<button className="btn btn-ghost btn-sm" disabled={state.blocked} onClick={()=>nutritionStore.restoreMeal(m.id)}>Restaurar refeição</button></div>)}</details>}
    {state.goals.length>0 && <details className="more"><summary>Metas anteriores</summary>{state.goals.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(g=><div className="card" key={g.id} style={{marginTop:8}}>Desde {g.date}: {g.mode==='direct'?g.kcal:g.maintenance-g.deficit} kcal {g.mode==='calculated'&&<span>({g.maintenance} − {g.deficit} informados)</span>}<button className="btn btn-ghost btn-sm" disabled={state.blocked} onClick={()=>nutritionStore.deleteGoal(g.id)}>Remover meta</button></div>)}</details>}
    {state.meals.length>0 && <details className="more"><summary>Dias com registros</summary><div className="lib-chips" style={{flexWrap:'wrap',margin:0,padding:'4px 0'}}>{[...new Set(state.meals.map(m=>m.date))].sort().reverse().map(d=><button className="lib-chip" key={d} onClick={()=>setDate(d)}>{dayLabel(d)}</button>)}</div></details>}
  </div>
}
