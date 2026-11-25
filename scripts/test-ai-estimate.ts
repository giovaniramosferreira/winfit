import assert from 'node:assert/strict'
import { RetryError, fetchWithRetry, abortableSleep, DEFAULT_DELAYS_MS, INTERACTIVE_DELAYS_MS } from '../src/lib/fetchWithRetry'
import { EstimateError, acceptEstimate, buildMealPrompt, dayEnergy, estimateRange, gramsForUnit, needsRepair, parseAiEstimate, scaleEstimate } from '../src/lib/aiEstimate'
import { whatIf } from '../src/lib/mealPreview'
import { validateMeal, type Meal } from '../src/lib/nutrition'

const res = (status: number) => new Response('corpo secreto com token abc123', { status })
const noSleep = async () => {}

async function main() {
  // --- fetchWithRetry
  assert.deepEqual([...DEFAULT_DELAYS_MS], [1000, 2000, 4000])
  assert.deepEqual([...INTERACTIVE_DELAYS_MS], [1500])
  let calls = 0
  const flaky = async () => (++calls < 3 ? res(503) : res(200))
  assert.equal((await fetchWithRetry('/x', {}, { fetcher: flaky as never, sleep: noSleep })).status, 200)
  assert.equal(calls, 3, 'repete 503 até dar certo')

  calls = 0
  const waits: number[] = []
  await assert.rejects(fetchWithRetry('/x', {}, { fetcher: (async () => { calls++; return res(429) }) as never, sleep: async (ms) => { waits.push(ms) } }), (e: RetryError) => e.status === 429)
  assert.equal(calls, 4, '1 tentativa + 3 retries')
  assert.deepEqual(waits, [1000, 2000, 4000])

  calls = 0
  await assert.rejects(fetchWithRetry('/x', {}, { fetcher: (async () => { calls++; return res(500) }) as never, sleep: noSleep }), (e: RetryError) => e.status === 500)
  assert.equal(calls, 1, '500 não é repetido')

  calls = 0
  await assert.rejects(fetchWithRetry('/x', {}, { delaysMs: INTERACTIVE_DELAYS_MS, fetcher: (async () => { calls++; return res(529) }) as never, sleep: noSleep }))
  assert.equal(calls, 2, 'interativo: um único retry')

  calls = 0
  assert.equal((await fetchWithRetry('/x', {}, { fetcher: (async () => { if (++calls === 1) throw new TypeError('offline'); return res(200) }) as never, sleep: noSleep })).status, 200, 'erro de rede é repetido')

  // erro nunca vaza corpo, URL ou token
  try { await fetchWithRetry('/segredo?token=abc123', {}, { fetcher: (async () => res(404)) as never, sleep: noSleep }); assert.fail('deveria falhar') }
  catch (e) { assert.doesNotMatch((e as Error).message, /abc123|segredo|corpo/) }

  // cancelamento real: aborta a requisição e a espera do backoff
  const controller = new AbortController()
  let seenSignal: AbortSignal | undefined
  const slow = (async (_u: string, init: RequestInit) => { seenSignal = init.signal ?? undefined; return new Promise<Response>((_r, reject) => init.signal!.addEventListener('abort', () => reject(Object.assign(new Error('x'), { name: 'AbortError' })))) }) as never
  const pending = fetchWithRetry('/x', {}, { fetcher: slow, signal: controller.signal })
  controller.abort()
  await assert.rejects(pending, (e: RetryError) => e.kind === 'aborted')
  assert.equal(seenSignal?.aborted, true, 'o sinal chegou ao fetch')
  const c2 = new AbortController()
  const sleeping = abortableSleep(60_000, c2.signal); c2.abort()
  await assert.rejects(sleeping, (e: RetryError) => e.kind === 'aborted')
  await assert.rejects(fetchWithRetry('/x', {}, { signal: AbortSignal.abort(), fetcher: (async () => res(200)) as never }), (e: RetryError) => e.kind === 'aborted')

  // --- Prompt
  const prompt = buildMealPrompt({ photoCount: 3, note: '  sem óleo  ' })
  assert.match(prompt, /3 imagens como UMA refeição/)
  assert.match(prompt, /não conte o mesmo alimento duas vezes/)
  assert.match(prompt, /sem óleo/)
  assert.match(prompt, /nunca inclua linha de total/)
  assert.doesNotMatch(buildMealPrompt(), /Contexto do usuário/)
  assert.match(buildMealPrompt({ photoCount: 99 }), /10 imagens/, 'limita a 10 fotos')

  // --- Parser estrito
  const good = { name: 'Prato feito', calories: 650, protein: 35, carbs: 70, fat: 22, serving_size_grams: 420, measured: false, unit_options: [{ unit: 'concha', quantity: 2, grams_per_unit: 80 }], ingredients: [], notes: null }
  const est = parseAiEstimate(JSON.stringify(good))
  assert.equal(est.kcal, 650)
  assert.deepEqual([est.kcalMin, est.kcalMax], [455, 845], 'sem balança: ±30%')
  assert.deepEqual(estimateRange(500, true), { kcalMin: 425, kcalMax: 575 }, 'com balança: ±15%')
  assert.equal(parseAiEstimate('```json\n' + JSON.stringify(good) + '\n```').name, 'Prato feito', 'aceita cerca de código')
  assert.equal(parseAiEstimate(good).warnings.length, 0)
  const bads: Array<[string, unknown]> = [
    ['campo extra', { ...good, vitamin_c: 3 }],
    ['kcal negativa', { ...good, calories: -1 }],
    ['kcal NaN', { ...good, calories: NaN }],
    ['gramas zero', { ...good, serving_size_grams: 0 }],
    ['unit_options de textos', { ...good, unit_options: ['fatia'] }],
    ['unidade em gramas', { ...good, unit_options: [{ unit: 'g', quantity: 1, grams_per_unit: 1 }] }],
    ['total como ingrediente', { ...good, ingredients: [{ name: 'Total', grams: 100, calories: 100, protein: 1, carbs: 1, fat: 1 }] }],
    ['ingrediente com campo extra', { ...good, ingredients: [{ name: 'Arroz', grams: 100, calories: 100, protein: 1, carbs: 1, fat: 1, id: 1 }] }],
    ['mais de 20 ingredientes', { ...good, ingredients: Array.from({ length: 21 }, (_, i) => ({ name: `i${i}`, grams: 10, calories: 10, protein: 0, carbs: 0, fat: 0 })) }],
    ['measured não booleano', { ...good, measured: 'sim' }],
    ['não é objeto', [1, 2]],
  ]
  for (const [label, value] of bads) assert.throws(() => parseAiEstimate(value), EstimateError, label)
  assert.throws(() => parseAiEstimate('{quebrado'), EstimateError)
  assert.throws(() => parseAiEstimate(null), EstimateError)

  // ingredientes recalculam o total
  const withIng = parseAiEstimate({ ...good, calories: 900, ingredients: [
    { name: 'Arroz', grams: 200, calories: 260, protein: 5, carbs: 56, fat: 1 },
    { name: 'Frango', grams: 150, calories: 240, protein: 45, carbs: 0, fat: 5 },
  ] })
  assert.equal(withIng.kcal, 500, 'total vem da soma dos ingredientes')
  assert.ok(withIng.warnings.includes('ingredients-reconciled'))
  assert.equal(withIng.protein, 50)
  assert.ok(parseAiEstimate({ ...good, calories: 100, protein: 50, carbs: 50, fat: 30 }).warnings.includes('macros-inconsistent'))

  // reparo condicional
  const water = parseAiEstimate({ ...good, name: 'Água', calories: 0, protein: 0, carbs: 0, fat: 0, unit_options: [] })
  assert.equal(needsRepair(water), true, 'sem macros e sem unidades: vale reparar')
  assert.equal(needsRepair(est), false, 'com macros: mostra imediatamente')
  assert.equal(needsRepair({ ...water, unitOptions: [{ unit: 'copo', quantity: 1, gramsPerUnit: 200 }] }), false)

  // porções
  assert.equal(gramsForUnit(est, 'concha', 3), 240)
  assert.throws(() => gramsForUnit(est, 'fatia', 1), EstimateError)
  assert.throws(() => gramsForUnit(est, 'concha', 0), EstimateError)
  const half = scaleEstimate(est, 210)
  assert.equal(half.kcal, 325)
  assert.equal(half.protein, 17.5)
  assert.equal(half.unitOptions[0].quantity, 1)
  assert.throws(() => scaleEstimate(est, 0), EstimateError)

  // --- Aceite: único caminho para o diário
  assert.throws(() => acceptEstimate(est, { id: 'a', accepted: false }), EstimateError, 'sem aceite não grava')
  const item = acceptEstimate(est, { id: 'a', accepted: true, now: new Date('2026-11-24T12:00:00Z') })
  assert.equal(item.kcal, 650)
  assert.equal(item.provenance, undefined, 'estimativa nunca ganha proveniência confirmada')
  assert.equal(item.macros, undefined, 'macros estimados ficam em estimate, fora dos totais confirmados')
  assert.equal(item.estimate?.origin, 'ai')
  assert.equal(acceptEstimate(est, { id: 'b', accepted: true, grams: 210 }).kcal, 325, 'aceita com porção ajustada')
  const meal: Meal = { id: 'm', date: '2026-11-24', time: '12:30', type: 'Almoço', items: [item] }
  validateMeal(meal)
  assert.throws(() => validateMeal({ ...meal, items: [{ ...item, provenance: {} as never }] }), /Estimativa de IA inválida/)
  assert.throws(() => validateMeal({ ...meal, items: [{ ...item, kcal: 5000 }] }), /Estimativa de IA inválida/, 'kcal fora da faixa')
  assert.throws(() => validateMeal({ ...meal, items: [{ ...item, estimate: { ...item.estimate!, origin: 'x' as never } }] }))
  assert.throws(() => validateMeal({ ...meal, items: [{ ...item, estimate: { ...item.estimate!, kcalMin: 900, kcalMax: 800 } }] }))
  assert.throws(() => validateMeal({ ...meal, items: [{ ...item, estimate: { ...item.estimate!, acceptedAt: 'ontem' } }] }))

  // --- Totais do dia separam confirmado de estimado
  const confirmed: Meal = { id: 'm2', date: '2026-11-24', time: '08:00', type: 'Café', items: [{ id: 'c', name: 'Pão', portion: 50, kcal: 130 }, { id: 'p', name: 'Pendente', portion: null, kcal: null }] }
  const e = dayEnergy([meal, confirmed], '2026-11-24')
  assert.deepEqual(e, { confirmedKcal: 130, estimatedKcal: 650, estimatedItems: 1, pending: 1, rangeMin: 130 + 455, rangeMax: 130 + 845 })
  assert.deepEqual(dayEnergy([], '2026-11-24'), { confirmedKcal: 0, estimatedKcal: 0, estimatedItems: 0, pending: 0, rangeMin: 0, rangeMax: 0 })

  // --- "E se?"
  const w1 = whatIf([meal, confirmed], '2026-11-24', 400, 1500)
  assert.equal(w1.beforeKcal, 780)
  assert.equal(w1.afterKcal, 1180)
  assert.equal(w1.remainingAfter, 320)
  assert.equal(w1.overBy, 0)
  assert.equal(w1.partial, true)
  assert.match(w1.message, /parcial/)
  const w2 = whatIf([meal], '2026-11-24', 1000, 1500)
  assert.equal(w2.overBy, 150)
  assert.match(w2.message, /Passaria 150 kcal/)
  assert.equal(whatIf([], '2026-11-24', 300, null).remainingAfter, null)
  assert.throws(() => whatIf([], '2026-11-24', -5, 2000))
  assert.equal(meal.items.length, 1, 'a prévia não altera o diário')

  console.log('ai-estimate: retry/cancel, prompt PT-BR, JSON estrito, faixa, porções, aceite e E se OK')
}
main().catch((e) => { console.error(e); process.exit(1) })
