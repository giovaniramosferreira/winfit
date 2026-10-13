import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'
import BodyPlate from '../components/BodyPlate'
import { ANATOMY } from '../data/anatomy'
import { byId, EXERCISES } from '../data/exercises'

const chapters = [
  ['Um plano escrito para você', 'Objetivo, nível, equipamento, tempo e limitações viram decisão de treino. O app explica o porquê de cada escolha.', 'Nove perguntas · cerca de 2 minutos'],
  ['Um caderno que anota por você', 'Carga e repetições já vêm preenchidas. Confirmou a série, o descanso começa a contar sozinho.', 'Registro em 1 toque'],
  ['Uma carga que sobe com método', 'Fechou o teto de repetições em todas as séries? Na próxima sessão o app sugere aumentar o peso.', 'Dupla progressão automática'],
  ['Um atlas de cada movimento', 'Cada exercício é uma prancha: músculo trabalhado, origem, inserção, ação, passo a passo e erros comuns.', `${EXERCISES.length} pranchas · academia ou casa`],
]

export default function Landing() {
  const nav = useNavigate()
  const { configured, session } = useAuth()
  const supino = byId.get('supino-reto-barra') ?? EXERCISES.find((e) => e.primary === 'peito')!
  const peito = ANATOMY.peito

  return (
    <div className="landing fade-in">
      <header className="landing-nav">
        <div className="landing-wrap between">
          <span className="wordmark">Win<em>Fit</em></span>
          {session?.user ? (
            <span className="small muted">{session.user.email}</span>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => nav('/login')}>Entrar</button>
          )}
        </div>
      </header>

      <section className="landing-wrap landing-cover">
        <div>
          <span className="eyebrow accent">Treinador de bolso</span>
          <h1 className="landing-title">Seu treino, escrito para o <em>seu corpo.</em></h1>
          <p className="landing-lead">
            Plano de musculação sob medida, guiado série a série, com progressão de carga automática.
            Cada exercício explicado como num atlas de anatomia.
          </p>
          <div className="landing-ctas">
            <button className="btn btn-primary" onClick={() => nav('/onboarding')}>Montar meu treino</button>
            {!session && configured && (
              <button className="btn btn-ghost" onClick={() => nav('/login')}>Já tenho conta</button>
            )}
          </div>
          <p className="tiny faint" style={{ marginTop: 12 }}>
            Grátis. Sem cadastro para começar: seus dados ficam no seu aparelho.
          </p>
        </div>
        <figure className="plate-fig" style={{ maxWidth: 420, width: '100%', justifySelf: 'center' }}>
          <BodyPlate primary="peito" secondary={['ombro', 'triceps']} label="Prancha do corpo, vistas anterior e posterior, com o peitoral em destaque" />
          <figcaption><b>Fig. 1.</b> Supino reto: peitoral em destaque; deltoide e tríceps como apoio.</figcaption>
        </figure>
      </section>

      <div className="landing-wrap">
        <div className="landing-verdict">
          <p>Os apps de treino falam como painel de controle. O WinFit fala como um livro que você consulta na academia.</p>
          <dl>
            <div><dt>Pranchas de exercício</dt><dd className="num">{EXERCISES.length}</dd></div>
            <div><dt>Perguntas para o plano</dt><dd className="num">9</dd></div>
            <div><dt>Custo</dt><dd className="num">R$ 0</dd></div>
          </dl>
        </div>
      </div>

      <section className="landing-wrap landing-section">
        <div className="sheet-head"><span>Sumário</span><span>Quatro capítulos</span></div>
        <h2 className="landing-h2">O que um bom treinador faria, <em>por escrito.</em></h2>
        <ol className="numbered">
          {chapters.map(([t, s, k], i) => (
            <li key={t}>
              <span className="n num">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3>{t}</h3>
                <p>{s}</p>
                <small>{k}</small>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-wrap landing-section">
        <div className="sheet-head"><span>Amostra do atlas</span><span>Peito</span></div>
        <div className="plate-sample">
          <div>
            <span className="eyebrow">Peito · empurrar horizontal</span>
            <h2 className="landing-h2" style={{ marginTop: 8 }}>{supino.name}</h2>
            <p className="latin" style={{ fontSize: 18, marginTop: 4 }}>{peito.latin}</p>
            <div style={{ maxWidth: 260, marginTop: 16 }}>
              <BodyPlate primary="peito" secondary={supino.secondary} views="front" />
            </div>
          </div>
          <div>
            <dl className="defs">
              <dt>Origem</dt><dd>{peito.origin}</dd>
              <dt>Inserção</dt><dd>{peito.insertion}</dd>
              <dt>Ação</dt><dd>{peito.action}</dd>
            </dl>
            <div className="rule" style={{ margin: '18px 0' }} />
            <span className="eyebrow">Como executar</span>
            <ol className="steps-list" style={{ marginTop: 10 }}>
              {supino.instructions.map((s) => <li key={s}>{s}</li>)}
            </ol>
            {supino.mistakes[0] && (
              <div className="note" style={{ marginTop: 16 }}><b>Erro comum.</b> {supino.mistakes[0]}</div>
            )}
          </div>
        </div>
      </section>

      <section className="landing-wrap landing-section">
        <div className="sheet-head"><span>Comece hoje</span><span>Grátis</span></div>
        <h2 className="landing-h2">O primeiro treino fica pronto em dois minutos.</h2>
        <div className="landing-ctas">
          <button className="btn btn-primary" onClick={() => nav('/onboarding')}>Montar meu treino</button>
          {!session && (
            <button className="btn btn-ghost" onClick={() => nav('/login')}>Entrar na minha conta</button>
          )}
        </div>
      </section>

      <footer className="landing-wrap landing-footer tiny faint">
        <span>WinFit · treino com método</span>
        <span>Conteúdo anatômico educativo, baseado em anatomia descritiva clássica.</span>
      </footer>
    </div>
  )
}
