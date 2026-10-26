import assert from 'node:assert/strict'
import { cloudTransport } from '../src/lib/cloudTransport'
let calls = 0
const api = cloudTransport('https://example.invalid', 'public', async (_url, options) => {
  calls++
  if (options?.method === 'PATCH') {
    assert.match(String(_url), /updated_at=eq\./)
    return new Response('[]', { status: 200 })
  }
  return new Response(JSON.stringify([{ data: { app: 'winfit' }, updated_at: '2026-10-01T00:00:00Z' }]))
})
const session = { access_token: 'test', user: { id: 'user-a' } }
const remote = await api.load(session)
assert.equal(remote?.updatedAt, '2026-10-01T00:00:00Z')
await assert.rejects(() => api.save(session, {}, remote!.updatedAt), /outro aparelho/)
const unauthenticated = { access_token: '', user: { id: 'user-a' } }
await assert.rejects(() => api.load(unauthenticated))
assert.equal(calls, 2)
const offline = cloudTransport('https://example.invalid', 'public', async () => { throw Error('offline') })
await assert.rejects(() => offline.load(session), /offline/)
console.log('Cloud sync: owner scoped read, compare-and-swap conflict and offline failures OK')
