import { parseWorkoutBackup, type WorkoutBackup } from './backup'
import type { OnboardingDraft } from '../types'

type Port = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
type Health = { error: string | null; blocked: boolean }
export const WORKOUT_STORAGE_KEY = 'winfit-v1'
type SavedWorkout = Omit<WorkoutBackup, 'app' | 'schemaVersion'> & { seed?: string; watchToken?: string; draft: OnboardingDraft | null; lastSetUndo: null }
function safeDraft(input: unknown): OnboardingDraft | null {
  if (!input || typeof input !== 'object') return null
  const d = input as Record<string, unknown>
  if (!Number.isInteger(d.step) || Number(d.step) < 0 || Number(d.step) > 10) return null
  const result: Record<string, unknown> = { step: d.step }
  const enums: Record<string, string[]> = {
    goal: ['hypertrophy', 'fat_loss', 'strength', 'return_fitness', 'health'], experience: ['none', 'little', 'intermediate', 'advanced'],
    currentState: ['active', 'sometimes', 'paused_months', 'paused_long'], location: ['gym_full', 'gym_basic', 'home_equipment', 'home_none'],
  }
  for (const [key, allowed] of Object.entries(enums)) if (typeof d[key] === 'string' && allowed.includes(d[key] as string)) result[key] = d[key]
  if (Number.isInteger(d.frequency) && Number(d.frequency) >= 2 && Number(d.frequency) <= 6) result.frequency = d.frequency
  if ([30, 45, 60, 75].includes(Number(d.sessionTimeMin))) result.sessionTimeMin = Number(d.sessionTimeMin)
  for (const [key, allowed] of Object.entries({ equipment: ['halteres', 'barra', 'banco', 'elasticos', 'barra_fixa', 'kettlebell', 'maquinas', 'polia', 'peso_corporal'], limitations: ['joelho', 'lombar', 'ombro', 'punho'] })) {
    if (Array.isArray(d[key]) && (d[key] as unknown[]).every((item) => typeof item === 'string' && allowed.includes(item))) result[key] = d[key]
  }
  if (d.biometrics && typeof d.biometrics === 'object') {
    const b = d.biometrics as Record<string, unknown>; const values: Record<string, unknown> = {}
    for (const key of ['age', 'weightKg', 'heightCm']) if (typeof b[key] === 'number' && Number.isFinite(b[key]) && Number(b[key]) > 0) values[key] = b[key]
    if (['f', 'm', 'na'].includes(String(b.sex))) values.sex = b.sex
    result.biometrics = values
  }
  return result as unknown as OnboardingDraft
}
/** Whitelist data fields. Persisted action names can never replace live store methods. */
export function safeWorkoutState(input: unknown): SavedWorkout {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Estado inválido')
  const state = input as Record<string, unknown>
  if (!('profile' in state) || !('plan' in state) || !Array.isArray(state.sessions) || !Array.isArray(state.prs)) throw Error('Estado incompleto')
  const parsed = parseWorkoutBackup(state)
  return { profile: parsed.profile, plan: parsed.plan, archivedPlans: parsed.archivedPlans, sessions: parsed.sessions,
    activeSession: parsed.activeSession, prs: parsed.prs, lastSetUndo: null, draft: safeDraft(state.draft),
    ...(typeof state.seed === 'string' && state.seed.length > 0 && state.seed.length <= 200 ? { seed: state.seed } : {}),
    ...(typeof state.watchToken === 'string' && /^[A-Z0-9-]{4,128}$/.test(state.watchToken) ? { watchToken: state.watchToken } : {}) }
}
export function createWorkoutStorage(port: Port | null) {
  let health: Health = { error: null, blocked: false }; let original: string | null = null
  const listeners = new Set<() => void>()
  const update = (next: Health) => { if (next.error !== health.error || next.blocked !== health.blocked) { health = next; listeners.forEach((fn) => fn()) } }
  return {
    health: () => health,
    subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } },
    original: () => original,
    getItem(key: string): string | null {
      try {
        if (!port) throw Error('unavailable')
        const raw = port.getItem(key)
        if (raw === null) return null
        original = raw
        const decoded = JSON.parse(raw)
        if (!decoded || typeof decoded !== 'object' || !decoded.state || (decoded.version !== undefined && decoded.version !== 0)) throw Error('invalid')
        const safe = safeWorkoutState(decoded.state)
        update({ error: null, blocked: false })
        return JSON.stringify({ state: safe, version: 0 })
      } catch {
        update({ error: 'Não foi possível ler os treinos salvos. O conteúdo original foi preservado e novas gravações estão bloqueadas. Baixe o original antes de redefinir.', blocked: true })
        return null
      }
    },
    setItem(key: string, value: string): void {
      if (health.blocked) return
      try {
        if (!port) throw Error('unavailable')
        port.setItem(key, value)
        original = value
        update({ error: null, blocked: false })
      } catch { update({ error: 'Não foi possível salvar os treinos neste dispositivo. Os dados novos estão somente na memória: exporte um backup antes de sair e libere espaço.', blocked: false }) }
    },
    removeItem(key: string): void {
      if (health.blocked) return
      try { if (!port) throw Error('unavailable'); port.removeItem(key); update({ error: null, blocked: false }) }
      catch { update({ error: 'Não foi possível remover os treinos salvos. Confira o armazenamento.', blocked: health.blocked }) }
    },
    // Called only after a human explicitly requests local reset; never during hydration/import.
    resetGuard(): boolean {
      try {
        if (!port) throw Error('unavailable')
        port.removeItem(WORKOUT_STORAGE_KEY); original = null; update({ error: null, blocked: false }); return true
      } catch { update({ error: 'Não foi possível redefinir o armazenamento dos treinos. O original foi preservado.', blocked: health.blocked }); return false }
    },
  }
}
function runtimeStorage(): Port | null {
  try { if (typeof localStorage !== 'undefined') return localStorage } catch { return null }
  if (typeof window !== 'undefined') return null
  const memory = new Map<string, string>()
  return { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => { memory.set(key, value) }, removeItem: (key) => { memory.delete(key) } }
}
export const workoutStorage = createWorkoutStorage(runtimeStorage())
export const getWorkoutStorageError = (): string | null => workoutStorage.health().error
export const resetWorkoutStorageGuard = (): boolean => workoutStorage.resetGuard()
