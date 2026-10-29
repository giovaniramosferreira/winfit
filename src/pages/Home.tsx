import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { homeSummary } from '../lib/homeSummary'
import { useAuth } from '../components/AuthProvider'
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
  const { session } = useAuth()
  const metadata = session?.user?.user_metadata
  const name = typeof metadata?.full_name === 'string' ? metadata.full_name : typeof metadata?.name === 'string' ? metadata.name : undefined
  const { message, weekCount, weekGoal } = homeSummary({ profile, plan, sessions, active, name })
  const resumeState = useStore(s => s.resumeOrExpireSession)
  const saveExpired = useStore(s => s.saveExpiredAsPartial)
  const [expired, setExpired] = useState(false)
  const resume = () => { if (resumeState() === 'expired') setExpired(true); else nav('/player') }

  return <main className={`home-hub${active ? ' home-hub-with-session' : ''}`}>
    <header className="home-heading">
      <div className="home-welcome">
        <div><h1>{message}</h1></div>
        {weekGoal > 0 && <Link to="/progress" className="home-week" aria-label={`${weekCount} de ${weekGoal} treinos nesta semana. Ver progresso`}>
          <img src="/media/pump-house/award.svg" width="15.9994" height="20" alt="" />
          <strong>{weekCount}<small>/{weekGoal}</small></strong><span>treinos na semana</span>
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



    {expired && active && <div className="modal-back"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="hub-expired">
      <h2 id="hub-expired">Treino inacabado</h2><p className="small muted">{active.dayLabel} tem {active.logs.length} séries registradas. Preserve o registro como treino parcial ou continue de onde parou.</p>
      <button className="btn btn-primary" onClick={() => { setExpired(false); nav('/player') }}>Continuar treino</button>
      <button className="btn btn-ghost" style={{ marginTop:10 }} onClick={() => { saveExpired(); setExpired(false) }}>Salvar como treino parcial</button>
      <button className="btn btn-quiet" onClick={() => setExpired(false)}>Voltar</button>
    </div></div>}
  </main>
}
