// Sequência semanal derivada dos treinos (AURAVIZ-163). Nada é guardado: dois aparelhos chegam ao mesmo resultado.
// Regra: semanas seguidas com >= 1 treino; a cada 4ª semana da sequência ganha-se 1 congelamento (limite por regra);
// semana perdida usa um congelamento, senão a sequência zera; a semana corrente sem treino fica aberta.
import type { Session } from '../types'

export type StreakRule = 'none' | 'gentle' | 'generous'
export type WeekStart = 'mon' | 'sun'
export const FREEZE_EVERY = 4
export const FREEZE_MAX: Record<StreakRule, number> = { none: 0, gentle: 1, generous: 2 }
export const STREAK_BADGES = [4, 12, 26, 52, 104] as const
export type WeekStatus = 'trained' | 'frozen' | 'missed' | 'open'
export interface WeekResult { week: string; status: WeekStatus; streak: number; freezes: number }
export interface StreakInfo { streak: number; best: number; freezes: number; weeks: WeekResult[] }

const dayMs = 86_400_000
const pad = (n: number) => String(n).padStart(2, '0')
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parse = (key: string) => new Date(`${key}T12:00:00`)

/** Chave (yyyy-mm-dd) do primeiro dia da semana de `date`, no horário local. */
export function weekKey(date: Date, start: WeekStart = 'mon'): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)
  const back = start === 'mon' ? (d.getDay() + 6) % 7 : d.getDay()
  d.setDate(d.getDate() - back)
  return keyOf(d)
}
const nextWeek = (key: string): string => { const d = parse(key); d.setDate(d.getDate() + 7); return keyOf(d) }

export type RuleSource = StreakRule | ((week: string) => StreakRule)

/** Calcula a sequência. `rule` pode variar por semana: cada semana é julgada pela regra vigente nela. */
export function streakInfo(sessions: Pick<Session, 'status' | 'startedAt'>[], now: Date, rule: RuleSource = 'generous', start: WeekStart = 'mon'): StreakInfo {
  const ruleAt = typeof rule === 'function' ? rule : () => rule
  const trained = new Set(sessions.filter((s) => s.status === 'completed' || s.status === 'partial').map((s) => weekKey(new Date(s.startedAt), start)))
  const current = weekKey(now, start)
  const first = [...trained].filter((w) => w <= current).sort()[0]
  if (!first) return { streak: 0, best: 0, freezes: 0, weeks: [] }
  let streak = 0, best = 0, freezes = 0
  const weeks: WeekResult[] = []
  for (let w = first; w <= current; w = nextWeek(w)) {
    const max = FREEZE_MAX[ruleAt(w)]
    if (freezes > max) freezes = max // primeira semana de uma regra nova: poda o que ela não mantém
    let status: WeekStatus
    if (trained.has(w)) {
      streak++
      if (streak % FREEZE_EVERY === 0) freezes = Math.min(freezes + 1, max)
      status = 'trained'
    } else if (w === current) {
      status = 'open'
    } else if (freezes > 0) {
      freezes--
      status = 'frozen'
    } else {
      streak = 0; freezes = 0
      status = 'missed'
    }
    best = Math.max(best, streak)
    weeks.push({ week: w, status, streak, freezes })
  }
  return { streak, best, freezes, weeks }
}

/** Maior marco atingido que o usuário ainda não viu (ou null). Só `seen` precisa ser guardado. */
export function streakCelebration(streak: number, seen: number[] = []): number | null {
  const reached = STREAK_BADGES.filter((b) => streak >= b && !seen.includes(b))
  return reached.length ? reached[reached.length - 1] : null
}
void dayMs
