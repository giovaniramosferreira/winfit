import type { Plan, PlanExercise, TrainingProfile, WorkoutDay, MuscleGroup } from '../types'
import type { Program, ProgramItem } from '../data/programs'
import { EXERCISES, byId } from '../data/exercises'
import { availableEquipment, canPerform, estimateDayMin } from './generator'

// Um programa curado é prescrição fechada, mas o filtro de equipamento e limitação
// continua valendo: prescrever o impossível derruba a confiança no app inteiro
// (seção 3, cluster 4). Quando o exercício não cabe, entra o equivalente mais próximo.

/** `null` = nem o exercício nem qualquer equivalente cabem no perfil. */
function resolveExercise(item: ProgramItem, p: TrainingProfile): { id: string; swapped: boolean } | null {
  const equip = availableEquipment(p)
  const base = byId.get(item.exerciseId)
  if (base && canPerform(base, equip, p.limitations)) return { id: base.id, swapped: false }

  const alt = EXERCISES.filter(
    (e) =>
      e.id !== item.exerciseId &&
      (base ? e.equivGroup === base.equivGroup : false) &&
      canPerform(e, equip, p.limitations),
  ).sort((a, b) => a.equivRank - b.equivRank)[0]

  const bySlot = EXERCISES.filter(
    (e) => e.slotTypes.includes(item.slot) && canPerform(e, equip, p.limitations),
  ).sort((a, b) => a.equivRank - b.equivRank)[0]

  const chosen = alt ?? bySlot
  // Sem equivalente viável o item sai: prescrever o impossível é pior que um dia
  // mais curto — mesma regra do gerador (seção 19).
  return chosen ? { id: chosen.id, swapped: true } : null
}

export interface ProgramFit {
  /** exercícios do programa que o perfil não consegue executar como escrito */
  swaps: { from: string; to: string }[]
  /** exercícios sem nenhum equivalente possível — saem do plano */
  dropped: string[]
  /** equipamento exigido pelo programa que o perfil não tem */
  missing: string[]
}

export function buildPlanFromProgram(program: Program, p: TrainingProfile): { plan: Plan; fit: ProgramFit } {
  const swaps: ProgramFit['swaps'] = []
  const dropped: string[] = []
  const equip = availableEquipment(p)

  const days: WorkoutDay[] = program.days.map((d, di) => {
    const exercises: PlanExercise[] = d.items.flatMap((item) => {
      const r = resolveExercise(item, p)
      if (!r) { dropped.push(item.exerciseId); return [] }
      if (r.swapped) swaps.push({ from: item.exerciseId, to: r.id })
      return [{
        id: crypto.randomUUID(),
        exerciseId: r.id,
        slotType: item.slot,
        sets: item.sets,
        repMin: item.repMin,
        repMax: item.repMax,
        restSec: item.restSec,
        optional: item.optional ?? false,
      }]
    })

    const muscles = [...new Set(exercises.map((e) => byId.get(e.exerciseId)?.primary).filter(Boolean))] as MuscleGroup[]

    return {
      id: crypto.randomUUID(),
      label: d.label,
      position: di,
      targetMuscles: muscles,
      estMin: estimateDayMin(exercises),
      exercises,
    }
  })

  const notes: string[] = []
  if (swaps.length > 0)
    notes.push(
      `${swaps.length} exercício${swaps.length > 1 ? 's foram trocados' : ' foi trocado'} por equivalentes que cabem no seu equipamento e nas suas limitações.`,
    )
  if (dropped.length > 0)
    notes.push(
      `${dropped.length} exercício${dropped.length > 1 ? 's saíram' : ' saiu'} do plano por não ter equivalente possível com o que você tem. Cadastre mais equipamentos no Perfil para receber o programa completo.`,
    )
  const longest = Math.max(...days.map((d) => d.estMin))
  if (longest > p.sessionTimeMin + 10)
    notes.push(
      `As sessões deste programa levam ~${longest} min — acima dos ${p.sessionTimeMin} min que você declarou. Os exercícios marcados como opcionais são os primeiros a cortar num dia curto.`,
    )

  const plan: Plan = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    splitType: `program:${program.id}`,
    splitLabel: program.name,
    rationale: program.rationale,
    notes,
    days,
    profileSnapshot: { ...p },
    status: 'active',
  }

  return {
    plan,
    fit: { swaps, dropped, missing: program.requires.filter((e) => !equip.includes(e)) },
  }
}

/** Programa é "pronto para usar" quando nada precisa ser trocado nem cortado. */
export function previewFit(program: Program, p: TrainingProfile): ProgramFit {
  const equip = availableEquipment(p)
  const swaps: ProgramFit['swaps'] = []
  const dropped: string[] = []
  for (const d of program.days)
    for (const item of d.items) {
      const r = resolveExercise(item, p)
      if (!r) dropped.push(item.exerciseId)
      else if (r.swapped) swaps.push({ from: item.exerciseId, to: r.id })
    }
  return { swaps, dropped, missing: program.requires.filter((e) => !equip.includes(e)) }
}
