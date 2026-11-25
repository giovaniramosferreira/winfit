import { useEffect, useMemo, useRef, useState } from 'react'
import PageTop from '../components/PageTop'
import Switch from '../components/Switch'
import Icon from '../components/Icon'
import { cardioCoreCircuit as program, LEVEL_ORDER } from '../data/circuits'
import { useCircuitStore } from '../lib/circuitStore'
import { useStore } from '../lib/store'
import CircuitDemo from '../components/CircuitDemo'
import { buildPhases, fmtDuration, positionAt, resolveMove, suggestProgression, totalSeconds, workSeconds, type CircuitPhaseKind, type ModifyReason } from '../lib/circuit'
import { confirmDialog } from '../components/ui'

const KIND_LABEL: Record<CircuitPhaseKind, string> = {
  prepare: 'Prepare-se', warmup: 'Aquecimento', work: 'Trabalho', rest: 'Descanso', round_rest: 'Descanso entre voltas', cooldown: 'Desaquecimento',
}
const REASON_LABEL: Record<ModifyReason, string> = { level: 'iniciante', impact: 'sem saltos', limitation: 'adaptado' }

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
    {active ? <h1 className="sr-only">{program.title}</h1> : <PageTop title="Circuito cardio e core" back="/training" tagline={`9 estações sem equipamento · ${fmtDuration(totalSeconds(setupPhases))} no total`} />}
    {(s.error || notice) && <p className="note" role="alert">{s.error || notice}</p>}

    {active && phase && pos ? <section className={`card training-session circuit-live circuit-${phase.kind}`} aria-labelledby="circuit-phase">
      <div className="between"><span className="eyebrow accent">{KIND_LABEL[phase.kind]}</span>
        {phase.round > 0 && <span className="small muted num">Volta {phase.round}/{active.settings.rounds}</span>}</div>
      <h2 id="circuit-phase">{phase.name}</h2>
      <p className="circuit-clock num" aria-live="off" aria-label={`${pos.remainingSec} segundos restantes`}>{pos.remainingSec}<span className="small"> s</span></p>
      {phase.moveId && <CircuitDemo key={pos.index} moveId={phase.moveId} modified={!!phase.modified} name={phase.kind === 'work' ? phase.name : phase.how} autoPlay compact />}
      <p className="small">{phase.how}</p>
      {phase.kind === 'work' && phase.moveId && <p className="small muted" style={{ marginTop: 6 }}>{program.moves.find((m) => m.id === phase.moveId)?.watch}</p>}
      {phase.kind === 'work' && (() => { const next = activePhases.slice(pos.index + 1).find((p) => p.kind === 'work'); return next ? <p className="small muted" style={{ marginTop: 6 }}>Depois: <b>{next.name}</b></p> : null })()}
      <div className="progressbar circuit-progress" role="progressbar" aria-label="Progresso do circuito" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(active.timer.elapsedMs / active.timer.totalMs * 100)}>
        <div style={{ width: `${active.timer.elapsedMs / active.timer.totalMs * 100}%` }} /></div>
      <p className="small muted" role="status">{active.timer.status === 'paused' ? 'Pausado' : `Faltam ${fmtDuration(Math.ceil((active.timer.totalMs - active.timer.elapsedMs) / 1000))}`}</p>
      <button className="btn btn-primary" onClick={() => { if (active.timer.status === 'paused') { void unlockAudio(); s.resume() } else s.pause() }}>{active.timer.status === 'paused' ? 'Retomar' : 'Pausar'}</button>
      <div className="circuit-actions">
        <button className="btn btn-ghost" onClick={() => s.skip()}>Pular etapa</button>
        <button className="btn btn-ghost" onClick={async () => { if (await confirmDialog({ title: 'Encerrar o circuito?', message: 'O tempo feito fica registrado.', confirmLabel: 'Encerrar' })) s.stop() }}>Encerrar</button>
      </div>
      <p className="small muted" style={{ marginTop: 10 }}>Dor, tontura ou falta de ar? Pare.</p>
    </section> : s.healthAckAt === null ? <section className="card training-session" aria-labelledby="circuit-health">
      <h2 id="circuit-health">Antes de começar</h2>
      <ul className="bullets">
        <li>Tem saltos e abdominais intensos.</li>
        <li>Problema cardíaco, lesão recente, dor nas costas, gestação ou pós-parto? Fale com um médico antes.</li>
        <li>Pare se sentir dor, tontura ou falta de ar.</li>
      </ul>
      <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => s.acknowledgeHealth()}>Entendi</button>
    </section> : <>
      {finished && <section className="note" role="status" style={{ marginBottom: 12 }}>
        <b>{finished.status === 'completed' ? 'Circuito concluído!' : 'Circuito encerrado.'}</b>{' '}
        {fmtDuration(Math.round(finished.workMs / 1000))} de trabalho em {finished.rounds} {finished.rounds === 1 ? 'volta' : 'voltas'}.
      </section>}
      {suggestion && <section className="note olive" style={{ marginBottom: 12 }}>
        <b>Hora de progredir.</b> {suggestion.text}
        <button className="btn btn-sm btn-ghost" style={{ display: 'block', marginTop: 10 }} onClick={() => s.setSettings(suggestion.settings)}>Aplicar</button>
      </section>}
      <section className="card training-session">
        <h2 className="field-title">Nível</h2>
        <div className="seg" role="group" aria-label="Nível">{LEVEL_ORDER.map((level) =>
          <button key={level} type="button" aria-pressed={setup.level === level} onClick={() => s.setSettings({ level })}>{program.levels[level].label}</button>)}</div>
        <p className="small muted" style={{ margin: '-8px 0 16px' }}>{program.levels[setup.level].workSec} s de exercício · {program.levels[setup.level].restSec} s de descanso</p>
        <h2 className="field-title">Voltas</h2>
        <div className="seg" role="group" aria-label="Número de voltas">{Array.from({ length: program.maxRounds }, (_, i) => i + 1).map((n) =>
          <button key={n} type="button" aria-pressed={setup.rounds === n} onClick={() => s.setSettings({ rounds: n })}>{n}</button>)}</div>
        <Switch label="Sem saltos" hint="Versão de baixo impacto" checked={setup.lowImpact} onChange={(v) => s.setSettings({ lowImpact: v })} />
        <Switch label="Aquecer e alongar" hint={`+${fmtDuration((program.warmup.length + program.cooldown.length) * 30)}`} checked={setup.warmup} onChange={(v) => s.setSettings({ warmup: v })} />
        <Switch label="Som" checked={s.audio} onChange={(v) => s.setSignals(v, s.vibration)} />
        <Switch label="Vibração" checked={s.vibration} onChange={(v) => s.setSignals(s.audio, v)} />
        <button className="btn btn-primary train-cta" onClick={() => void start()}><Icon name="play" />Começar · {fmtDuration(totalSeconds(setupPhases))}</button>
      </section>

      <section className="card" style={{ marginTop: 12 }}>
        <h2>Estações</h2>
        <ol className="circuit-moves">{program.moves.map((m, i) => { const r = resolveMove(m, setup, limitations)
          return <li key={m.id}><details>
            <summary><span className="n num">{i + 1}</span><span className="t">{r.name}<small>{m.focus}</small>
              {r.reasons.some((x) => x !== 'level') && <span className="pill accent circuit-tag">{r.reasons.filter((x) => x !== 'level').map((x) => REASON_LABEL[x]).join(' · ')}</span>}</span></summary>
            <CircuitDemo moveId={m.id} modified={r.modified} name={r.name} compact />
            <ol className="small">{r.how.map((h) => <li key={h}>{h}</li>)}</ol>
            <p className="small muted">{m.watch}</p>
          </details></li> })}</ol>
      </section>
    </>}

    {s.history.length > 0 && <section className="card" style={{ marginTop: 12 }}>
      <h2>Histórico</h2>
      {s.history.slice(0, 30).map((r) => <div className="list-item" key={r.id}><div className="grow">
        <b>{r.status === 'completed' ? 'Concluído' : 'Interrompido'} · {program.levels[r.settings.level].label}</b>
        <p className="small muted">{new Date(r.startedAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} · {r.rounds}/{r.settings.rounds} {r.settings.rounds === 1 ? 'volta' : 'voltas'}{r.settings.lowImpact ? ' · sem saltos' : ''}</p>
      </div><span className="small num">{fmtDuration(Math.round(r.workMs / 1000))}</span></div>)}
    </section>}
  </div>
}
