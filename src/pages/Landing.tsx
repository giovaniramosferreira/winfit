import { Link } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'
import { useStore } from '../lib/store'
import GoogleSignInButton, { GoogleMark } from '../components/GoogleSignInButton'
import LandingPreview from '../components/LandingPreview'
import { EXERCISES } from '../data/exercises'
import './landing.css'

const modules = [
  { number: '01', title: 'Academia', detail: 'Plano para seu objetivo, séries registradas e cargas que evoluem.', symbol: 'gym' },
  { number: '02', title: 'Calistenia', detail: 'Treinos em casa com o peso do corpo, incluindo um circuito de 10 minutos.', symbol: 'home' },
  { number: '03', title: 'Alimentação', detail: 'Diário de refeições com total do dia e sua meta.', symbol: 'food' },
  { number: '04', title: 'Pausas', detail: 'Um minuto de respiração guiada para recomeçar.', symbol: 'breath' },
] as const

function ModuleSymbol({ kind }: { kind: string }) {
  return <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'gym' ? <><path d="m6 6 12 12M4 9l5-5M15 20l5-5M2 7l5-5M17 22l5-5M5 10l5-5M14 19l5-5" /></> : kind === 'home' ? <><path d="m3 10 9-7 9 7M5 9v12h14V9M10 21v-7h4v7" /></> : kind === 'food' ? <><path d="M5 3v6a3 3 0 0 0 6 0V3M8 3v18M19 3c-3 3-4 7-4 10h4M19 3v18" /></> : <><path d="M4 8c4-5 12-5 16 0M6 12c3-4 9-4 12 0M9 16c2-2 4-2 6 0" /><circle cx="12" cy="20" r="1" /></>}
  </svg>
}

export default function Landing() {
  const { session, configured } = useAuth()
  const onboarded = useStore(s => s.profile !== null && s.plan !== null)
  const start = onboarded ? '/home' : '/onboarding'
  return <div className="landing welcome">
    <header className="landing-nav">
      <nav className="landing-wrap between" aria-label="Navegação principal">
        <Link to="/" className="wordmark" aria-label="WinFit início">Win<em>Fit</em><span className="brand-dot" /></Link>
        <div className="welcome-nav-links"><button className="welcome-how-link" onClick={e => { e.preventDefault(); document.getElementById('como-funciona')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }) }}>Como funciona</button>{(session?.user || configured) && <Link to={session?.user ? start : '/login'} className="welcome-nav-login">{!session?.user && <GoogleMark />}{session?.user ? 'Abrir meu app' : 'Entrar'}<span aria-hidden="true">↗</span></Link>}</div>
      </nav>
    </header>
    <main id="conteudo">
      <section className="landing-wrap welcome-hero" aria-labelledby="welcome-title">
        <div className="welcome-copy">
          <h1 id="welcome-title">Um pouco por dia.<br /><em>Mais você.</em></h1>
          <p className="welcome-lead">Treino na academia ou em casa, alimentação e pausas. No seu ritmo.</p>
          <div className="welcome-actions">
            <Link className="btn btn-primary" to={start}>{session?.user || onboarded ? 'Abrir meu app' : 'Começar grátis'} <span aria-hidden="true">→</span></Link>
            {!session?.user && <GoogleSignInButton />}
          </div>
          <p className="welcome-no-account">Sem cadastro. Seus dados ficam no seu aparelho.</p>
        </div>
        <LandingPreview />
      </section>
      <section className="landing-wrap welcome-section" aria-labelledby="modules-title">
        <div className="welcome-section-heading"><div><h2 id="modules-title">Tudo em <em>um app.</em></h2></div></div>
        <div className="welcome-modules">{modules.map(module => <article key={module.number} className="welcome-module"><div className="welcome-module-top"><span className="welcome-module-symbol"><ModuleSymbol kind={module.symbol} /></span></div><h3>{module.title}</h3><p className="welcome-module-detail">{module.detail}</p></article>)}</div>
      </section>
      <section id="como-funciona" className="welcome-how" aria-labelledby="how-title"><div className="landing-wrap welcome-how-grid"><div><h2 id="how-title">Comece em <em>2 minutos.</em></h2></div><ol className="welcome-steps"><li><span>01</span><div><h3>Responda 9 perguntas</h3><p>Objetivo, tempo e equipamento.</p></div></li><li><span>02</span><div><h3>Treine com o app</h3><p>{EXERCISES.length} exercícios ilustrados, séries e descanso.</p></div></li><li><span>03</span><div><h3>Veja sua evolução</h3><p>Frequência, cargas e recordes.</p></div></li></ol></div></section>
      <section className="landing-wrap"><div className="welcome-closing"><h2>Seu ritmo já é<br /><em>um bom começo.</em></h2><div className="welcome-actions"><Link className="btn btn-primary" to={start}>{session?.user || onboarded ? 'Abrir meu app' : 'Começar grátis'} <span aria-hidden="true">→</span></Link></div></div></section>
    </main>
    <footer className="landing-wrap welcome-footer"><Link to="/" className="wordmark">Win<em>Fit</em></Link><p>Um pouco de cuidado, todos os dias.</p><p className="welcome-footer-note">Conteúdo educativo. Não substitui orientação profissional.</p></footer>
  </div>
}
