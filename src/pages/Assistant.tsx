import { useState } from 'react'
import PageTop from '../components/PageTop'
import Switch from '../components/Switch'
import { useStore } from '../lib/store'
import { adaptationWarnings, applyFutureDay, proposeAdaptation } from '../lib/assistantContext'
import { byId, EQUIP_LABEL } from '../data/exercises'
import { availableEquipment } from '../lib/generator'
import type { Equipment, WorkoutDay } from '../types'

export default function Assistant() {
  const plan = useStore((s) => s.plan)
  const profile = useStore((s) => s.profile)
  const [minutes, setMinutes] = useState(30)
  const [dayId, setDayId] = useState(plan?.days[0]?.id ?? '')
  const [atHome, setAtHome] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment[] | null>(null)
  const [proposal, setProposal] = useState<WorkoutDay | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [baseline, setBaseline] = useState('')
  const equipment: Equipment[] = atHome ? ['peso_corporal'] : selectedEquipment ?? (profile ? availableEquipment(profile) : ['peso_corporal'])
  const preview = () => {
    const day = plan?.days.find((d) => d.id === dayId)
    if (!day || !profile) return
    const proposed = proposeAdaptation(day, minutes, profile, equipment)
    setProposal(proposed); setWarnings(adaptationWarnings(proposed, profile, equipment)); setBaseline(JSON.stringify(plan)); setMessage('')
  }
  const apply = () => {
    const current = useStore.getState()
    if (!current.plan || !proposal || JSON.stringify(current.plan) !== baseline) { setMessage('O plano mudou. Gere uma nova prévia.'); return }
    const next = applyFutureDay(current.plan, proposal)
    if (next && warnings.length === 0 && proposal.estMin <= minutes) { useStore.setState({ plan: next }); setProposal(null); setMessage('Pronto! O próximo treino desse dia já está adaptado.') }
  }
  const times = [15, 20, 30, 45, 60]
  return <div className="page assistant-page fade-in">
    <PageTop title="Adaptar treino" tagline="Pouco tempo ou sem equipamento hoje? Ajuste o próximo treino." />
    {plan && profile ? <section className="card assistant-adaptation" id="assistant-adaptation">
      <h2 className="field-title">Qual treino?</h2>
      {plan.days.length <= 3
        ? <div className="seg" role="group" aria-label="Dia">{plan.days.map((d) => <button key={d.id} type="button" aria-pressed={dayId === d.id} onClick={() => { setDayId(d.id); setProposal(null) }}>{d.label.replace(/^Corpo inteiro /, '')}</button>)}</div>
        : <select className="input" aria-label="Dia" value={dayId} onChange={(e) => { setDayId(e.target.value); setProposal(null) }}>{plan.days.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}</select>}
      <h2 className="field-title">Quanto tempo você tem?</h2>
      <div className="seg" role="group" aria-label="Minutos disponíveis">{times.map((t) => <button key={t} type="button" className="num" aria-pressed={minutes === t} onClick={() => { setMinutes(t); setProposal(null) }}>{t}′</button>)}</div>
      <Switch label="Só peso do corpo hoje" checked={atHome} onChange={(v) => { setAtHome(v); setProposal(null) }} />
      {!atHome && <><h2 className="field-title" style={{ marginTop: 10 }}>Equipamento disponível</h2>
        <div className="lib-chips" style={{ flexWrap: 'wrap', margin: 0, padding: 0 }}>{(Object.keys(EQUIP_LABEL) as Equipment[]).filter((item) => item !== 'peso_corporal').map((item) =>
          <button key={item} type="button" className={`lib-chip${equipment.includes(item) ? ' on' : ''}`} aria-pressed={equipment.includes(item)} onClick={() => { setSelectedEquipment(equipment.includes(item) ? equipment.filter((existing) => existing !== item) : [...equipment, item]); setProposal(null) }}>{EQUIP_LABEL[item]}</button>)}</div></>}
      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={preview}>Ver proposta</button>
      {proposal && <div className="assistant-proposal"><h3>Proposta · ~{proposal.estMin} min</h3><ul>{proposal.exercises.map((ex) => <li key={ex.id}>{byId.get(ex.exerciseId)?.name ?? ex.exerciseId} · {ex.sets} séries</li>)}</ul>
        {proposal.estMin > minutes && <p role="alert">Os exercícios obrigatórios passam de {minutes} min. Aumente o tempo.</p>}
        {warnings.map((warning) => <p role="alert" key={warning}>{warning}</p>)}
        <button className="btn btn-primary" disabled={warnings.length > 0 || proposal.exercises.length === 0 || proposal.estMin > minutes} onClick={apply}>Usar no próximo treino</button>
        <button className="btn btn-quiet" onClick={() => setProposal(null)}>Cancelar</button></div>}
      {message && <p role="status">{message}</p>}
    </section> : <p className="small muted">Crie seu plano primeiro.</p>}
  </div>
}
