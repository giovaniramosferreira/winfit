import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { greeting, sessionsThisWeek } from '../lib/helpers'
import { sessionModules } from '../data/sessionModules'
import HomeArtwork from '../components/HomeArtwork'

const moduleLabels = {
  gym: { title: 'Academia', caption: 'Seu plano de treino' },
  home: { title: 'Calistenia', caption: 'Movimente-se em casa' },
  pelvic: { title: 'Saúde pélvica', caption: 'Respiração disponível' },
  nutrition: { title: 'Alimentação', caption: 'Seu diário alimentar' },
}

export default function Home() {
  const nav = useNavigate()
  const active = useStore(s => s.activeSession)
  const sessions = useStore(s => s.sessions)
  const profile = useStore(s => s.profile)
  const plan = useStore(s => s.plan)
  const weekCount = sessionsThisWeek(sessions).length
  const weekGoal = profile && plan ? Math.min(profile.frequency, plan.days.length) : 0
  const resumeState = useStore(s => s.resumeOrExpireSession)
  const saveExpired = useStore(s => s.saveExpiredAsPartial)
  const [expired, setExpired] = useState(false)
  const resume = () => { if (resumeState() === 'expired') setExpired(true); else nav('/player') }

  return <main className={`home-hub${active ? ' home-hub-with-session' : ''}`}>
    <header className="home-heading">
      <div className="home-heading-top">
        <span className="home-greeting">{greeting()}<span className="home-greeting-dot" /></span>
        <span className="home-brand">Win<em>Fit</em></span>
      </div>
      <div className="home-welcome">
        <div><h1>Seu momento<br /> <em>de cuidar.</em></h1><p>Um passo de cada vez, no seu ritmo.</p></div>
        {weekGoal > 0 && <Link to="/progress" className="home-week" aria-label={`${weekCount} de ${weekGoal} treinos nesta semana. Ver progresso`}>
          <img src="/media/pump-house/award.svg" width="15.9994" height="20" alt="" />
          <strong>{weekCount}<small>/{weekGoal}</small></strong><span>nesta semana</span>
        </Link>}
      </div>
    </header>

    {active && <button className="home-resume" onClick={resume}>
      <span className="home-resume-play" aria-hidden="true"><img src="/media/pump-house/play.svg" width="12" height="12" alt="" /></span>
      <span className="home-resume-info"><strong>{active.dayLabel}</strong><span>{active.logs.length} séries registradas · {active.source === 'home' ? 'Calistenia' : 'Academia'}</span></span>
      <span className="home-resume-action">Retomar treino <span aria-hidden="true">↗</span></span>
    </button>}

    <div className="home-module-grid" aria-label="Módulos do Winfit">
      {sessionModules.map(module => {
        const label = moduleLabels[module.id]
        return <Link key={module.id} to={module.path} className={`home-module home-module-${module.id}`}>
          <HomeArtwork module={module.id} />
          {module.id === 'pelvic' && <span className="home-module-badge">Kegel em revisão</span>}
          <div className="home-module-copy">
            {module.id === 'gym' && <span className="home-kit-icon home-kit-dumbbell"><img src="/media/pump-house/dumbbell.svg" width="24.0285" height="14.028" alt="" /></span>}
            {module.id === 'pelvic' && <span className="home-kit-icon home-kit-heart"><img src="/media/pump-house/heart.svg" width="20" height="18.0035" alt="" /></span>}
            <div className="home-module-title"><h2>{label.title}</h2><span aria-hidden="true">↗</span></div>
            <p>{label.caption}</p>
          </div>
        </Link>
      })}
    </div>

    <nav className="home-shortcuts" aria-label="Sua rotina e acompanhamento">
      <Link to="/routine">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="3" /><path d="M8 3v4m8-4v4M4 11h16m-12 5 2 2 5-4" /></svg>
        <span><strong>Minha rotina</strong><span>Lembretes e checklist</span></span><span aria-hidden="true">›</span>
      </Link>
      <Link to="/assistant">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 0 1-8 8H5l-3 3V11a9 9 0 0 1 18 0ZM7 10h8m-8 4h5" /></svg>
        <span><strong>Assistente</strong><span>Adapte seu treino</span></span><span aria-hidden="true">›</span>
      </Link>
    </nav>

    {expired && active && <div className="modal-back"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="hub-expired">
      <h2 id="hub-expired">Treino inacabado</h2><p className="small muted">{active.dayLabel} tem {active.logs.length} séries registradas. Preserve o registro como treino parcial ou continue de onde parou.</p>
      <button className="btn btn-primary" onClick={() => { setExpired(false); nav('/player') }}>Continuar treino</button>
      <button className="btn btn-ghost" style={{ marginTop:10 }} onClick={() => { saveExpired(); setExpired(false) }}>Salvar como treino parcial</button>
      <button className="btn btn-quiet" onClick={() => setExpired(false)}>Voltar</button>
    </div></div>}
  </main>
}
