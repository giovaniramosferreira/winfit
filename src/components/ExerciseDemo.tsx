import { useCallback, useId, useRef, useState } from 'react'
import { MOVEMENT_DEMOS } from '../data/movementDemos'
import InkFigure from './InkFigure'
import ExerciseEquipment from './ExerciseEquipment'
import { EXERCISE_ILLUSTRATIONS } from '../data/exerciseIllustrations'
import IllustratedExerciseDemo from './IllustratedExerciseDemo'

export default function ExerciseDemo({ exerciseId, name }: { exerciseId: string; name: string }) {
  const pilot = EXERCISE_ILLUSTRATIONS[exerciseId]
  return pilot ? <IllustratedExerciseDemo key={exerciseId} pilot={pilot} name={name} />
    : <VectorExerciseDemo key={exerciseId} exerciseId={exerciseId} name={name} />
}

function VectorExerciseDemo({ exerciseId, name }: { exerciseId: string; name: string }) {
  const demo = MOVEMENT_DEMOS[exerciseId]
  const titleId = useId()
  const svg = useRef<SVGSVGElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const bindSvg = useCallback((element: SVGSVGElement | null) => {
    svg.current = element
    element?.pauseAnimations()
  }, [])
  if (!demo) return null

  const toggle = () => {
    if (!svg.current) return
    if (playing) svg.current.pauseAnimations()
    else svg.current.unpauseAnimations()
    setPlaying(!playing)
  }

  return (
    <figure className="exercise-demo">
      <div className="between">
        <span className="eyebrow">Demonstração ilustrada</span>
        <span className="tiny faint">{demo.view}</span>
      </div>
      <svg className="movement-illustration" viewBox="0 0 320 180" role="img" aria-labelledby={titleId}
        ref={bindSvg}>
        <title id={titleId}>{`${name}: ${demo.cue}`}</title>
        <line className="demo-floor" x1="20" y1="163" x2="300" y2="163" />
        <ExerciseEquipment demo={demo} />
        <InkFigure demo={demo} patternId={`shorts-${titleId.replace(/:/g, '')}`} />
        <ExerciseEquipment demo={demo} foreground />
      </svg>
      <figcaption id={`${titleId}-cue`} className="small muted">{demo.cue}</figcaption>
      {demo.hold
        ? <p className="tiny faint" style={{ marginTop: 8 }}>Posição de sustentação · conte o tempo em segundos.</p>
        : <button type="button" className="btn-quiet demo-control" aria-pressed={playing}
            aria-describedby={`${titleId}-cue`} onClick={toggle}>{playing ? 'Pausar demonstração' : 'Reproduzir demonstração'}</button>}
    </figure>
  )
}
