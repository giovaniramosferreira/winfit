import assert from 'node:assert/strict'
import { evaluateAllergens, ALLERGEN_DISCLAIMER } from '../src/lib/allergens'
import { isValidBarcode, parseOffProduct, toNutritionSource, OFF_LICENSE } from '../src/lib/openFoodFacts'
import { calculateConfirmedNutrition } from '../src/lib/mealAnalysis'
import { addWater, endFast, fastStatus, favoriteFoods, frequentFoods, recentFoods, savedFoods, startFast, waterProgress, waterTotalMl } from '../src/lib/wellness'
import { bmi, bmiBand, dots, navyBodyFat, oneRm, percentTable, rpeLoad, rpePercent } from '../src/lib/calculators'
import { plateSplit, pushPullBalance, pushPullOf, supersetOrder, warmupSets } from '../src/lib/plates'
import type { Meal } from '../src/lib/nutrition'
import type { Session } from '../src/types'

const near = (a: number, b: number, tol: number, msg?: string) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} esperado ~${b}, veio ${a}`)

// --- Alergênicos
assert.equal(evaluateAllergens({ name: 'Bolo' }, []).assessment, 'unable_to_assess', 'sem sensibilidades não há o que avaliar')
assert.equal(evaluateAllergens({ name: 'Bolo', declared: ['en:milk'] }, ['leite']).assessment, 'declared')
assert.equal(evaluateAllergens({ name: 'Barra', traces: ['en:gluten'] }, ['glúten']).assessment, 'may_contain', 'acentos e tags em inglês')
assert.equal(evaluateAllergens({ name: 'Bolo', ingredientsText: 'farinha de trigo, açúcar' }, ['gluten']).assessment, 'possible')
assert.equal(evaluateAllergens({ name: 'Bolo de ovo' }, ['ovo']).assessment, 'possible')
assert.equal(evaluateAllergens({ name: 'Ovomaltine' }, ['ovo']).assessment, 'unable_to_assess', 'palavra inteira, não pedaço')
assert.equal(evaluateAllergens({ name: 'Maçã', ingredientsText: 'maçã' }, ['leite']).assessment, 'unable_to_assess', 'sem correspondência NÃO é "seguro"')
const strongest = evaluateAllergens({ name: 'Bolo de leite', declared: ['en:milk'], traces: ['en:milk'] }, ['leite'])
assert.equal(strongest.assessment, 'declared', 'a fonte mais forte vence')
assert.ok(strongest.evidence.length >= 2 && strongest.matched.includes('leite'))
assert.deepEqual(evaluateAllergens({ name: 'x', declared: ['en:peanuts'] }, ['amendoim', 'soja']).matched, [], '"peanuts" (plural) é outra palavra: não presume')
assert.match(ALLERGEN_DISCLAIMER, /Leia sempre o rótulo/)

// --- Código de barras / Open Food Facts
assert.equal(isValidBarcode('7891000100103'), true)
assert.equal(isValidBarcode('73513537'), true)
assert.equal(isValidBarcode('7891000100104'), false, 'dígito verificador errado')
assert.equal(isValidBarcode('123'), false)
assert.equal(isValidBarcode('78910001001a3'), false)
const offOk = { status: 1, code: '7891000100103', product: { product_name: 'Leite em pó', product_name_pt: 'Leite integral em pó', brands: 'Marca X, Outra', serving_quantity: '26', nutriments: { 'energy-kcal_100g': 497, proteins_100g: 26, carbohydrates_100g: 38, fat_100g: 27 }, allergens_tags: ['en:milk'], traces_tags: ['en:soybeans'], ingredients_text: 'leite' } }
const off = parseOffProduct(offOk)
assert.equal(off.name, 'Leite integral em pó')
assert.equal(off.brand, 'Marca X')
assert.equal(off.servingGrams, 26)
assert.deepEqual(off.declaredAllergens, ['en:milk'])
assert.equal(parseOffProduct({ ...offOk, product: { ...offOk.product, nutriments: { 'energy-kj_100g': 2092 } } }).kcalPer100g, 500, 'converte kJ em kcal')
assert.equal(parseOffProduct({ ...offOk, product: { ...offOk.product, nutriments: { 'energy-kcal_100g': 100 } } }).macrosPer100g, null)
assert.throws(() => parseOffProduct({ status: 0 }), /não encontrado/)
assert.throws(() => parseOffProduct({ ...offOk, code: '7891000100104' }), /inválido/)
assert.throws(() => parseOffProduct({ ...offOk, product: { product_name: 'x', nutriments: {} } }), /energia/)
assert.throws(() => parseOffProduct({ ...offOk, product: { nutriments: { 'energy-kcal_100g': 1 } } }), /nome/)
assert.throws(() => parseOffProduct({ ...offOk, product: { ...offOk.product, nutriments: { 'energy-kcal_100g': -5 } } }), /energia/)
const src = toNutritionSource(off, '2026-11-24')
assert.equal(src.license, OFF_LICENSE)
assert.match(src.license, /ODbL/)
assert.equal(src.recordId, 'OFF-7891000100103')
const confirmed = calculateConfirmedNutrition(src, 26, true)
near(confirmed.kcal, 129.22, 0.01, 'kcal da porção')
assert.throws(() => calculateConfirmedNutrition(src, 26, false), /Confirme/, 'exige confirmação de gramas')

// --- Água
const at = (h: number, d = 24) => new Date(2026, 10, d, h).getTime()
let water = addWater([], { id: 'w1', ts: at(9), ml: 300 })
water = addWater(water, { id: 'w2', ts: at(15), ml: 500 })
water = addWater(water, { id: 'w3', ts: at(10, 23), ml: 1000 })
assert.equal(addWater(water, { id: 'w1', ts: at(9), ml: 300 }), water, 'id repetido não duplica')
assert.equal(waterTotalMl(water, '2026-11-24'), 800)
assert.deepEqual(waterProgress(800, 2000), { pct: 40, remainingMl: 1200, reached: false })
assert.equal(waterProgress(2500, 2000).reached, true)
assert.equal(waterProgress(2500, 2000).pct, 100)
assert.throws(() => waterProgress(0, 100))
assert.throws(() => addWater([], { id: 'x', ts: 0, ml: 0 }))
assert.throws(() => addWater([], { id: 'x', ts: 0, ml: 99999 }))

// --- Jejum
let fast = startFast('f1', at(20), 16, null)
assert.throws(() => startFast('f2', at(21), 16, fast), /em andamento/)
assert.throws(() => startFast('f2', at(21), 500, null))
assert.throws(() => startFast('f2', at(21), 0, null))
assert.deepEqual(fastStatus(fast, at(20) + 8 * 3_600_000), { elapsedHours: 8, remainingHours: 8, goalReached: false, active: true })
assert.equal(fastStatus(fast, at(20) + 17 * 3_600_000).goalReached, true)
fast = endFast(fast, at(20) + 10 * 3_600_000)
assert.equal(fastStatus(fast, at(20) + 99 * 3_600_000).elapsedHours, 10, 'jejum encerrado não continua contando')
assert.equal(fastStatus(fast, 0).active, false)
assert.throws(() => endFast(fast, at(22)), /já foi encerrado/)
assert.doesNotThrow(() => startFast('f3', at(23), 12, fast), 'depois de encerrar pode iniciar outro')
assert.throws(() => endFast(startFast('f4', at(20), 12, null), at(19)), /antes do início/)

// --- Refeições salvas
const meal = (id: string, date: string, time: string, items: [string, number | null, number | null][]): Meal => ({ id, date, time, type: 'x', items: items.map(([name, portion, kcal], i) => ({ id: `${id}${i}`, name, portion, kcal })) })
const meals = [
  meal('a', '2026-11-20', '08:00', [['Pão', 50, 130], ['Café', null, 2]]),
  meal('b', '2026-11-21', '08:00', [['Pão', 50, 130]]),
  meal('c', '2026-11-22', '12:00', [['Arroz', 150, 190], ['pão', 50, 130]]),
  meal('d', '2026-11-23', '13:00', [['Feijão', 100, 76]]),
]
const foods = savedFoods(meals, [])
assert.equal(foods.find((f) => f.name.toLowerCase() === 'pão')?.uses, 3, 'agrupa por nome sem diferenciar caixa')
assert.deepEqual(recentFoods(foods, 2).map((f) => f.name), ['Feijão', 'Arroz'])
assert.deepEqual(frequentFoods(foods).map((f) => f.name.toLowerCase()), ['pão'], 'frequente = usado mais de uma vez')
const favKey = foods.find((f) => f.name === 'Arroz')!.key
assert.deepEqual(favoriteFoods(savedFoods(meals, [favKey])).map((f) => f.name), ['Arroz'])
assert.equal(savedFoods([], []).length, 0)

// --- Calculadoras
assert.equal(oneRm(100, 1), 100)
assert.equal(oneRm(100, 5), 116.7)
assert.equal(oneRm(100, 5, 'brzycki'), 112.5)
near(oneRm(100, 5, 'lombardi'), 117.5, 0.1)
assert.throws(() => oneRm(100, 31)); assert.throws(() => oneRm(0, 5)); assert.throws(() => oneRm(100, NaN))
assert.equal(rpePercent(1, 10), 100); assert.equal(rpePercent(5, 10), 86.3); assert.equal(rpePercent(5, 9), 83.7)
assert.equal(rpePercent(5, 9.5), 85, 'interpola meio ponto')
assert.equal(rpePercent(12, 6), null, 'fora da tabela'); assert.equal(rpePercent(0, 8), null); assert.equal(rpePercent(5, 9.3), null)
assert.equal(rpeLoad(200, 5, 9), 165)
const table = percentTable(200)
assert.deepEqual(table[0], { pct: 100, weight: 200 }); assert.equal(table.find((r) => r.pct === 85)?.weight, 170); assert.equal(table.find((r) => r.pct === 40)?.weight, 80)
assert.equal(percentTable(101, 2.5).find((r) => r.pct === 95)?.weight, 95, 'arredonda para baixo na grade (95,95 → 95)')
assert.equal(bmi(80, 180), 24.7); assert.equal(bmiBand(24.7), 'peso normal'); assert.equal(bmiBand(17), 'abaixo do peso'); assert.equal(bmiBand(27), 'sobrepeso'); assert.equal(bmiBand(31), 'obesidade')
assert.throws(() => bmi(80, 0))
near(navyBodyFat({ sex: 'm', heightCm: 180, neckCm: 38, waistCm: 85 }), 16.1, 0.2, 'Marinha (homem)')
assert.ok(navyBodyFat({ sex: 'f', heightCm: 165, neckCm: 32, waistCm: 75, hipCm: 98 }) > 15)
assert.throws(() => navyBodyFat({ sex: 'm', heightCm: 180, neckCm: 40, waistCm: 38 }))
assert.throws(() => navyBodyFat({ sex: 'f', heightCm: 165, neckCm: 32, waistCm: 75 }), /Quadril/)
near(dots('m', 80, 400), 275.5, 0.5, 'DOTS')
assert.ok(dots('f', 60, 300) > 0)

// --- Anilhas e aquecimento
assert.deepEqual(plateSplit(100).perSide, [25, 15]); assert.equal(plateSplit(100).exact, true)
assert.deepEqual(plateSplit(62.5).perSide, [20, 1.25])
const odd = plateSplit(61); assert.equal(odd.exact, false); assert.equal(odd.remainderKg, 1); assert.equal(odd.loadedKg, 60)
assert.deepEqual(plateSplit(20).perSide, []); assert.equal(plateSplit(20).exact, true); assert.deepEqual(plateSplit(15).perSide, [])
assert.deepEqual(plateSplit(60, 20, [10, 5]).perSide, [10, 10], 'usa só as anilhas que você tem')
assert.throws(() => plateSplit(-1))
assert.deepEqual(warmupSets(100), [{ weight: 40, reps: 8 }, { weight: 60, reps: 5 }, { weight: 80, reps: 3 }, { weight: 90, reps: 1 }])
assert.deepEqual(warmupSets(40), [{ weight: 20, reps: 8 }, { weight: 22.5, reps: 5 }, { weight: 30, reps: 3 }, { weight: 35, reps: 1 }])
assert.deepEqual(warmupSets(25), [{ weight: 20, reps: 8 }, { weight: 22.5, reps: 1 }], 'sem repetir carga')
assert.deepEqual(warmupSets(20), []); assert.throws(() => warmupSets(0))

// --- Push/pull e superset
assert.equal(pushPullOf(['push_h_comp']), 'push'); assert.equal(pushPullOf(['iso_biceps']), 'pull'); assert.equal(pushPullOf(['knee_comp']), 'other')
const lk = (id: string) => ({ slotTypes: id === 'p' ? (['push_h_comp'] as never) : (['pull_h_comp'] as never) })
const log = (exerciseId: string) => ({ id: Math.random() + '', exerciseId, planExerciseId: 'x', setNumber: 1, weight: 10, reps: 10, ts: 0, isPR: false })
const sess = (logs: ReturnType<typeof log>[], startedAt = 100, status: Session['status'] = 'completed') => ({ id: 's' + startedAt, planId: 'p', dayId: 'd', dayLabel: 'A', startedAt, status, exercises: [], logs, currentIndex: 0, timer: null }) as Session
assert.equal(pushPullBalance([sess([log('p'), log('p')])], 0, 1000, lk).status, 'insufficient')
assert.equal(pushPullBalance([sess([...Array(9).fill(0).map(() => log('p')), ...Array(3).fill(0).map(() => log('q'))])], 0, 1000, lk).status, 'push_heavy')
assert.equal(pushPullBalance([sess([...Array(3).fill(0).map(() => log('p')), ...Array(9).fill(0).map(() => log('q'))])], 0, 1000, lk).status, 'pull_heavy')
assert.equal(pushPullBalance([sess([...Array(6).fill(0).map(() => log('p')), ...Array(6).fill(0).map(() => log('q'))])], 0, 1000, lk).status, 'balanced')
assert.equal(pushPullBalance([sess([...Array(12).fill(0).map(() => log('p'))], 5000)], 0, 1000, lk).push, 0, 'fora do período não conta')
assert.equal(pushPullBalance([sess([...Array(12).fill(0).map(() => log('p'))], 100, 'discarded')], 0, 1000, lk).push, 0)
assert.deepEqual(supersetOrder([{ exerciseId: 'a', sets: 3 }, { exerciseId: 'b', sets: 2 }]), [
  { exerciseId: 'a', setNumber: 1, restAfter: false }, { exerciseId: 'b', setNumber: 1, restAfter: true },
  { exerciseId: 'a', setNumber: 2, restAfter: false }, { exerciseId: 'b', setNumber: 2, restAfter: true },
  { exerciseId: 'a', setNumber: 3, restAfter: true },
])
assert.throws(() => supersetOrder([{ exerciseId: 'a', sets: 3 }])); assert.throws(() => supersetOrder([{ exerciseId: 'a', sets: 0 }, { exerciseId: 'b', sets: 1 }]))

console.log('extras: alergênicos, Open Food Facts, água/jejum/salvas, calculadoras, anilhas, aquecimento, push/pull e supersets OK')
