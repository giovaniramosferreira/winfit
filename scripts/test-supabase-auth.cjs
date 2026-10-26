const fs = require('node:fs'), ts = require('typescript'), { strict: a } = require('node:assert');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, f);
const { createSupabaseAuthenticator } = require('../server/supabaseAuth.ts');
const { createAssistantHandler } = require('../server/assistant.ts');
const userA = '11111111-1111-4111-8111-111111111111';
const userB = '22222222-2222-4222-8222-222222222222';
const config = { url: 'https://project.supabase.co', publicKey: 'synthetic-public-key', timeoutMs: 30 };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
(async () => {
  let calls = 0;
  const authenticate = createSupabaseAuthenticator(config, async (url, init) => {
    calls++;
    a.equal(url, config.url + '/auth/v1/user');
    a.equal(init.method, 'GET');
    a.equal(init.headers.apikey, config.publicKey);
    a.equal(init.redirect, 'error'); a.equal(init.cache, 'no-store');
    a.ok(init.signal instanceof AbortSignal);
    return json({ id: init.headers.Authorization === 'Bearer synthetic-A' ? userA : userB, email: 'must-not-return@example.invalid', user_metadata: { admin: true } });
  });
  a.deepEqual(await authenticate('synthetic-A'), { id: userA });
  a.deepEqual(await authenticate('synthetic-B'), { id: userB });
  a.deepEqual(await authenticate('synthetic-A'), { id: userA });
  a.equal(calls, 3, 'every request revalidates; no cross-account or revocation cache');
  for (const token of ['', 'has space', 'line\nbreak', 'tab\tvalue', 'return\rvalue', 'x'.repeat(8193)]) a.equal(await authenticate(token), null);
  a.equal(calls, 3);
  for (const url of ['http://project.supabase.co', 'https://user:pass@project.supabase.co', 'https://project.supabase.co/path', 'https://project.supabase.co/?token=x', 'https://project.supabase.co/#x', 'invalid']) {
    a.throws(() => createSupabaseAuthenticator({ ...config, url }), /Configuração/);
  }
  for (const change of [{ publicKey: '' }, { publicKey: 'line\nbreak' }, { timeoutMs: 0 }, { timeoutMs: Infinity }, { timeoutMs: 30001 }]) {
    a.throws(() => createSupabaseAuthenticator({ ...config, ...change }), /Configuração/);
  }
  for (const status of [401, 403]) a.equal(await createSupabaseAuthenticator(config, async () => json({ message: 'private' }, status))('synthetic-A'), null);
  const unavailable = /Autenticação indisponível/;
  for (const status of [302, 400, 404, 429, 500, 503]) await a.rejects(() => createSupabaseAuthenticator(config, async () => json({ message: 'private' }, status))('synthetic-A'), unavailable);
  for (const body of [{}, null, [], { id: '../../other' }, { id: userA, error: 'failure' }, { id: 123 }]) {
    await a.rejects(() => createSupabaseAuthenticator(config, async () => json(body))('synthetic-A'), unavailable);
  }
  for (const response of [new Response('invalid'), new Response('{}', { headers: { 'Content-Type': 'text/html' } }), new Response('x'.repeat(65537), { headers: { 'Content-Type': 'application/json' } })]) {
    await a.rejects(() => createSupabaseAuthenticator(config, async () => response)('synthetic-A'), unavailable);
  }
  await a.rejects(() => createSupabaseAuthenticator(config, async () => { throw Error('secret token detail'); })('synthetic-A'), e => e.message === 'Autenticação indisponível');
  let aborted = false;
  await a.rejects(() => createSupabaseAuthenticator(config, (_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => { aborted = true; reject(Error('timeout')); });
  }))('synthetic-A'), unavailable);
  a.equal(aborted, true);
  let cancelled = false;
  const hangingBody = new ReadableStream({ pull() {}, cancel() { cancelled = true; } });
  await a.rejects(() => createSupabaseAuthenticator(config, async () => new Response(hangingBody, { headers: { 'Content-Type': 'application/json' } }))('synthetic-A'), unavailable);
  a.equal(cancelled, true, 'timeout covers body as well as headers');
  let overflowCancelled = false;
  const oversizedBody = new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(32768).fill(32)); controller.enqueue(new Uint8Array(32769).fill(32)); },
    cancel() { overflowCancelled = true; },
  });
  await a.rejects(() => createSupabaseAuthenticator(config, async () => new Response(oversizedBody, { headers: { 'Content-Type': 'application/json', 'Content-Length': '2' } }))('synthetic-A'), unavailable);
  a.equal(overflowCancelled, true, 'actual streamed bytes override false Content-Length');
  let finishLate;
  const lateFetch = new Promise(resolve => { finishLate = resolve; });
  await a.rejects(() => createSupabaseAuthenticator(config, () => lateFetch)('synthetic-A'), unavailable);
  let lateCancelled = false;
  finishLate(new Response(new ReadableStream({ cancel() { lateCancelled = true; } }), { headers: { 'Content-Type': 'application/json' } }));
  await new Promise(resolve => setImmediate(resolve));
  a.equal(lateCancelled, true, 'late transports cannot authorize and their bodies are cancelled');
  // Integration: authority rejection/failure must stop before a paid provider is touched.
  let paidCalls = 0;
  const request = () => new Request('https://app.invalid/api/assistant', { method: 'POST', headers: { Authorization: 'Bearer synthetic-A', 'Content-Type': 'application/json' }, body: '{}' });
  for (const [status, expected] of [[401, 401], [503, 503]]) {
    const handler = createAssistantHandler({ authenticate: createSupabaseAuthenticator(config, async () => json({}, status)), destination: 'test', provider: async () => { paidCalls++; return {}; }, coordinator: null });
    a.equal((await handler(request())).status, expected);
  }
  a.equal(paidCalls, 0);
  console.log('Supabase authority: verified identity, account isolation, invalid sessions, bounded timeout/body, safe failures PASS');
})().catch(e => { console.error(e); process.exitCode = 1; });
