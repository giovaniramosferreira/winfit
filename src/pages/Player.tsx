import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { byId } from '../data/exercises'
import { ANATOMY, plateNo } from '../data/anatomy'
import { lastPerformance, suggestFor, fmtKg } from '../lib/progression'
import { equivalentsFor } from '../lib/generator'
import { isEquipmentFree } from '../lib/homeWorkout'
import { fmtClock, beep, vibrate } from '../lib/helpers'
import type { Exercise, PlanExercise } from '../types'
import { useWatchSync } from '../lib/watchSync'
import WatchModal from '../components/WatchModal'
import NumberDial from '../components/NumberDial'
import ExerciseDemo from '../components/ExerciseDemo'
import { isEquipmentFreeSession, isTimedExercise, variationLabel } from '../lib/exerciseRules'

export default function Player() {
  const nav = useNavigate()
  const session = useStore((s) => s.activeSession)
  const sessions = useStore((s) => s.sessions)
  const profile = useStore((s) => s.profile)
  const plan = useStore((s) => s.plan)
  const logSet = useStore((s) => s.logSet)
  const editSet = useStore((s) => s.editSet)
  const deleteSet = useStore((s) => s.deleteSet)
  const skipExercise = useStore((s) => s.skipExercise)
  const setCurrentIndex = useStore((s) => s.setCurrentIndex)
  const substitute = useStore((s) => s.substitute)
  const finishSession = useStore((s) => s.finishSession)
  const discardActive = useStore((s) => s.discardActive)

  const { syncState, lastCommand } = useWatchSync()

  const [editor, setEditor] = useState<{ weight: number; reps: number; logId?: string } | null>(null)
  const [subOpen, setSubOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [finishOpen, setFinishOpen] = useState(false)
  const [watchModalOpen, setWatchModalOpen] = useState(false)
  const [prFlash, setPrFlash] = useState<string | null>(null)
  const [watchToast, setWatchToast] = useState<string | null>(null)
  const finishing = useRef(false)

  useEffect(() => {
    if (lastCommand) {
      setWatchToast(`Watch: ${lastCommand.message}`)
      const t = setTimeout(() => setWatchToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [lastCommand?.ts])

  if (!session || !profile) return finishing.current ? null : <Navigate to="/home" replace />

  const idx = session.currentIndex
  const sx = session.exercises[idx]
  const exercise = byId.get(sx.exerciseId)!
  const isTimed = isTimedExercise(exercise.id)
  const bodyweight = exercise.loadType === 'bodyweight'
  const equipmentFreeSession = isEquipmentFreeSession(session, plan)

  const planExLike: PlanExercise = {
    id: sx.planExerciseId, exerciseId: sx.exerciseId, slotType: 'core',
    sets: sx.sets, repMin: sx.repMin, repMax: sx.repMax, restSec: sx.restSec, optional: sx.optional,
  }
  const suggestion = suggestFor(planExLike, exercise, sessions)
  const prev = lastPerformance(sx.exerciseId, sessions)

  const logsHere = session.logs.filter((l) => l.planExerciseId === sx.planExerciseId)
  const nextSetNumber = logsHere.length + 1
  const totalSets = session.exercises.filter((e) => !e.skipped).reduce((a, e) => a + e.sets, 0)
  const doneSets = session.logs.length
  const allExercisesDone = session.exercises.every((e) => {
    const n = session.logs.filter((l) => l.planExerciseId === e.planExerciseId).length
    return e.skipped || n >= e.sets
  })

  const defaultWeight = () => {
    if (logsHere.length > 0) return logsHere[logsHere.length - 1].weight
    if (exercise.loadType !== 'external') return 0
    return suggestion.weight ?? 0
  }
  const defaultReps = () => {
    if (logsHere.length > 0) return logsHere[logsHere.length - 1].reps
    return suggestion.targetReps
  }

  const quickLog = () => {
    // Primeira série de um exercício de carga externa sem referência: pedir a carga
    // (logar 0 kg silenciosamente corromperia o histórico e a progressão).
    if (exercise.loadType === 'external' && defaultWeight() === 0) {
      setEditor({ weight: 0, reps: defaultReps() })
      return
    }
    const log = logSet(idx, defaultWeight(), defaultReps())
    vibrate(30)
    if (log?.isPR) {
      setPrFlash(`Novo recorde: ${fmtKg(log.weight)}.`)
      setTimeout(() => setPrFlash(null), 3500)
    }
  }

  const confirmEditor = () => {
    if (!editor) return
    if (editor.logId) {
      editSet(editor.logId, editor.weight, editor.reps)
    } else {
      const log = logSet(idx, editor.weight, editor.reps)
      vibrate(30)
      if (log?.isPR) {
        setPrFlash(`Novo recorde: ${fmtKg(log.weight)}.`)
        setTimeout(() => setPrFlash(null), 3500)
      }
    }
    setEditor(null)
  }

  const goNext = () => setCurrentIndex(Math.min(idx + 1, session.exercises.length - 1))
  const goPrev = () => setCurrentIndex(Math.max(idx - 1, 0))

  const doFinish = (rpe?: number) => {
    // A store esvazia a sessão antes da transição de rota terminar.
    finishing.current = true
    const id = finishSession(rpe)
    if (id) nav(`/summary/${id}`, { replace: true })
    else nav('/home', { replace: true })
  }

  const unit = isTimed ? 'seg' : 'reps'

  return (
    <div className={`player${session.timer ? ' is-resting' : ''}`}>
      <header className="player-head">
        <div className="between">
          <button className="btn-quiet" onClick={() => nav('/home')}>▾ Minimizar</button>
          <div className="row" style={{ gap: 8 }}>
            <button
              className={`watch-badge ${syncState}`}
              onClick={() => setWatchModalOpen(true)}
              title="Sincronização com Apple Watch"
            >
              <span className="dot-pulse" />
              <span>Watch</span>
            </button>
            <span className="small muted num">{doneSets}/{totalSets} séries</span>
          </div>
          <button className="btn-quiet" onClick={() => setMenuOpen(true)}>⋯</button>
        </div>
        <div className="player-progress"><div style={{ width: `${(doneSets / Math.max(totalSets, 1)) * 100}%` }} /></div>
        <label className="exercise-picker">
          <span className="tiny muted">Ir para exercício</span>
          <select aria-label="Ir para exercício" value={idx} onChange={(event) => {
            setEditor(null)
            setSubOpen(false)
            setCurrentIndex(Number(event.target.value))
          }}>
            {session.exercises.map((item, index) => {
              const count = session.logs.filter((log) => log.planExerciseId === item.planExerciseId).length
              return <option key={item.planExerciseId} value={index}>
                {index + 1}. {byId.get(item.exerciseId)?.name ?? 'Exercício'} · {count}/{item.sets} séries{item.skipped ? ' · pulado' : ''}
              </option>
            })}
          </select>
        </label>
      </header>

      <main className="player-body">
        <div className="between">
          <span className="eyebrow num">Exercício {idx + 1} de {session.exercises.length}</span>
          {sx.substitutedFrom && <span className="pill">substituído</span>}
        </div>
        <h1 style={{ marginTop: 6, fontSize: 27 }}>{exercise.name}</h1>
        <p className="latin small" style={{ marginTop: 2 }}>{ANATOMY[exercise.primary].latin}</p>
        <p className="small muted num" style={{ marginTop: 4 }}>
          Meta: {sx.sets} × {sx.repMin}–{sx.repMax} {unit}
          {exercise.loadType === 'external' && suggestion.weight != null && suggestion.weight > 0 && (
            <> · <b className={`mono${suggestion.isIncrease ? ' accent-text' : ''}`}>{fmtKg(suggestion.weight)}</b></>
          )}
        </p>
        <p className="tiny faint" style={{ marginTop: 4 }}>{suggestion.note}</p>

        <ExerciseDemo key={exercise.id} exerciseId={exercise.id} name={exercise.name} />

        {watchToast && (
          <div className="pr-flash ok" style={{ marginTop: 12 }}>
            {watchToast}
          </div>
        )}
        {prFlash && <div className="pr-flash" style={{ marginTop: 12 }}>{prFlash}</div>}

        <div style={{ marginTop: 16 }}>
          <div className={`set-row head${bodyweight ? ' bodyweight' : ''}`}>
            <span>Série</span>
            <span>Anterior</span>
            {!bodyweight && <span>kg</span>}
            <span>{unit}</span>
            <span />
          </div>
          {Array.from({ length: Math.max(sx.sets, logsHere.length) }, (_, i) => {
            const log = logsHere[i]
            const prevSet = prev?.[i]
            const isNext = i === logsHere.length
            return (
              <div className={`set-row${isNext ? ' current' : ''}${bodyweight ? ' bodyweight' : ''}`} key={i}>
                <span className="n num">{i + 1}</span>
                <span className="prev num">{prevSet ? bodyweight ? `${prevSet.reps} ${unit}` : `${prevSet.weight > 0 ? prevSet.weight : '—'}×${prevSet.reps}` : '—'}</span>
                {log ? (
                  <>
                    {!bodyweight && <button className="set-cell done num" onClick={() => setEditor({ weight: log.weight, reps: log.reps, logId: log.id })}>
                      {log.weight > 0 ? log.weight : '—'}
                    </button>}
                    <button className="set-cell done num" onClick={() => setEditor({ weight: log.weight, reps: log.reps, logId: log.id })}>
                      {log.reps}
                    </button>
                    <span className="check-btn done">✓</span>
                  </>
                ) : (
                  <>
                    {!bodyweight && <button className="set-cell num" disabled={!isNext}
                      onClick={() => setEditor({ weight: defaultWeight(), reps: defaultReps() })}>
                      {isNext && exercise.loadType === 'external' ? (defaultWeight() || '?') : isNext ? '—' : ''}
                    </button>}
                    <button className="set-cell num" disabled={!isNext}
                      onClick={() => setEditor({ weight: defaultWeight(), reps: defaultReps() })}>
                      {isNext ? defaultReps() : ''}
                    </button>
                    <button className="check-btn" disabled={!isNext} onClick={quickLog}>✓</button>
                  </>
                )}
              </div>
            )
          })}
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn btn-ghost btn-sm grow" disabled={equipmentFreeSession && logsHere.length > 0}
            onClick={() => setSubOpen(true)}>{bodyweight ? 'Variações' : 'Trocar'}</button>
          <button className="btn btn-ghost btn-sm grow" onClick={() => nav(`/exercise/${exercise.id}`)}>Como fazer</button>
          <button className="btn btn-ghost btn-sm grow" onClick={() => { skipExercise(idx) }}>Pular →</button>
        </div>
        {equipmentFreeSession && logsHere.length > 0 && <p className="tiny faint" style={{ marginTop: 8 }}>
          Escolha a variação antes da primeira série deste exercício. As séries registradas permanecem no histórico.
        </p>}

      </main>

      <footer className="player-foot">
        <RestTimer />
        <div className="row">
          <button className="btn btn-ghost" style={{ flex: 1 }} disabled={idx === 0} onClick={goPrev}>← Anterior</button>
          <button className="btn btn-primary" style={{ flex: 1 }} disabled={idx === session.exercises.length - 1} onClick={goNext}>Próximo →</button>
        </div>
        <button className={`btn ${allExercisesDone ? 'btn-primary' : 'btn-quiet'}`} style={{ width: '100%', marginTop: 8 }} onClick={() => setFinishOpen(true)}>Encerrar treino</button>
      </footer>

      {editor && (
        <div className="modal-back" onClick={() => setEditor(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); confirmEditor() }}>
            <h2>{editor.logId ? 'Editar série' : `Série ${nextSetNumber}`}</h2>
            {exercise.loadType === 'external' && (
              <NumberDial label="Carga (kg)" value={editor.weight} min={0}
                onChange={(weight) => setEditor((current) => current ? { ...current, weight } : null)} />
            )}
            <NumberDial label={isTimed ? 'Segundos' : 'Repetições'} value={editor.reps} min={1} integer
              onChange={(reps) => setEditor((current) => current ? { ...current, reps } : null)} />
            <button type="submit" className="btn btn-primary" style={{ marginTop: 20 }}>
              {editor.logId ? 'Salvar' : 'Registrar série'}
            </button>
            {editor.logId && (
              <button type="button" className="btn btn-danger" style={{ marginTop: 10 }}
                onClick={() => { deleteSet(editor.logId!); setEditor(null) }}>
                Excluir série
              </button>
            )}
          </form>
        </div>
      )}

      {subOpen && (
        <SubstituteModal
          exercise={exercise}
          onClose={() => setSubOpen(false)}
          onPick={(newId, scope) => { substitute(idx, newId, scope); setSubOpen(false) }}
        />
      )}

      {menuOpen && (
        <div className="modal-back" onClick={() => setMenuOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Opções</h2>
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-ghost" onClick={() => { setMenuOpen(false); setFinishOpen(true) }}>
                Encerrar treino agora
              </button>
              <button className="btn btn-danger" style={{ marginTop: 10 }}
                onClick={() => { if (confirm('Descartar este treino? As séries registradas serão perdidas.')) { discardActive(); nav('/home') } }}>
                Descartar treino
              </button>
              <button className="btn btn-quiet" onClick={() => setMenuOpen(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {finishOpen && (
        <div className="modal-back" onClick={() => setFinishOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Como foi o treino?</h2>
            <p className="muted small" style={{ marginTop: 6 }}>
              {doneSets < totalSets
                ? `Você registrou ${doneSets} de ${totalSets} séries. O treino será salvo como parcial.`
                : 'Todas as séries registradas.'}
            </p>
            <div className="eyebrow" style={{ marginTop: 16 }}>Esforço percebido</div>
            <div className="rpe" style={{ marginTop: 8 }}>
              {([[1, 'Muito leve'], [2, 'Leve'], [3, 'Moderado'], [4, 'Pesado'], [5, 'Máximo']] as const).map(([v, t]) => (
                <button key={v} onClick={() => doFinish(v)} aria-label={`${v}: ${t}`}>
                  <b className="num">{v}</b><span>{t}</span>
                </button>
              ))}
            </div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => doFinish(undefined)}>
              Encerrar sem avaliar
            </button>
          </div>
        </div>
      )}

      {watchModalOpen && (
        <WatchModal syncState={syncState} onClose={() => setWatchModalOpen(false)} />
      )}
    </div>
  )
}

function RestTimer() {
  const timer = useStore((s) => s.activeSession?.timer ?? null)
  const clearTimer = useStore((s) => s.clearTimer)
  const startTimer = useStore((s) => s.startTimer)
  const [, force] = useState(0)
  const firedFor = useRef<number | null>(null)

  useEffect(() => {
    if (!timer) return
    const iv = setInterval(() => force((x) => x + 1), 250)
    return () => clearInterval(iv)
  }, [timer])

  if (!timer) return null
  const remaining = Math.ceil((timer.endsAt - Date.now()) / 1000)

  if (remaining <= 0) {
    if (firedFor.current !== timer.endsAt) {
      firedFor.current = timer.endsAt
      beep()
      vibrate([180, 90, 180])
    }
    return (
      <div className="timer-bar done">
        <span className="t green">0:00</span>
        <span className="grow small green">Descanso encerrado — próxima série!</span>
        <button className="btn btn-ghost btn-sm" onClick={clearTimer}>OK</button>
      </div>
    )
  }

  return (
    <div className="timer-bar">
      <span className="t num">{fmtClock(remaining)}</span>
      <span className="grow small muted">descanso</span>
      <button className="btn btn-ghost btn-sm" onClick={() => startTimer(remaining + 30)}>+30s</button>
      <button className="btn btn-ghost btn-sm" onClick={clearTimer}>Pular</button>
    </div>
  )
}

function SubstituteModal({ exercise, onClose, onPick }: {
  exercise: Exercise
  onClose: () => void
  onPick: (id: string, scope: 'today' | 'always') => void
}) {
  const profile = useStore((s) => s.profile)!
  const session = useStore((s) => s.activeSession)!
  const plan = useStore((s) => s.plan)
  const equipmentFree = isEquipmentFreeSession(session, plan)
  const [chosen, setChosen] = useState<Exercise | null>(null)
  const options = equivalentsFor(exercise.id, session.profileSnapshot ?? profile)
    .filter((ex) => !equipmentFree || isEquipmentFree(ex))
    .sort((a, b) => Number(variationLabel(exercise.id, a.id) === 'Outra variação') - Number(variationLabel(exercise.id, b.id) === 'Outra variação'))

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={`Variações de ${exercise.name}`} onClick={(e) => e.stopPropagation()}>
        <div className="between" style={{ marginBottom: 12 }}>
          <span className="eyebrow">{exercise.loadType === 'bodyweight' ? 'Ajuste a dificuldade' : 'Substituir exercício'}</span>
          <button className="btn-quiet" onClick={onClose}>Fechar</button>
        </div>
        {!chosen ? (
          <>
            <h2>Trocar {exercise.name}</h2>
            <p className="muted small" style={{ marginTop: 4 }}>{equipmentFree ? 'Variações sem equipamentos, respeitando seu perfil:' : 'Equivalentes com o seu equipamento:'}</p>
            <div style={{ marginTop: 8 }}>
              {options.length === 0 && <p className="muted small">Nenhum equivalente disponível — você pode pular este exercício.</p>}
              {options.slice(0, 8).map((o) => (
                <button key={o.id} className="list-item" onClick={() => setChosen(o)}>
                  <div className="grow">
                    <h3>{o.name}</h3>
                    <span className="tiny faint">{exercise.loadType === 'bodyweight' ? variationLabel(exercise.id, o.id) : o.equivGroup === exercise.equivGroup ? 'Mesmo padrão de movimento' : 'Estímulo semelhante'}</span>
                  </div>
                  <span className="chev">›</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2>{chosen.name}</h2>
            <p className="muted small" style={{ marginTop: 4 }}>Aplicar a troca:</p>
            <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => onPick(chosen.id, 'today')}>
              Só neste treino
            </button>
            {session.source !== 'home' && <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => onPick(chosen.id, 'always')}>
              Sempre (atualiza o plano)
            </button>}
            <button className="btn btn-quiet" onClick={() => setChosen(null)}>← Outras opções</button>
          </>
        )}
      </div>
    </div>
  )
}
