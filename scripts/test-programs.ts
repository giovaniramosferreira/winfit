import { PROGRAMS } from '../src/data/programs'
import { byId } from '../src/data/exercises'
import { buildPlanFromProgram } from '../src/lib/program'
import { canPerform, availableEquipment } from '../src/lib/generator'
import type { Limitation, TrainLocation, TrainingProfile } from '../src/types'

// Os programas são escritos à mão, então nada garante que um id exista ou que o
// exercício caiba no perfil — este teste é essa garantia.

if (typeof globalThis.crypto?.randomUUID !== 'function') {
  // @ts-expect-error polyfill mínimo para o ambiente de teste
  globalThis.crypto = { randomUUID: () => Math.random().toString(36).slice(2) }
}

let failures = 0
const fail = (msg: string) => { console.error('✗ ' + msg); failures++ }

// 1. Todo exerciseId citado existe no catálogo.
for (const prog of PROGRAMS)
  for (const day of prog.days)
    for (const item of day.items)
      if (!byId.has(item.exerciseId)) fail(`${prog.id} / ${day.label}: exercício inexistente "${item.exerciseId}"`)

// 2. Todo slot declarado bate com os slots reais do exercício.
for (const prog of PROGRAMS)
  for (const day of prog.days)
    for (const item of day.items) {
      const ex = byId.get(item.exerciseId)
      if (ex && !ex.slotTypes.includes(item.slot))
        fail(`${prog.id}: "${ex.name}" declarado como ${item.slot}, mas o catálogo diz ${ex.slotTypes.join('/')}`)
    }

// 3. Prescrição coerente.
for (const prog of PROGRAMS)
  for (const day of prog.days)
    for (const item of day.items) {
      if (item.repMin > item.repMax) fail(`${prog.id}: faixa de reps invertida em ${item.exerciseId}`)
      if (item.sets < 1 || item.sets > 6) fail(`${prog.id}: séries fora da faixa em ${item.exerciseId}`)
      if (item.restSec < 30 || item.restSec > 240) fail(`${prog.id}: descanso irreal em ${item.exerciseId}`)
    }

// 4. Com o equipamento que o programa exige, nada é trocado nem cortado.
for (const prog of PROGRAMS) {
  const full: TrainingProfile = {
    goal: 'hypertrophy', experience: 'advanced', currentState: 'active',
    location: 'gym_full', equipment: [], frequency: prog.daysPerWeek,
    sessionTimeMin: 75, limitations: [], biometrics: {}, version: 1,
  }
  const { fit } = buildPlanFromProgram(prog, full)
  if (fit.swaps.length > 0 || fit.dropped.length > 0)
    fail(`${prog.id}: numa academia completa e sem limitações, o programa deveria sair intacto (${fit.swaps.length} trocas, ${fit.dropped.length} cortes)`)
}

// 5. O plano construído respeita equipamento e limitações de qualquer perfil.
const LOCATIONS: TrainLocation[] = ['gym_full', 'gym_basic', 'home_equipment', 'home_none']
const LIMS: Limitation[][] = [[], ['joelho'], ['lombar'], ['ombro'], ['joelho', 'lombar', 'ombro', 'punho']]

let built = 0
for (const prog of PROGRAMS)
  for (const location of LOCATIONS)
    for (const limitations of LIMS) {
      const profile: TrainingProfile = {
        goal: 'hypertrophy', experience: 'intermediate', currentState: 'active',
        location, equipment: location === 'home_equipment' ? ['halteres', 'banco', 'elasticos'] : [],
        frequency: 3, sessionTimeMin: 60, limitations, biometrics: {}, version: 1,
      }
      const { plan, fit } = buildPlanFromProgram(prog, profile)
      built++
      const equip = availableEquipment(profile)
      for (const day of plan.days) {
        // Dia vazio só é aceitável quando falta o equipamento que define o programa.
        if (day.exercises.length === 0 && fit.missing.length === 0)
          fail(`${prog.id} @ ${location}: dia "${day.label}" ficou vazio com o equipamento completo`)
        for (const pe of day.exercises) {
          const ex = byId.get(pe.exerciseId)
          if (!ex) { fail(`${prog.id} @ ${location}: id resolvido inexistente`); continue }
          if (!canPerform(ex, equip, limitations))
            fail(`${prog.id} @ ${location} [${limitations.join(',') || 'sem limitação'}]: "${ex.name}" é inviável`)
        }
      }
    }

if (failures === 0)
  console.log(`${PROGRAMS.length} programas · ${built} perfis testados · 0 falhas
✓ Programas válidos: exercícios existem, slots batem, prescrição coerente, equipamento e limitações respeitados.`)
else {
  console.error(`\n${failures} falha(s).`)
  process.exit(1)
}
