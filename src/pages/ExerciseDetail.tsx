import { useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { byId, EQUIP_LABEL, MUSCLE_LABEL } from '../data/exercises'
import { fmtDate } from '../lib/helpers'
import { fmtKg } from '../lib/progression'
import Chart from '../components/Chart'
import BodyPlate from '../components/BodyPlate'
import { ANATOMY, plateNo } from '../data/anatomy'
import ExerciseDemo from '../components/ExerciseDemo'
import { isTimedExercise } from '../lib/exerciseRules'

export default function ExerciseDetail() {
  const { id } = useParams()
  const nav = useNavigate()
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
  const plate = plateNo(exercise.id)
  const bodyweight = exercise.loadType === 'bodyweight'
  const unit = isTimedExercise(exercise.id) ? 'seg' : 'reps'

  return (
    <div className="page fade-in exercise-detail-page">
      <div className="between" style={{ marginBottom: 6 }}>
        <button className="btn-quiet" onClick={() => nav(-1)} style={{ padding: '4px 0' }}>
          ← Voltar{active ? ' ao treino' : ''}
        </button>
        <span className="eyebrow num">Exercício {plate}</span>
      </div>
      <div className="exercise-detail-heading">

      <div className="eyebrow" style={{ marginTop: 16 }}>{MUSCLE_LABEL[exercise.primary]}</div>
      <h1 className="screen-title" style={{ marginTop: 6 }}>{exercise.name}</h1>
      <p className="latin" style={{ fontSize: 17, marginTop: 4 }}>
        {anat.latin}{anat.also ? <span className="small"> — {anat.also}</span> : null}
      </p>

      </div><ExerciseDemo key={exercise.id} exerciseId={exercise.id} name={exercise.name} />

      <figure className="plate-fig" style={{ marginTop: 14 }}>
        <BodyPlate primary={exercise.primary} secondary={exercise.secondary}
          label={`Figura do corpo com ${MUSCLE_LABEL[exercise.primary].toLowerCase()} em destaque`} />
        <figcaption>
          Em hachura, o músculo principal
          {exercise.secondary.length > 0 && <>; em tom claro, apoio de {exercise.secondary.map((m) => MUSCLE_LABEL[m].toLowerCase()).join(', ')}</>}.
        </figcaption>
      </figure>

      <dl className="defs exercise-anatomy" style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
        <dt>Origem</dt><dd>{anat.origin}</dd>
        <dt>Inserção</dt><dd>{anat.insertion}</dd>
        <dt>Ação</dt><dd>{anat.action}</dd>
        <dt>Equipamento</dt><dd>{exercise.equipment.length ? exercise.equipment.map((e) => EQUIP_LABEL[e]).join(' + ') : 'Peso corporal'}</dd>
      </dl>

      <section className="card" style={{ marginTop: 18 }}>
        <div className="eyebrow">Como executar</div>
        <ol className="steps-list" style={{ marginTop: 10 }}>
          {exercise.instructions.map((i) => <li key={i}>{i}</li>)}
        </ol>
      </section>

      {exercise.mistakes.length > 0 && (
        <div className="note" style={{ marginTop: 6 }}>
          <b>{exercise.mistakes.length === 1 ? 'Erro comum.' : 'Erros comuns.'}</b>{' '}
          {exercise.mistakes.join(' ')}
        </div>
      )}

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
          <div className="eyebrow">Seu histórico</div>
          {[...history].reverse().slice(0, 10).map((h) => (
            <div key={h.ts} className="list-item">
              <span className="tiny faint num" style={{ width: 60 }}>{fmtDate(h.ts)}</span>
              <span className="small mono num grow">{h.sets}</span>
            </div>
          ))}
        </section>
      )}

      <p className="tiny faint" style={{ marginTop: 20 }}>
        Conteúdo anatômico educativo, baseado em anatomia descritiva clássica. Não substitui orientação profissional.
      </p>
    </div>
  )
}
