/**
 * Cliente mínimo do Supabase REST/Auth. Não traz SDK para manter o PWA leve.
 * Sem as variáveis VITE_SUPABASE_* o produto continua utilizável localmente.
 */
import { cloudTransport } from './cloudTransport'
import { exchangeGoogleCode, googleOAuthReady, prepareGoogleOAuth, readGoogleCallback, GOOGLE_VERIFIER_KEY } from './googleOAuth'
const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
const SESSION_KEY = 'winfit-auth-session'
let authEpoch = 0
let restoring: Promise<AuthSession | null> | null = null

export interface AuthSession { access_token: string; refresh_token: string; expires_at?: number; user?: { id: string; email?: string } }
export const isAuthConfigured = Boolean(url && key)
const googleConfig = { url, key, enabled: import.meta.env.VITE_GOOGLE_AUTH_ENABLED === 'true' }
export const isGoogleAuthConfigured = googleOAuthReady(googleConfig)
export async function signInWithGoogle() {
  const target = await prepareGoogleOAuth(googleConfig, `${window.location.origin}${window.location.pathname}`, window.sessionStorage)
  window.location.assign(target)
}
export const cloudDestination = url ? new URL(url).hostname : null
export const loadCloudRecord = (session: AuthSession) => cloudTransport(url!, key!).load(session)
export const saveCloudRecord = (session: AuthSession, data: Record<string, unknown>, expected: string | null) => cloudTransport(url!, key!).save(session, data, expected)
export const deleteCloudRecord = (session: AuthSession, expected: string) => cloudTransport(url!, key!).remove(session, expected)

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

async function restoreSessionRequest(): Promise<AuthSession | null> {
  const run = authEpoch
  if (!isAuthConfigured) return null
  const callback = readGoogleCallback(window.location.href)
  if (callback) {
    history.replaceState(null, '', callback.cleanUrl)
    // HashRouter listens to popstate; replaceState alone does not notify it.
    window.dispatchEvent(new PopStateEvent('popstate'))
    if (callback.error) {
      sessionStorage.removeItem(GOOGLE_VERIFIER_KEY)
      throw new Error('O acesso não foi concluído. Tente novamente ou continue sem conta.')
    }
    const session = await exchangeGoogleCode(googleConfig, callback.code!, sessionStorage)
    if (run !== authEpoch) return null
    saveSession(session)
  }
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
    if (run !== authEpoch) return null
    if (!response.ok) { saveSession(null); return null }
    session = await response.json()
    if (run !== authEpoch) return null
    saveSession(session)
  }
  if (!session) return null
  const user = await fetch(`${url}/auth/v1/user`, { headers: headers(session.access_token) })
  if (run !== authEpoch) return null
  if (!user.ok) { saveSession(null); return null }
  session.user = await user.json()
  if (run !== authEpoch) return null
  saveSession(session)
  return session
}
export function restoreSession(): Promise<AuthSession | null> {
  if (!restoring) restoring = restoreSessionRequest().finally(() => { restoring = null })
  return restoring
}

export async function sendMagicLink(email: string) {
  if (!isAuthConfigured) throw new Error('Autenticação ainda não foi configurada.')
  const response = await fetch(`${url}/auth/v1/otp`, {
    method: 'POST', headers: headers(),
    body: JSON.stringify({ email, create_user: true, options: { email_redirect_to: window.location.origin } }),
  })
  if (!response.ok) throw new Error('Não foi possível enviar o link. Tente novamente.')
}

export function signOut() { authEpoch++; saveSession(null) }
