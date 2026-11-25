import type { Session } from '../types'

export function startOfWeek(d = new Date()): Date {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7 // segunda = 0
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - day)
  return x
}

export function sessionsThisWeek(sessions: Session[]): Session[] {
  const from = startOfWeek().getTime()
  return sessions.filter((s) => s.startedAt >= from && (s.status === 'completed' || s.status === 'partial'))
}

export function sessionsInWeekOffset(sessions: Session[], offset: number): Session[] {
  const start = startOfWeek()
  start.setDate(start.getDate() + offset * 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return sessions.filter(
    (s) => s.startedAt >= start.getTime() && s.startedAt < end.getTime() && (s.status === 'completed' || s.status === 'partial'),
  )
}

export function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function fmtDateTime(ts: number): string {
  return new Date(ts).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

export function fmtDuration(ms: number): string {
  const min = Math.round(ms / 60000)
  if (min < 1) return '<1 min'
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`
}

/** Maior intervalo entre duas ações que ainda conta como treino (descanso longo incluso). */
export const MAX_IDLE_GAP_MS = 15 * 60 * 1000

/**
 * Tempo de treino de uma sessão encerrada: soma dos intervalos entre início, séries e fim, limitando cada
 * intervalo a MAX_IDLE_GAP_MS. Treino deixado aberto por horas ou dias não infla a duração.
 * Nunca excede `endedAt − startedAt`; devolve null se a sessão não tem fim.
 */
export function sessionActiveMs(session: { startedAt: number; endedAt?: number; logs: ReadonlyArray<{ ts: number }> }): number | null {
  const { startedAt, endedAt } = session
  if (endedAt === undefined || endedAt < startedAt) return null
  const marks = session.logs.map((l) => Math.min(Math.max(l.ts, startedAt), endedAt)).sort((a, b) => a - b)
  const points = [startedAt, ...marks, endedAt]
  let total = 0
  for (let i = 1; i < points.length; i++) total += Math.min(points[i] - points[i - 1], MAX_IDLE_GAP_MS)
  return Math.min(total, endedAt - startedAt)
}

export function fmtClock(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch { /* sem suporte */ }
}

let audioCtx: AudioContext | null = null
export function beep() {
  try {
    audioCtx = audioCtx ?? new AudioContext()
    const o = audioCtx.createOscillator()
    const g = audioCtx.createGain()
    o.connect(g)
    g.connect(audioCtx.destination)
    o.frequency.value = 880
    g.gain.setValueAtTime(0.001, audioCtx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5)
    o.start()
    o.stop(audioCtx.currentTime + 0.55)
  } catch { /* sem suporte */ }
}

/** "1 série", "3 séries": evita "1 séries" em toda a interface. */
export function plural(n: number, one: string, many: string): string {
  return `${n.toLocaleString('pt-BR')} ${n === 1 ? one : many}`
}
