import type { Plan, Session, TrainingProfile } from '../types'
import { startOfWeek } from './helpers'

interface HomeSummaryInput {
  profile: TrainingProfile | null
  plan: Plan | null
  sessions: Session[]
  active?: Session | null
  name?: string
  now?: number
}

/** Local, factual fallback. No weather, schedule or remote AI is inferred. */
export function homeSummary({ profile, plan, sessions, active, name, now = Date.now() }: HomeSummaryInput) {
  const firstName = name?.trim().split(/\s+/)[0]?.slice(0, 40)
  const address = firstName ? `, ${firstName}` : ''
  const from = startOfWeek(new Date(now)).getTime()
  const finished = sessions.filter(s => (s.status === 'completed' || s.status === 'partial') && s.startedAt <= now)
  const weekCount = finished.filter(s => s.startedAt >= from).length
  const weekGoal = profile?.frequency ?? 0
  const gymHistory = finished.filter(s => !s.source && s.planId === plan?.id).sort((a, b) => b.startedAt - a.startedAt)
  const previousIndex = plan?.days.findIndex(day => day.id === gymHistory[0]?.dayId) ?? -1
  const next = plan?.days.length ? plan.days[(previousIndex + 1) % plan.days.length] : null
  const message = active
    ? `Vamos continuar ${active.dayLabel}${address}?`
    : weekGoal > 0 && weekCount >= weekGoal
      ? `Meta da semana alcançada${address}.`
      : next
        ? `Hoje é dia de ${next.label}${address}.`
        : `Vamos montar seu treino${address}?`
  return { message, weekCount, weekGoal }
}
