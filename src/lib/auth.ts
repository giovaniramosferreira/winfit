/**
 * Cliente mínimo do Supabase REST/Auth. Não traz SDK para manter o PWA leve.
 * Sem as variáveis VITE_SUPABASE_* o produto continua utilizável localmente.
 */
const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
const SESSION_KEY = 'winfit-auth-session'

export interface AuthSession { access_token: string; refresh_token: string; expires_at?: number; user?: { id: string; email?: string } }
export const isAuthConfigured = Boolean(url && key)

function headers(token?: string) {
  return { apikey: key!, Authorization: `Bearer ${token ?? key!}`, 'Content-Type': 'application/json' }
}
function readSession(): AuthSession | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
}
function saveSession(session: AuthSession | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
}

export async function restoreSession(): Promise<AuthSession | null> {
  if (!isAuthConfigured) return null
  // Magic-link callbacks arrive in the URL fragment.
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const access = hash.get('access_token')
  if (access) {
    const session: AuthSession = { access_token: access, refresh_token: hash.get('refresh_token') || '', expires_at: Number(hash.get('expires_at')) || undefined }
    saveSession(session)
    history.replaceState(null, '', `${location.pathname}${location.search}`)
  }
  let session = readSession()
  if (!session) return null
  if (session.expires_at && session.expires_at < Date.now() / 1000 + 30 && session.refresh_token) {
    const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: headers(), body: JSON.stringify({ refresh_token: session.refresh_token }) })
    if (!response.ok) { saveSession(null); return null }
    session = await response.json()
    saveSession(session)
  }
  if (!session) return null
  const user = await fetch(`${url}/auth/v1/user`, { headers: headers(session.access_token) })
  if (!user.ok) { saveSession(null); return null }
  session.user = await user.json()
  saveSession(session)
  return session
}

export async function sendMagicLink(email: string) {
  if (!isAuthConfigured) throw new Error('Autenticação ainda não foi configurada.')
  const response = await fetch(`${url}/auth/v1/otp`, {
    method: 'POST', headers: headers(),
    body: JSON.stringify({ email, create_user: true, options: { email_redirect_to: window.location.origin } }),
  })
  if (!response.ok) throw new Error('Não foi possível enviar o link. Tente novamente.')
}

export function signOut() { saveSession(null) }

export async function loadCloudState(session: AuthSession): Promise<Record<string, unknown> | null> {
  const response = await fetch(`${url}/rest/v1/user_state?select=data&id=eq.${session.user!.id}`, { headers: headers(session.access_token) })
  if (!response.ok) throw new Error('Não foi possível buscar seus dados sincronizados.')
  const rows = await response.json()
  return rows[0]?.data ?? null
}

export async function saveCloudState(session: AuthSession, data: Record<string, unknown>) {
  const response = await fetch(`${url}/rest/v1/user_state`, {
    method: 'POST', headers: { ...headers(session.access_token), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: session.user!.id, data, updated_at: new Date().toISOString() }),
  })
  if (!response.ok) throw new Error('Não foi possível sincronizar seus dados.')
}
