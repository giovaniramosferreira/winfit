// Água, jejum e refeições salvas (AURAVIZ-166). Lógica pura; módulos opcionais, desligados por padrão na UI.
import type { Meal } from './nutrition'

// ---- Água
export interface WaterEntry { id: string; ts: number; ml: number }
export const WATER_PRESETS_ML = [200, 300, 500] as const
export function waterTotalMl(entries: WaterEntry[], date: string): number {
  return entries.filter((e) => localDay(e.ts) === date).reduce((s, e) => s + e.ml, 0)
}
export function waterProgress(totalMl: number, goalMl: number): { pct: number; remainingMl: number; reached: boolean } {
  if (!Number.isFinite(goalMl) || goalMl < 250 || goalMl > 10_000) throw new Error('Meta de água fora do intervalo (250–10.000 ml).')
  return { pct: Math.min(100, Math.round((totalMl / goalMl) * 100)), remainingMl: Math.max(0, goalMl - totalMl), reached: totalMl >= goalMl }
}
export function addWater(entries: WaterEntry[], entry: WaterEntry): WaterEntry[] {
  if (!entry.id || !Number.isFinite(entry.ml) || entry.ml <= 0 || entry.ml > 3000) throw new Error('Quantidade de água inválida (1–3.000 ml).')
  if (entries.some((e) => e.id === entry.id)) return entries
  return [...entries, entry]
}
function localDay(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ---- Jejum (registro explícito: ausência de refeição nunca é lida como jejum)
export interface FastingSession { id: string; startedAt: number; goalHours: number; endedAt: number | null; canceled?: boolean }
export const MIN_FAST_HOURS = 1
export const MAX_FAST_HOURS = 168
export function startFast(id: string, now: number, goalHours: number, current: FastingSession | null): FastingSession {
  if (current && current.endedAt === null && !current.canceled) throw new Error('Já existe um jejum em andamento.')
  if (!Number.isFinite(goalHours) || goalHours < MIN_FAST_HOURS || goalHours > MAX_FAST_HOURS) throw new Error('Meta de jejum fora do intervalo (1–168 h).')
  return { id, startedAt: now, goalHours, endedAt: null }
}
export function endFast(s: FastingSession, now: number): FastingSession {
  if (s.endedAt !== null) throw new Error('Este jejum já foi encerrado.')
  if (now < s.startedAt) throw new Error('O fim não pode ser antes do início.')
  return { ...s, endedAt: now }
}
export function fastStatus(s: FastingSession, now: number): { elapsedHours: number; remainingHours: number; goalReached: boolean; active: boolean } {
  const end = s.endedAt ?? now
  const elapsed = Math.max(0, (end - s.startedAt) / 3_600_000)
  return { elapsedHours: Math.round(elapsed * 10) / 10, remainingHours: Math.max(0, Math.round((s.goalHours - elapsed) * 10) / 10), goalReached: elapsed >= s.goalHours, active: s.endedAt === null && !s.canceled }
}

// ---- Refeições salvas: recentes, frequentes e favoritas
export interface SavedFood { key: string; name: string; kcal: number | null; portion: number | null; uses: number; lastUsed: string; favorite: boolean }
const keyOf = (name: string, portion: number | null) => `${name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()}|${portion ?? ''}`
export function savedFoods(meals: Meal[], favorites: string[] = []): SavedFood[] {
  const map = new Map<string, SavedFood>()
  for (const m of meals) for (const i of m.items) {
    if (!i.name.trim()) continue
    const key = keyOf(i.name, i.portion)
    const known = map.get(key)
    const lastUsed = known && known.lastUsed > `${m.date} ${m.time}` ? known.lastUsed : `${m.date} ${m.time}`
    map.set(key, { key, name: i.name.trim(), kcal: i.kcal, portion: i.portion, uses: (known?.uses ?? 0) + 1, lastUsed, favorite: favorites.includes(key) })
  }
  return [...map.values()]
}
export const recentFoods = (foods: SavedFood[], limit = 10): SavedFood[] => [...foods].sort((a, b) => b.lastUsed.localeCompare(a.lastUsed) || a.name.localeCompare(b.name)).slice(0, limit)
export const frequentFoods = (foods: SavedFood[], limit = 10): SavedFood[] => [...foods].filter((f) => f.uses > 1).sort((a, b) => b.uses - a.uses || b.lastUsed.localeCompare(a.lastUsed)).slice(0, limit)
export const favoriteFoods = (foods: SavedFood[]): SavedFood[] => foods.filter((f) => f.favorite).sort((a, b) => a.name.localeCompare(b.name))
export { keyOf as savedFoodKey }
