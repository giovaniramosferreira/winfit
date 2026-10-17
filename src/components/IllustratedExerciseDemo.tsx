import { useId, useState } from 'react'
import type { CSSProperties } from 'react'
import type { ExerciseIllustration } from '../data/exerciseIllustrations'

/** Atlas local: a animação muda o quadro, sem deformar o desenho ou atualizar React a cada frame. */
export default function IllustratedExerciseDemo({ pilot, name }: { pilot: ExerciseIllustration; name: string }) {
  const cueId = useId()
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)

  return <figure className={`exercise-demo illustrated-pilot${failed ? ' is-failed' : ''}`}>
    <div className="between">
      <span className="eyebrow">Demonstração ilustrada</span>
      <span className="tiny faint">{pilot.hold ? 'Posição de sustentação' : 'Sequência ilustrada'}</span>
    </div>
    <div className="pilot-artboard" style={{ aspectRatio: pilot.aspectRatio, '--illustration-ratio': pilot.aspectRatio } as CSSProperties}>
      {failed ? <p className="small muted">Não foi possível carregar o desenho. Confira as instruções abaixo.</p> : <>
        <img src={pilot.sprite} alt="" className="pilot-preload" aria-hidden="true" onError={() => setFailed(true)} />
        <div className={`pilot-frames ${pilot.hold ? 'pilot-hold' : `pilot-cycle-${pilot.cycle}`}${playing ? ' is-playing' : ''}`} role="img" aria-label={`${name}: ${pilot.cue}`}
          style={{ backgroundImage: `url(${pilot.sprite})`, animationPlayState: playing ? 'running' : 'paused' }} />
      </>}
    </div>
    <figcaption id={cueId} className="small muted">{pilot.cue}</figcaption>
    {pilot.hold ? <p className="tiny faint" style={{ marginTop: 8 }}>Posição de sustentação · conte o tempo em segundos.</p>
      : !failed && <button type="button" className="btn-quiet demo-control" aria-pressed={playing}
      aria-describedby={cueId} onClick={() => setPlaying(!playing)}>
      {playing ? 'Pausar demonstração' : 'Reproduzir demonstração'}
    </button>}
  </figure>
}
