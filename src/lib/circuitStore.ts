import { create } from 'zustand'
import { cardioCoreCircuit, circuitById, type CircuitProgram } from '../data/circuits'
import type { Limitation } from '../types'
import {
  DEFAULT_CIRCUIT_SETTINGS, advanceCircuit, buildPhases, createCircuitTimer, pauseCircuit, restoreCircuit, resumeCircuit, roundsDone,
  skipCircuitPhase, validLimitations, validSettings, workDoneMs, workSeconds, type CircuitSettings, type CircuitTimer,
} from './circuit'

export const CIRCUIT_STORAGE_KEY = 'winfit-circuit-v1'

export interface CircuitActive { programId: string; programVersion: number; settings: CircuitSettings; limitations: Limitation[]; startedAt: number; timer: CircuitTimer }
export interface CircuitRecord {
  id: string; programId: string; programVersion: number; settings: CircuitSettings; limitations: Limitation[]
  startedAt: number; endedAt: number; elapsedMs: number; workMs: number; plannedWorkMs: number; rounds: number
  status: 'completed' | 'interrupted'
}
export interface CircuitData {
  version: 1; active: CircuitActive | null; history: CircuitRecord[]; settings: CircuitSettings
  audio: boolean; vibration: boolean; healthAckAt: number | null
}
interface CircuitState extends CircuitData {
  error: string | null
  setSettings: (patch: Partial<CircuitSettings>) => void
  acknowledgeHealth: (now?: number) => void
  start: (programId: string, limitations: Limitation[], now?: number) => boolean
  tick: (now?: number) => void; pause: (now?: number) => void; resume: (now?: number) => void
  skip: (now?: number) => void; stop: (now?: number) => void
  setSignals: (audio: boolean, vibration: boolean) => void
  exportData: () => string; importData: (json: string) => boolean; resetAll: () => void
}

const empty = (): CircuitData => ({ version: 1, active: null, history: [], settings: { ...DEFAULT_CIRCUIT_SETTINGS }, audio: true, vibration: true, healthAckAt: null })
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0
const programFor = (id: unknown, version: unknown): CircuitProgram | undefined => {
  const p = typeof id === 'string' ? circuitById.get(id) : undefined
  return p && p.version === version ? p : undefined
}

export function validateCircuitData(raw: unknown): CircuitData {
  if (!raw || typeof raw !== 'object') throw Error('Formato inválido')
  const d = raw as CircuitData
  if (d.version !== 1 || typeof d.audio !== 'boolean' || typeof d.vibration !== 'boolean' || !Array.isArray(d.history) || d.history.length > 10000
    || !(d.healthAckAt === null || finite(d.healthAckAt))) throw Error('Versão ou formato inválido')
  if (!validSettings(cardioCoreCircuit, d.settings)) throw Error('Ajustes inválidos')
  const ids = new Set<string>()
  const history: CircuitRecord[] = d.history.map((r) => {
    const p = r && programFor(r.programId, r.programVersion)
    if (!p || typeof r.id !== 'string' || !r.id || ids.has(r.id) || !validSettings(p, r.settings) || !validLimitations(r.limitations)
      || !finite(r.startedAt) || !finite(r.endedAt) || r.endedAt < r.startedAt || !['completed', 'interrupted'].includes(r.status)) throw Error('Histórico inválido')
    const phases = buildPhases(p, r.settings, r.limitations)
    const total = phases.reduce((n, f) => n + f.seconds * 1000, 0), planned = workSeconds(phases) * 1000
    if (!finite(r.elapsedMs) || r.elapsedMs > total || (r.status === 'completed' && r.elapsedMs !== total) || !finite(r.workMs) || r.workMs > planned
      || r.plannedWorkMs !== planned || !Number.isInteger(r.rounds) || r.rounds < 0 || r.rounds > r.settings.rounds) throw Error('Histórico inválido')
    ids.add(r.id)
    return { id: r.id, programId: p.id, programVersion: p.version, settings: { ...r.settings }, limitations: [...r.limitations], startedAt: r.startedAt,
      endedAt: r.endedAt, elapsedMs: r.elapsedMs, workMs: r.workMs, plannedWorkMs: planned, rounds: r.rounds, status: r.status }
  })
  let active: CircuitActive | null = null
  if (d.active !== null) {
    const a = d.active, p = a && programFor(a.programId, a.programVersion)
    if (!p || !finite(a.startedAt) || !validSettings(p, a.settings) || !validLimitations(a.limitations) || !a.timer || typeof a.timer.id !== 'string'
      || !a.timer.id || ids.has(a.timer.id) || !finite(a.timer.elapsedMs) || !finite(a.timer.skippedWorkMs) || !['running', 'paused'].includes(a.timer.status)) throw Error('Sessão inválida')
    // Fases e duração vêm do conteúdo versionado, não do arquivo.
    const phases = buildPhases(p, a.settings, a.limitations)
    const base = createCircuitTimer(a.timer.id, phases, 0)
    if (a.timer.elapsedMs >= base.totalMs || a.timer.skippedWorkMs > a.timer.elapsedMs) throw Error('Duração inválida')
    active = { programId: p.id, programVersion: p.version, settings: { ...a.settings }, limitations: [...a.limitations], startedAt: a.startedAt,
      timer: restoreCircuit({ ...base, elapsedMs: a.timer.elapsedMs, skippedWorkMs: a.timer.skippedWorkMs }) }
  }
  return { version: 1, active, history, settings: { ...d.settings }, audio: d.audio, vibration: d.vibration, healthAckAt: d.healthAckAt }
}

/** Progresso derivado do conteúdo versionado, usado no registro e na mesclagem de backups. */
export function circuitProgress(a: CircuitActive, timer: CircuitTimer = a.timer): Pick<CircuitRecord, 'workMs' | 'plannedWorkMs' | 'rounds'> {
  const phases = buildPhases(programFor(a.programId, a.programVersion)!, a.settings, a.limitations)
  return { workMs: Math.round(workDoneMs(phases, timer)), plannedWorkMs: workSeconds(phases) * 1000, rounds: roundsDone(phases, timer.elapsedMs) }
}

type Storage_ = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
export function createCircuitStore(storage?: Storage_) {
  let initial = empty(); let loadError: string | null = null; let original: string | null = null
  try { original = storage?.getItem(CIRCUIT_STORAGE_KEY) ?? null; if (original) initial = validateCircuitData(JSON.parse(original)) }
  catch { loadError = 'Não foi possível ler os dados do circuito. O conteúdo salvo foi preservado; restaure um backup válido ou redefina estes dados.' }
  let blocked = !!loadError
  return create<CircuitState>((set, get) => {
    const data = (): CircuitData => { const s = get(); return { version: 1, active: s.active, history: s.history, settings: s.settings, audio: s.audio, vibration: s.vibration, healthAckAt: s.healthAckAt } }
    const save = () => {
      if (blocked) return
      try { if (!storage) throw Error('unavailable'); storage.setItem(CIRCUIT_STORAGE_KEY, JSON.stringify(data())); set({ error: null }) }
      catch { set({ error: 'Não foi possível salvar o circuito neste dispositivo. Exporte um backup antes de sair.' }) }
    }
    const finish = (timer: CircuitTimer, now: number, status: CircuitRecord['status']) => {
      const s = get(), a = s.active
      if (!a || s.history.some((r) => r.id === timer.id)) return
      const record: CircuitRecord = { id: timer.id, programId: a.programId, programVersion: a.programVersion, settings: a.settings, limitations: a.limitations,
        startedAt: a.startedAt, endedAt: Math.max(now, a.startedAt), elapsedMs: timer.elapsedMs, ...circuitProgress(a, timer), status }
      set({ active: null, history: [record, ...s.history] })
    }
    const update = (fn: (t: CircuitTimer, a: CircuitActive) => CircuitTimer, now: number) => {
      const a = get().active; if (!a) return
      const timer = fn(a.timer, a)
      if (timer.status === 'completed') finish(timer, now, 'completed'); else set({ active: { ...a, timer } })
      save()
    }
    return { ...initial, error: loadError,
      setSettings(patch) {
        if (get().active) return
        const next = { ...get().settings, ...patch }
        if (validSettings(cardioCoreCircuit, next)) { set({ settings: next }); save() }
      },
      acknowledgeHealth(now = Date.now()) { set({ healthAckAt: now }); save() },
      start(programId, limitations, now = Date.now()) {
        const p = circuitById.get(programId)
        const s = get()
        if (blocked || !p || s.active || s.healthAckAt === null || !finite(now) || !validLimitations(limitations)) return false
        const id = globalThis.crypto?.randomUUID?.() ?? `${now}-${Math.random().toString(36).slice(2)}`
        const timer = createCircuitTimer(id, buildPhases(p, s.settings, limitations), now)
        set({ active: { programId: p.id, programVersion: p.version, settings: { ...s.settings }, limitations: [...limitations], startedAt: now, timer } }); save(); return true
      },
      tick(now = Date.now()) { update((t) => advanceCircuit(t, now), now) },
      pause(now = Date.now()) { if (get().active?.timer.status === 'running') update((t) => pauseCircuit(t, now), now) },
      resume(now = Date.now()) { update((t) => resumeCircuit(t, now), now) },
      skip(now = Date.now()) {
        update((t, a) => skipCircuitPhase(t, buildPhases(programFor(a.programId, a.programVersion)!, a.settings, a.limitations), now), now)
      },
      stop(now = Date.now()) {
        const a = get().active; if (!a || !finite(now)) return
        const timer = pauseCircuit(a.timer, now)
        finish(timer, now, timer.status === 'completed' ? 'completed' : 'interrupted'); save()
      },
      setSignals(audio, vibration) { set({ audio, vibration }); save() },
      exportData: () => blocked && original !== null ? original : JSON.stringify(data(), null, 2),
      importData(json) {
        let next: CircuitData
        try { next = validateCircuitData(JSON.parse(json)) }
        catch { set({ error: 'Backup do circuito inválido. Os dados atuais foram preservados.' }); return false }
        try {
          if (!storage) throw Error('unavailable')
          storage.setItem(CIRCUIT_STORAGE_KEY, JSON.stringify(next))
          blocked = false; original = null; set({ ...next, error: null }); return true
        } catch { set({ error: 'Não foi possível salvar o circuito neste dispositivo. Os dados atuais foram preservados.' }); return false }
      },
      resetAll() {
        try { storage?.removeItem(CIRCUIT_STORAGE_KEY); blocked = false; original = null; set({ ...empty(), error: null }) }
        catch { set({ error: 'Não foi possível apagar os dados do circuito.' }) }
      },
    }
  })
}
let browserStorage: Storage_ | undefined
try { browserStorage = typeof localStorage === 'undefined' ? undefined : localStorage } catch { /* Falha de gravação fica visível na store. */ }
export const useCircuitStore = createCircuitStore(browserStorage)
