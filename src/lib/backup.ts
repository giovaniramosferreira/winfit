import type { Plan, PRRecord, Session, TrainingProfile } from '../types'
import { byId } from '../data/exercises'

export interface WorkoutBackup {
  app: 'winfit'
  schemaVersion: 2
  profile: TrainingProfile | null
  plan: Plan | null
  archivedPlans: Plan[]
  sessions: Session[]
  activeSession: Session | null
  prs: PRRecord[]
}
type RecordValue = Record<string, unknown>
const object = (v: unknown): v is RecordValue => !!v && typeof v === 'object' && !Array.isArray(v)
const number = (v: unknown, min = 0): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min
const text = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length < 10000
const list = (v: unknown, valid: (item: unknown) => boolean): boolean => Array.isArray(v) && v.length <= 10000 && v.every(valid)
const unique = (items: unknown, field = 'id'): boolean => Array.isArray(items) && new Set(items.map((v) => object(v) ? v[field] : undefined)).size === items.length
const strings = (v: unknown): boolean => list(v, text)
const member = (v: unknown, values: string[]): boolean => typeof v === 'string' && values.includes(v)
function profile(v: unknown): boolean {
  return object(v) && member(v.goal, ['health', 'hypertrophy', 'fat_loss', 'strength', 'return_fitness']) &&
    member(v.experience, ['none', 'little', 'intermediate', 'advanced']) &&
    member(v.currentState, ['active', 'sometimes', 'paused_months', 'paused_long']) &&
    member(v.location, ['gym_full', 'gym_basic', 'home_equipment', 'home_none']) &&
    list(v.equipment, (x) => member(x, ['halteres', 'barra', 'banco', 'elasticos', 'barra_fixa', 'kettlebell', 'maquinas', 'polia', 'peso_corporal'])) &&
    list(v.limitations, (x) => member(x, ['joelho', 'lombar', 'ombro', 'punho'])) &&
    number(v.frequency, 2) && v.frequency <= 7 && number(v.sessionTimeMin, 1) && object(v.biometrics) && number(v.version)
}
function exercise(v: unknown, plan = false): boolean {
  return object(v) && text(plan ? v.id : v.planExerciseId) && text(v.exerciseId) &&
    (!plan || byId.has(v.exerciseId)) && number(v.sets, 1) && Number.isInteger(v.sets) &&
    number(v.repMin, 1) && number(v.repMax, 1) && v.repMax >= v.repMin && number(v.restSec) &&
    typeof v.optional === 'boolean' && (plan ? text(v.slotType) : typeof v.skipped === 'boolean')
}
function plan(v: unknown): boolean {
  return object(v) && text(v.id) && number(v.createdAt) && text(v.splitType) && text(v.splitLabel) &&
    strings(v.rationale) && strings(v.notes) && profile(v.profileSnapshot) && member(v.status, ['active', 'archived']) &&
    Array.isArray(v.days) && v.days.length > 0 && list(v.days, (day) => object(day) && text(day.id) && text(day.label) &&
      number(day.position) && number(day.estMin) && strings(day.targetMuscles) && Array.isArray(day.exercises) &&
      day.exercises.length > 0 && list(day.exercises, (x) => exercise(x, true)))
}
function log(v: unknown): boolean {
  return object(v) && text(v.id) && text(v.exerciseId) && text(v.planExerciseId) && number(v.setNumber, 1) &&
    number(v.weight) && number(v.reps, 1) && Number.isInteger(v.reps) && number(v.ts) && typeof v.isPR === 'boolean'
}
function session(v: unknown): boolean {
  if (!object(v) || !text(v.id) || !text(v.planId) || !text(v.dayId) || !text(v.dayLabel) || !number(v.startedAt) ||
    !member(v.status, ['active', 'completed', 'partial', 'discarded']) || !list(v.exercises, (x) => exercise(x)) ||
    !list(v.logs, log) || !unique(v.logs) || !unique(v.exercises, 'planExerciseId') || !number(v.currentIndex) || !Number.isInteger(v.currentIndex) ||
    !Array.isArray(v.exercises) || v.exercises.length === 0 || v.currentIndex >= v.exercises.length) return false
  if (v.status === 'active' && !v.exercises.every((x) => object(x) && typeof x.exerciseId === 'string' && byId.has(x.exerciseId))) return false
  return (v.endedAt === undefined || number(v.endedAt)) &&
    (v.timer === null || (object(v.timer) && number(v.timer.endsAt) && number(v.timer.totalSec)))
}
function pr(v: unknown): boolean {
  return object(v) && text(v.id) && text(v.exerciseId) && text(v.sessionId) &&
    member(v.type, ['max_weight', 'e1rm']) && number(v.value) && number(v.reps) && number(v.ts)
}

/** Validation finishes before the caller changes any state. Legacy exports are v1. */
export function parseWorkoutBackup(input: unknown): WorkoutBackup {
  if (!object(input) || (input.app !== undefined && input.app !== 'winfit') ||
    (input.schemaVersion !== undefined && input.schemaVersion !== 1 && input.schemaVersion !== 2)) throw new Error('Backup ou versão não reconhecida.')
  const nullable = (value: unknown, valid: (v: unknown) => boolean) => value == null || valid(value)
  if (!nullable(input.profile, profile) || !nullable(input.plan, plan) ||
    !list(input.archivedPlans ?? [], plan) || !list(input.sessions ?? [], session) ||
    !nullable(input.activeSession, session) || !list(input.prs ?? [], pr) || !unique(input.sessions ?? []) ||
    !unique(input.archivedPlans ?? []) || !unique(input.prs ?? [])) throw new Error('Backup inválido. Nenhum dado foi substituído.')
  return { app: 'winfit', schemaVersion: 2, profile: (input.profile ?? null) as TrainingProfile | null,
    plan: (input.plan ?? null) as Plan | null, archivedPlans: (input.archivedPlans ?? []) as Plan[],
    sessions: (input.sessions ?? []) as Session[], activeSession: (input.activeSession ?? null) as Session | null,
    prs: (input.prs ?? []) as PRRecord[] }
}

function union<T extends { id: string }>(local: T[], remote: T[]): T[] {
  return [...new Map([...remote, ...local].map((item) => [item.id, item])).values()]
}
function mergeSession(local: Session, remote: Session): Session {
  const counts = new Map<string, number>()
  const logs = union(local.logs, remote.logs).sort((a, b) => a.ts - b.ts).map((log) => {
    const setNumber = (counts.get(log.planExerciseId) ?? 0) + 1
    counts.set(log.planExerciseId, setNumber)
    return { ...log, setNumber }
  })
  const terminal = local.status !== 'active' ? local : remote.status !== 'active' ? remote : local
  return { ...terminal, logs, timer: terminal.status === 'active' ? terminal.timer : null }
}
/** Local values win conflicts only after the user explicitly chooses reconciliation. */
export function mergeWorkouts(local: WorkoutBackup, remote: WorkoutBackup): WorkoutBackup {
  const chosenPlan = local.plan ?? remote.plan
  const records = new Map<string, Session>()
  for (const s of [...remote.sessions, ...local.sessions]) records.set(s.id, records.has(s.id) ? mergeSession(s, records.get(s.id)!) : mergeSession(s, s))
  let active = local.activeSession ?? remote.activeSession
  if (active && records.has(active.id)) { records.set(active.id, mergeSession(records.get(active.id)!, active)); active = null }
  if (local.activeSession && remote.activeSession) {
    if (local.activeSession.id === remote.activeSession.id && active) active = mergeSession(local.activeSession, remote.activeSession)
    else if (remote.activeSession.id !== active?.id) {
      const pending = remote.activeSession
      records.set(pending.id, records.has(pending.id) ? mergeSession(records.get(pending.id)!, pending) :
        { ...pending, status: 'partial', timer: null, dayLabel: pending.dayLabel + ' · recuperado de outro aparelho' })
    }
  }
  return { app: 'winfit', schemaVersion: 2, profile: local.profile ?? remote.profile, plan: chosenPlan,
    archivedPlans: union([...local.archivedPlans, ...(remote.plan && remote.plan.id !== chosenPlan?.id ? [remote.plan] : [])], remote.archivedPlans)
      .filter((item) => item.id !== chosenPlan?.id),
    sessions: [...records.values()].sort((a, b) => b.startedAt - a.startedAt),
    activeSession: active, prs: union(local.prs, remote.prs) }
}
