import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { byId, MUSCLE_LABEL } from '../data/exercises'

export default function Preview() {
  const plan = useStore((s) => s.plan)
  const nav = useNavigate()
  const [building, setBuilding] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(() => useStore.getState().plan?.days[0]?.id ?? null)
  const [showWhy, setShowWhy] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setBuilding(false), 700)
    return () => clearTimeout(t)
  }, [])

  if (!plan) return <Navigate to="/" replace />

  if (building) {
    return (
      <div className="page-full product-shell account-screen preview-screen center" style={{ justifyContent: 'center' }}>
        <div className="fade-in">
          <div className="spinner" aria-hidden="true" />
          <h2 style={{ marginTop: 16, fontSize: 24 }} role="status">Montando seu plano…</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="page-full product-shell account-screen preview-screen fade-in">
      <div className="account-entry-mark" aria-hidden="true">✓</div><div className="screen-kicker">Seu plano está pronto</div>
      <h1 className="screen-title" style={{ marginTop: 8 }}>{plan.splitLabel}</h1>
      <p className="muted" style={{ marginTop: 6 }}>
        {plan.days.length} treinos por semana · ~{Math.round(plan.days.reduce((a, d) => a + d.estMin, 0) / plan.days.length)} min cada
      </p>

      {plan.notes.map((n) => (
        <div key={n} className="note olive" style={{ marginTop: 14 }}>
          <b>Nota.</b> {n}
        </div>
      ))}

      <button className="card" style={{ marginTop: 14, width: '100%', textAlign: 'left' }} aria-expanded={showWhy} onClick={() => setShowWhy(!showWhy)}>
        <div className="between">
          <h3>Por que este plano?</h3>
          <span className="chev">{showWhy ? '−' : '+'}</span>
        </div>
        {showWhy && (
          <ul className="small muted" style={{ marginTop: 10, paddingLeft: 18, display: 'grid', gap: 6 }}>
            {plan.rationale.map((r) => <li key={r}>{r}</li>)}
          </ul>
        )}
      </button>

      <div className="stack" style={{ marginTop: 14, flex: 1 }}>
        {plan.days.map((day) => (
          <button key={day.id} className="card" style={{ width: '100%', textAlign: 'left' }}
            aria-expanded={expanded === day.id} onClick={() => setExpanded(expanded === day.id ? null : day.id)}>
            <div className="between">
              <div>
                <h3>{day.label}{day.position === 0 && <span className="pill accent" style={{ marginLeft: 8, verticalAlign: 'middle' }}>Primeiro treino</span>}</h3>
                <div className="small muted num">{day.exercises.length} exercícios · ~{day.estMin} min</div>
                <div style={{ marginTop: 6 }}>
                  {day.targetMuscles.slice(0, 4).map((m) => (
                    <span key={m} className="muscle-tag">{MUSCLE_LABEL[m]}</span>
                  ))}
                </div>
              </div>
              <span className="chev">{expanded === day.id ? '−' : '+'}</span>
            </div>
            {expanded === day.id && (
              <div style={{ marginTop: 12 }}>
                {day.exercises.map((pe) => {
                  const ex = byId.get(pe.exerciseId)
                  return (
                    <div key={pe.id} className="between" style={{ padding: '8px 0', borderTop: '1px solid var(--line)' }}>
                      <span className="small">{ex?.name}</span>
                      <span className="small faint mono num">{pe.sets}×{pe.repMin}–{pe.repMax}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <button className="btn btn-primary" onClick={() => nav('/home')}>Começar</button>
        <button className="btn btn-quiet" onClick={() => nav('/onboarding')}>Mudar respostas</button>
      </div>
    </div>
  )
}
