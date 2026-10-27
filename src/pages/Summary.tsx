import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { byId } from '../data/exercises'
import { fmtDuration } from '../lib/helpers'
import { activityTotals, fmtKg, volumeOf } from '../lib/progression'

export default function Summary() {
  const { id } = useParams()
  const nav = useNavigate()
  const sessions = useStore((s) => s.sessions)
  const session = sessions.find((s) => s.id === id)

  if (!session) return <Navigate to="/home" replace />

  const volume = volumeOf(session.logs)
  const activity = activityTotals(session.logs)
  // Um recorde por exercício: a melhor série marcada como PR na sessão.
  const prs = [...session.logs.filter((l) => l.isPR)
    .reduce((m, l) => {
      const cur = m.get(l.exerciseId)
      if (!cur || l.weight > cur.weight || (l.weight === cur.weight && l.reps > cur.reps)) m.set(l.exerciseId, l)
      return m
    }, new Map<string, (typeof session.logs)[number]>()).values()]
  const previous = sessions.find((s) => s.id !== session.id && s.dayId === session.dayId && s.startedAt < session.startedAt)
  const prevVolume = previous ? volumeOf(previous.logs) : null
  const delta = prevVolume != null && prevVolume > 0 ? Math.round(((volume - prevVolume) / prevVolume) * 100) : null

  return (
    <div className="page-full fade-in training-summary">
      <div className="summary-heading" style={{ paddingTop: 32 }}><div className="summary-award"><img src="/media/pump-house/award.svg" width="32" height="40" alt="" /></div>
        <div className="sheet-head"><span>Treino concluído</span><span>{session.status === 'partial' ? 'Parcial' : 'Completo'}</span></div>
        <h1 className="screen-title">{prs.length > 0 ? <>Sessão com <em>{prs.length} {prs.length === 1 ? 'recorde' : 'recordes'}.</em></> : 'Treino concluído!'}</h1>
        <p className="muted" style={{ marginTop: 6 }}>{session.dayLabel}</p>
      </div>

      <div className="stat-grid" style={{ marginTop: 24 }}>
        <div className="stat">
          <div className="v num">{session.endedAt ? fmtDuration(session.endedAt - session.startedAt) : '—'}</div>
          <div className="k">Duração</div>
        </div>
        <div className="stat">
          <div className="v num">{session.logs.length}</div>
          <div className="k">Séries registradas</div>
        </div>
        <div className="stat">
          <div className="v num">{!activity.hasLoad ? activity.reps : volume >= 1000 ? `${(volume / 1000).toFixed(1).replace('.', ',')} t` : `${Math.round(volume)} kg`}</div>
          <div className="k">{activity.hasLoad ? 'Volume total' : 'Repetições'}</div>
        </div>
        <div className="stat">
          <div className="v num" style={{ color: delta != null && delta > 0 ? 'var(--accent)' : undefined }}>
            {!activity.hasLoad ? `${activity.seconds} seg` : delta != null ? `${delta > 0 ? '+' : ''}${delta}%` : '—'}
          </div>
          <div className="k">{activity.hasLoad ? `vs. último ${session.dayLabel.split(' ')[0]}` : 'Tempo de sustentação'}</div>
        </div>
      </div>

      {prs.length > 0 && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="eyebrow accent">Recordes desta sessão</div>
          {prs.map((l) => (
            <div key={l.id} className="between" style={{ marginTop: 8 }}>
              <span className="small">{byId.get(l.exerciseId)?.name}</span>
              <b className="num gold">{fmtKg(l.weight)} × {l.reps}</b>
            </div>
          ))}
        </div>
      )}

      <p className="summary-note">Seu treino foi salvo. Cada sessão conta na sua evolução.</p><div className="grow" />
      <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => nav('/home', { replace: true })}>
        Concluir
      </button>
    </div>
  )
}
