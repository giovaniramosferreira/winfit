import { byId } from '../data/exercises'
import type { Exercise, Plan, PlanExercise, Session, SlotType, TrainingProfile, WorkoutDay } from '../types'
import { canPerform, estimateDayMin } from './generator'
import { isEquipmentFree, isTimedExercise } from './exerciseRules'
export { isEquipmentFree } from './exerciseRules'

type Move = { id: string; slot: SlotType; alternate?: string }
const CYCLE: Array<{ label: string; moves: Move[] }> = [
  { label: 'Casa A · base completa', moves: [
    { id: 'agachamento-corporal', slot: 'knee_comp' }, { id: 'flexao', slot: 'push_h_comp' }, { id: 'puxada-prona-solo', slot: 'pull_h_comp' },
    { id: 'ponte-gluteo', slot: 'hip_comp' }, { id: 'prancha', slot: 'core' },
  ] },
  { label: 'Casa B · unilateral e core', moves: [
    { id: 'avanco-corporal', alternate: 'agachamento-corporal', slot: 'lower_uni' }, { id: 'pike-pushup', alternate: 'flexao', slot: 'push_v_comp' }, { id: 'puxada-prona-solo', slot: 'pull_v_comp' },
    { id: 'ponte-unilateral', alternate: 'ponte-gluteo', slot: 'hip_comp' }, { id: 'dead-bug', slot: 'core' },
  ] },
  { label: 'Casa C · controle e estabilidade', moves: [
    { id: 'agachamento-corporal', slot: 'knee_comp' }, { id: 'flexao-diamante', alternate: 'flexao', slot: 'push_h_comp' }, { id: 'puxada-prona-solo', slot: 'pull_h_comp' },
    { id: 'ponte-gluteo', slot: 'hip_comp' }, { id: 'prancha-lateral', alternate: 'dead-bug', slot: 'core' },
  ] },
]

function setsFor(profile: TrainingProfile, slot: SlotType) {
  let sets = profile.experience === 'advanced' ? 4 : profile.experience === 'intermediate' ? 3 : 2
  if (profile.currentState === 'paused_months' || profile.currentState === 'paused_long') sets = Math.max(2, sets - 1)
  return slot === 'core' ? Math.min(sets, 3) : sets
}
function choose(move: Move, profile: TrainingProfile) {
  const skill = profile.experience === 'advanced' ? 3 : profile.experience === 'intermediate' ? 2 : 1
  return [byId.get(move.id), move.alternate ? byId.get(move.alternate) : undefined]
    .find((ex): ex is Exercise => Boolean(ex && ex.skill <= skill && isEquipmentFree(ex) && canPerform(ex, ['peso_corporal'], profile.limitations)))
}
function prescription(profile: TrainingProfile, move: Move, exercise: Exercise): PlanExercise {
  const timed = isTimedExercise(exercise.id)
  return { id: crypto.randomUUID(), exerciseId: exercise.id, slotType: move.slot, optional: false, sets: setsFor(profile, move.slot),
    repMin: timed ? 20 : 8, repMax: timed ? 45 : 15, restSec: move.slot === 'core' ? 45 : 75 }
}

// Treino de home office cabe em ~30 min: corta uma série por vez, das maiores para as menores, até 2 por exercício.
const HOME_BUDGET_MIN = 30
function fitToBudget(exercises: PlanExercise[]) {
  while (estimateDayMin(exercises) > HOME_BUDGET_MIN) {
    const target = [...exercises].filter((e) => e.sets > 2).sort((a, b) => b.sets - a.sets)[0]
    if (!target) break
    target.sets -= 1
  }
}

export function homeWorkout(profile: TrainingProfile, plan: Plan, _seed: string, sessions: Session[]) {
  const homeId = `${plan.id}:home`
  const done = sessions.filter((s) => s.planId === homeId)
  const days: WorkoutDay[] = CYCLE.map((template, index) => {
    const exercises = template.moves.map((move) => {
      const exercise = choose(move, profile)
      return exercise ? prescription(profile, move, exercise) : null
    }).filter((item): item is PlanExercise => item !== null)
    fitToBudget(exercises)
    return { id: `${homeId}:${index}`, label: `Em casa · ${template.label}`, position: index,
      targetMuscles: [...new Set(exercises.map((e) => byId.get(e.exerciseId)!.primary))], exercises, estMin: estimateDayMin(exercises) }
  })
  const homePlan: Plan = {
    id: homeId, createdAt: plan.createdAt, status: 'active', splitType: 'home_full_body', splitLabel: 'Calistenia corpo inteiro · ciclo A/B/C',
    profileSnapshot: { ...profile, location: 'home_none', equipment: [] }, days,
    rationale: ['Sessões de corpo inteiro permitem treinar os principais padrões mesmo em dias avulsos de home office.', 'A progressão vem de repetições, execução mais controlada e variações unilaterais — sem improvisar equipamentos inseguros.'],
    notes: ['Sem barra fixa ou elástico, não há puxada com carga equivalente. A puxada prona trabalha controle das escápulas e costas; para desenvolver puxada de verdade, adicione uma barra fixa ou elástico ao seu setup.'],
  }
  return { plan: homePlan, day: homePlan.days[done.length % homePlan.days.length] }
}
