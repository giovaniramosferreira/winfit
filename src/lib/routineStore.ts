import { create } from 'zustand'
import { defaultRoutine, validateRoutine, type RoutineData } from './routine'
export { validateRoutine as validateRoutineData } from './routine'
export const ROUTINE_STORAGE_KEY = 'winfit-routine-v1'
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>
interface RoutineState {
  data: RoutineData; error: string | null; blocked: boolean
  update: (patch: Partial<RoutineData>) => boolean
  exportData: () => string
  importData: (input: unknown) => boolean
  resetAll: () => boolean
}
export function createRoutineStore(storage: StoragePort | null) {
  let initial = defaultRoutine(); let initialError: string | null = null; let original: string | null = null
  try {
    original = storage?.getItem(ROUTINE_STORAGE_KEY) ?? null
    if (original) {
      const decoded = JSON.parse(original)
      const valid = validateRoutine(decoded?.state?.data ?? decoded)
      if (!valid) throw Error('invalid')
      initial = valid
    }
  } catch { initialError = 'Dados da rotina inválidos ou indisponíveis. O conteúdo original foi preservado; exporte uma cópia antes de redefinir.' }
  return create<RoutineState>((set, get) => {
    const persist = (data: RoutineData, force = false) => {
      if (get().blocked && !force) return false
      try {
        if (!storage) throw Error('unavailable')
        storage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(data))
        original = null; set({ data, error: null, blocked: false }); return true
      } catch { set({ error: 'Não foi possível salvar a rotina neste dispositivo. Libere espaço ou permita o armazenamento e tente novamente.' }); return false }
    }
    return { data: initial, error: initialError, blocked: !!initialError,
      update: (patch) => {
        const valid = validateRoutine({ ...get().data, ...patch })
        if (!valid) { set({ error: 'Configuração de rotina inválida. Os dados anteriores foram preservados.' }); return false }
        return persist(valid)
      },
      exportData: () => get().blocked && original !== null ? original : JSON.stringify(get().data),
      importData: (input) => {
        try { const valid = validateRoutine(typeof input === 'string' ? JSON.parse(input) : input); if (!valid) throw Error('invalid'); return persist(valid) }
        catch { set({ error: 'Arquivo de rotina inválido. Os dados anteriores foram preservados.' }); return false }
      },
      resetAll: () => persist(defaultRoutine(), true),
    }
  })
}
let storage: StoragePort | null = null
try { storage = typeof localStorage === 'undefined' ? null : localStorage } catch { /* Visible failure on write. */ }
export const useRoutineStore = createRoutineStore(storage)
export function exportRoutineData(): RoutineData {
  if (useRoutineStore.getState().blocked) throw Error('Rotina inválida: exporte o original antes de redefinir.')
  return JSON.parse(useRoutineStore.getState().exportData()) as RoutineData
}
export const importRoutineData = (input: unknown): boolean => useRoutineStore.getState().importData(input)
export const resetRoutineData = (): boolean => useRoutineStore.getState().resetAll()
