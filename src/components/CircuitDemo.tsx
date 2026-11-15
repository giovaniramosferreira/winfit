import artManifest from '../data/circuitIllustrations.json'
import { circuitDemoFor } from '../data/circuitDemos'
import type { ExerciseIllustration } from '../data/exerciseIllustrations'
import IllustratedExerciseDemo from './IllustratedExerciseDemo'
import { InkDemo } from './ExerciseDemo'

const ART = artManifest as Record<string, Omit<ExerciseIllustration, 'cue'>>

/** Arte em tinta do catálogo quando empacotada (docs/media/circuit); senão, o boneco vetorial. */
export function circuitArtFor(moveId: string, modified: boolean): ExerciseIllustration | undefined {
  const art = ART[modified ? `${moveId}-mod` : moveId]
  const demo = circuitDemoFor(moveId, modified)
  return art && demo ? { ...art, cue: demo.cue } : undefined
}

export default function CircuitDemo({ moveId, modified, name, autoPlay = false, compact = false }: { moveId: string; modified: boolean; name: string; autoPlay?: boolean; compact?: boolean }) {
  const art = circuitArtFor(moveId, modified)
  if (art) return <IllustratedExerciseDemo pilot={art} name={name} autoPlay={autoPlay} compact={compact} />
  const demo = circuitDemoFor(moveId, modified)
  return demo ? <InkDemo demo={demo} name={name} autoPlay={autoPlay} compact={compact} /> : null
}
