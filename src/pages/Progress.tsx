import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { byId } from '../data/exercises'
import { fmtDate, fmtDuration, sessionsInWeekOffset, sessionsThisWeek } from '../lib/helpers'
import { fmtKg, volumeOf } from '../lib/progression'
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

  // Exercícios com histórico, ordenados por uso
  const exerciseStats = useMemo(() => {
    const map = new Map<string, { count: number; max: number }>()
    for (const s of sessions) {
      for (const l of s.logs) {
        const cur = map.get(l.exerciseId) ?? { count: 0, max: 0 }
        cur.count += 1
        cur.max = Math.max(cur.max, l.weight)
        map.set(l.exerciseId, cur)
      }
    }
    return [...map.entries()].sort((a, b) => b[1].count - a[1].count)
  }, [sessions])

  // Título-conclusão: o exercício mais registrado com carga, do primeiro ao último treino.
  const lead = useMemo(() => {
    for (const [exId] of exerciseStats) {
      const series = [...sessions]
        .sort((a, b) => a.startedAt - b.startedAt)
        .map((s) => ({ ts: s.startedAt, max: Math.max(0, ...s.logs.filter((l) => l.exerciseId === exId).map((l) => l.weight)) }))
        .filter((x) => x.max > 0)
      if (series.length >= 2) return { exId, series }
    }
    return null
  }, [exerciseStats, sessions])
  const leadEx = lead ? byId.get(lead.exId) : undefined
  const leadDelta = lead ? lead.series[lead.series.length - 1].max - lead.series[0].max : 0

  if (sessions.length === 0) {
    return (
      <div className="page">
        <div className="sheet-head"><span>Progresso</span><span>Caderno vazio</span></div>
        <h1>Seus números começam no <em>primeiro treino.</em></h1>
        <p className="muted small" style={{ marginTop: 8 }}>Conclua uma sessão para ver carga, volume e recordes aqui.</p>
        <Link to="/home" className="btn btn-primary" style={{ marginTop: 20 }}>Ir para o treino</Link>
      </div>
    )
  }

  return (
    <div className="page fade-in">
      <div className="sheet-head"><span>Progresso</span><span className="num">{sessions.length} treinos no caderno</span></div>
      <h1>
        {lead && leadEx && leadDelta > 0
          ? <>A carga do {leadEx.name.toLowerCase()} subiu <em>{fmtKg(leadDelta)}.</em></>
          : lead && leadEx
            ? <>{leadEx.name}: carga estável em <em>{fmtKg(lead.series[lead.series.length - 1].max)}.</em></>
            : <>{sessions.length} {sessions.length === 1 ? 'treino registrado' : 'treinos registrados'}.</>}
      </h1>
      {lead && leadEx && (
        <figure className="plate-fig" style={{ marginTop: 14 }}>
          <Chart data={lead.series.map((x) => ({ label: fmtDate(x.ts), value: x.max }))} unit="" />
          <figcaption><b>Fig.</b> {leadEx.name} ({ANATOMY[leadEx.primary].latin}), carga máxima por sessão em kg.</figcaption>
        </figure>
      )}

      <div className="stat-grid" style={{ marginTop: 18 }}>
        <div className="stat">
          <div className="v num">{week.length}<span className="muted" style={{ fontSize: 16 }}>/{profile.frequency}</span></div>
          <div className="k">Treinos esta semana</div>
        </div>
        <div className="stat">
          <div className="v num">{weekVol >= 1000 ? `${(weekVol / 1000).toFixed(1).replace('.', ',')} t` : `${Math.round(weekVol)} kg`}</div>
          <div className="k">Volume da semana {delta != null && <span className={delta >= 0 ? 'accent-text' : ''}>({delta > 0 ? '+' : ''}{delta}%)</span>}</div>
        </div>
        <div className="stat">
          <div className="v num">{sessions.length}</div>
          <div className="k">Treinos no total</div>
        </div>
        <div className="stat">
          <div className="v num gold">{prs.length}</div>
          <div className="k">Recordes pessoais</div>
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
            <span className="mono num">{st.max > 0 ? fmtKg(st.max) : '—'}</span>
            <span className="chev">›</span>
          </Link>
        ))}
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h3>Histórico</h3>
        {sessions.slice(0, 15).map((s) => (
          <div key={s.id} className="list-item">
            <div className="grow">
              <span className="small">{s.dayLabel} {s.status === 'partial' && <span className="pill">parcial</span>}</span>
              <div className="tiny faint num">
                {fmtDate(s.startedAt)} · {s.logs.length} séries · {s.endedAt ? fmtDuration(s.endedAt - s.startedAt) : ''}
              </div>
            </div>
            <span className="mono num small muted">{Math.round(volumeOf(s.logs))} kg</span>
          </div>
        ))}
      </div>
    </div>
  )
}
