import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { defaultRoutine, validateRoutine, type RoutineData } from './routine'

export const useRoutineStore = create<{ data: RoutineData; update: (patch: Partial<RoutineData>) => void }>()(persist((set, get) => ({
  data: defaultRoutine(), update: (patch) => { const data = validateRoutine({ ...get().data, ...patch }); if (data) set({ data }) },
}), { name: 'winfit-routine-v1', storage: createJSONStorage(() => localStorage), merge: (saved, current) => ({ ...current, data: validateRoutine((saved as { data?: unknown })?.data) ?? defaultRoutine() }) }))
export const exportRoutineData = () => JSON.parse(JSON.stringify(useRoutineStore.getState().data)) as RoutineData
export function importRoutineData(input: unknown) { const data = validateRoutine(input); if (!data) return false; useRoutineStore.setState({ data }); return true }
export const resetRoutineData = () => useRoutineStore.setState({ data: defaultRoutine() })
