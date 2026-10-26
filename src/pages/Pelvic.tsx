import { useEffect, useRef, useState } from 'react'
import { pelvicPrograms, phaseInstructions, phaseLabels } from '../data/pelvicPrograms'
import { usePelvicStore } from '../lib/pelvicStore'

export default function Pelvic() {
  const s = usePelvicStore()
  const [notice, setNotice] = useState('')
  const previous = useRef<string | null>(null)
  const audioContext = useRef<AudioContext | null>(null)
  useEffect(() => {
    const interval = window.setInterval(() => { if (!document.hidden) usePelvicStore.getState().tick() }, 1000)
    const pause = () => usePelvicStore.getState().pause()
    const visibility = () => { if (document.hidden) pause() }
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('pagehide', pause)
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', pause); pause(); void audioContext.current?.close() }
  }, [])
  const timer = s.active?.timer
  const phase = timer?.phases[timer.phaseIndex]
  const key = timer ? `${timer.id}-${timer.phaseIndex}` : null
  useEffect(() => {
    if (previous.current && key !== previous.current) {
      if (s.vibration && navigator.vibrate) navigator.vibrate(80)
      const ctx = audioContext.current
      if (s.audio && ctx?.state === 'running') {
        const oscillator = ctx.createOscillator(); const gain = ctx.createGain()
        oscillator.connect(gain); gain.connect(ctx.destination); gain.gain.value = 0.05
        oscillator.frequency.value = 440; oscillator.start(); oscillator.stop(ctx.currentTime + 0.12)
      }
    }
    previous.current = key
  }, [key, s.audio, s.vibration])
  const enableAudio = async (enabled: boolean) => {
    s.setSignals(enabled,s.vibration)
    if (enabled) {
      try { audioContext.current ??= new AudioContext(); await audioContext.current.resume() }
      catch { s.setSignals(false,s.vibration); setNotice('Áudio indisponível neste navegador. As instruções continuam na tela.') }
    }
  }
  return <div className="page">
    <div className="eyebrow accent">Bem-estar · histórico separado</div>
    <h1>Saúde pélvica</h1>
    <p className="small muted">Conheça a proposta e faça uma pausa para respirar. Não substitui avaliação individual de saúde.</p>
    <section className="note" style={{ marginTop:16 }}>
      <b>Antes de começar</b>
      <p className="small">Não prenda a respiração, não empurre para baixo e não treine interrompendo o xixi. Pare se sentir dor ou desconforto. Dor pélvica ou sintomas urinários merecem avaliação profissional; contrações não são indicadas para todas as pessoas.</p>
      <p className="small">Não prometemos melhora sexual ou tratamento de sintomas. A pausa disponível é apenas respiração confortável, sem contrações.</p>
    </section>
    {(s.error || notice) && <p className="note" role="alert">{s.error || notice}</p>}
    {s.active && timer && phase ? <section className="card" style={{ marginTop:18 }} aria-labelledby="pelvic-phase">
      <p className="eyebrow">{pelvicPrograms.find(p => p.id === s.active!.programId)?.title}</p>
      <h2 id="pelvic-phase">{phaseLabels[phase.kind]}</h2>
      <p>{phaseInstructions[phase.kind]}</p>
      <p className="num" style={{ fontSize:48, textAlign:'center', margin:'16px 0' }} aria-label={`${timer.remainingSeconds} segundos restantes`}>{timer.remainingSeconds}<span className="small"> segundos</span></p>
      <p className="small muted" role="status">{timer.status === 'paused' ? 'Pausado. Retome quando estiver pronto.' : `Etapa ${timer.phaseIndex + 1} de ${timer.phases.length}`}</p>
      <button className="btn btn-primary" onClick={() => timer.status === 'paused' ? s.resume() : s.pause()}>{timer.status === 'paused' ? 'Retomar' : 'Pausar'}</button>
      <button className="btn btn-ghost" style={{ marginTop:10 }} onClick={() => s.stop()}>Interromper sessão</button>
      <p className="tiny muted">Ao sair desta tela ou colocar o app em segundo plano, a sessão pausa. Sessões interrompidas não contam como concluídas.</p>
    </section> : pelvicPrograms.map(p => <section key={p.id} className="card" style={{ marginTop:18 }}>
      <div className="eyebrow">{p.kind === 'relaxation' ? 'Relaxamento sem contração' : 'Prévia · indisponível'}</div>
      <h2>{p.title}</h2><p className="small muted">{p.description}</p>
      {p.available ? <button className="btn btn-primary" style={{ marginTop:12 }} onClick={() => s.start(p.id)}>Começar pausa · 70 segundos</button> : <><button className="btn btn-ghost" style={{ marginTop:12 }} disabled>Aguardando revisão profissional</button><p className="tiny muted">A prévia não contém prescrição de tempo, intensidade ou progressão. A liberação exige revisão registrada por profissional.</p></>}
      <p className="tiny muted">Conteúdo versão {p.version} · {p.reviewStatus === 'general-wellbeing' ? 'Bem-estar geral; sem protocolo clínico' : 'Revisão profissional pendente'}</p>
    </section>)}
    <section className="card" style={{ marginTop:18 }}>
      <h2>Sinais opcionais</h2>
      <label style={{ display:'block', padding:'12px 0' }}><input type="checkbox" checked={s.audio} onChange={e => void enableAudio(e.target.checked)} /> Som na mudança de etapa</label>
      <label style={{ display:'block', padding:'12px 0' }}><input type="checkbox" checked={s.vibration} onChange={e => { s.setSignals(s.audio,e.target.checked); if (e.target.checked && !navigator.vibrate) setNotice('Este navegador não oferece vibração. Use o texto e o contador na tela.') }} /> Vibração na mudança de etapa</label>
      <p className="tiny muted">Desligados por padrão. Som pode precisar ser reativado após recarregar. Sem animação obrigatória; texto e segundos ficam sempre visíveis.</p>
    </section>
    <section className="card" style={{ marginTop:18 }}>
      <h2>Histórico pélvico</h2>
      <p className="small muted">Independente dos treinos de academia e calistenia. Não altera sua meta semanal.</p>
      {s.history.length === 0 ? <p className="small muted">Nenhuma sessão registrada.</p> : s.history.slice(0,50).map(r => <div className="list-item" key={r.id}><div className="grow"><b>{r.status === 'completed' ? 'Concluída' : 'Interrompida'}</b><p className="tiny muted">{pelvicPrograms.find(p => p.id === r.programId)?.title} · v{r.programVersion} · {new Date(r.startedAt).toLocaleString('pt-BR')}</p></div><span className="small num">{Math.floor(r.elapsedMs / 1000)} s</span></div>)}
    </section>
    <details className="card" style={{ marginTop:18 }}><summary>Fontes e limites</summary><p className="small">Texto próprio baseado em orientações públicas. Essas referências não significam aprovação do Winfit ou revisão profissional do conteúdo.</p><p><a href="https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/" target="_blank" rel="noreferrer">NHS: respiração confortável</a></p><p><a href="https://www.nhs.uk/conditions/urinary-incontinence/10-ways-to-stop-leaks/" target="_blank" rel="noreferrer">NHS: assoalho pélvico e respiração</a></p><p><a href="https://www.nhs.uk/symptoms/pelvic-pain/" target="_blank" rel="noreferrer">NHS: avaliação de dor pélvica</a></p></details>
  </div>
}
