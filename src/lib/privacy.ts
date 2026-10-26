import { useSyncExternalStore } from 'react'

const KEY = 'winfit-privacy-v1'
type Privacy = { watchDestination: string | null; error: string | null }
let state: Privacy = { watchDestination: null, error: null }
const listeners = new Set<() => void>()
function receiveConsent(raw: string | null): void {
  let destination: string | null = null
  try { const saved = JSON.parse(raw || 'null'); if (typeof saved?.watchDestination === 'string') destination = saved.watchDestination } catch { /* Invalid consent means no consent. */ }
  state = { watchDestination: destination, error: null }
  listeners.forEach((listener) => listener())
}
try {
  const stored: unknown = JSON.parse(localStorage.getItem(KEY) || 'null')
  if (stored && typeof stored === 'object' && 'watchDestination' in stored && typeof stored.watchDestination === 'string') {
    state = { watchDestination: stored.watchDestination, error: null }
  }
} catch { /* Consent defaults to off when unavailable. */ }
if (typeof window !== 'undefined') window.addEventListener('storage', (event) => {
  if (event.key === KEY || event.key === null) receiveConsent(event.newValue)
})
export const privacy = {
  getState: () => state,
  subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
  setWatchDestination: (destination: string | null): boolean => {
    // Revocation always takes effect in memory even if persistence fails.
    let error: string | null = null
    try { localStorage.setItem(KEY, JSON.stringify({ watchDestination: destination })) }
    catch {
      destination = null
      try { localStorage.removeItem(KEY); error = 'Não foi possível salvar a preferência; a autorização anterior foi removida.' }
      catch { error = 'Envio interrompido nesta sessão. O navegador não permitiu remover a autorização salva; desative novamente ao reabrir ou limpe o armazenamento.' }
    }
    state = { watchDestination: destination, error }
    listeners.forEach((listener) => listener())
    return !error
  },
}
export const usePrivacy = () => useSyncExternalStore(privacy.subscribe, privacy.getState, privacy.getState)
export function watchAllowed(destination: string): boolean {
  return privacy.getState().watchDestination === destination.replace(/\/+$/, '')
}
