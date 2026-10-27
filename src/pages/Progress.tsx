import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { byId } from '../data/exercises'
import { fmtDate, fmtDuration, sessionsInWeekOffset, sessionsThisWeek } from '../lib/helpers'
import { activityTotals, exerciseProgressSeries, fmtKg, volumeOf } from '../lib/progression'
import { isTimedExercise } from '../lib/exerciseRules'
import Chart from '../components/Chart'
import { ANATOMY } from '../data/anatomy'

export default function Progress() {
  const sessions = useStore((s) => s.sessions)
  const prs = useStore((s) => s.prs)
  const profile = useStore((s) => s.profile)!

  const week = sessionsThisWeek(sessions)
  const lastWeek = sessionsInWeekOffset(sessions, -1)
  const weekVol = week.reduce((a, s) => a + volumeOf(s.logs), 0)
  const lastVol = lastWeek.reduce((a, s) => a + volumeOf(s.logs), 0)
  const delta = lastVol > 0 ? Math.round(((weekVol - lastVol) / lastVol) * 100) : null
  const weekActivity = activityTotals(week.flatMap((session) => session.logs))
  const bodyweightFocus = !activityTotals((week.length > 0 ? week : sessions).flatMap((session) => session.logs)).hasLoad

  // Exercícios com histórico, ordenados por uso
  const exerciseStats = useMemo(() => {
    const map = new Map<string, { count: number; max: number; best: number }>()
    for (const s of sessions) {
      for (const l of s.logs) {
        const cur = map.get(l.exerciseId) ?? { count: 0, max: 0, best: 0 }
        cur.count += 1
        cur.max = Math.max(cur.max, l.weight)
        cur.best = Math.max(cur.best, l.reps)
        map.set(l.exerciseId, cur)
      }
    }
    return [...map.entries()].sort((a, b) => b[1].count - a[1].count)
  }, [sessions])

  // Título-conclusão: o exercício mais registrado com carga, do primeiro ao último treino.
  const lead = useMemo(() => {
    for (const [exId] of exerciseStats) {
      const { unit, points } = exerciseProgressSeries(exId, sessions)
      if (points.length >= 2) return { exId, unit, series: points }
    }
    return null
  }, [exerciseStats, sessions])
  const leadEx = lead ? byId.get(lead.exId) : undefined
  const leadDelta = lead ? lead.series[lead.series.length - 1].value - lead.series[0].value : 0
  const metricLabel = lead?.unit === 'kg' ? 'Carga' : lead?.unit === 'seg' ? 'Sustentação' : 'Repetições'
  const formatLead = (value: number) => lead?.unit === 'kg' ? fmtKg(value) : `${value.toLocaleString('pt-BR')} ${lead?.unit ?? ''}`

  if (sessions.length === 0) {
    return (
      <div className="page product-shell account-screen progress-screen">
        <div className="screen-topline"><span className="screen-kicker">Progresso</span><span>Seu histórico</span></div><div className="account-empty-art" aria-hidden="true"><img src="/media/pump-house/award.svg" alt="" /></div>
        <h1 className="screen-title">Seus números começam no <em>primeiro treino.</em></h1>
        <p className="muted small" style={{ marginTop: 8 }}>Conclua uma sessão para acompanhar sua frequência e evolução nos exercícios.</p>
        <Link to="/home" className="btn btn-primary" style={{ marginTop: 20 }}>Ir para o treino</Link>
      </div>
    )
  }

  return (
    <div className="page product-shell account-screen progress-screen fade-in">
      <div className="screen-topline"><span className="screen-kicker">Seu progresso</span><span className="num">{sessions.length} treinos registrados</span></div>
      <h1 className="screen-title">
        {lead && leadEx && leadDelta > 0
          ? <>{leadEx.name}: {metricLabel.toLowerCase()} aumentou <em>{formatLead(leadDelta)}.</em></>
          : lead && leadEx
            ? <>{leadEx.name}: {metricLabel.toLowerCase()} {leadDelta < 0 ? 'mais recente' : 'estável'} em <em>{formatLead(lead.series[lead.series.length - 1].value)}.</em></>
            : <>{sessions.length} {sessions.length === 1 ? 'treino registrado' : 'treinos registrados'}.</>}
      </h1>
      {lead && leadEx && (
        <figure className="plate-fig" style={{ marginTop: 14 }}>
          <Chart data={lead.series.map((x) => ({ label: fmtDate(x.ts), value: x.value }))} unit={lead.unit === 'kg' ? '' : lead.unit} />
          <figcaption><b>Fig.</b> {leadEx.name} ({ANATOMY[leadEx.primary].latin}), {metricLabel.toLowerCase()} máxima por série de cada sessão em {lead.unit}.</figcaption>
        </figure>
      )}

      <div className="stat-grid" style={{ marginTop: 18 }}>
        <div className="stat">
          <div className="v num">{week.length}<span className="muted" style={{ fontSize: 16 }}>/{profile.frequency}</span></div>
          <div className="k">Treinos esta semana</div>
        </div>
        <div className="stat">
          <div className="v num">{bodyweightFocus ? weekActivity.reps : weekVol >= 1000 ? `${(weekVol / 1000).toFixed(1).replace('.', ',')} t` : `${Math.round(weekVol)} kg`}</div>
          <div className="k">{bodyweightFocus ? 'Repetições na semana' : <>Volume da semana {delta != null && <span className={delta >= 0 ? 'accent-text' : ''}>({delta > 0 ? '+' : ''}{delta}%)</span>}</>}</div>
        </div>
        <div className="stat">
          <div className="v num">{bodyweightFocus ? `${weekActivity.seconds} seg` : sessions.length}</div>
          <div className="k">{bodyweightFocus ? 'Sustentação na semana' : 'Treinos no total'}</div>
        </div>
        <div className="stat">
          <div className={`v num${bodyweightFocus ? '' : ' gold'}`}>{bodyweightFocus ? weekActivity.sets : prs.length}</div>
          <div className="k">{bodyweightFocus ? 'Séries na semana' : 'Recordes pessoais'}</div>
        </div>
      </div>

      {prs.length > 0 && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="eyebrow accent">Últimos recordes</div>
          {prs.slice(0, 5).map((pr) => (
            <Link key={pr.id} to={`/exercise/${pr.exerciseId}`} className="list-item">
              <div className="grow">
                <span className="small">{byId.get(pr.exerciseId)?.name}</span>
                <div className="tiny faint">{fmtDate(pr.ts)}</div>
              </div>
              <b className="mono num gold">{fmtKg(pr.value)} × {pr.reps}</b>
            </Link>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: 14 }}>
        <h3>Evolução por exercício</h3>
        {exerciseStats.slice(0, 10).map(([exId, st]) => (
          <Link key={exId} to={`/exercise/${exId}`} className="list-item">
            <div className="grow">
              <span className="small">{byId.get(exId)?.name}</span>
              <div className="tiny faint num">{st.count} séries registradas</div>
            </div>
            <span className="mono num">{st.max > 0 ? fmtKg(st.max) : `${st.best} ${isTimedExercise(exId) ? 'seg' : 'reps'}`}</span>
            <span className="chev">›</span>
          </Link>
        ))}
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="between"><h3>Seu histórico</h3><span className="pill">{sessions.length} sessões</span></div>
        {sessions.slice(0, 15).map((s) => {
          const activity = activityTotals(s.logs)
          return (
          <Link key={s.id} to={`/session/${s.id}`} className="list-item">
            <div className="grow">
              <span className="small">{s.dayLabel} {s.status === 'partial' && <span className="pill">parcial</span>}</span>
              <div className="tiny faint num">
                {fmtDate(s.startedAt)} · {s.logs.length} séries · {s.endedAt ? fmtDuration(s.endedAt - s.startedAt) : ''}
              </div>
            </div>
            <span className="mono num small muted">{activity.hasLoad ? `${Math.round(activity.volume)} kg` : <>
              {activity.reps > 0 && `${activity.reps} reps`}
              {activity.reps > 0 && activity.seconds > 0 && ' · '}
              {activity.seconds > 0 && `${activity.seconds} seg`}
              {activity.sets === 0 && 'Sem séries'}
            </>}</span>
          </Link>
        )})}
      </div>
    </div>
  )
}
