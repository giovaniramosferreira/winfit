import { useMemo } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { byId, EQUIP_LABEL, MUSCLE_LABEL } from '../data/exercises'
import { fmtDate } from '../lib/helpers'
import { fmtKg } from '../lib/progression'
import Chart from '../components/Chart'
import BodyPlate from '../components/BodyPlate'
import { ANATOMY } from '../data/anatomy'
import PageTop from '../components/PageTop'
import ExerciseDemo from '../components/ExerciseDemo'
import { isTimedExercise } from '../lib/exerciseRules'

export default function ExerciseDetail() {
  const { id } = useParams()
  const sessions = useStore((s) => s.sessions)
  const active = useStore((s) => s.activeSession)
  const exercise = id ? byId.get(id) : undefined

  const history = useMemo(() => {
    if (!exercise) return []
    return sessions
      .filter((s) => s.logs.some((l) => l.exerciseId === exercise.id))
      .sort((a, b) => a.startedAt - b.startedAt)
      .map((s) => {
        const logs = s.logs.filter((l) => l.exerciseId === exercise.id)
        return {
          ts: s.startedAt,
          max: Math.max(...logs.map((l) => exercise.loadType === 'bodyweight' ? l.reps : l.weight)),
          sets: logs.map((l) => exercise.loadType === 'bodyweight'
            ? `${l.reps} ${isTimedExercise(exercise.id) ? 'seg' : 'reps'}`
            : `${l.weight > 0 ? l.weight : '—'}×${l.reps}`).join(' · '),
        }
      })
  }, [sessions, exercise])

  if (!exercise) return <Navigate to="/library" replace />

  const chartData = history.filter((h) => h.max > 0).map((h) => ({ label: fmtDate(h.ts), value: h.max }))

  const anat = ANATOMY[exercise.primary]
  const bodyweight = exercise.loadType === 'bodyweight'
  const unit = isTimedExercise(exercise.id) ? 'seg' : 'reps'

  return (
    <div className="page fade-in exercise-detail-page">
      <PageTop title={exercise.name} back={active ? '/player' : '/library'} />
      <p className="top-tagline">{MUSCLE_LABEL[exercise.primary]} · {exercise.equipment.length ? exercise.equipment.map((e) => EQUIP_LABEL[e]).join(' + ') : 'Peso corporal'}</p>
      <ExerciseDemo key={exercise.id} exerciseId={exercise.id} name={exercise.name} />

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="field-title">Como fazer</h2>
        <ol className="steps-list" style={{ marginTop: 6 }}>
          {exercise.instructions.map((i) => <li key={i}>{i}</li>)}
        </ol>
        {exercise.mistakes.length > 0 && <>
          <h2 className="field-title" style={{ marginTop: 16 }}>Evite</h2>
          <ul className="bullets" style={{ marginTop: 4 }}>{exercise.mistakes.map((m) => <li key={m}>{m}</li>)}</ul>
        </>}
      </section>

      {chartData.length >= 2 && (
        <section className="card" style={{ marginTop: 18 }}>
          <div className="between">
            <div className="eyebrow">{bodyweight ? isTimedExercise(exercise.id) ? 'Seu tempo' : 'Suas repetições' : 'Sua carga'}</div>
            <span className="mono num small accent-text">melhor {bodyweight ? `${Math.max(...chartData.map((d) => d.value))} ${unit}` : fmtKg(Math.max(...chartData.map((d) => d.value)))}</span>
          </div>
          <div style={{ marginTop: 10 }}>
              <Chart data={chartData} unit={bodyweight ? unit : ''} />
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="card" style={{ marginTop: 12 }}>
          <h2 className="field-title">Seu histórico</h2>
          {[...history].reverse().slice(0, 10).map((h) => (
            <div key={h.ts} className="list-item">
              <span className="tiny faint num" style={{ width: 60 }}>{fmtDate(h.ts)}</span>
              <span className="small mono num grow">{h.sets}</span>
            </div>
          ))}
        </section>
      )}

      <details className="card more-card" style={{ marginTop: 12 }}>
        <summary>Músculos trabalhados</summary>
        <figure className="plate-fig" style={{ marginTop: 10 }}>
          <BodyPlate primary={exercise.primary} secondary={exercise.secondary}
            label={`Figura do corpo com ${MUSCLE_LABEL[exercise.primary].toLowerCase()} em destaque`} />
          <figcaption>
            Principal: {MUSCLE_LABEL[exercise.primary].toLowerCase()} ({anat.latin})
            {exercise.secondary.length > 0 && <>. Apoio: {exercise.secondary.map((m) => MUSCLE_LABEL[m].toLowerCase()).join(', ')}</>}.
          </figcaption>
        </figure>
        <dl className="defs exercise-anatomy" style={{ marginTop: 14 }}>
          <dt>Origem</dt><dd>{anat.origin}</dd>
          <dt>Inserção</dt><dd>{anat.insertion}</dd>
          <dt>Ação</dt><dd>{anat.action}</dd>
        </dl>
        <p className="small muted" style={{ marginTop: 10 }}>Conteúdo educativo. Não substitui orientação profissional.</p>
      </details>
    </div>
  )
}
