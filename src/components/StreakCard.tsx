import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { bodyStore, useBody } from '../lib/bodyMetricsStore'
import { FREEZE_EVERY, streakCelebration, streakInfo, type StreakRule } from '../lib/streak'

const RULE_LABEL: Record<StreakRule, string> = { none: 'Sem congelamentos', gentle: 'Suave (1 congelamento)', generous: 'Generosa (até 2)' }

/** Sequência semanal derivada dos treinos: nada além do marco já visto é guardado. */
export default function StreakCard() {
  const sessions = useStore((s) => s.sessions)
  const body = useBody()
  const info = useMemo(() => streakInfo(sessions, new Date(), body.streakRule, body.weekStart), [sessions, body.streakRule, body.weekStart])
  const badge = streakCelebration(info.streak, body.streakSeen)
  if (info.weeks.length === 0) return null
  const last = info.weeks[info.weeks.length - 1]
  const open = last.status === 'open'
  return <section className="card streak-card" aria-label="Sequência semanal" style={{ marginTop: 12 }}>
    <div className="between">
      <div><b className="num" data-testid="streak-count">{info.streak} {info.streak === 1 ? 'semana seguida' : 'semanas seguidas'}</b>
        <p className="small muted">{open && info.streak > 0 ? 'Treine nesta semana para manter a sequência.' : `Melhor: ${info.best}.`} {info.freezes > 0 && `${info.freezes} ${info.freezes === 1 ? 'congelamento guardado' : 'congelamentos guardados'}.`}</p></div>
      <Link to="/progress" className="small">Ver</Link>
    </div>
    {badge !== null && <p role="status" className="small accent-text">Marco de {badge} semanas! <button className="btn btn-quiet btn-sm" onClick={() => bodyStore.markStreakSeen(badge)}>Ok</button></p>}
    <details className="more"><summary>Como funciona</summary>
      <p className="small muted">Conta semanas com pelo menos um treino. A cada {FREEZE_EVERY} semanas você ganha um congelamento, que cobre uma semana perdida.</p>
      <label className="small">Regra<select value={body.streakRule} disabled={body.blocked} onChange={(e) => bodyStore.setStreakRule(e.target.value as StreakRule)} style={{ minHeight: 44, width: '100%' }}>
        {(Object.keys(RULE_LABEL) as StreakRule[]).map((k) => <option key={k} value={k}>{RULE_LABEL[k]}</option>)}</select></label>
      <label className="small">A semana começa na<select value={body.weekStart} disabled={body.blocked} onChange={(e) => bodyStore.setWeekStart(e.target.value as 'mon' | 'sun')} style={{ minHeight: 44, width: '100%' }}>
        <option value="mon">Segunda</option><option value="sun">Domingo</option></select></label>
    </details>
  </section>
}
