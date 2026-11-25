import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { byId, MUSCLE_LABEL } from '../data/exercises'
import { muscleFatigue, MUSCLES, type FatigueState } from '../lib/fatigue'
import { suggestDeload } from '../lib/deload'
import { pushPullBalance } from '../lib/plates'

const STATE_LABEL: Record<FatigueState, string> = { fresh: 'descansado', light: 'leve', moderate: 'moderada', high: 'alta' }
const BALANCE_TEXT = { balanced: 'Equilibrado', push_heavy: 'Mais empurrar que puxar', pull_heavy: 'Mais puxar que empurrar', insufficient: 'Dados insuficientes' } as const

/** Fadiga por músculo, balanço empurrar/puxar e sugestões de deload. Estimativas; não substituem orientação profissional. */
export default function TrainingInsights() {
  const sessions = useStore((s) => s.sessions)
  const data = useMemo(() => {
    const now = Date.now()
    const fatigue = muscleFatigue(sessions, now)
    const balance = pushPullBalance(sessions, now - 28 * 86_400_000, now)
    const ids = [...new Set(sessions.flatMap((s) => s.logs.map((l) => l.exerciseId)))]
    const deloads = ids.flatMap((id) => {
      const ex = byId.get(id)
      if (!ex || ex.loadType !== 'external') return []
      const d = suggestDeload(id, sessions)
      return d.suggest ? [{ id, name: ex.name, reason: d.reason }] : []
    })
    return { fatigue, balance, deloads }
  }, [sessions])
  if (sessions.length === 0) return null
  const tired = MUSCLES.filter((m) => data.fatigue[m].state !== 'fresh').sort((a, b) => data.fatigue[b].level - data.fatigue[a].level)
  return <section className="card" style={{ marginTop: 14 }} aria-labelledby="ti-title">
    <h2 id="ti-title">Recuperação e equilíbrio <span className="pill">estimativa</span></h2>
    <h3 className="field-title">Fadiga agora</h3>
    {tired.length === 0 ? <p className="small muted">Nenhum músculo com fadiga relevante.</p>
      : <ul className="plain-list" data-testid="fatigue-list">{tired.map((m) => <li key={m} className="small"><b>{MUSCLE_LABEL[m]}</b>: {STATE_LABEL[data.fatigue[m].state]} <span className="muted num">({data.fatigue[m].level.toFixed(2)})</span></li>)}</ul>}
    <p className="tiny muted">Conta séries de 5 a 30 repetições, com meia-vida de recuperação por músculo. É uma aproximação.</p>
    <h3 className="field-title" style={{ marginTop: 10 }}>Empurrar × puxar (4 semanas)</h3>
    <p className="small" data-testid="push-pull">{BALANCE_TEXT[data.balance.status]} <span className="muted num">({data.balance.push} × {data.balance.pull} séries)</span></p>
    {data.deloads.length > 0 && <>
      <h3 className="field-title" style={{ marginTop: 10 }}>Deload sugerido</h3>
      {data.deloads.map((d) => <p key={d.id} className="small"><Link to={`/exercise/${d.id}`}><b>{d.name}</b></Link>: {d.reason}</p>)}
    </>}
  </section>
}
