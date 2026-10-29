import { useId, useState } from 'react'
import type { CSSProperties } from 'react'
import { spriteMotion } from '../lib/spriteMotion'
import type { ExerciseIllustration } from '../data/exerciseIllustrations'

/** Atlas local: a animação muda o quadro, sem deformar o desenho ou atualizar React a cada frame. */
export default function IllustratedExerciseDemo({ pilot, name, autoPlay = false, compact = false }: { pilot: ExerciseIllustration; name: string; autoPlay?: boolean; compact?: boolean }) {
  const cueId = useId()
  const [playing, setPlaying] = useState(autoPlay)
  const [failed, setFailed] = useState(false)

  const motion = pilot.motion && !pilot.hold ? spriteMotion(pilot.motion) : null

  return <figure className={`exercise-demo illustrated-pilot${failed ? ' is-failed' : ''}${compact ? ' is-compact' : ''}${autoPlay ? ' is-autoplay' : ''}`}>
    <div className="between">
      <span className="eyebrow">Demonstração ilustrada</span>
      <span className="tiny faint">{pilot.hold ? 'Posição de sustentação' : 'Sequência ilustrada'}</span>
    </div>
    {motion && <style>{motion.keyframes}</style>}
    <div className="pilot-artboard" style={{ aspectRatio: pilot.aspectRatio, '--illustration-ratio': pilot.aspectRatio } as CSSProperties}>
      {failed ? <p className="small muted">Não foi possível carregar o desenho. Confira as instruções abaixo.</p> : <>
        <img src={pilot.sprite} alt="" className="pilot-preload" aria-hidden="true" onError={() => setFailed(true)} />
        <div className={`pilot-frames ${pilot.hold ? 'pilot-hold' : `pilot-cycle-${pilot.cycle}`}${playing ? ' is-playing' : ''}`} role="img" aria-label={`${name}: ${pilot.cue}`}
          style={{ backgroundImage: `url(${pilot.sprite})`, animationPlayState: playing ? 'running' : 'paused', ...(motion ? { animationName: motion.name, animationDuration: motion.duration, backgroundSize: motion.backgroundSize } : {}) }} />
      </>}
    </div>
    <figcaption id={cueId} className="small muted">{pilot.cue}</figcaption>
    {pilot.hold ? <p className="tiny faint" style={{ marginTop: 8 }}>Posição de sustentação · conte o tempo em segundos.</p>
      : !failed && !autoPlay && <button type="button" className="btn-quiet demo-control" aria-pressed={playing}
      aria-describedby={cueId} onClick={() => setPlaying(!playing)}>
      {playing ? 'Pausar demonstração' : 'Reproduzir demonstração'}
    </button>}
  </figure>
}
