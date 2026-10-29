import type { Exercise } from '../types'

/** Input bounds are UI affordances, never migration rules for saved history. */
export function maximumInputLoad(exercise: Exercise, knownLoads: number[] = []): number {
  const base = exercise.id === 'leg-press' ? 600
    : exercise.equipment.includes('barra') ? 350
    : exercise.equipment.includes('halteres') || exercise.equipment.includes('kettlebell') ? 100
    : exercise.equipment.includes('maquinas') || exercise.equipment.includes('polia') ? 250 : 100
  const known = Math.max(0, ...knownLoads.filter(Number.isFinite))
  return Math.max(base, Math.ceil(known * 1.2))
}
