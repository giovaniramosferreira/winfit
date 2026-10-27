import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { adaptationWarnings, applyFutureDay, buildAssistantContext, localExplanation, proposeAdaptation } from '../lib/assistantContext'
import { byId, EQUIP_LABEL } from '../data/exercises'
import { availableEquipment } from '../lib/generator'
import type { Equipment, WorkoutDay } from '../types'

export default function Assistant() {
  const plan = useStore((s) => s.plan)
  const profile = useStore((s) => s.profile)
  const sessions = useStore((s) => s.sessions)
  const [enabled, setEnabled] = useState(false)
  const [context, setContext] = useState('')
  const [answer, setAnswer] = useState('')
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
    if (next && warnings.length === 0 && proposal.estMin <= minutes) { useStore.setState({ plan: next }); setProposal(null); setMessage('Adaptação salva para o próximo treino desse dia. O treino em andamento continua igual.') }
  }
  return <div className="page assistant-page fade-in"><header className="wellness-heading"><div className="screen-topline"><Link to="/home">← Início</Link><span className="wellness-badge">Ferramentas locais</span></div><p className="screen-kicker">Assistente</p><h1 className="screen-title">Seu treino,<br/><em>do seu jeito.</em></h1><p className="screen-subtitle">Assistente para adaptar o próximo treino ao tempo e aos equipamentos de hoje.</p>{plan && profile && <button type="button" className="wellness-assistant-jump" onClick={() => document.getElementById('assistant-adaptation')?.scrollIntoView()}>Adaptar meu próximo treino <span aria-hidden="true">↓</span></button>}</header>
    <section className="card assistant-context"><span className="screen-kicker">Entenda seu plano</span><h2>Explicações locais</h2><p>A conversa com IA ainda não está disponível. Por enquanto, revise explicações e adaptações calculadas neste aparelho.</p>
      <label><input type="checkbox" checked={enabled} onChange={(e) => { setEnabled(e.target.checked); setAnswer(''); setContext(e.target.checked ? buildAssistantContext(plan, sessions, profile) : '') }} /> Preparar contexto do plano e das 3 últimas sessões somente nesta consulta local</label>
      <p className="small muted">Revise, remova ou edite os fatos antes de consultar. Dados da conta, medidas corporais e observações de saúde não entram nesta prévia.</p>
      <label>Contexto (opcional e editável)<textarea maxLength={2000} value={context} disabled={!enabled} onChange={(e) => setContext(e.target.value)} /></label>
      <button className="btn" disabled={!enabled} onClick={() => setAnswer(localExplanation(context, enabled))}>Como funciona a adaptação?</button>
      {answer && <p role="status">{answer}</p>}
    </section>
    {plan && profile && <section className="card assistant-adaptation" id="assistant-adaptation"><span className="screen-kicker">Prepare o próximo passo</span><h2>Adaptar um treino futuro</h2>
      <p>A prévia preserva exercícios obrigatórios. O tempo informado é uma preferência; não garante a duração final. Não altera séries já registradas.</p>
      <label>Dia<select value={dayId} onChange={(e) => { setDayId(e.target.value); setProposal(null) }}>{plan.days.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}</select></label>
      <label>Tempo disponível (min)<input type="number" min="5" max="180" value={minutes} onChange={(e) => { setMinutes(Number(e.target.value)); setProposal(null) }} /></label>
      <label><input type="checkbox" checked={atHome} onChange={(e) => { setAtHome(e.target.checked); setProposal(null) }} /> Hoje só tenho o peso do corpo</label>
      {!atHome && <fieldset><legend>Equipamentos disponíveis hoje</legend>{(Object.keys(EQUIP_LABEL) as Equipment[]).filter((item) => item !== 'peso_corporal').map((item) => <label key={item} style={{ display: 'block', padding: '10px 0' }}><input type="checkbox" checked={equipment.includes(item)} onChange={(event) => { setSelectedEquipment(event.target.checked ? [...equipment, item] : equipment.filter((existing) => existing !== item)); setProposal(null) }} />{EQUIP_LABEL[item]}</label>)}</fieldset>}
      <button className="btn btn-primary" disabled={!Number.isFinite(minutes) || minutes < 5 || minutes > 180} onClick={preview}>Ver proposta</button>
      {proposal && <div className="assistant-proposal"><span className="wellness-badge">Revise antes de aplicar</span><h3>Prévia</h3><ul>{proposal.exercises.map((ex) => <li key={ex.id}>{byId.get(ex.exerciseId)?.name ?? ex.exerciseId} · {ex.sets} séries</li>)}</ul>
        <p className="small">Duração estimada: ~{proposal.estMin} min, incluindo séries, descanso, aquecimento e transições.</p>
        {proposal.estMin > minutes && <p role="alert">Os exercícios obrigatórios ainda excedem o tempo informado. Aumente o tempo ou descarte esta proposta; ela não será aplicada como se coubesse.</p>}
        {warnings.map((warning) => <p role="alert" key={warning}>{warning}</p>)}
        <button className="btn btn-primary" disabled={warnings.length > 0 || proposal.exercises.length === 0 || proposal.estMin > minutes} onClick={apply}>Aplicar ao próximo treino</button>
        <button className="btn" onClick={() => setProposal(null)}>Cancelar</button></div>}
      {message && <p role="status">{message}</p>}
    </section>}
  </div>
}
