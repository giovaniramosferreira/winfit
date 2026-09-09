import { EXERCISES } from '../data/exercises'
import type { Exercise, Plan, Session, TrainingProfile } from '../types'
import { generatePlan } from './generator'

// Estes itens usam apoio ou acessórios apesar de classificados como peso corporal.
const NEEDS_SUPPORT = new Set([
  'flexao-inclinada', 'flexao-declinada', 'remada-toalha',
  'flexora-deslizante', 'panturrilha-corporal',
])

export function isEquipmentFree(exercise: Exercise): boolean {
  return exercise.equipment.every((e) => e === 'peso_corporal') && !NEEDS_SUPPORT.has(exercise.id)
}

export function homeWorkout(profile: TrainingProfile, plan: Plan, seed: string, sessions: Session[]) {
  const homeProfile: TrainingProfile = {
    ...profile, location: 'home_none', equipment: [], frequency: 3,
    sessionTimeMin: Math.min(30, profile.sessionTimeMin),
  }
  const homePlan = generatePlan(homeProfile, `${seed}:home`, EXERCISES.filter(isEquipmentFree))
  homePlan.id = `${plan.id}:home`
  homePlan.days.forEach((day, index) => {
    day.id = `${homePlan.id}:${index}`
    day.label = `Em casa · ${day.label}`
  })
  const done = sessions.filter((s) => s.planId === homePlan.id)
  const day = homePlan.days[done.length % homePlan.days.length]
  return { plan: homePlan, day }
}
