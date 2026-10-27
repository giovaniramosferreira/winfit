import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { byId } from '../data/exercises'
import { ANATOMY, plateNo } from '../data/anatomy'
import { sessionsThisWeek, startOfWeek } from '../lib/helpers'
import { fmtKg } from '../lib/progression'
import { homeWorkout } from '../lib/homeWorkout'
import { startTraining, type TrainingMode } from '../data/sessionModules'
import HomeArtwork from '../components/HomeArtwork'
import { isTimedExercise } from '../lib/exerciseRules'

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
  return <div className="page training-page">
    <div className="sheet-head"><Link to="/home">‹ Início</Link><span className="num">Semana {weekSessions.length}/{goal}</span></div>
    <div className="training-heading"><div><div className="screen-kicker">{mode === 'home' ? 'Calistenia · só o peso do corpo' : 'Academia · seu plano'}</div>
    <h1 className="screen-title">{mode === 'home' ? 'Calistenia' : 'Academia'}</h1>
    <p className="small muted">{mode === 'home' ? 'Seu ciclo de corpo inteiro, sem equipamentos. Cada treino concluído avança o ciclo em casa e preserva a sequência do plano.' : plan.splitLabel}</p></div><div className="training-art" aria-hidden="true"><HomeArtwork module={mode === 'home' ? 'home' : 'gym'} /></div></div>
    <section className="hero-card training-session" style={{ marginTop:16 }}>
      <div className="eyebrow accent">{active ? `${origin} em andamento` : 'Próximo treino'}</div>
      <h2 style={{ marginTop:8 }}>{active ? active.dayLabel : day.label}</h2>
      {active && <p className="small muted">{active.logs.length} séries registradas. Retomar mantém exercício atual, séries e descanso, mesmo ao entrar por outro módulo.</p>}
      {!active && <div className="kpis" style={{ marginTop:14 }}><div><b className="num">{day.exercises.length}</b><span>exercícios</span></div><div><b className="num">~{day.estMin}</b><span>minutos</span></div></div>}
      <div className="eyebrow" style={{ marginTop:18 }}>Exercícios de hoje</div>
      <ol className="toc" style={{ marginTop:4 }}>{toc.map((pe,i) => {
        const ex = byId.get(pe.exerciseId); if (!ex) return null
        return <li key={pe.id}><Link to={`/exercise/${ex.id}`} className={`toc-item${i === 0 && !active ? ' on' : ''}`}>
          <span className="n num">{plateNo(ex.id)}</span><span className="t">{ex.name}<small>{ANATOMY[ex.primary].latin}</small></span><span className="m num">{pe.sets}×{pe.repMin}–{pe.repMax}{isTimedExercise(ex.id) ? ' s' : ''}</span>
        </Link></li>
      })}</ol>
      {active || day.exercises.length ? <button className="btn btn-primary" style={{ marginTop:16 }} onClick={() => start()}>{active ? 'Retomar treino' : mode === 'home' ? 'Começar em casa' : 'Começar treino'}</button> : <p className="note">Não há exercícios sem equipamentos compatíveis com as limitações do seu perfil.</p>}
      {!active && mode === 'gym' && <button className="btn btn-quiet" onClick={() => setPickDay(true)}>Treinar outro dia do plano</button>}
      {mode === 'home' && <p className="tiny muted" style={{ marginTop:12 }}>Demonstrações e variações no treino. Sem porta, sofá ou acessórios improvisados.</p>}
      {unavailable && <p className="note" role="alert">Não foi possível iniciar este treino. Revise seu plano e limitações no perfil.</p>}
    </section>
    <section className="card training-week" style={{ marginTop:18 }}><div className="between"><h2>Minha semana</h2><span className="tiny muted num">{weekSessions.length} de {goal} treinos</span></div>
      <div className="week-dots" style={{ marginTop:12 }}>{week.map((d,i) => <div key={i} className={`week-dot ${d.done ? 'done' : ''} ${d.today ? 'today' : ''}`}><div className="dot">{d.done ? '✓' : ''}</div><div className="lbl">{d.label}</div></div>)}</div>
      <p className="tiny muted" style={{ marginTop:10 }}>Academia e calistenia compartilham sua meta semanal.</p>
    </section>
    {lastPR && <Link to={`/exercise/${lastPR.exerciseId}`} className="note" style={{ display:'block', marginTop:14, color:'inherit', textDecoration:'none' }}><b>Último recorde.</b> {byId.get(lastPR.exerciseId)?.name}: <span className="mono num">{fmtKg(lastPR.value)} × {lastPR.reps}</span></Link>}
    {pickDay && <div className="modal-back" onClick={() => setPickDay(false)}><div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="choose-training">
      <h2 id="choose-training">Escolher treino</h2>{plan.days.map(d => <button key={d.id} className="list-item" onClick={() => start(d.id)}><div className="grow"><h3>{d.label}</h3><span className="small muted num">{d.exercises.length} exercícios · ~{d.estMin} min</span></div><span className="chev">›</span></button>)}
      <button className="btn btn-quiet" onClick={() => setPickDay(false)}>Voltar</button>
    </div></div>}
    {expired && active && <div className="modal-back"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="training-expired">
      <h2 id="training-expired">Treino inacabado</h2><p className="small muted">{active.dayLabel} tem {active.logs.length} séries registradas. Preserve o registro como treino parcial ou continue de onde parou.</p>
      <button className="btn btn-primary" onClick={() => { setExpired(false); nav('/player') }}>Continuar treino</button>
      <button className="btn btn-ghost" style={{ marginTop:10 }} onClick={() => { saveExpired(); setExpired(false) }}>Salvar como treino parcial</button>
      <button className="btn btn-quiet" onClick={() => setExpired(false)}>Voltar</button>
    </div></div>}
  </div>
}
