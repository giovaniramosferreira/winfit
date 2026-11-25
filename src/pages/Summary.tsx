import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import Confetti from '../components/Confetti'
import { renderShareCard, shareOrDownload } from '../lib/shareImage'
import { useStore } from '../lib/store'
import { byId } from '../data/exercises'
import { fmtDuration, sessionActiveMs } from '../lib/helpers'
import { activityTotals, fmtKg, volumeOf } from '../lib/progression'

export default function Summary() {
  const { id } = useParams()
  const nav = useNavigate()
  const sessions = useStore((s) => s.sessions)
  const session = sessions.find((s) => s.id === id)
  const [shareMsg, setShareMsg] = useState('')

  if (!session) return <Navigate to="/home" replace />

  const volume = volumeOf(session.logs)
  const activity = activityTotals(session.logs)
  const activeMs = sessionActiveMs(session)
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
      <div className="summary-heading" style={{ paddingTop: 32 }}>{prs.length > 0 && <Confetti />}<div className="summary-award"><img src="/media/pump-house/award.svg" width="32" height="40" alt="" /></div>
        <h1 className="screen-title">{prs.length > 0 ? <>{prs.length === 1 ? 'Novo recorde' : `${prs.length} recordes`} <em>hoje!</em></> : session.status === 'partial' ? 'Treino salvo.' : 'Treino concluído!'}</h1>
        <p className="muted" style={{ marginTop: 6 }}>{session.dayLabel}{session.status === 'partial' ? ' · parcial' : ''}</p>
      </div>

      <div className="stat-grid" style={{ marginTop: 24 }}>
        <div className="stat">
          <div className="v num">{activeMs === null ? '—' : fmtDuration(activeMs)}</div>
          <div className="k">Duração</div>
        </div>
        <div className="stat">
          <div className="v num">{session.logs.length}</div>
          <div className="k">{session.logs.length === 1 ? 'Série' : 'Séries'}</div>
        </div>
        <div className="stat">
          <div className="v num">{!activity.hasLoad ? activity.reps : volume >= 1000 ? `${(volume / 1000).toFixed(1).replace('.', ',')} t` : `${Math.round(volume)} kg`}</div>
          <div className="k">{activity.hasLoad ? 'Volume total' : 'Repetições'}</div>
        </div>
        <div className="stat">
          <div className="v num" style={{ color: delta != null && delta > 0 ? 'var(--accent)' : undefined }}>
            {!activity.hasLoad ? `${activity.seconds} seg` : delta != null ? `${delta > 0 ? '+' : ''}${delta}%` : '—'}
          </div>
          <div className="k">{activity.hasLoad ? 'vs. último treino igual' : 'Tempo de sustentação'}</div>
        </div>
      </div>

      {prs.length > 0 && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="eyebrow accent">Recordes deste treino</div>
          {prs.map((l) => (
            <div key={l.id} className="between" style={{ marginTop: 8 }}>
              <span className="small">{byId.get(l.exerciseId)?.name}</span>
              <b className="num gold">{fmtKg(l.weight)} × {l.reps}</b>
            </div>
          ))}
        </div>
      )}

      <div className="grow" />
      <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => nav('/home', { replace: true })}>
        Concluir
      </button>
      <button className="btn btn-quiet" onClick={async () => {
        try {
          const durationText = activeMs === null ? '—' : fmtDuration(activeMs)
          const blob = await renderShareCard({
            title: prs.length ? `${prs.length === 1 ? 'Novo recorde' : `${prs.length} recordes`} hoje!` : 'Treino feito!',
            subtitle: session.dayLabel,
            stats: [[durationText, 'duração'], [String(session.logs.length), session.logs.length === 1 ? 'série' : 'séries'],
              ...(activity.hasLoad ? [[volume >= 1000 ? `${(volume / 1000).toFixed(1).replace('.', ',')} t` : `${Math.round(volume)} kg`, 'volume'] as [string, string]] : [[String(activity.reps), 'repetições'] as [string, string]])],
          })
          const result = await shareOrDownload(blob, 'winfit-treino.png')
          setShareMsg(result === 'downloaded' ? 'Imagem salva.' : '')
        } catch { setShareMsg('Não foi possível gerar a imagem.') }
      }}>Compartilhar resumo</button>
      {shareMsg && <p className="small muted center" role="status">{shareMsg}</p>}
    </div>
  )
}
