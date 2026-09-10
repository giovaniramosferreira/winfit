import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isAuthConfigured, loadCloudState, restoreSession, saveCloudState, signOut, type AuthSession } from '../lib/auth'
import { useStore } from '../lib/store'

type AuthContextValue = { configured: boolean; loading: boolean; session: AuthSession | null; syncNow: () => Promise<void>; logout: () => void }
const AuthContext = createContext<AuthContextValue>({ configured: false, loading: false, session: null, syncNow: async () => {}, logout: () => {} })
export const useAuth = () => useContext(AuthContext)

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(isAuthConfigured)
  const importCloudData = useStore((s) => s.importCloudData)

  const snapshot = () => JSON.parse(useStore.getState().exportData()) as Record<string, unknown>
  const syncNow = async () => { if (session) await saveCloudState(session, snapshot()) }

  useEffect(() => {
    let alive = true
    restoreSession().then(async (next) => {
      if (!alive) return
      if (next) {
        try {
          const cloud = await loadCloudState(next)
          if (cloud) importCloudData(cloud)
          else await saveCloudState(next, snapshot())
        } catch { /* O app segue funcionalmente local e tenta sincronizar no próximo toque. */ }
      }
      if (alive) { setSession(next); setLoading(false) }
    }).catch(() => alive && setLoading(false))
    return () => { alive = false }
  }, [importCloudData])

  useEffect(() => {
    if (!session) return
    let timer: number | undefined
    return useStore.subscribe(() => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => { syncNow().catch(() => {}) }, 1200)
    })
  }, [session])

  const value = useMemo(() => ({
    configured: isAuthConfigured, loading, session, syncNow,
    logout: () => { signOut(); setSession(null) },
  }), [loading, session])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
