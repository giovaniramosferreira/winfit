import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { cardioCoreCircuit as program, LEVEL_ORDER } from '../data/circuits'
import { useCircuitStore } from '../lib/circuitStore'
import { useStore } from '../lib/store'
import CircuitDemo from '../components/CircuitDemo'
import { buildPhases, fmtDuration, positionAt, resolveMove, suggestProgression, totalSeconds, workSeconds, type CircuitPhaseKind, type ModifyReason } from '../lib/circuit'

const KIND_LABEL: Record<CircuitPhaseKind, string> = {
  prepare: 'Prepare-se', warmup: 'Aquecimento', work: 'Trabalho', rest: 'Descanso', round_rest: 'Descanso entre voltas', cooldown: 'Desaquecimento',
}
const REASON_LABEL: Record<ModifyReason, string> = { level: 'iniciante', impact: 'baixo impacto', limitation: 'adaptado às suas limitações' }
const LIMITATION_LABEL = { joelho: 'joelho', lombar: 'lombar', ombro: 'ombro', punho: 'punho' } as const

export default function Circuit() {
  const s = useCircuitStore()
  const limitations = useStore((st) => st.profile?.limitations ?? [])
  const [notice, setNotice] = useState('')
  const [finishedId, setFinishedId] = useState<string | null>(null)
  const audio = useRef<AudioContext | null>(null)
  const lastSignal = useRef<string | null>(null)
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null)

  // Tick a cada 250 ms; pausa ao sair da tela ou ir para segundo plano.
  useEffect(() => {
    const interval = window.setInterval(() => { if (!document.hidden) useCircuitStore.getState().tick() }, 250)
    const pause = () => useCircuitStore.getState().pause()
    const visibility = () => { if (document.hidden) pause() }
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('pagehide', pause)
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', pause); pause(); void audio.current?.close(); void wakeLock.current?.release() }
  }, [])

  const active = s.active
  const activePhases = useMemo(() => active ? buildPhases(program, active.settings, active.limitations) : [], [active?.timer.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const pos = active ? positionAt(activePhases, active.timer.elapsedMs) : null
  const phase = pos ? activePhases[pos.index] : undefined
  const running = active?.timer.status === 'running'

  // Mantém a tela acesa durante o circuito, quando o navegador permite.
  useEffect(() => {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
    if (running && nav.wakeLock && !wakeLock.current) nav.wakeLock.request('screen').then((l) => { wakeLock.current = l }).catch(() => {})
    if (!running && wakeLock.current) { void wakeLock.current.release().catch(() => {}); wakeLock.current = null }
  }, [running])

  // Som e vibração: contagem nos 3 últimos segundos e sinal na troca de fase.
  const signalKey = active && pos ? `${active.timer.id}:${pos.index}:${pos.remainingSec <= 3 ? pos.remainingSec : 'x'}` : null
  useEffect(() => {
    if (!signalKey || !phase || !pos || !running) { lastSignal.current = signalKey; return }
    const prev = lastSignal.current
    lastSignal.current = signalKey
    if (!prev || prev === signalKey) return
    const changed = prev.split(':')[1] !== String(pos.index)
    const countdown = !changed && pos.remainingSec <= 3 && pos.remainingSec > 0 && ['work', 'rest', 'prepare', 'round_rest'].includes(phase.kind)
    if (!changed && !countdown) return
    if (s.vibration && navigator.vibrate) navigator.vibrate(changed ? (phase.kind === 'work' ? [120, 60, 120] : 200) : 40)
    const ctx = audio.current
    if (s.audio && ctx?.state === 'running') {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination); g.gain.value = 0.06
      o.frequency.value = changed ? (phase.kind === 'work' ? 880 : 520) : 660
      o.start(); o.stop(ctx.currentTime + (changed ? 0.35 : 0.1))
    }
  }, [signalKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const prevActiveId = useRef<string | null>(null)
  useEffect(() => {
    const id = active?.timer.id ?? null
    if (prevActiveId.current && !id && s.history[0]?.id === prevActiveId.current) setFinishedId(prevActiveId.current)
    prevActiveId.current = id
  }, [active?.timer.id, s.history])

  const unlockAudio = async () => {
    if (!s.audio) return
    try { audio.current ??= new AudioContext(); await audio.current.resume() }
    catch { setNotice('Som indisponível neste navegador. O contador e a vibração continuam funcionando.') }
  }
  const start = async () => {
    await unlockAudio()
    setFinishedId(null)
    if (!s.start(program.id, limitations)) setNotice('Não foi possível iniciar o circuito.')
  }

  const setup = s.settings
  const setupPhases = useMemo(() => buildPhases(program, setup, limitations), [setup, limitations])
  const suggestion = useMemo(() => suggestProgression(program, s.history, setup), [s.history, setup])
  const finished = finishedId ? s.history.find((r) => r.id === finishedId) : undefined

  return <div className="page training-page circuit-page fade-in">
    {active ? <h1 className="sr-only">{program.title}</h1> : <header className="training-heading"><div>
      <span className="screen-kicker">Calistenia · circuito por tempo</span>
      <h1 className="screen-title">{program.title}</h1>
      <p className="small muted">{program.description}</p>
    </div></header>}
    {(s.error || notice) && <p className="note" role="alert">{s.error || notice}</p>}

    {active && phase && pos ? <section className={`card training-session circuit-live circuit-${phase.kind}`} aria-labelledby="circuit-phase">
      <div className="between"><span className="eyebrow accent">{KIND_LABEL[phase.kind]}</span>
        {phase.round > 0 && <span className="tiny muted num">Volta {phase.round} de {active.settings.rounds}</span>}</div>
      <h2 id="circuit-phase">{phase.name}{phase.kind === 'work' && phase.modified && <span className="pill accent circuit-pill">versão modificada</span>}</h2>
      <p className="circuit-clock num" aria-live="off" aria-label={`${pos.remainingSec} segundos restantes`}>{pos.remainingSec}<span className="small"> s</span></p>
      {phase.moveId && <CircuitDemo key={pos.index} moveId={phase.moveId} modified={!!phase.modified} name={phase.kind === 'work' ? phase.name : phase.how} autoPlay compact />}
      <p className="small">{phase.how}</p>
      {phase.kind === 'work' && phase.moveId && <p className="tiny muted" style={{ marginTop: 6 }}>{program.moves.find((m) => m.id === phase.moveId)?.watch}</p>}
      {phase.kind === 'work' && (() => { const next = activePhases.slice(pos.index + 1).find((p) => p.kind === 'work'); return next ? <p className="tiny muted" style={{ marginTop: 6 }}>Depois: {next.name}</p> : null })()}
      <div className="progressbar circuit-progress" role="progressbar" aria-label="Progresso do circuito" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(active.timer.elapsedMs / active.timer.totalMs * 100)}>
        <div style={{ width: `${active.timer.elapsedMs / active.timer.totalMs * 100}%` }} /></div>
      <p className="small muted" role="status">{active.timer.status === 'paused' ? 'Pausado. Retome quando estiver pronto.' : `Faltam ${fmtDuration(Math.ceil((active.timer.totalMs - active.timer.elapsedMs) / 1000))}`}</p>
      <button className="btn btn-primary" onClick={() => { if (active.timer.status === 'paused') { void unlockAudio(); s.resume() } else s.pause() }}>{active.timer.status === 'paused' ? 'Retomar' : 'Pausar'}</button>
      <div className="circuit-actions">
        <button className="btn btn-ghost" onClick={() => s.skip()}>Pular etapa</button>
        <button className="btn btn-ghost" onClick={() => { if (confirm('Encerrar o circuito agora? O tempo feito fica registrado como sessão interrompida.')) s.stop() }}>Encerrar</button>
      </div>
      <p className="tiny muted">Sentiu dor, tontura ou falta de ar fora do normal? Pare. Ao sair desta tela o circuito pausa.</p>
    </section> : s.healthAckAt === null ? <section className="card training-session" aria-labelledby="circuit-health">
      <h2 id="circuit-health">Antes do primeiro circuito</h2>
      <p className="small" style={{ marginTop: 8 }}>Este circuito tem saltos e exercícios intensos de abdômen. Consulte um médico antes de começar se você tem condição cardíaca, pressão alta sem controle, lesão recente, dor nas costas ou nas articulações, ou se está gestante ou no pós-parto.</p>
      <p className="small" style={{ marginTop: 8 }}>Pare se sentir dor, tontura, dor no peito ou falta de ar fora do normal. O app orienta, mas não substitui avaliação profissional.</p>
      <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => s.acknowledgeHealth()}>Li e entendi</button>
    </section> : <>
      {finished && <section className="note" role="status" style={{ marginBottom: 12 }}>
        <b>{finished.status === 'completed' ? 'Circuito concluído.' : 'Circuito encerrado.'}</b>{' '}
        {fmtDuration(Math.round(finished.workMs / 1000))} de trabalho em {finished.rounds} {finished.rounds === 1 ? 'volta' : 'voltas'}. Registrado no histórico do circuito.
      </section>}
      {suggestion && <section className="note olive" style={{ marginBottom: 12 }}>
        <b>Hora de progredir.</b> {suggestion.text}
        <button className="btn btn-sm btn-ghost" style={{ display: 'block', marginTop: 10 }} onClick={() => s.setSettings(suggestion.settings)}>Aplicar sugestão</button>
      </section>}
      <section className="card training-session">
        <div className="kpis"><div><b className="num">{fmtDuration(totalSeconds(setupPhases))}</b><span>duração total</span></div>
          <div><b className="num">{fmtDuration(workSeconds(setupPhases))}</b><span>de trabalho</span></div></div>
        <h2 style={{ marginTop: 16, fontSize: 18 }}>Nível</h2>
        {LEVEL_ORDER.map((level) => <button key={level} className={`option${setup.level === level ? ' selected' : ''}`} aria-pressed={setup.level === level} onClick={() => s.setSettings({ level })}>
          <div><div>{program.levels[level].label}</div><div className="desc">{program.levels[level].description}</div></div></button>)}
        <h2 style={{ marginTop: 16, fontSize: 18 }}>Voltas</h2>
        <div className="circuit-rounds" role="group" aria-label="Número de voltas">{Array.from({ length: program.maxRounds }, (_, i) => i + 1).map((n) =>
          <button key={n} className={`btn btn-sm ${setup.rounds === n ? 'btn-primary' : 'btn-ghost'}`} aria-pressed={setup.rounds === n} onClick={() => s.setSettings({ rounds: n })}>{n}</button>)}</div>
        <p className="tiny muted">O circuito original pede 3 voltas. Entre voltas há {program.roundRestSec} s de descanso.</p>
        <label className="circuit-check"><input type="checkbox" checked={setup.lowImpact} onChange={(e) => s.setSettings({ lowImpact: e.target.checked })} /> Baixo impacto: sem saltos</label>
        <label className="circuit-check"><input type="checkbox" checked={setup.warmup} onChange={(e) => s.setSettings({ warmup: e.target.checked })} /> Aquecimento ({fmtDuration(program.warmup.length * 30)}) e desaquecimento ({fmtDuration(program.cooldown.length * 30)})</label>
        <label className="circuit-check"><input type="checkbox" checked={s.audio} onChange={(e) => s.setSignals(e.target.checked, s.vibration)} /> Som na troca e nos 3 últimos segundos</label>
        <label className="circuit-check"><input type="checkbox" checked={s.vibration} onChange={(e) => s.setSignals(s.audio, e.target.checked)} /> Vibração</label>
        {limitations.length > 0 && <p className="tiny muted">Seu perfil indica limitação em {limitations.map((l) => LIMITATION_LABEL[l]).join(', ')}. As estações que forçam essas regiões já usam a versão modificada.</p>}
        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => void start()}>Começar circuito</button>
      </section>

      <section className="card" style={{ marginTop: 12 }}>
        <h2>Estações</h2>
        <p className="tiny muted">Toque numa estação para ver a demonstração e as instruções.</p>
        <ol className="circuit-moves">{program.moves.map((m, i) => { const r = resolveMove(m, setup, limitations)
          return <li key={m.id}><details>
            <summary><span className="n num">{i + 1}</span><span className="t">{r.name}<small>{m.focus}</small>
              {r.modified && <span className="pill accent circuit-tag">{r.reasons.map((x) => REASON_LABEL[x]).join(' · ')}</span>}</span></summary>
            <CircuitDemo moveId={m.id} modified={r.modified} name={r.name} compact />
            <ol className="small">{r.how.map((h) => <li key={h}>{h}</li>)}</ol>
            <p className="tiny muted">{m.watch}</p>
            {r.modified ? <p className="tiny faint">Original: {m.name}.</p> : <p className="tiny faint">Versão mais fácil: {m.modified.name}.</p>}
          </details></li> })}</ol>
      </section>
    </>}

    <section className="card" style={{ marginTop: 12 }}>
      <h2>Histórico do circuito</h2>
      <p className="small muted">Separado dos treinos por séries. Não altera a meta semanal nem os recordes.</p>
      {s.history.length === 0 ? <p className="small muted">Nenhum circuito registrado.</p> : s.history.slice(0, 30).map((r) => <div className="list-item" key={r.id}><div className="grow">
        <b>{r.status === 'completed' ? 'Concluído' : 'Interrompido'} · {program.levels[r.settings.level].label}</b>
        <p className="tiny muted">{new Date(r.startedAt).toLocaleString('pt-BR')} · {r.rounds}/{r.settings.rounds} {r.settings.rounds === 1 ? 'volta' : 'voltas'}{r.settings.lowImpact ? ' · baixo impacto' : ''}</p>
      </div><span className="small num">{fmtDuration(Math.round(r.workMs / 1000))}</span></div>)}
    </section>
    <p className="tiny muted" style={{ marginTop: 12 }}><Link to="/calisthenics">Voltar para calistenia</Link> · Conteúdo versão {program.version}, pendente de revisão por profissional de educação física.</p>
  </div>
}
