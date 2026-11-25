// AURAVIZ-165: dois aparelhos editando offline e sincronizando sem perder registros.
// Usa o cloudTransport real contra um servidor falso com compare-and-swap (como o Supabase com updated_at=eq.).
import assert from 'node:assert/strict'
const disk = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: (key: string) => disk.get(key) ?? null,
  setItem: (key: string, value: string) => { disk.set(key, value) },
  removeItem: (key: string) => disk.delete(key),
} })
const { applicationSnapshot, mergeApplications } = await import('../src/lib/applicationBackup')
const { cloudTransport } = await import('../src/lib/cloudTransport')
const { useStore } = await import('../src/lib/store')
const { nutritionStore } = await import('../src/lib/nutritionStore')

useStore.getState().completeOnboarding({ goal: 'health', experience: 'intermediate', currentState: 'active', location: 'gym_full', equipment: [], frequency: 3, sessionTimeMin: 45, limitations: [], biometrics: {}, version: 1 })
const meal = (id: string) => ({ id, date: '2026-11-24', time: '12:00', type: 'Almoço', items: [{ id: `${id}-item`, name: id, portion: null, kcal: null }] })
nutritionStore.upsertMeal(meal('base'))
const base = applicationSnapshot()

// servidor falso: uma linha por usuário, PATCH só se updated_at bater (compare-and-swap)
let row: { data: Record<string, unknown>; updated_at: string } | null = null
const server = async (url: unknown, init?: RequestInit): Promise<Response> => {
  const u = String(url)
  if (!init?.method || init.method === 'GET') return new Response(JSON.stringify(row ? [row] : []))
  const body = JSON.parse(String(init.body))
  if (init.method === 'POST') { if (row) return new Response('[]', { status: 409 }); row = { data: body.data, updated_at: body.updated_at }; return new Response(JSON.stringify([row])) }
  const expected = decodeURIComponent(/updated_at=eq\.([^&]+)/.exec(u)![1])
  if (!row || row.updated_at !== expected) return new Response('[]', { status: 200 })
  row = { data: body.data, updated_at: body.updated_at }
  return new Response(JSON.stringify([row]))
}
const api = cloudTransport('https://exemplo.invalid', 'public', server as typeof fetch)
const session = { access_token: 'teste', user: { id: 'u1' } }

const device = (name: string, meals: string[], entries: string[]) => {
  const snap = structuredClone(base)
  snap.modules!.nutrition!.meals = [...snap.modules!.nutrition!.meals, ...meals.map(meal)]
  snap.modules!.routine!.entries = entries.map((id, i) => ({ id, ts: i + 1, energy: 3, note: name }))
  return snap
}
const mealIds = (b: typeof base) => b.modules!.nutrition!.meals.map((m) => m.id).sort()
const entryIds = (b: typeof base) => b.modules!.routine!.entries.map((e) => e.id).sort()

// 1) A cria o backup remoto
let a = device('A', ['a1'], ['ea1'])
await api.save(session, a as unknown as Record<string, unknown>, null)
let aSeen = (await api.load(session))!.updatedAt

// 2) B, que nunca viu o remoto, edita offline e ao sincronizar carrega, mescla e grava
let b = device('B', ['b1'], ['eb1'])
const remote1 = (await api.load(session))!
b = mergeApplications(b, remote1.data as unknown as typeof base)
await api.save(session, b as unknown as Record<string, unknown>, remote1.updatedAt)
assert.deepEqual(mealIds(b), ['a1', 'b1', 'base'])
assert.deepEqual(entryIds(b), ['ea1', 'eb1'])

// 3) A (ainda com a versão antiga) edita offline e tenta gravar: o servidor recusa, nada é sobrescrito
a = device('A', ['a1', 'a2'], ['ea1', 'ea2'])
await assert.rejects(() => api.save(session, a as unknown as Record<string, unknown>, aSeen), /outro aparelho/)
const untouched = (await api.load(session))!
assert.deepEqual(mealIds(untouched.data as unknown as typeof base), ['a1', 'b1', 'base'], 'a gravação recusada não apagou o que B tinha enviado')

// 4) A carrega o remoto, mescla e grava: ninguém perde nada
a = mergeApplications(a, untouched.data as unknown as typeof base)
await api.save(session, a as unknown as Record<string, unknown>, untouched.updatedAt)
const final = (await api.load(session))!.data as unknown as typeof base
assert.deepEqual(mealIds(final), ['a1', 'a2', 'b1', 'base'])
assert.deepEqual(entryIds(final), ['ea1', 'ea2', 'eb1'])
assert.deepEqual(mergeApplications(final, final), final, 'mesclar de novo é idempotente')

// 5) exclusão em um aparelho (tombstone) não é desfeita por um registro antigo do outro
const deleting = structuredClone(final)
const gone = deleting.modules!.nutrition!.meals.find((m) => m.id === 'b1')!
deleting.modules!.nutrition!.meals = deleting.modules!.nutrition!.meals.filter((m) => m.id !== 'b1')
deleting.modules!.nutrition!.deleted = [gone]
const afterDelete = mergeApplications(deleting, final)
assert.equal(afterDelete.modules!.nutrition!.meals.some((m) => m.id === 'b1'), false, 'tombstone local vence o registro vivo remoto')
// 6) exclusão feita no OUTRO aparelho: um registro vivo e desatualizado aqui não ressuscita o item
const staleLocal = structuredClone(final)
const remoteDeleted = structuredClone(final)
const removed = remoteDeleted.modules!.nutrition!.meals.find((m) => m.id === 'a2')!
remoteDeleted.modules!.nutrition!.meals = remoteDeleted.modules!.nutrition!.meals.filter((m) => m.id !== 'a2')
remoteDeleted.modules!.nutrition!.deleted = [removed]
const resolved = mergeApplications(staleLocal, remoteDeleted)
assert.equal(resolved.modules!.nutrition!.meals.some((m) => m.id === 'a2'), false, 'exclusão remota não é desfeita por cópia local antiga')
assert.equal(resolved.modules!.nutrition!.deleted.some((m) => m.id === 'a2'), true, 'continua restaurável')
assert.deepEqual(mergeApplications(resolved, remoteDeleted), resolved, 'idempotente')
void aSeen

console.log('two-device sync: conflito recusado, mescla sem perda, idempotência e tombstone OK')
