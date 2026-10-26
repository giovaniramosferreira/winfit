import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { cloudDestination, deleteCloudRecord, isAuthConfigured, loadCloudRecord, restoreSession, saveCloudRecord, signOut, type AuthSession } from '../lib/auth'
import { useStore } from '../lib/store'
import { applicationSnapshot, applyApplicationBackup, downloadBackup, mergeApplications, parseApplicationBackup } from '../lib/applicationBackup'
import type { CloudRecord } from '../lib/cloudTransport'
import { nutritionStore } from '../lib/nutritionStore'
import { usePelvicStore } from '../lib/pelvicStore'
import { useRoutineStore } from '../lib/routineStore'

type Status = 'local' | 'checking' | 'review' | 'pending' | 'synced' | 'error'
type Review = { remote: CloudRecord; includeModules: boolean }
type Value = { configured: boolean; loading: boolean; session: AuthSession | null; destination: string | null;
  status: Status; error: string; review: boolean; syncNow: (includeModules?: boolean) => Promise<void>;
  resolve: (includeModules?: boolean) => Promise<void>; deleteRemote: () => Promise<void>; downloadRemote: () => void; logout: () => void }
const AuthContext = createContext<Value>({ configured: false, loading: false, session: null, destination: null,
  status: 'local', error: '', review: false, syncNow: async () => {}, resolve: async () => {}, deleteRemote: async () => {}, downloadRemote: () => {}, logout: () => {} })
export const useAuth = () => useContext(AuthContext)

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(isAuthConfigured)
  const [status, setStatus] = useState<Status>('local')
  const [error, setError] = useState('')
  const [review, setReview] = useState<Review | null>(null)
  const epoch = useRef(0)
  const busy = useRef(false)
  const failure = (err: unknown) => { setError(err instanceof Error ? err.message : 'Falha de sincronização.'); setStatus('error') }
  const markOwner = (s: AuthSession) => localStorage.setItem('winfit-data-owner', s.user!.id)
  const confirmOwner = (s: AuthSession) => {
    const owner = localStorage.getItem('winfit-data-owner')
    return !owner || owner === s.user!.id || window.confirm('Estes dados locais pertencem a outra conta. Você quer transferi-los para a conta atual? Exporte uma cópia antes se não tiver certeza.')
  }

  useEffect(() => {
    const run = ++epoch.current
    restoreSession().then(async (next) => {
      if (run !== epoch.current) return
      setSession(next)
      if (!next) return
      setStatus('checking')
      try {
        const remote = await loadCloudRecord(next)
        if (run !== epoch.current) return
        if (!remote) { setStatus('pending'); return }
        const parsed = parseApplicationBackup(remote.data)
        const local = applicationSnapshot()
        const hasLocal = local.profile || local.sessions.length || local.activeSession || local.modules?.nutrition?.meals.length ||
          local.modules?.nutrition?.goals.length || local.modules?.nutrition?.deleted.length || local.modules?.pelvic?.history.length ||
          local.modules?.pelvic?.active || localStorage.getItem('winfit-routine-v1')
        const owner = localStorage.getItem('winfit-data-owner')
        if (!hasLocal && (!owner || owner === next.user!.id)) {
          applyApplicationBackup(parsed, parsed); markOwner(next); setStatus('synced')
        } else { setReview({ remote, includeModules: false }); setStatus('review') }
      } catch (err) { if (run === epoch.current) failure(err) }
    }).catch((err) => { if (run === epoch.current) failure(err) })
      .finally(() => { if (run === epoch.current) setLoading(false) })
    return () => { epoch.current++ }
  }, [])

  useEffect(() => {
    const changed = () => setStatus((current) => current === 'synced' ? 'pending' : current)
    const subscriptions = [useStore.subscribe(changed), nutritionStore.subscribe(changed), usePelvicStore.subscribe(changed), useRoutineStore.subscribe(changed)]
    return () => subscriptions.forEach((unsubscribe) => unsubscribe())
  }, [])

  const syncNow = async (includeModules = false) => {
    if (!session?.user || busy.current) return
    if (!confirmOwner(session)) { setStatus('pending'); return }
    const run = epoch.current; busy.current = true; setStatus('checking'); setError('')
    try {
      const local = applicationSnapshot(includeModules)
      const remote = await loadCloudRecord(session)
      if (run !== epoch.current) return
      if (remote) { parseApplicationBackup(remote.data); setReview({ remote, includeModules }); setStatus('review'); return }
      await saveCloudRecord(session, local as unknown as Record<string, unknown>, null)
      if (run === epoch.current) { markOwner(session); setStatus('synced') }
    } catch (err) { if (run === epoch.current) failure(err) }
    finally { busy.current = false }
  }
  const resolve = async (includeModules = review?.includeModules ?? false) => {
    if (!session?.user || !review || busy.current) return
    if (!confirmOwner(session)) return
    const run = epoch.current; busy.current = true; setStatus('checking'); setError('')
    try {
      const remote = parseApplicationBackup(review.remote.data)
      const local = applicationSnapshot(includeModules)
      const merged = mergeApplications(local, remote)
      // Private local modules are uploaded only when explicitly selected.
      applyApplicationBackup(mergeApplications(applicationSnapshot(), remote), remote)
      await saveCloudRecord(session, merged as unknown as Record<string, unknown>, review.remote.updatedAt)
      if (run === epoch.current) { markOwner(session); setReview(null); setStatus('synced') }
    } catch (err) { if (run === epoch.current) failure(err) }
    finally { busy.current = false }
  }
  const deleteRemote = async () => {
    if (!session?.user || busy.current) return
    const run = epoch.current; busy.current = true; setStatus('checking'); setError('')
    try {
      const remote = await loadCloudRecord(session)
      if (run !== epoch.current) return
      if (remote) await deleteCloudRecord(session, remote.updatedAt)
      if (run === epoch.current) { setReview(null); setStatus('pending') }
    } catch (err) { if (run === epoch.current) failure(err) }
    finally { busy.current = false }
  }
  const logout = () => { epoch.current++; signOut(); setSession(null); setReview(null); setStatus('local'); setError('') }
  return <AuthContext.Provider value={{ configured: isAuthConfigured, loading, session, destination: cloudDestination, status, error, review: !!review,
    syncNow, resolve, deleteRemote, downloadRemote: () => { if (review) downloadBackup(review.remote.data, 'winfit-backup-nuvem.json') }, logout }}>{children}</AuthContext.Provider>
}
