import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { homeSummary } from '../lib/homeSummary'
import { useAuth } from '../components/AuthProvider'
import { startTraining } from '../data/sessionModules'
import HomeArtwork from '../components/HomeArtwork'
import { useCircuitStore } from '../lib/circuitStore'
import Icon from '../components/Icon'

const wellbeing = [
  { to: '/pelvic', title: 'Saúde pélvica', caption: 'Pausa de 1 min', icon: 'breath' },
  { to: '/nutrition', title: 'Alimentação', caption: 'Diário de refeições', icon: 'meal' },
  { to: '/routine', title: 'Rotina', caption: 'Lembretes e checklist', icon: 'calendar' },
  { to: '/assistant', title: 'Adaptar treino', caption: 'Pouco tempo hoje?', icon: 'spark' },
] as const

export default function Home() {
  const nav = useNavigate()
  const active = useStore(s => s.activeSession)
  const sessions = useStore(s => s.sessions)
  const profile = useStore(s => s.profile)
  const plan = useStore(s => s.plan)
  const circuitActive = useCircuitStore(s => s.active !== null)
  const { session } = useAuth()
  const metadata = session?.user?.user_metadata
  const name = typeof metadata?.full_name === 'string' ? metadata.full_name : typeof metadata?.name === 'string' ? metadata.name : undefined
  const { message, weekCount, weekGoal, next } = homeSummary({ profile, plan, sessions, active, name })
  const saveExpired = useStore(s => s.saveExpiredAsPartial)
  const [expired, setExpired] = useState(false)
  const homeOnly = profile?.location === 'home_none'
  const go = () => {
    const result = startTraining(active?.source === 'home' || (!active && homeOnly) ? 'home' : 'gym', active ? undefined : next?.id)
    if (result === 'expired') setExpired(true)
    else if (result !== 'unavailable') nav('/player')
  }

  return <main className="page hub fade-in">
    <section className="hub-hero" aria-labelledby="hub-title">
      <div className="hub-hero-top">
        <span className="hub-brand">Win<em>Fit</em></span>
        {weekGoal > 0 && <Link to="/progress" className="hub-week" aria-label={`${weekCount} de ${weekGoal} treinos nesta semana. Ver progresso`}>
          <Ring value={weekCount} goal={weekGoal} /><span><b className="num">{weekCount}/{weekGoal}</b> na semana</span>
        </Link>}
      </div>
      <h1 id="hub-title">{message}</h1>
      {active
        ? <p className="hub-meta num">{active.logs.length} {active.logs.length === 1 ? 'série feita' : 'séries feitas'} · {active.source === 'home' ? 'Calistenia' : 'Academia'}</p>
        : next && <p className="hub-meta num">{next.exercises.length} exercícios · ~{next.estMin} min</p>}
      <button className="btn hub-cta home-resume" onClick={go}>
        <Icon name="play" />{active ? 'Retomar treino' : 'Começar treino'}
      </button>
    </section>

    <h2 className="hub-section">Treinar</h2>
    <div className="hub-train" aria-label="Modalidades de treino">
      <Link to="/training" className="hub-card home-module"><HomeArtwork module="gym" /><span className="hub-card-copy"><b>Academia</b><small>Seu plano</small></span></Link>
      <Link to="/calisthenics" className="hub-card home-module"><HomeArtwork module="home" /><span className="hub-card-copy"><b>Calistenia</b><small>Sem equipamento</small></span></Link>
    </div>
    <Link to="/circuit" className="hub-row hub-quick">
      <span className="hub-row-icon"><Icon name="timer" /></span>
      <span className="hub-row-copy"><b>Circuito cardio e core</b><small>{circuitActive ? 'Pausado · toque para retomar' : '~9 min por volta · sem equipamento'}</small></span>
      <Icon name="chevron" />
    </Link>

    <h2 className="hub-section">Bem-estar</h2>
    <div className="hub-grid">
      {wellbeing.map(item => <Link key={item.to} to={item.to} className="hub-tile">
        <span className="hub-row-icon"><Icon name={item.icon} /></span>
        <b>{item.title}</b><small>{item.caption}</small>
      </Link>)}
    </div>

    {expired && active && <div className="modal-back"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="hub-expired">
      <h2 id="hub-expired">Treino inacabado</h2><p className="small muted">{active.dayLabel}: {active.logs.length} séries registradas.</p>
      <button className="btn btn-primary" onClick={() => { setExpired(false); nav('/player') }}>Continuar treino</button>
      <button className="btn btn-ghost" style={{ marginTop:10 }} onClick={() => { saveExpired(); setExpired(false) }}>Salvar como parcial</button>
      <button className="btn btn-quiet" onClick={() => setExpired(false)}>Voltar</button>
    </div></div>}
  </main>
}

function Ring({ value, goal }: { value: number; goal: number }) {
  const r = 15, c = 2 * Math.PI * r, p = Math.min(1, goal ? value / goal : 0)
  return <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
    <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="4" />
    <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${c * p} ${c}`} transform="rotate(-90 18 18)" />
  </svg>
}
