import type { Exercise, Plan, Session } from '../types'

// Estes movimentos precisam de apoio além do chão, mesmo com carga corporal.
const NEEDS_SUPPORT = new Set(['flexao-inclinada', 'flexao-declinada', 'remada-toalha', 'flexora-deslizante', 'panturrilha-corporal'])
const TIMED_IDS = new Set(['prancha', 'prancha-lateral', 'prancha-joelhos', 'prancha-lateral-joelhos'])

export function isEquipmentFree(exercise: Exercise): boolean {
  return exercise.equipment.every((e) => e === 'peso_corporal') && !NEEDS_SUPPORT.has(exercise.id)
}

export function isTimedExercise(exerciseId: string): boolean {
  return TIMED_IDS.has(exerciseId)
}

export function isEquipmentFreeSession(session: Session, plan: Plan | null): boolean {
  return session.source === 'home' || session.profileSnapshot?.location === 'home_none'
    || (session.planId === plan?.id && plan?.profileSnapshot.location === 'home_none')
}

// Só comparamos dificuldade dentro de uma mesma família de movimento.
const PROGRESSIONS = [
  ['flexao-joelhos', 'flexao', 'flexao-diamante'],
  ['ponte-gluteo', 'ponte-unilateral'],
  ['prancha-joelhos', 'prancha'],
  ['prancha-lateral-joelhos', 'prancha-lateral'],
]

export function variationLabel(currentId: string, alternativeId: string): string {
  const family = PROGRESSIONS.find((ids) => ids.includes(currentId) && ids.includes(alternativeId))
  if (!family) return 'Outra variação'
  return family.indexOf(alternativeId) < family.indexOf(currentId) ? 'Mais fácil' : 'Mais difícil'
}
