/** OAuth Google via Supabase. Segredos do Google ficam somente no provedor. */
export interface GoogleOAuthConfig { url?: string; key?: string; enabled: boolean }
type VerifierStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
export const GOOGLE_VERIFIER_KEY = 'winfit-google-pkce'

export function googleOAuthReady(config: GoogleOAuthConfig): boolean {
  if (!config.enabled || !config.key || !config.url || /SEU-PROJETO|SUA_CHAVE/i.test(`${config.url} ${config.key}`)) return false
  try { return new URL(config.url).protocol === 'https:' } catch { return false }
}

function base64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function prepareGoogleOAuth(config: GoogleOAuthConfig, redirect: string, storage: VerifierStorage): Promise<string> {
  if (!googleOAuthReady(config)) throw new Error('O login com Google ainda não está disponível. Você pode experimentar sem conta.')
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)))
  const challenge = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))))
  // Persistir antes de sair: se o navegador bloquear armazenamento, não iniciar login.
  storage.setItem(GOOGLE_VERIFIER_KEY, JSON.stringify({ verifier, createdAt: Date.now() }))
  const target = new URL(`${config.url!.replace(/\/$/, '')}/auth/v1/authorize`)
  target.search = new URLSearchParams({ provider: 'google', redirect_to: redirect, code_challenge: challenge, code_challenge_method: 's256' }).toString()
  return target.toString()
}

export async function exchangeGoogleCode(config: GoogleOAuthConfig, code: string, storage: VerifierStorage): Promise<{ access_token: string; refresh_token: string; expires_at: number }> {
  let pending: { verifier?: string; createdAt?: number } | null = null
  try { pending = JSON.parse(storage.getItem(GOOGLE_VERIFIER_KEY) || 'null') } catch { /* Invalid storage requires a new login. */ }
  storage.removeItem(GOOGLE_VERIFIER_KEY)
  if (!googleOAuthReady(config) || !pending?.verifier || !pending.createdAt || Date.now() - pending.createdAt > 10 * 60_000) {
    throw new Error('Este acesso expirou. Entre com Google novamente neste navegador.')
  }
  const response = await fetch(`${config.url!.replace(/\/$/, '')}/auth/v1/token?grant_type=pkce`, {
    method: 'POST', headers: { apikey: config.key!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ auth_code: code, code_verifier: pending.verifier }),
  })
  if (!response.ok) throw new Error('Não foi possível entrar com Google. Tente novamente.')
  const result = await response.json()
  if (typeof result.access_token !== 'string' || !result.access_token || typeof result.refresh_token !== 'string' || !result.refresh_token) {
    throw new Error('Não foi possível confirmar o acesso com Google. Tente novamente.')
  }
  return { access_token: result.access_token, refresh_token: result.refresh_token, expires_at: Number(result.expires_at) || Date.now() / 1000 + (Number(result.expires_in) || 3600) }
}

export function readGoogleCallback(href: string): { code: string | null; error: boolean; cleanUrl: string } | null {
  const callback = new URL(href)
  const fragment = new URLSearchParams(callback.hash.slice(1))
  const code = callback.searchParams.get('code')
  const error = callback.searchParams.has('error') || fragment.has('error')
  if (!code && !error) return null
  for (const key of ['code', 'error', 'error_code', 'error_description']) callback.searchParams.delete(key)
  return { code, error, cleanUrl: `${callback.pathname}${callback.search}#/login` }
}
