import packedCatalog from './catalogIllustrations.json'
import { EXERCISES } from './exercises'
import { ILLUSTRATION_PILOTS, type IllustrationPilot } from './illustrationPilots'

export interface ExerciseIllustration extends IllustrationPilot {
  hold?: boolean
}

type PackedIllustration = Omit<ExerciseIllustration, 'cue'>

const packed = packedCatalog as Record<string, PackedIllustration>

/** Only completed local assets enter the renderer; approved pilots retain their original cues and poses. */
export const EXERCISE_ILLUSTRATIONS: Record<string, ExerciseIllustration> = {
  ...Object.fromEntries(EXERCISES.flatMap(exercise => {
    const art = packed[exercise.id]
    return art ? [[exercise.id, { ...art, cue: exercise.instructions.join(' ') }]] : []
  })),
  ...ILLUSTRATION_PILOTS,
}
