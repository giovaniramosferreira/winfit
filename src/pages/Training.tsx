import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { byId, MUSCLE_LABEL } from '../data/exercises'
import { sessionsThisWeek, startOfWeek } from '../lib/helpers'
import { fmtKg } from '../lib/progression'
import { homeWorkout } from '../lib/homeWorkout'
import { startTraining, type TrainingMode } from '../data/sessionModules'
import Icon from '../components/Icon'
import { isTimedExercise } from '../lib/exerciseRules'
import { useCircuitStore } from '../lib/circuitStore'
import { Sheet } from '../components/ui'

export default function Training({ mode = 'gym' }: { mode?: TrainingMode }) {
  const nav = useNavigate()
  const plan = useStore(s => s.plan)!
  const profile = useStore(s => s.profile)!
  const sessions = useStore(s => s.sessions)
  const active = useStore(s => s.activeSession)
  const prs = useStore(s => s.prs)
  const seed = useStore(s => s.seed)
  const saveExpired = useStore(s => s.saveExpiredAsPartial)
  const [expired, setExpired] = useState(false)
  const [pickDay, setPickDay] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const circuitActive = useCircuitStore(s => s.active !== null)
  const home = useMemo(() => homeWorkout(profile,plan,seed,sessions),[profile,plan,seed,sessions])
  const nextGymDay = useMemo(() => {
    const done = sessions.filter(s => s.planId === plan.id).sort((a,b) => b.startedAt - a.startedAt)
    if (!done.length) return plan.days[0]
    const position = plan.days.findIndex(d => d.id === done[0].dayId)
    return plan.days[(position + 1) % plan.days.length] ?? plan.days[0]
  },[sessions,plan])
  const day = mode === 'home' ? home.day : nextGymDay
  const weekSessions = sessionsThisWeek(sessions)
  const goal = Math.min(profile.frequency,plan.days.length)
  const week = useMemo(() => {
    const start = startOfWeek(); const labels = ['S','T','Q','Q','S','S','D']
    const today = new Date(); today.setHours(0,0,0,0)
    return labels.map((label,i) => { const date = new Date(start); date.setDate(start.getDate()+i)
      return { label, today:date.getTime() === today.getTime(), done:weekSessions.some(s => { const d = new Date(s.startedAt); d.setHours(0,0,0,0); return d.getTime() === date.getTime() }) }
    })
  },[weekSessions])
  const start = (dayId = day.id) => {
    const result = startTraining(mode,dayId)
    if (result === 'expired') { setExpired(true); setPickDay(false) }
    else if (result === 'unavailable') setUnavailable(true)
    else nav('/player')
  }
  const toc = active ? active.exercises.map(e => ({ id:e.planExerciseId, exerciseId:e.exerciseId, sets:e.sets, repMin:e.repMin, repMax:e.repMax })) : day.exercises
  const origin = active ? active.source === 'home' ? 'Calistenia' : 'Academia' : mode === 'home' ? 'Calistenia' : 'Academia'
  const lastPR = mode === 'gym' ? prs[0] : null
  const title = active ? active.dayLabel : day.label.replace(/^Em casa · /, '')
  return <div className="page training-page">
    <h1 className="sr-only">Treinar</h1>
    <nav className="seg" aria-label="Modalidade">
      <Link to="/training" aria-current={mode === 'gym' ? 'page' : undefined}>Academia</Link>
      <Link to="/calisthenics" aria-current={mode === 'home' ? 'page' : undefined}>Calistenia</Link>
    </nav>
    <section className="hero-card training-session">
      <div className="eyebrow accent">{active ? `${origin} em andamento` : 'Próximo treino'}</div>
      <h2 className="train-title">{title}</h2>
      <p className="train-meta num">{active ? `${active.logs.length} séries feitas` : `${day.exercises.length} exercícios · ~${day.estMin} min`}</p>
      <ol className="train-list">{toc.map((pe,i) => {
        const ex = byId.get(pe.exerciseId); if (!ex) return null
        return <li key={pe.id}><Link to={`/exercise/${ex.id}`}>
          <span className="train-n num">{i + 1}</span><span className="train-t">{ex.name}<small>{MUSCLE_LABEL[ex.primary]}</small></span><span className="train-m num">{pe.sets}×{pe.repMin}–{pe.repMax}{isTimedExercise(ex.id) ? ' s' : ''}</span>
        </Link></li>
      })}</ol>
      {active || day.exercises.length ? <button className="btn btn-primary train-cta" onClick={() => start()}><Icon name="play" />{active ? 'Retomar treino' : 'Começar treino'}</button> : <p className="note">Nenhum exercício sem equipamento combina com suas limitações.</p>}
      {!active && mode === 'gym' && plan.days.length > 1 && <button className="btn btn-quiet" onClick={() => setPickDay(true)}>Escolher outro dia</button>}
      {unavailable && <p className="note" role="alert">Não foi possível iniciar. Revise o plano no Perfil.</p>}
    </section>
    <Link to="/circuit" className="hub-row hub-quick">
      <span className="hub-row-icon"><Icon name="timer" /></span>
      <span className="hub-row-copy"><b>Circuito cardio e core</b><small>{circuitActive ? 'Pausado · toque para retomar' : '~9 min por volta · sem equipamento'}</small></span>
      <Icon name="chevron" />
    </Link>
    <section className="card training-week" style={{ marginTop:12 }}><div className="between"><h2>Semana</h2><span className="small muted num">{weekSessions.length} de {goal}</span></div>
      <div className="week-dots" style={{ marginTop:8 }}>{week.map((d,i) => <div key={i} className={`week-dot ${d.done ? 'done' : ''} ${d.today ? 'today' : ''}`}><div className="dot">{d.done ? '✓' : ''}</div><div className="lbl">{d.label}</div></div>)}</div>
    </section>
    {lastPR && <Link to={`/exercise/${lastPR.exerciseId}`} className="note" style={{ display:'block', marginTop:14, color:'inherit', textDecoration:'none' }}><b>Último recorde.</b> {byId.get(lastPR.exerciseId)?.name}: <span className="mono num">{fmtKg(lastPR.value)} × {lastPR.reps}</span></Link>}
    {pickDay && <Sheet onClose={() => setPickDay(false)} labelledBy="choose-training"><div>
      <h2 id="choose-training">Escolher dia</h2>{plan.days.map(d => <button key={d.id} className="list-item" onClick={() => start(d.id)}><div className="grow"><h3>{d.label}</h3><span className="small muted num">{d.exercises.length} exercícios · ~{d.estMin} min</span></div><span className="chev">›</span></button>)}
      <button className="btn btn-quiet" onClick={() => setPickDay(false)}>Voltar</button>
    </div></Sheet>}
    {expired && active && <Sheet dismissible={false} labelledBy="training-expired" onClose={() => setExpired(false)}><div>
      <h2 id="training-expired">Treino inacabado</h2><p className="small muted">{active.dayLabel}: {active.logs.length} séries registradas.</p>
      <button className="btn btn-primary" onClick={() => { setExpired(false); nav('/player') }}>Continuar treino</button>
      <button className="btn btn-ghost" style={{ marginTop:10 }} onClick={() => { saveExpired(); setExpired(false) }}>Salvar como parcial</button>
      <button className="btn btn-quiet" onClick={() => setExpired(false)}>Voltar</button>
    </div></Sheet>}
  </div>
}
