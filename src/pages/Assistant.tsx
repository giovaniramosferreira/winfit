import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { adaptationWarnings, applyFutureDay, localExplanation, proposeAdaptation } from '../lib/assistantContext'
import { byId } from '../data/exercises'
import type { Equipment, WorkoutDay } from '../types'

export default function Assistant() {
  const plan = useStore((s) => s.plan)
  const profile = useStore((s) => s.profile)
  const [enabled, setEnabled] = useState(false)
  const [context, setContext] = useState('')
  const [answer, setAnswer] = useState('')
  const [minutes, setMinutes] = useState(30)
  const [dayId, setDayId] = useState(plan?.days[0]?.id ?? '')
  const [atHome, setAtHome] = useState(false)
  const [proposal, setProposal] = useState<WorkoutDay | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [baseline, setBaseline] = useState('')
  const equipment: Equipment[] = atHome ? ['peso_corporal'] : [...(profile?.equipment ?? []), 'peso_corporal']
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
    if (next && warnings.length === 0) { useStore.setState({ plan: next }); setProposal(null); setMessage('Adaptação salva para o próximo treino desse dia. O treino em andamento continua igual.') }
  }
  return <div className="page"><Link to="/home">← Início</Link><h1>Assistente</h1>
    <section className="card"><h2>Explicações locais</h2><p>Regras do aplicativo. IA remota indisponível: o backend autenticado ainda não está configurado.</p>
      <label><input type="checkbox" checked={enabled} onChange={(e) => { setEnabled(e.target.checked); setAnswer(''); if (!e.target.checked) setContext('') }} /> Usar o contexto que eu informar nesta consulta local</label>
      <label>Contexto (opcional e editável)<textarea maxLength={2000} value={context} disabled={!enabled} onChange={(e) => setContext(e.target.value)} /></label>
      <button className="btn" disabled={!enabled} onClick={() => setAnswer(localExplanation(context, enabled))}>Como funciona a adaptação?</button>
      {answer && <p role="status">{answer}</p>}
    </section>
    {plan && profile && <section className="card"><h2>Adaptar um treino futuro</h2>
      <p>A prévia preserva exercícios obrigatórios. O tempo informado é uma preferência; não garante a duração final. Não altera séries já registradas.</p>
      <label>Dia<select value={dayId} onChange={(e) => { setDayId(e.target.value); setProposal(null) }}>{plan.days.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}</select></label>
      <label>Tempo disponível (min)<input type="number" min="5" max="180" value={minutes} onChange={(e) => { setMinutes(Number(e.target.value)); setProposal(null) }} /></label>
      <label><input type="checkbox" checked={atHome} onChange={(e) => { setAtHome(e.target.checked); setProposal(null) }} /> Hoje só tenho o peso do corpo</label>
      <button className="btn" disabled={!Number.isFinite(minutes) || minutes < 5 || minutes > 180} onClick={preview}>Ver proposta</button>
      {proposal && <div><h3>Prévia</h3><ul>{proposal.exercises.map((ex) => <li key={ex.id}>{byId.get(ex.exerciseId)?.name ?? ex.exerciseId} · {ex.sets} séries</li>)}</ul>
        {warnings.map((warning) => <p role="alert" key={warning}>{warning}</p>)}
        <button className="btn btn-primary" disabled={warnings.length > 0 || proposal.exercises.length === 0} onClick={apply}>Aplicar ao próximo treino</button>
        <button className="btn" onClick={() => setProposal(null)}>Cancelar</button></div>}
      {message && <p role="status">{message}</p>}
    </section>}
  </div>
}
