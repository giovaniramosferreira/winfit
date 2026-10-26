import { create } from 'zustand'
import { pelvicPrograms } from '../data/pelvicPrograms'
import { advanceTimer, createTimer, pauseTimer, restoreTimer, resumeTimer, type PelvicTimer } from './pelvicTimer'
export const PELVIC_STORAGE_KEY = 'winfit-pelvic-v1'
interface PelvicActive { programId: string; programVersion: number; startedAt: number; timer: PelvicTimer }
interface PelvicRecord { id: string; programId: string; programVersion: number; startedAt: number; endedAt: number; elapsedMs: number; status: 'completed' | 'interrupted' }
interface PelvicData { version: 1; active: PelvicActive | null; history: PelvicRecord[]; audio: boolean; vibration: boolean }
interface PelvicState extends PelvicData {
  error: string | null
  start: (programId: string, now?: number) => boolean; tick: (now?: number) => void
  pause: (now?: number) => void; resume: (now?: number) => void; stop: (now?: number) => void
  setSignals: (audio: boolean, vibration: boolean) => void
  exportData: () => string; importData: (json: string) => boolean; resetAll: () => void
}
const empty = (): PelvicData => ({ version: 1, active: null, history: [], audio: false, vibration: false })
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0
export function validatePelvicData(raw: unknown): PelvicData {
  if (!raw || typeof raw !== 'object') throw Error('Formato inválido')
  const d = { ...(raw as PelvicData) }
  if (d.version !== 1 || typeof d.audio !== 'boolean' || typeof d.vibration !== 'boolean' || !Array.isArray(d.history) || d.history.length > 10000) throw Error('Versão ou formato inválido')
  const validProgram = (id: string, version: number) => pelvicPrograms.find(p => p.id === id && p.version === version && p.available)
  const ids = new Set<string>()
  for (const r of d.history) {
    const p = r && validProgram(r.programId, r.programVersion)
    if (!p || typeof r.id !== 'string' || !r.id || ids.has(r.id) || !finite(r.startedAt) || !finite(r.endedAt) || r.endedAt < r.startedAt || !finite(r.elapsedMs) || r.elapsedMs > p.phases.reduce((n,f) => n + f.seconds * 1000, 0) || !['completed', 'interrupted'].includes(r.status) || (r.status === 'completed' && r.elapsedMs !== p.phases.reduce((n,f) => n + f.seconds * 1000, 0))) throw Error('Histórico inválido')
    ids.add(r.id)
  }
  if (d.active !== null) {
    const a = d.active; const p = a && validProgram(a.programId, a.programVersion)
    if (!p || !finite(a.startedAt) || !a.timer || typeof a.timer.id !== 'string' || !a.timer.id || ids.has(a.timer.id) || !finite(a.timer.elapsedMs) || !['running', 'paused'].includes(a.timer.status)) throw Error('Sessão inválida')
    const total = p.phases.reduce((n,f) => n + f.seconds * 1000, 0)
    if (a.timer.elapsedMs >= total) throw Error('Duração inválida')
    // Reconstruct derived fields and phases from trusted versioned content.
    const base = createTimer(a.timer.id, p.phases, 0)
    const derived = advanceTimer(base, a.timer.elapsedMs)
    d.active = { programId: p.id, programVersion: p.version, startedAt: a.startedAt, timer: restoreTimer(derived) }
  }
  return { version: 1, active: d.active, history: d.history.map(r => ({ id:r.id, programId:r.programId, programVersion:r.programVersion, startedAt:r.startedAt, endedAt:r.endedAt, elapsedMs:r.elapsedMs, status:r.status })), audio: d.audio, vibration: d.vibration }
}
export function createPelvicStore(storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>) {
  let initial = empty(); let loadError: string | null = null; let original: string | null = null
  try { original = storage?.getItem(PELVIC_STORAGE_KEY) ?? null; if (original) initial = validatePelvicData(JSON.parse(original)) } catch { loadError = 'Não foi possível ler os dados pélvicos. O conteúdo salvo foi preservado; restaure um backup válido ou redefina estes dados.' }
  let blocked = !!loadError
  return create<PelvicState>((set, get) => {
    const data = (): PelvicData => { const s = get(); return { version: 1, active:s.active, history:s.history, audio:s.audio, vibration:s.vibration } }
    const save = () => {
      if (blocked) return
      try { if (!storage) throw Error('unavailable'); storage.setItem(PELVIC_STORAGE_KEY, JSON.stringify(data())); set({ error:null }) }
      catch { set({ error:'Não foi possível salvar os dados pélvicos neste dispositivo. Exporte um backup antes de sair.' }) }
    }
    const finish = (timer: PelvicTimer, now: number, status: PelvicRecord['status']) => {
      const s = get(); const a = s.active
      if (!a || s.history.some(r => r.id === timer.id)) return
      set({ active:null, history:[{ id:timer.id, programId:a.programId, programVersion:a.programVersion, startedAt:a.startedAt, endedAt:Math.max(now,a.startedAt), elapsedMs:timer.elapsedMs, status }, ...s.history] })
    }
    return { ...initial, error:loadError,
      start(programId, now = Date.now()) {
        const p = pelvicPrograms.find(p => p.id === programId && p.available)
        if (blocked || !p || get().active || !finite(now)) return false
        const id = globalThis.crypto?.randomUUID?.() ?? `${now}-${Math.random().toString(36).slice(2)}`
        set({ active:{ programId:p.id, programVersion:p.version, startedAt:now, timer:createTimer(id,p.phases,now) } }); save(); return true
      },
      tick(now = Date.now()) { const a = get().active; if (!a) return; const timer = advanceTimer(a.timer,now); if (timer.status === 'completed') finish(timer,now,'completed'); else set({ active:{ ...a,timer } }); save() },
      pause(now = Date.now()) { const a = get().active; if (!a) return; const timer = pauseTimer(a.timer,now); if (timer.status === 'completed') finish(timer,now,'completed'); else set({ active:{ ...a,timer } }); save() },
      resume(now = Date.now()) { const a = get().active; if (a) { set({ active:{ ...a,timer:resumeTimer(a.timer,now) } }); save() } },
      stop(now = Date.now()) { const a = get().active; if (!a || !finite(now)) return; const timer = pauseTimer(a.timer,now); finish(timer,now,timer.status === 'completed' ? 'completed' : 'interrupted'); save() },
      setSignals(audio,vibration) { set({ audio,vibration }); save() },
      exportData: () => blocked && original !== null ? original : JSON.stringify(data(),null,2),
      importData(json) {
        let next: PelvicData
        try { next = validatePelvicData(JSON.parse(json)) }
        catch { set({ error:'Backup pélvico inválido. Os dados atuais foram preservados.' }); return false }
        try {
          if (!storage) throw Error('unavailable')
          storage.setItem(PELVIC_STORAGE_KEY, JSON.stringify(next))
          blocked = false; original = null; set({ ...next,error:null }); return true
        } catch { set({ error:'Não foi possível salvar os dados pélvicos neste dispositivo. Os dados atuais foram preservados.' }); return false }
      },
      resetAll() { try { storage?.removeItem(PELVIC_STORAGE_KEY); blocked = false; original = null; set({ ...empty(),error:null }) } catch { set({ error:'Não foi possível apagar os dados pélvicos salvos.' }) } },
    }
  })
}
let browserStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | undefined
try { browserStorage = typeof localStorage === 'undefined' ? undefined : localStorage } catch { /* A failed save remains visible in the store. */ }
export const usePelvicStore = createPelvicStore(browserStorage)
