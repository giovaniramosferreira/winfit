import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { byId } from '../data/exercises'
import { ANATOMY, plateNo } from '../data/anatomy'
import { greeting, sessionsThisWeek, startOfWeek } from '../lib/helpers'
import { fmtKg } from '../lib/progression'
import InstallCard from '../components/InstallCard'
import { homeWorkout } from '../lib/homeWorkout'

export default function Home() {
  const nav = useNavigate()
  const plan = useStore((s) => s.plan)!
  const sessions = useStore((s) => s.sessions)
  const active = useStore((s) => s.activeSession)
  const prs = useStore((s) => s.prs)
  const startSession = useStore((s) => s.startSession)
  const startHomeSession = useStore((s) => s.startHomeSession)
  const seed = useStore((s) => s.seed)
  const resumeState = useStore((s) => s.resumeOrExpireSession)
  const saveExpired = useStore((s) => s.saveExpiredAsPartial)
  const discard = useStore((s) => s.discardActive)
  const profile = useStore((s) => s.profile)!
  const [expiredPrompt, setExpiredPrompt] = useState(false)
  const [pickDay, setPickDay] = useState(false)
  const home = useMemo(() => homeWorkout(profile, plan, seed, sessions), [profile, plan, seed, sessions])

  const weekSessions = sessionsThisWeek(sessions)
  const goal = Math.min(profile.frequency, plan.days.length)

  // Próximo treino = dia seguinte ao último executado (a semana "desliza" — regra R2 da spec).
  const nextDay = useMemo(() => {
    const done = sessions
      .filter((s) => s.planId === plan.id)
      .sort((a, b) => b.startedAt - a.startedAt)
    if (done.length === 0) return plan.days[0]
    const lastPos = plan.days.findIndex((d) => d.id === done[0].dayId)
    return plan.days[(lastPos + 1) % plan.days.length] ?? plan.days[0]
  }, [sessions, plan])

  const lastPR = prs.length > 0 ? prs[0] : null

  const handleStart = (source: 'plan' | 'home' = 'plan') => {
    const state = resumeState()
    if (state === 'resumable') return nav('/player')
    if (state === 'expired') return setExpiredPrompt(true)
    if (source === 'home') startHomeSession()
    else startSession(nextDay.id)
    nav('/player')
  }

  // Bolinhas da semana (seg–dom)
  const week = useMemo(() => {
    const start = startOfWeek()
    const labels = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return labels.map((lbl, i) => {
      const day = new Date(start); day.setDate(start.getDate() + i)
      const has = weekSessions.some((s) => {
        const d = new Date(s.startedAt); d.setHours(0, 0, 0, 0)
        return d.getTime() === day.getTime()
      })
      return { lbl, done: has, today: day.getTime() === today.getTime() }
    })
  }, [weekSessions])

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  // Em andamento, o sumário mostra o que está no player (inclui trocas e treino em casa).
  const toc = active
    ? active.exercises.map((e) => ({ id: e.planExerciseId, exerciseId: e.exerciseId, sets: e.sets, repMin: e.repMin, repMax: e.repMax }))
    : nextDay.exercises

  return (
    <div className="page fade-in">
      <div className="sheet-head">
        <span>{greeting()} · {today}</span>
        <span className="num">Semana {weekSessions.length}/{goal}</span>
      </div>

      <section className="hero-card">
        <div className="eyebrow accent">{active ? 'Treino em andamento' : weekSessions.length >= goal ? 'Semana fechada' : 'Treino de hoje'}</div>
        <h1 style={{ marginTop: 8 }}>{active ? active.dayLabel : nextDay.label}</h1>
        {!active && (
          <div className="kpis" style={{ marginTop: 14 }}>
            <div><b className="num">{nextDay.exercises.length}</b><span>exercícios</span></div>
            <div><b className="num">~{nextDay.estMin}</b><span>minutos</span></div>
            <div><b className={`num${weekSessions.length >= goal ? ' hot' : ''}`}>{weekSessions.length}/{goal}</b><span>treinos na semana</span></div>
          </div>
        )}

        <div className="eyebrow" style={{ marginTop: 18 }}>Exercícios de hoje</div>
        <ol className="toc" style={{ marginTop: 4 }}>
          {toc.map((pe, i) => {
            const ex = byId.get(pe.exerciseId)
            if (!ex) return null
            return (
              <li key={pe.id}>
                <Link to={`/exercise/${ex.id}`} className={`toc-item${i === 0 && !active ? ' on' : ''}`}>
                  <span className="n num">{plateNo(ex.id)}</span>
                  <span className="t">{ex.name}<small>{ANATOMY[ex.primary].latin}</small></span>
                  <span className="m num">{pe.sets}×{pe.repMin}–{pe.repMax}</span>
                </Link>
              </li>
            )
          })}
        </ol>

        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => handleStart()}>
          {active ? 'Continuar treino' : 'Começar treino'}
        </button>
        {!active && (
          <button className="btn-quiet btn" onClick={() => setPickDay(true)}>
            Treinar outro dia do plano
          </button>
        )}
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <div className="between">
          <h3>Minha semana</h3>
          <span className="tiny muted num">{weekSessions.length} de {goal} treinos</span>
        </div>
        <div className="week-dots" style={{ marginTop: 12 }}>
          {week.map((d, i) => (
            <div key={i} className={`week-dot ${d.done ? 'done' : ''} ${d.today ? 'today' : ''}`}>
              <div className="dot">{d.done ? '✓' : ''}</div>
              <div className="lbl">{d.lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {lastPR && (
        <Link to={`/exercise/${lastPR.exerciseId}`} className="note" style={{ display: 'block', marginTop: 14, color: 'inherit', textDecoration: 'none' }}>
          <b>Último recorde.</b> {byId.get(lastPR.exerciseId)?.name}: <span className="mono num">{fmtKg(lastPR.value)} × {lastPR.reps}</span>
        </Link>
      )}

      <section className="card" style={{ marginTop: 18 }} aria-labelledby="home-workout-title">
        <div className="eyebrow">Calistenia · só o peso do corpo</div>
        <h2 id="home-workout-title" style={{ marginTop: 6 }}>Treino em casa</h2>
        <p className="small muted" style={{ marginTop: 6 }}>
          Calistenia de corpo inteiro, sem equipamentos. Conta na sua semana e mantém o próximo treino do plano.
        </p>
        {home.day.exercises.length > 0 ? <>
          <p className="small muted num" style={{ marginTop: 8 }}>
            {home.day.exercises.length} exercícios · ~{home.day.estMin} min
          </p>
          <details style={{ marginTop: 6 }}>
            <summary style={{ cursor: 'pointer', padding: '10px 0' }}>Ver exercícios</summary>
            {home.day.exercises.map((pe) => (
              <div className="list-item" key={pe.id}>
                <span className="grow small">{byId.get(pe.exerciseId)?.name}</span>
                <span className="tiny muted mono num">
                  {pe.sets} × {pe.repMin}–{pe.repMax} {pe.exerciseId.startsWith('prancha') ? 'seg' : 'reps'}
                </span>
              </div>
            ))}
          </details>
          <p className="tiny faint" style={{ marginTop: 8 }}>
            Demonstrações ilustradas e variações no treino. Sem porta, sofá ou acessórios improvisados.
          </p>
          <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={() => handleStart('home')}>
            {active ? 'Continuar treino em andamento' : 'Começar em casa'}
          </button>
        </> : <p className="small muted" style={{ marginTop: 10 }}>
          Não há exercícios sem equipamentos compatíveis com as limitações do seu perfil.
        </p>}
      </section>

      <div style={{ marginTop: 12 }}>
        <InstallCard />
      </div>

      {pickDay && (
        <div className="modal-back" onClick={() => setPickDay(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Escolher treino</h2>
            <div style={{ marginTop: 10 }}>
              {plan.days.map((d) => (
                <button key={d.id} className="list-item" onClick={() => { startSession(d.id); nav('/player') }}>
                  <div className="grow">
                    <h3>{d.label}</h3>
                    <span className="small muted num">{d.exercises.length} exercícios · ~{d.estMin} min</span>
                  </div>
                  <span className="chev">›</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {expiredPrompt && active && (
        <div className="modal-back">
          <div className="modal">
            <h2>Treino inacabado</h2>
            <p className="muted small" style={{ marginTop: 8 }}>
              Você não finalizou <b>{active.dayLabel}</b>. O que fazer com as {active.logs.length} séries registradas?
            </p>
            <div style={{ marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => { saveExpired(); setExpiredPrompt(false) }}>
                Salvar como treino parcial
              </button>
              <button className="btn btn-danger" style={{ marginTop: 10 }} onClick={() => { discard(); setExpiredPrompt(false) }}>
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
