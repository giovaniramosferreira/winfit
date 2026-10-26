export type PelvicPhaseKind = 'prepare' | 'contract' | 'relax' | 'rest'
export interface PelvicPhase { kind: PelvicPhaseKind; seconds: number }
export interface PelvicTimer {
  id: string; phases: PelvicPhase[]; elapsedMs: number; anchorAt: number | null
  status: 'running' | 'paused' | 'completed'; phaseIndex: number; remainingSeconds: number
}
export function createTimer(id: string, phases: PelvicPhase[], now: number): PelvicTimer {
  if (!id || !Number.isFinite(now) || now < 0 || !phases.length || phases.length > 1000 || phases.some(p => !['prepare', 'contract', 'relax', 'rest'].includes(p.kind) || !Number.isFinite(p.seconds) || p.seconds <= 0 || p.seconds > 3600)) throw new Error('Sequência de tempo inválida')
  return { id, phases: phases.map(p => ({ ...p })), elapsedMs: 0, anchorAt: now, status: 'running', phaseIndex: 0, remainingSeconds: Math.ceil(phases[0].seconds) }
}
export function advanceTimer(timer: PelvicTimer, now: number): PelvicTimer {
  if (timer.status !== 'running') return timer
  if (!Number.isFinite(now) || timer.anchorAt === null || now < timer.anchorAt) return { ...timer, anchorAt: null, status: 'paused' }
  const total = timer.phases.reduce((sum, p) => sum + p.seconds * 1000, 0)
  const elapsedMs = Math.min(total, timer.elapsedMs + now - timer.anchorAt)
  let left = elapsedMs
  let phaseIndex = 0
  while (phaseIndex < timer.phases.length && left >= timer.phases[phaseIndex].seconds * 1000) { left -= timer.phases[phaseIndex].seconds * 1000; phaseIndex++ }
  return { ...timer, elapsedMs, anchorAt: elapsedMs === total ? null : now, status: elapsedMs === total ? 'completed' : 'running', phaseIndex, remainingSeconds: phaseIndex === timer.phases.length ? 0 : Math.ceil(timer.phases[phaseIndex].seconds - left / 1000) }
}
export function pauseTimer(timer: PelvicTimer, now: number): PelvicTimer {
  const next = advanceTimer(timer, now)
  return next.status === 'completed' ? next : { ...next, status: 'paused', anchorAt: null }
}
export function resumeTimer(timer: PelvicTimer, now: number): PelvicTimer {
  return timer.status === 'paused' && Number.isFinite(now) && now >= 0 ? { ...timer, status: 'running', anchorAt: now } : timer
}
export function restoreTimer(timer: PelvicTimer): PelvicTimer {
  return timer.status === 'completed' ? timer : { ...timer, status: 'paused', anchorAt: null }
}
