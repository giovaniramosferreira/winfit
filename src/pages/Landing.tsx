import { Link } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'
import { useStore } from '../lib/store'
import GoogleSignInButton, { GoogleMark } from '../components/GoogleSignInButton'
import LandingPreview from '../components/LandingPreview'
import { EXERCISES } from '../data/exercises'
import './landing.css'

const modules = [
  { number: '01', title: 'Academia', detail: 'Menos dúvida entre uma série e outra.', text: 'Um plano para seu objetivo, com exercícios explicados, registro de séries e evolução de cargas.', label: 'Plano personalizado', symbol: 'gym' },
  { number: '02', title: 'Calistenia', detail: 'Seu corpo. Seu espaço. Seu treino.', text: 'Treinos em casa com o peso do corpo, sem depender de equipamentos ou apoios improvisados.', label: 'Para treinar em casa', symbol: 'home' },
  { number: '03', title: 'Alimentação', detail: 'Conheça melhor o seu dia a dia.', text: 'Registre suas refeições e acompanhe o total diário e as metas que você definir.', label: 'Diário manual', symbol: 'food' },
  { number: '04', title: 'Saúde pélvica', detail: 'Um tempo para respirar e perceber.', text: 'Faça uma pausa com respiração guiada. Os exercícios de contração Kegel seguem em revisão profissional.', label: 'Respiração disponível', symbol: 'breath' },
] as const

function ModuleSymbol({ kind }: { kind: string }) {
  return <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'gym' ? <><path d="m6 6 12 12M4 9l5-5M15 20l5-5M2 7l5-5M17 22l5-5M5 10l5-5M14 19l5-5" /></> : kind === 'home' ? <><path d="m3 10 9-7 9 7M5 9v12h14V9M10 21v-7h4v7" /></> : kind === 'food' ? <><path d="M5 3v6a3 3 0 0 0 6 0V3M8 3v18M19 3c-3 3-4 7-4 10h4M19 3v18" /></> : <><path d="M4 8c4-5 12-5 16 0M6 12c3-4 9-4 12 0M9 16c2-2 4-2 6 0" /><circle cx="12" cy="20" r="1" /></>}
  </svg>
}

export default function Landing() {
  const { session } = useAuth()
  const onboarded = useStore(s => s.profile !== null && s.plan !== null)
  const start = onboarded ? '/home' : '/onboarding'
  return <div className="landing welcome">
    <header className="landing-nav">
      <nav className="landing-wrap between" aria-label="Navegação principal">
        <Link to="/" className="wordmark" aria-label="WinFit início">Win<em>Fit</em><span className="brand-dot" /></Link>
        <div className="welcome-nav-links"><button className="welcome-how-link" onClick={e => { e.preventDefault(); document.getElementById('como-funciona')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }) }}>Como funciona</button><Link to={session?.user ? start : '/login'} className="welcome-nav-login">{!session?.user && <GoogleMark />}{session?.user ? 'Abrir meu app' : 'Entrar'}<span aria-hidden="true">↗</span></Link></div>
      </nav>
    </header>
    <main id="conteudo">
      <section className="landing-wrap welcome-hero" aria-labelledby="welcome-title">
        <div className="welcome-copy">
          <div className="welcome-eyebrow"><span />BEM-ESTAR QUE CABE NA SUA ROTINA</div>
          <h1 id="welcome-title">Um pouco por dia.<br /><em>Mais você.</em></h1>
          <p className="welcome-lead">Seu treino, sua alimentação e suas pausas. Um espaço para cuidar de você, no seu ritmo.</p>
          <div className="welcome-actions">
            {session?.user ? <Link className="btn btn-primary" to={start}>Continuar no WinFit <span aria-hidden="true">↗</span></Link> : <GoogleSignInButton />}
            <Link className="btn welcome-try" to={start}>Experimentar sem conta <span aria-hidden="true">→</span></Link>
          </div>
          <p className="welcome-no-account">Sem cadastro para começar.<br />Seus registros ficam neste aparelho.</p>
          <div className="welcome-proof"><span className="welcome-proof-mark" aria-hidden="true">✓</span><p>Na academia ou em casa.<br /><strong>O próximo passo pode ser pequeno.</strong></p></div>
        </div>
        <LandingPreview />
      </section>
      <div className="welcome-band"><div className="landing-wrap"><span>FEITO PARA A VIDA REAL</span><p>Treine com direção.</p><span aria-hidden="true">✳</span><p>Registre sua rotina.</p><span aria-hidden="true">✳</span><p>Respeite seu ritmo.</p></div></div>
      <section className="landing-wrap welcome-section" aria-labelledby="modules-title">
        <div className="welcome-section-heading"><div><p className="welcome-kicker">UM APP, DIFERENTES FORMAS DE CUIDAR</p><h2 id="modules-title">O que faz bem.<br /><em>Mais perto de você.</em></h2></div><p>Não precisa mudar tudo de uma vez.<br />Escolha por onde quer começar.</p></div>
        <div className="welcome-modules">{modules.map(module => <article key={module.number} className="welcome-module"><div className="welcome-module-top"><span className="welcome-module-symbol"><ModuleSymbol kind={module.symbol} /></span><span className="num">{module.number}</span></div><h3>{module.title}</h3><p className="welcome-module-detail">{module.detail}</p><p>{module.text}</p><span className="welcome-module-label">{module.label}</span></article>)}</div>
      </section>
      <section id="como-funciona" className="welcome-how" aria-labelledby="how-title"><div className="landing-wrap welcome-how-grid"><div><p className="welcome-kicker">DO SEU JEITO, DESDE O COMEÇO</p><h2 id="how-title">Um plano.<br />Um passo.<br /><em>Um dia de cada vez.</em></h2><p className="welcome-how-intro">Você traz sua rotina.<br />O WinFit ajuda a dar direção.</p><Link className="welcome-text-link" to={start}>Experimentar sem conta <span aria-hidden="true">↗</span></Link></div><ol className="welcome-steps"><li><span>01</span><div><h3>Conte um pouco sobre você</h3><p>Objetivo, experiência, tempo e equipamentos. Nove perguntas ajudam a montar seu plano de treino.</p></div></li><li><span>02</span><div><h3>Abra o treino e siga seu ritmo</h3><p>Veja cada movimento, registre as séries e acompanhe o descanso. São {EXERCISES.length} exercícios ilustrados para consultar.</p></div></li><li><span>03</span><div><h3>Perceba o caminho que já fez</h3><p>Consulte seus treinos e sua evolução. Registre refeições e organize a rotina conforme fizer sentido para você.</p></div></li></ol></div></section>
      <section className="landing-wrap welcome-section welcome-faq" aria-labelledby="faq-title"><div><p className="welcome-kicker">ANTES DO PRIMEIRO PASSO</p><h2 id="faq-title">Pode perguntar.</h2></div><div className="welcome-faq-list"><details><summary>Preciso criar uma conta para usar?</summary><p>Não. Toque em “Experimentar sem conta” e monte seu plano. Os registros ficam no navegador deste aparelho. Ao limpar os dados do navegador, você pode perder esses registros; use a exportação no Perfil para guardar uma cópia.</p></details><details><summary>Posso treinar em casa?</summary><p>Sim. A Calistenia oferece treinos com o peso do corpo, e seu plano considera o local e os equipamentos que você informar.</p></details><details><summary>O que já posso usar?</summary><p>Academia, calistenia, diário alimentar manual e respiração guiada estão disponíveis. Contrações Kegel estão em revisão profissional; análise de refeições por foto e IA ainda não estão disponíveis.</p></details><details><summary>Como vai funcionar o login com Google?</summary><p>Você poderá usar sua conta Google quando essa opção estiver disponível. Por enquanto, experimente sem conta. Entrar não autoriza o envio automático dos seus registros; o backup tem uma confirmação própria.</p></details></div></section>
      <section className="landing-wrap"><div className="welcome-closing"><p className="welcome-kicker">COMECE PELO QUE É POSSÍVEL HOJE</p><h2>Seu ritmo já é<br /><em>um bom começo.</em></h2><div className="welcome-actions">{session?.user ? <Link className="btn btn-primary" to={start}>Abrir meu app</Link> : <GoogleSignInButton />}<Link className="btn welcome-try" to={start}>Experimentar sem conta <span aria-hidden="true">→</span></Link></div></div></section>
    </main>
    <footer className="landing-wrap welcome-footer"><Link to="/" className="wordmark">Win<em>Fit</em></Link><p>Um pouco de cuidado, todos os dias.</p><p className="welcome-footer-note">Conteúdo educativo. Respeite seus limites e busque orientação profissional quando precisar.</p></footer>
  </div>
}
