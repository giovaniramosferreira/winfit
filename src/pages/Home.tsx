import { lazy, Suspense, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { greeting } from '../lib/helpers'
import { sessionModules } from '../data/sessionModules'
const InstallCard = lazy(() => import('../components/InstallCard'))
export default function Home() {
  const nav = useNavigate()
  const active = useStore(s => s.activeSession)
  const resumeState = useStore(s => s.resumeOrExpireSession)
  const saveExpired = useStore(s => s.saveExpiredAsPartial)
  const [expired, setExpired] = useState(false)
  const resume = () => { if (resumeState() === 'expired') setExpired(true); else nav('/player') }
  return <div className="page">
    <div className="sheet-head"><span>{greeting()}</span><span className="tiny muted">Seu espaço de bem-estar</span></div>
    <h1>Como vamos cuidar de você hoje?</h1>
    {active && <section className="hero-card" style={{ marginTop:18 }}>
      <div className="eyebrow accent">{active.source === 'home' ? 'Calistenia em andamento' : 'Academia em andamento'}</div>
      <h2>{active.dayLabel}</h2><p className="small muted">{active.logs.length} séries registradas. Continue de onde parou.</p>
      <button className="btn btn-primary" onClick={resume}>Retomar treino</button>
    </section>}
    <div aria-label="Módulos do Winfit">
      {sessionModules.map(module => <Link key={module.id} to={module.path} className="card" style={{ display:'block', marginTop:16, color:'inherit', textDecoration:'none' }}>
        <div className="between"><h2>{module.title}</h2><span className="chev" aria-hidden="true">›</span></div>
        <p className="small muted" style={{ marginTop:6 }}>{module.description}</p>
        <p className="tiny accent" style={{ marginTop:10 }}>{module.status}</p>
      </Link>)}
    </div>
    <section className="card" style={{ marginTop:18 }}><h2>No seu ritmo</h2>
      <Link className="list-item" to="/routine"><span className="grow">Rotina e lembretes</span><span className="chev">›</span></Link>
      <Link className="list-item" to="/assistant"><span className="grow">Assistente e check-ins</span><span className="chev">›</span></Link>
    </section>
    <div style={{ marginTop:12 }}><Suspense fallback={null}><InstallCard /></Suspense></div>
    {expired && active && <div className="modal-back"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="hub-expired">
      <h2 id="hub-expired">Treino inacabado</h2><p className="small muted">{active.dayLabel} tem {active.logs.length} séries registradas. Preserve o registro como treino parcial ou continue de onde parou.</p>
      <button className="btn btn-primary" onClick={() => { setExpired(false); nav('/player') }}>Continuar treino</button>
      <button className="btn btn-ghost" style={{ marginTop:10 }} onClick={() => { saveExpired(); setExpired(false) }}>Salvar como treino parcial</button>
      <button className="btn btn-quiet" onClick={() => setExpired(false)}>Voltar</button>
    </div></div>}
  </div>
}
