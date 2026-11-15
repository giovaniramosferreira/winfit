import { useEffect, useRef, useState } from 'react'
import { pelvicPrograms, phaseInstructions, phaseLabels } from '../data/pelvicPrograms'
import { usePelvicStore } from '../lib/pelvicStore'
import PageTop from '../components/PageTop'
import Switch from '../components/Switch'
import Icon from '../components/Icon'

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
  const available = pelvicPrograms.filter(p => p.available)
  const locked = pelvicPrograms.filter(p => !p.available)
  return <div className="page pelvic-page fade-in">
    <PageTop title="Saúde pélvica" tagline="Uma pausa curta para respirar." />
    {(s.error || notice) && <p className="note" role="alert">{s.error || notice}</p>}
    {s.active && timer && phase ? <section className="card pelvic-session" aria-labelledby="pelvic-phase">
      <p className="eyebrow">{pelvicPrograms.find(p => p.id === s.active!.programId)?.title}</p>
      <h2 id="pelvic-phase">{phaseLabels[phase.kind]}</h2>
      <p>{phaseInstructions[phase.kind]}</p>
      <p className="num" style={{ fontSize:56, fontWeight:600, textAlign:'center', margin:'16px 0', color:'#4f2f8f' }} aria-label={`${timer.remainingSeconds} segundos restantes`}>{timer.remainingSeconds}<span className="small"> s</span></p>
      <p className="small muted" role="status">{timer.status === 'paused' ? 'Pausado' : `Etapa ${timer.phaseIndex + 1} de ${timer.phases.length}`}</p>
      <button className="btn btn-primary" onClick={() => timer.status === 'paused' ? s.resume() : s.pause()}>{timer.status === 'paused' ? 'Retomar' : 'Pausar'}</button>
      <button className="btn btn-quiet" style={{ marginTop:6 }} onClick={() => s.stop()}>Interromper</button>
    </section> : <>
      {available.map(p => <section key={p.id} className="card pelvic-program pelvic-program-available">
        <h2>{p.title}</h2><p className="small muted">Respire no seu ritmo, sem prender o ar nem contrair.</p>
        <button className="btn btn-primary train-cta" onClick={() => s.start(p.id)}><Icon name="play" />Começar pausa · 70 s</button>
      </section>)}
      <section className="card" style={{ marginTop:12 }}>
        <Switch label="Som na troca de etapa" checked={s.audio} onChange={(v) => void enableAudio(v)} />
        <Switch label="Vibração" checked={s.vibration} onChange={(v) => { s.setSignals(s.audio, v); if (v && !navigator.vibrate) setNotice('Este navegador não vibra. Acompanhe pelo contador.') }} />
      </section>
      <details className="card more-card" style={{ marginTop:12 }} open={s.history.length === 0}>
        <summary>Antes de começar</summary>
        <ul className="bullets small" style={{ marginTop:4 }}>
          <li>Não prenda a respiração nem empurre para baixo.</li>
          <li>Não treine interrompendo o xixi.</li>
          <li>Dor pélvica ou sintomas urinários pedem avaliação profissional.</li>
        </ul>
        <p className="small muted" style={{ marginTop:8 }}>É uma pausa de bem-estar, não um tratamento.</p>
      </details>
      {locked.map(p => <div key={p.id} className="hub-row" style={{ opacity:.85 }}>
        <span className="hub-row-icon"><Icon name="breath" /></span>
        <span className="hub-row-copy"><b>{p.title.replace(' · em revisão', '')}</b><small>Em breve, após revisão profissional</small></span>
      </div>)}
    </>}
    {s.history.length > 0 && <section className="card" style={{ marginTop:12 }}>
      <h2>Histórico</h2>
      {s.history.slice(0,50).map(r => <div className="list-item" key={r.id}><div className="grow"><b>{r.status === 'completed' ? 'Concluída' : 'Interrompida'}</b><p className="small muted">{new Date(r.startedAt).toLocaleString('pt-BR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p></div><span className="small num">{Math.floor(r.elapsedMs / 1000)} s</span></div>)}
    </section>}
    <details className="more"><summary>Fontes</summary><p><a href="https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/" target="_blank" rel="noreferrer">NHS: respiração confortável</a></p><p><a href="https://www.nhs.uk/conditions/urinary-incontinence/10-ways-to-stop-leaks/" target="_blank" rel="noreferrer">NHS: assoalho pélvico e respiração</a></p><p><a href="https://www.nhs.uk/symptoms/pelvic-pain/" target="_blank" rel="noreferrer">NHS: avaliação de dor pélvica</a></p></details>
  </div>
}
