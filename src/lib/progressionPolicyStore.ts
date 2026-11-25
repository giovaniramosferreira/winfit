// Política de progressão escolhida por exercício (AURAVIZ-162). Preferência local; o histórico continua sendo a fonte da sugestão.
import { isProgressionPolicy, type ProgressionPolicy } from './progression'

export const POLICY_KEY = 'winfit-progression-policy-v1'
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

function read(storage: StorageLike | undefined): Record<string, ProgressionPolicy> {
  try {
    const parsed = JSON.parse(storage?.getItem(POLICY_KEY) ?? '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return Object.fromEntries(Object.entries(parsed).filter(([k, v]) => k && isProgressionPolicy(v))) as Record<string, ProgressionPolicy>
  } catch { return {} }
}
const defaultStorage = (): StorageLike | undefined => { try { return typeof localStorage === 'undefined' ? undefined : localStorage } catch { return undefined } }

/** Política do exercício; 'double' (dupla progressão) quando nunca escolhida ou dado inválido. */
export function policyFor(exerciseId: string, storage: StorageLike | undefined = defaultStorage()): ProgressionPolicy {
  return read(storage)[exerciseId] ?? 'double'
}
export function setPolicy(exerciseId: string, policy: ProgressionPolicy, storage: StorageLike | undefined = defaultStorage()): boolean {
  if (!exerciseId.trim() || !isProgressionPolicy(policy) || !storage) return false
  try { storage.setItem(POLICY_KEY, JSON.stringify({ ...read(storage), [exerciseId]: policy })); return true } catch { return false }
}
