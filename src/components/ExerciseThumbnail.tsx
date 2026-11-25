import { EXERCISE_ILLUSTRATIONS } from '../data/exerciseIllustrations'

/** One decorative frame; the adjacent exercise name labels the link. */
export default function ExerciseThumbnail({ exerciseId }: { exerciseId: string }) {
  const art = EXERCISE_ILLUSTRATIONS[exerciseId]
  if (!art) return <span className="exercise-thumbnail" aria-hidden="true">◇</span>
  const columns = art.motion?.columns ?? 3
  const rows = art.motion?.rows ?? 2
  return <span className="exercise-thumbnail" aria-hidden="true"><span style={{ aspectRatio: art.aspectRatio, backgroundImage: `url(${art.sprite})`, backgroundSize: `${columns * 100}% ${rows * 100}%` }} /></span>
}
