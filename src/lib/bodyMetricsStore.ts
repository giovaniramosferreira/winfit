// Peso corporal, perfil de metas e preferências de sequência (AURAVIZ-156/157/158/163). Local, versionado e validado.
// Dados inválidos nunca são sobrescritos por gravações comuns: o usuário exporta e só então redefine.
import { useSyncExternalStore } from 'react'
import type { ActivityLevel, GoalKind, PinnedMacros, Sex } from './goals'
import { ACTIVITY_MULTIPLIER } from './goals'
import type { WeightPoint } from './adaptiveGoal'
import type { StreakRule, WeekStart } from './streak'
import { validDate } from './nutrition'

export const BODY_KEY = 'winfit-body-v1'
export interface BodySettings { sex: Sex | null; age: number | null; heightCm: number | null; activity: ActivityLevel; kind: GoalKind; weeklyChangeKg: number; bodyFatPct: number | null; pinned: PinnedMacros }
export interface BodyState { version: 1; settings: BodySettings; weights: WeightPoint[]; streakRule: StreakRule; weekStart: WeekStart; streakSeen: number[]; error: string | null; blocked: boolean }
type Persisted = Omit<BodyState, 'error' | 'blocked'>
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export const DEFAULT_SETTINGS: BodySettings = { sex: null, age: null, heightCm: null, activity: 'light', kind: 'maintain', weeklyChangeKg: 0.5, bodyFatPct: null, pinned: {} }
const fresh = (): Persisted => ({ version: 1, settings: { ...DEFAULT_SETTINGS, pinned: {} }, weights: [], streakRule: 'generous', weekStart: 'mon', streakSeen: [] })

const isNum = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max
const orNull = (v: unknown, min: number, max: number): boolean => v === null || isNum(v, min, max)

/** Valida o documento salvo. Lança erro em qualquer campo desconhecido, fora de faixa ou duplicado. */
export function parseBodyState(value: unknown): Persisted {
  const v = value as Persisted
  const bad = (m: string): never => { throw new Error(`Dados corporais inválidos: ${m}.`) }
  if (!v || typeof v !== 'object' || v.version !== 1) bad('versão')
  const s = v.settings
  if (!s || typeof s !== 'object') bad('ajustes')
  if (s.sex !== null && !['f', 'm', 'na'].includes(s.sex as string)) bad('sexo')
  if (!orNull(s.age, 14, 100) || !orNull(s.heightCm, 100, 250) || !orNull(s.bodyFatPct, 3, 60)) bad('medidas')
  if (!(s.activity in ACTIVITY_MULTIPLIER) || !['lose', 'maintain', 'gain'].includes(s.kind) || !isNum(s.weeklyChangeKg, 0.1, 1)) bad('objetivo')
  if (!s.pinned || typeof s.pinned !== 'object' || Object.entries(s.pinned).some(([k, n]) => !['protein', 'carbs', 'fat'].includes(k) || !isNum(n, 0, 2000))) bad('macros fixados')
  if (!Array.isArray(v.weights) || v.weights.length > 3650) bad('pesagens')
  const days = new Set<string>()
  for (const w of v.weights) {
    if (!w || !validDate(w.date) || !isNum(w.kg, 25, 400) || days.has(w.date)) bad('pesagem')
    days.add(w.date)
  }
  if (!['none', 'gentle', 'generous'].includes(v.streakRule) || !['mon', 'sun'].includes(v.weekStart)) bad('sequência')
  if (!Array.isArray(v.streakSeen) || v.streakSeen.some((n) => !Number.isInteger(n) || n < 1 || n > 1000)) bad('marcos')
  return { version: 1, settings: { ...s, pinned: { ...s.pinned } }, weights: [...v.weights].sort((a, b) => a.date.localeCompare(b.date)), streakRule: v.streakRule, weekStart: v.weekStart, streakSeen: [...new Set(v.streakSeen)] }
}

export function createBodyStore(storage: StorageLike | undefined) {
  let raw: string | null = null
  let state: BodyState = { ...fresh(), error: null, blocked: false }
  try {
    raw = storage?.getItem(BODY_KEY) ?? null
    if (raw !== null) state = { ...parseBodyState(JSON.parse(raw)), error: null, blocked: false }
  } catch (e) {
    state = { ...fresh(), error: e instanceof SyntaxError ? 'Dados corporais ilegíveis. Eles foram preservados.' : (e as Error).message, blocked: true }
  }
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((l) => l())
  const persisted = (): Persisted => ({ version: 1, settings: state.settings, weights: state.weights, streakRule: state.streakRule, weekStart: state.weekStart, streakSeen: state.streakSeen })
  /** Aplica a mudança, valida e grava; em qualquer falha o estado anterior é mantido. */
  function commit(change: (p: Persisted) => Persisted): boolean {
    if (state.blocked) return false
    try {
      const next = parseBodyState(change(structuredClone(persisted())))
      storage?.setItem(BODY_KEY, JSON.stringify(next))
      state = { ...next, error: null, blocked: false }
      emit()
      return true
    } catch (e) {
      state = { ...state, error: e instanceof Error && /inválid/.test(e.message) ? e.message : 'Não foi possível salvar neste aparelho.' }
      emit()
      return false
    }
  }
  return {
    getState: () => state,
    subscribe: (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } },
    setSettings: (patch: Partial<BodySettings>) => commit((p) => ({ ...p, settings: { ...p.settings, ...patch } })),
    upsertWeight: (date: string, kg: number) => commit((p) => ({ ...p, weights: [...p.weights.filter((w) => w.date !== date), { date, kg }] })),
    deleteWeight: (date: string) => commit((p) => ({ ...p, weights: p.weights.filter((w) => w.date !== date) })),
    setStreakRule: (streakRule: StreakRule) => commit((p) => ({ ...p, streakRule })),
    setWeekStart: (weekStart: WeekStart) => commit((p) => ({ ...p, weekStart })),
    markStreakSeen: (badge: number) => commit((p) => ({ ...p, streakSeen: [...p.streakSeen, badge] })),
    exportData: () => raw !== null && state.blocked ? raw : JSON.stringify(persisted()),
    reset: () => { try { storage?.removeItem(BODY_KEY); state = { ...fresh(), error: null, blocked: false }; emit(); return true } catch { return false } },
  }
}

const safeStorage = (): StorageLike | undefined => { try { return typeof localStorage === 'undefined' ? undefined : localStorage } catch { return undefined } }
export const bodyStore = createBodyStore(safeStorage())
export const useBody = (): BodyState => useSyncExternalStore(bodyStore.subscribe, bodyStore.getState, bodyStore.getState)
