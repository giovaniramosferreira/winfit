import { useState, useSyncExternalStore } from 'react'
import MealPhotoDraft, { NutritionLabelCalculator } from '../components/MealPhotoDraft'
import { daySummary, goalForDate, localDate, type Meal, type FoodItem, type NutritionGoal } from '../lib/nutrition'
import { nutritionStore } from '../lib/nutritionStore'
const uid = () => crypto.randomUUID()
const freshItem = (): FoodItem => ({id:uid(),name:'',portion:null,kcal:null})
const freshMeal = (date:string): Meal => ({id:uid(),date,time:new Date().toTimeString().slice(0,5),type:'Almoço',items:[freshItem()]})
const inputStyle = {width:'100%',minHeight:44,marginTop:4}
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
    <div className="sheet-head"><span>Alimentação</span><span>Diário manual</span></div>
    <h1>Seu diário <em>alimentar.</em></h1>
    <p className="small muted">Registros locais. As calorias são informadas por você; análise por IA ainda não está disponível.</p>
    {state.error && <div role="alert" className="card" style={{marginTop:12}}>{state.error}</div>}
    {message && <p role="status" style={{marginTop:12}}>{message}</p>}
    <MealPhotoDraft/>
    <section className="card" style={{marginTop:16}}>
      <label>Dia do diário<input aria-label="Dia do diário" type="date" style={inputStyle} value={date} onChange={e=>setDate(e.target.value)}/></label>
      <h2 style={{marginTop:16}}>{summary.kcal.toLocaleString('pt-BR')} kcal {summary.partial && <span className="pill">Total parcial</span>}</h2>
      <p className="small muted">{summary.pending ? `${summary.pending} item(ns) sem calorias informadas.` : 'Todos os itens registrados têm calorias informadas.'}</p>
      <p>{target===null?'Sem meta calórica definida.':`Meta informada: ${target.toLocaleString('pt-BR')} kcal`}</p>
      <p className="tiny muted">O diário não determina gasto energético ou déficit real.</p>
      <div className="row" style={{marginTop:12,flexWrap:'wrap'}}>
        <button className="btn btn-primary" disabled={state.blocked} onClick={()=>{setMeal(freshMeal(date));setMessage('')}}>Adicionar refeição</button>
        <button className="btn btn-ghost" disabled={state.blocked} onClick={()=>{setGoalDate(date);setGoalOpen(!goalOpen)}}>Configurar meta</button>
      </div>
    </section>
    {goalOpen && <section className="card" style={{marginTop:12}}><h2>Meta opcional</h2>
      <label>Válida a partir de<input type="date" style={inputStyle} value={goalDate} onChange={e=>setGoalDate(e.target.value)}/></label>
      <label>Como informar<select style={inputStyle} value={mode} onChange={e=>setMode(e.target.value as typeof mode)}><option value="direct">Meta direta em kcal</option><option value="calculated">Manutenção menos déficit informados</option></select></label>
      {mode==='direct'?<label>Meta (kcal)<input type="number" min="1" step="any" style={inputStyle} value={direct} onChange={e=>setDirect(e.target.value)}/></label>:<>
        <label>Manutenção informada (kcal)<input type="number" min="1" step="any" style={inputStyle} value={maintenance} onChange={e=>setMaintenance(e.target.value)}/></label>
        <label>Déficit planejado informado (kcal)<input type="number" min="0" step="any" style={inputStyle} value={deficit} onChange={e=>setDeficit(e.target.value)}/></label>
        <p className="small muted">Cálculo apenas com seus valores. Não é uma estimativa de necessidade ou déficit real.</p>
      </>}
      <button className="btn btn-primary" style={{marginTop:12}} onClick={saveGoal}>Salvar meta</button>
      <button className="btn btn-ghost" onClick={()=>setGoalOpen(false)}>Cancelar</button>
    </section>}
    {meal && <section className="card" style={{marginTop:12}}><h2>Refeição</h2><form onSubmit={e=>{e.preventDefault();saveMeal()}}>
      <label>Data<input required type="date" style={inputStyle} value={meal.date} onChange={e=>setMeal({...meal,date:e.target.value})}/></label>
      <label>Horário local<input required type="time" style={inputStyle} value={meal.time} onChange={e=>setMeal({...meal,time:e.target.value})}/></label>
      <label>Tipo<select style={inputStyle} value={meal.type} onChange={e=>setMeal({...meal,type:e.target.value})}>{['Café da manhã','Almoço','Jantar','Lanche','Outro'].map(t=><option key={t}>{t}</option>)}</select></label>
      {meal.items.map((item,index)=><fieldset key={item.id} style={{marginTop:16,padding:12,border:'1px solid var(--line)',borderRadius:12}}><legend>Item {index+1}</legend>
        <label>Alimento<input required maxLength={200} style={inputStyle} value={item.name} onChange={e=>updateItem(item.id,{name:e.target.value})}/></label>
        <label>Porção em gramas (opcional)<input type="number" min="0.01" step="any" style={inputStyle} value={item.portion??''} onChange={e=>updateItem(item.id,{portion:e.target.value===''?null:Number(e.target.value)})}/></label>
        <label>Calorias da porção (opcional)<input type="number" min="0" step="any" style={inputStyle} value={item.kcal??''} onChange={e=>updateItem(item.id,{kcal:e.target.value===''?null:Number(e.target.value)})}/></label>
        <NutritionLabelCalculator name={item.name} onConfirm={value=>updateItem(item.id,{portion:value.portion,kcal:value.kcal,provenance:value.provenance})}/>
        <button type="button" className="btn btn-ghost btn-sm" disabled={meal.items.length===1} onClick={()=>setMeal({...meal,items:meal.items.filter(i=>i.id!==item.id)})}>Remover item</button>
      </fieldset>)}
      <p className="tiny muted">Campo vazio significa informação pendente. Zero kcal é um valor informado.</p>
      <button type="button" className="btn btn-ghost" onClick={()=>setMeal({...meal,items:[...meal.items,freshItem()]})}>Adicionar item</button>
      <div className="row" style={{marginTop:12}}><button type="submit" className="btn btn-primary">Salvar refeição</button><button type="button" className="btn btn-ghost" onClick={()=>setMeal(null)}>Cancelar</button></div>
    </form></section>}
    <h2 style={{marginTop:24}}>Refeições do dia</h2>
    {!meals.length && <p className="muted">Nenhuma refeição registrada nesta data.</p>}
    {meals.map(m=><article key={m.id} className="card" style={{marginTop:12}}><h3>{m.time} · {m.type}</h3>{m.items.map(i=><p key={i.id}>{i.name}{i.portion!==null?` · ${i.portion} g`:''} · {i.kcal===null?'kcal pendentes':`${i.kcal} kcal`}</p>)}<div className="row"><button className="btn btn-ghost btn-sm" disabled={state.blocked} onClick={()=>setMeal(structuredClone(m))}>Editar refeição</button><button className="btn btn-ghost btn-sm" disabled={state.blocked} onClick={()=>{if(nutritionStore.deleteMeal(m.id))setMessage('Refeição excluída. Você pode restaurá-la abaixo.')}}>Excluir refeição</button></div></article>)}
    {state.deleted.length>0 && <details style={{marginTop:20}}><summary>Refeições excluídas ({state.deleted.length})</summary>{state.deleted.map(m=><div className="card" key={m.id} style={{marginTop:8}}>{m.date} · {m.time} · {m.type}<button className="btn btn-ghost btn-sm" disabled={state.blocked} onClick={()=>nutritionStore.restoreMeal(m.id)}>Restaurar refeição</button></div>)}</details>}
    <details style={{marginTop:20}}><summary>Histórico de metas ({state.goals.length})</summary>{state.goals.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(g=><div className="card" key={g.id} style={{marginTop:8}}>Desde {g.date}: {g.mode==='direct'?g.kcal:g.maintenance-g.deficit} kcal {g.mode==='calculated'&&<span>({g.maintenance} − {g.deficit} informados)</span>}<button className="btn btn-ghost btn-sm" disabled={state.blocked} onClick={()=>nutritionStore.deleteGoal(g.id)}>Remover meta</button></div>)}</details>
    <details style={{marginTop:20}}><summary>Dias com registros</summary>{[...new Set(state.meals.map(m=>m.date))].sort().reverse().map(d=><button className="btn btn-ghost btn-sm" style={{margin:4}} key={d} onClick={()=>setDate(d)}>{d}</button>)}</details>
  </div>
}
