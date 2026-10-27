import assert from 'node:assert/strict'
import { webcrypto } from 'node:crypto'
import { buildSync } from 'esbuild'
import vm from 'node:vm'
import { googleOAuthReady, prepareGoogleOAuth, exchangeGoogleCode, GOOGLE_VERIFIER_KEY, readGoogleCallback } from '../src/lib/googleOAuth'

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true })
const config = { url: 'https://example.supabase.co', key: 'public-anon-key', enabled: true }
const values = new Map<string, string>()
const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) }, removeItem: (key: string) => { values.delete(key) } }
assert.equal(googleOAuthReady({ ...config, enabled: false }), false)
assert.equal(googleOAuthReady({ ...config, key: '' }), false)
assert.equal(googleOAuthReady({ ...config, url: 'https://SEU-PROJETO.supabase.co' }), false)
await assert.rejects(prepareGoogleOAuth({ ...config, enabled: false }, 'http://127.0.0.1:5173/', storage), /disponível/)
assert.equal(values.size, 0, 'Disabled login must not modify storage')
await assert.rejects(prepareGoogleOAuth(config, 'http://localhost:5173/', { ...storage, setItem: () => { throw new Error('storage unavailable') } }), /storage unavailable/)
const target = new URL(await prepareGoogleOAuth(config, 'http://127.0.0.1:5173/', storage))
assert.equal(target.origin, config.url)
assert.equal(target.pathname, '/auth/v1/authorize')
assert.equal(target.searchParams.get('provider'), 'google')
assert.equal(target.searchParams.get('redirect_to'), 'http://127.0.0.1:5173/')
assert.equal(target.searchParams.get('code_challenge_method'), 's256')
const verifier = JSON.parse(values.get(GOOGLE_VERIFIER_KEY)!).verifier
assert.match(verifier, /^[A-Za-z0-9_-]{43,128}$/)
const expected = Buffer.from(await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))).toString('base64url')
assert.equal(target.searchParams.get('code_challenge'), expected)
assert.equal(target.searchParams.has('client_secret'), false)

let requests = 0
const originalFetch = globalThis.fetch
globalThis.fetch = async (input, init) => {
  requests++
  assert.equal(String(input), `${config.url}/auth/v1/token?grant_type=pkce`)
  assert.deepEqual(JSON.parse(init!.body as string), { auth_code: 'one-time-code', code_verifier: verifier })
  return new Response(JSON.stringify({ access_token: 'access', refresh_token: 'refresh', expires_in: 3600 }))
}
try {
  const session = await exchangeGoogleCode(config, 'one-time-code', storage)
  assert.equal(session.access_token, 'access')
  assert.ok(session.expires_at! > Date.now() / 1000 + 3500)
  assert.equal(values.has(GOOGLE_VERIFIER_KEY), false)
  await assert.rejects(exchangeGoogleCode(config, 'one-time-code', storage), /novamente/)
  assert.equal(requests, 1, 'Missing verifier must not send a request')
  await prepareGoogleOAuth(config, 'http://127.0.0.1:5173/', storage)
  globalThis.fetch = async () => new Response('{"error":"private provider diagnostic"}', { status: 400 })
  await assert.rejects(exchangeGoogleCode(config, 'bad-code', storage), /Não foi possível/)
  assert.equal(values.has(GOOGLE_VERIFIER_KEY), false)
  await prepareGoogleOAuth(config, 'http://127.0.0.1:5173/', storage)
  globalThis.fetch = async () => new Response('{"access_token":"incomplete"}')
  await assert.rejects(exchangeGoogleCode(config, 'bad-response', storage), /Não foi possível/)
} finally { globalThis.fetch = originalFetch }

assert.equal(readGoogleCallback('http://localhost:5173/#/home'), null)
assert.deepEqual(readGoogleCallback('http://localhost:5173/?code=abc&campaign=test'), { code: 'abc', error: false, cleanUrl: '/?campaign=test#/login' })
assert.deepEqual(readGoogleCallback('http://localhost:5173/#error=access_denied&error_description=secret'), { code: null, error: true, cleanUrl: '/#/login' })
values.set(GOOGLE_VERIFIER_KEY, JSON.stringify({ verifier: 'expired', createdAt: Date.now() - 11 * 60_000 }))
await assert.rejects(exchangeGoogleCode(config, 'expired-code', storage), /expirou/)
assert.equal(values.size, 0)

// Exercise the real auth adapter with a callback, including the event HashRouter listens to.
await prepareGoogleOAuth(config, 'http://localhost:5173/', storage)
let callbackUrl = new URL('http://localhost:5173/?code=abc')
const events: string[] = []
const localValues = new Map<string, string>()
const requestsSeen: string[] = []
const authBundle = buildSync({ entryPoints: ['src/lib/auth.ts'], bundle: true, platform: 'node', format: 'cjs', write: false,
  define: { 'import.meta.env': JSON.stringify({ VITE_SUPABASE_URL: config.url, VITE_SUPABASE_ANON_KEY: config.key, VITE_GOOGLE_AUTH_ENABLED: 'true' }) },
}).outputFiles[0].text
const authModule = { exports: {} as { restoreSession: () => Promise<any> } }
vm.runInNewContext(authBundle, {
  module: authModule, URL, URLSearchParams, Date,
  localStorage: { getItem: (key: string) => localValues.get(key) ?? null, setItem: (key: string, value: string) => localValues.set(key, value), removeItem: (key: string) => localValues.delete(key) },
  sessionStorage: storage,
  history: { replaceState: (_state: unknown, _title: string, target: string) => { callbackUrl = new URL(target, callbackUrl) } },
  window: { get location() { return callbackUrl }, dispatchEvent: (event: { type: string }) => { events.push(event.type) } },
  HashChangeEvent: class { constructor(public type: string) {} },
  PopStateEvent: class { constructor(public type: string) {} },
  fetch: async (input: string) => {
    requestsSeen.push(input)
    return new Response(JSON.stringify(input.includes('/token') ? { access_token: 'access', refresh_token: 'refresh', expires_in: 3600 } : { id: 'user', email: 'test@example.invalid' }))
  },
})
const restored = await authModule.exports.restoreSession()
assert.equal(restored.user.id, 'user')
assert.equal(callbackUrl.hash, '#/login')
assert.equal(callbackUrl.search, '')
assert.ok(events.includes('popstate'), 'OAuth callback must notify HashRouter after replaceState')
assert.equal(requestsSeen.length, 2, 'Code exchange and user verification, with no backup upload')
callbackUrl = new URL('http://localhost:5173/#error=access_denied&error_description=private-provider-message')
events.length = 0
await assert.rejects(authModule.exports.restoreSession(), /O acesso não foi concluído/)
assert.equal(callbackUrl.hash, '#/login')
assert.ok(events.includes('popstate'), 'Cancellation must also display the login screen')
assert.equal(requestsSeen.length, 2, 'Cancellation must not contact the provider')
console.log('Google OAuth: disabled gate, PKCE, callback, exchange and failure handling OK')
