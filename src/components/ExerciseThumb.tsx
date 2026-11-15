import { EXERCISE_ILLUSTRATIONS } from '../data/exerciseIllustrations'

/** Primeiro quadro da arte do exercício, como miniatura decorativa. */
export default function ExerciseThumb({ exerciseId, size = 56 }: { exerciseId: string; size?: number }) {
  const art = EXERCISE_ILLUSTRATIONS[exerciseId]
  return <span className="ex-thumb" aria-hidden="true" style={{ width: size, height: size }}>
    {art && <span className="ex-thumb-frame" style={{
      aspectRatio: art.aspectRatio,
      backgroundImage: `url(${art.sprite})`,
      backgroundSize: art.hold ? '100% 100%' : `${(art.motion?.columns ?? 3) * 100}% ${(art.motion?.rows ?? 2) * 100}%`,
    }} />}
  </span>
}
