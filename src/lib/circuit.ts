import { LEVEL_ORDER, type CircuitLevel, type CircuitMove, type CircuitProgram } from '../data/circuits'
import type { Limitation } from '../types'

export interface CircuitSettings { level: CircuitLevel; rounds: number; lowImpact: boolean; warmup: boolean }
export const DEFAULT_CIRCUIT_SETTINGS: CircuitSettings = { level: 'beginner', rounds: 1, lowImpact: false, warmup: true }

export type CircuitPhaseKind = 'prepare' | 'warmup' | 'work' | 'rest' | 'round_rest' | 'cooldown'
export interface CircuitPhase {
  kind: CircuitPhaseKind
  seconds: number
  name: string
  how: string
  round: number
  /** Estação do circuito (work) ou a próxima estação (rest/prepare). */
  moveId?: string
  modified?: boolean
}

export type ModifyReason = 'level' | 'impact' | 'limitation'
export interface ResolvedMove { move: CircuitMove; modified: boolean; reasons: ModifyReason[]; name: string; how: string[] }

const LIMITATIONS: Limitation[] = ['joelho', 'lombar', 'ombro', 'punho']

export function validSettings(program: CircuitProgram, raw: unknown): raw is CircuitSettings {
  const s = raw as CircuitSettings
  return !!s && typeof s === 'object' && LEVEL_ORDER.includes(s.level) && Number.isInteger(s.rounds) && s.rounds >= 1
    && s.rounds <= program.maxRounds && typeof s.lowImpact === 'boolean' && typeof s.warmup === 'boolean'
}
export function validLimitations(raw: unknown): raw is Limitation[] {
  return Array.isArray(raw) && raw.length <= LIMITATIONS.length && raw.every((l) => LIMITATIONS.includes(l)) && new Set(raw).size === raw.length
}

/** Uma única versão modificada cobre iniciante, baixo impacto e limitações do perfil. */
export function resolveMove(move: CircuitMove, settings: CircuitSettings, limitations: Limitation[]): ResolvedMove {
  const reasons: ModifyReason[] = []
  if (settings.level === 'beginner') reasons.push('level')
  if (settings.lowImpact && move.impact) reasons.push('impact')
  if (move.stresses.some((l) => limitations.includes(l))) reasons.push('limitation')
  const modified = reasons.length > 0
  return { move, modified, reasons, name: modified ? move.modified.name : move.name, how: modified ? move.modified.how : move.how }
}

export function buildPhases(program: CircuitProgram, settings: CircuitSettings, limitations: Limitation[]): CircuitPhase[] {
  const level = program.levels[settings.level]
  const moves = program.moves.map((m) => resolveMove(m, settings, limitations))
  const phases: CircuitPhase[] = []
  if (settings.warmup) {
    const each = 30
    for (const step of program.warmup) phases.push({ kind: 'warmup', seconds: each, name: step.name, how: step.how, round: 0 })
  }
  phases.push({ kind: 'prepare', seconds: program.prepareSec, name: 'Prepare-se', how: `Primeira estação: ${moves[0].name}.`, round: 1, moveId: moves[0].move.id, modified: moves[0].modified })
  for (let round = 1; round <= settings.rounds; round++) {
    moves.forEach((m, index) => {
      phases.push({ kind: 'work', seconds: level.workSec, name: m.name, how: m.how.join(' '), round, moveId: m.move.id, modified: m.modified })
      const next = moves[index + 1]
      if (next) phases.push({ kind: 'rest', seconds: level.restSec, name: 'Descanso', how: `Próximo: ${next.name}.`, round, moveId: next.move.id, modified: next.modified })
      else if (round < settings.rounds) phases.push({ kind: 'round_rest', seconds: program.roundRestSec, name: 'Descanso entre voltas', how: `Volta ${round + 1} começa com ${moves[0].name}. Beba água.`, round: round + 1, moveId: moves[0].move.id, modified: moves[0].modified })
    })
  }
  if (settings.warmup) for (const step of program.cooldown) phases.push({ kind: 'cooldown', seconds: 30, name: step.name, how: step.how, round: 0 })
  return phases
}

export const totalSeconds = (phases: CircuitPhase[]) => phases.reduce((n, p) => n + p.seconds, 0)
export const workSeconds = (phases: CircuitPhase[]) => phases.reduce((n, p) => n + (p.kind === 'work' ? p.seconds : 0), 0)

// ── Cronômetro com âncora absoluta (mesmo modelo do módulo pélvico) ──────────

export interface CircuitTimer {
  id: string
  totalMs: number
  elapsedMs: number
  anchorAt: number | null
  status: 'running' | 'paused' | 'completed'
  /** Tempo de trabalho pulado, descontado do registro. */
  skippedWorkMs: number
}

export interface TimerPosition { index: number; remainingSec: number; phaseElapsedMs: number }

export function createCircuitTimer(id: string, phases: CircuitPhase[], now: number): CircuitTimer {
  if (!id || !Number.isFinite(now) || now < 0 || !phases.length || phases.some((p) => !Number.isFinite(p.seconds) || p.seconds <= 0)) throw new Error('Circuito inválido')
  return { id, totalMs: totalSeconds(phases) * 1000, elapsedMs: 0, anchorAt: now, status: 'running', skippedWorkMs: 0 }
}

export function positionAt(phases: CircuitPhase[], elapsedMs: number): TimerPosition {
  let left = elapsedMs
  for (let index = 0; index < phases.length; index++) {
    const ms = phases[index].seconds * 1000
    if (left < ms) return { index, remainingSec: Math.ceil((ms - left) / 1000), phaseElapsedMs: left }
    left -= ms
  }
  return { index: phases.length, remainingSec: 0, phaseElapsedMs: 0 }
}

export function advanceCircuit(timer: CircuitTimer, now: number): CircuitTimer {
  if (timer.status !== 'running') return timer
  if (!Number.isFinite(now) || timer.anchorAt === null || now < timer.anchorAt) return { ...timer, anchorAt: null, status: 'paused' }
  const elapsedMs = Math.min(timer.totalMs, timer.elapsedMs + now - timer.anchorAt)
  const done = elapsedMs >= timer.totalMs
  return { ...timer, elapsedMs, anchorAt: done ? null : now, status: done ? 'completed' : 'running' }
}
export function pauseCircuit(timer: CircuitTimer, now: number): CircuitTimer {
  const next = advanceCircuit(timer, now)
  return next.status === 'completed' ? next : { ...next, status: 'paused', anchorAt: null }
}
export function resumeCircuit(timer: CircuitTimer, now: number): CircuitTimer {
  return timer.status === 'paused' && Number.isFinite(now) && now >= 0 ? { ...timer, status: 'running', anchorAt: now } : timer
}
export function restoreCircuit(timer: CircuitTimer): CircuitTimer {
  return timer.status === 'completed' ? timer : { ...timer, status: 'paused', anchorAt: null }
}
/** Vai para o início da próxima fase; o trabalho não feito não conta no registro. */
export function skipCircuitPhase(timer: CircuitTimer, phases: CircuitPhase[], now: number): CircuitTimer {
  const current = advanceCircuit(timer, now)
  if (current.status === 'completed') return current
  const pos = positionAt(phases, current.elapsedMs)
  const phase = phases[pos.index]
  const leftMs = phase.seconds * 1000 - pos.phaseElapsedMs
  const elapsedMs = Math.min(current.totalMs, current.elapsedMs + leftMs)
  const done = elapsedMs >= current.totalMs
  return { ...current, elapsedMs, skippedWorkMs: current.skippedWorkMs + (phase.kind === 'work' ? leftMs : 0),
    status: done ? 'completed' : current.status, anchorAt: done ? null : current.anchorAt === null ? null : now }
}

/** Trabalho efetivamente feito (ms): tempo em fases de trabalho, menos o que foi pulado. */
export function workDoneMs(phases: CircuitPhase[], timer: CircuitTimer): number {
  let left = timer.elapsedMs, work = 0
  for (const p of phases) {
    const ms = p.seconds * 1000
    const spent = Math.min(ms, left)
    if (p.kind === 'work') work += spent
    left -= spent
    if (left <= 0) break
  }
  return Math.max(0, work - timer.skippedWorkMs)
}

/** Voltas cuja última estação terminou. */
export function roundsDone(phases: CircuitPhase[], elapsedMs: number): number {
  let end = 0, rounds = 0
  phases.forEach((p, i) => {
    end += p.seconds * 1000
    const last = p.kind === 'work' && !phases.slice(i + 1).some((q) => q.kind === 'work' && q.round === p.round)
    if (last && elapsedMs >= end) rounds = p.round
  })
  return rounds
}

// ── Progressão ───────────────────────────────────────────────────────────────

export interface CircuitHistoryEntry {
  status: 'completed' | 'interrupted'
  settings: CircuitSettings
  workMs: number
  plannedWorkMs: number
  endedAt: number
}
export interface ProgressionSuggestion { text: string; settings: CircuitSettings }

/**
 * Depois de duas sessões completas seguidas com o mesmo ajuste e quase sem
 * pular estações (≥ 90% do trabalho), sugere subir o nível; no avançado, mais uma volta.
 */
export function suggestProgression(program: CircuitProgram, history: CircuitHistoryEntry[], current: CircuitSettings): ProgressionSuggestion | null {
  const recent = [...history].sort((a, b) => b.endedAt - a.endedAt).slice(0, 2)
  if (recent.length < 2) return null
  const solid = recent.every((h) => h.status === 'completed' && h.settings.level === current.level && h.settings.rounds === current.rounds && h.workMs >= h.plannedWorkMs * 0.9)
  if (!solid) return null
  const levelIndex = LEVEL_ORDER.indexOf(current.level)
  if (levelIndex < LEVEL_ORDER.length - 1) {
    const level = LEVEL_ORDER[levelIndex + 1]
    const l = program.levels[level]
    return { text: `Você completou as duas últimas sessões no nível ${program.levels[current.level].label.toLowerCase()}. Experimente o ${l.label.toLowerCase()}: ${l.workSec} s de trabalho e ${l.restSec} s de descanso.`, settings: { ...current, level } }
  }
  if (current.rounds < program.maxRounds) {
    return { text: `Você completou as duas últimas sessões no avançado. Experimente ${current.rounds + 1} voltas.`, settings: { ...current, rounds: current.rounds + 1 } }
  }
  return null
}

export function fmtDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60), s = Math.round(totalSec % 60)
  return s ? `${m} min ${s} s` : `${m} min`
}
