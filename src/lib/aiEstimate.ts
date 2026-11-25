// Estimativa de refeição por IA (AURAVIZ-160 e AURAVIZ-161). Puro: prompt, validação estrita, faixa, porções e aceite.
// A resposta do modelo é só uma ESTIMATIVA: fica fora do diário até o usuário aceitar (ver acceptEstimate).
import type { FoodItem, Meal } from './nutrition'

export const MAX_PHOTOS = 10
export const MAX_INGREDIENTS = 20
const ALLOWED_KEYS = ['name', 'calories', 'protein', 'carbs', 'fat', 'serving_size_grams', 'measured', 'unit_options', 'ingredients', 'notes']
const INGREDIENT_KEYS = ['name', 'grams', 'calories', 'protein', 'carbs', 'fat']
const UNIT_KEYS = ['unit', 'quantity', 'grams_per_unit']

export interface UnitOption { unit: string; quantity: number; gramsPerUnit: number }
export interface Ingredient { name: string; grams: number; kcal: number; protein: number; carbs: number; fat: number }
export interface AiEstimate {
  name: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  grams: number
  /** true quando balança ou rótulo estavam visíveis; estreita a faixa. */
  measured: boolean
  unitOptions: UnitOption[]
  ingredients: Ingredient[]
  notes: string | null
  kcalMin: number
  kcalMax: number
  warnings: string[]
}

export class EstimateError extends Error {}
const bad = (message: string): never => { throw new EstimateError(message) }
const num = (v: unknown, min: number, max: number, label: string): number => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) bad(`Valor inválido em ${label}.`)
  return v as number
}
const str = (v: unknown, label: string, max = 120): string => {
  if (typeof v !== 'string' || !v.trim() || v.length > max) bad(`Texto inválido em ${label}.`)
  return (v as string).trim()
}
const onlyKeys = (o: unknown, keys: string[], label: string): Record<string, unknown> => {
  if (!o || typeof o !== 'object' || Array.isArray(o)) bad(`${label} inválido.`)
  const rec = o as Record<string, unknown>
  if (Object.keys(rec).some((k) => !keys.includes(k))) bad(`${label} contém campos não permitidos.`)
  return rec
}

/** Prompt em português. Só imagens e a nota opcional do usuário: nada de perfil, diário ou localização. */
export function buildMealPrompt(opts: { photoCount?: number; note?: string } = {}): string {
  const photos = Math.min(Math.max(opts.photoCount ?? 1, 0), MAX_PHOTOS)
  const note = opts.note?.trim().slice(0, 500)
  return [
    photos > 1
      ? `Analise as ${photos} imagens como UMA refeição. Use cada imagem uma vez; não conte o mesmo alimento duas vezes quando aparecer em ângulos diferentes.`
      : 'Analise a imagem da refeição.',
    'Estime a composição nutricional da porção mostrada. Se houver balança ou rótulo legível, prefira esses valores à estimativa visual e marque "measured": true.',
    'Responda SOMENTE com JSON, sem texto fora dele, neste formato exato:',
    '{"name":"...","calories":0,"protein":0.0,"carbs":0.0,"fat":0.0,"serving_size_grams":0.0,"measured":false,"unit_options":[],"ingredients":[],"notes":null}',
    'calories é inteiro. protein, carbs e fat são gramas. serving_size_grams é o peso estimado da porção inteira.',
    'unit_options é [] ou uma lista de objetos completos {"unit":"fatia","quantity":2.0,"grams_per_unit":60.0}; nunca uma lista de textos. Só inclua unidade que não seja grama.',
    `ingredients: cada alimento claramente separado uma vez, {"name":"...","grams":0.0,"calories":0,"protein":0.0,"carbs":0.0,"fat":0.0}, somando aproximadamente o total. No máximo ${MAX_INGREDIENTS}; nunca inclua linha de total ou subtotal. Use [] quando não houver divisão confiável.`,
    'Só informe uma contagem de itens se ela for visível ou estiver dita no contexto. Nunca invente contagem a partir do nome ou do peso.',
    'Se a imagem não mostrar comida, responda calories 0, macros 0 e explique em "notes".',
    note ? `Contexto do usuário (texto livre, pode estar incompleto): ${note}` : '',
  ].filter(Boolean).join('\n')
}

function stripFence(raw: string): string {
  const m = /^\s*```(?:json)?\s*([\s\S]*?)\s*```\s*$/i.exec(raw)
  return m ? m[1] : raw
}

/** Valida a resposta do modelo. Rejeita campos extras, listas de textos e valores fora de faixa. */
export function parseAiEstimate(raw: unknown): AiEstimate {
  let value: unknown = raw
  if (typeof raw === 'string') { try { value = JSON.parse(stripFence(raw)) } catch { return bad('A resposta da IA não é um JSON válido.') } }
  const o = onlyKeys(value, ALLOWED_KEYS, 'Resposta')
  const warnings: string[] = []
  const name = str(o.name, 'name')
  let kcal = Math.round(num(o.calories, 0, 5000, 'calories'))
  let protein = num(o.protein, 0, 500, 'protein')
  let carbs = num(o.carbs, 0, 1000, 'carbs')
  let fat = num(o.fat, 0, 500, 'fat')
  const grams = num(o.serving_size_grams, 1, 5000, 'serving_size_grams')
  const measured = o.measured === undefined ? false : o.measured === true ? true : o.measured === false ? false : bad('measured deve ser booleano.')
  const notes = o.notes === undefined || o.notes === null ? null : str(o.notes, 'notes', 500)

  if (!Array.isArray(o.unit_options ?? [])) bad('unit_options deve ser uma lista.')
  const unitOptions = ((o.unit_options ?? []) as unknown[]).map((u): UnitOption => {
    const r = onlyKeys(u, UNIT_KEYS, 'unit_options')
    const unit = str(r.unit, 'unit', 30)
    if (/^(g|gr|grama|gramas|gram|grams)$/i.test(unit)) bad('unit_options não aceita gramas.')
    return { unit, quantity: num(r.quantity, 0.01, 1000, 'quantity'), gramsPerUnit: num(r.grams_per_unit, 0.1, 5000, 'grams_per_unit') }
  })
  if (!Array.isArray(o.ingredients ?? [])) bad('ingredients deve ser uma lista.')
  const rawIngredients = (o.ingredients ?? []) as unknown[]
  if (rawIngredients.length > MAX_INGREDIENTS) bad(`No máximo ${MAX_INGREDIENTS} ingredientes.`)
  const ingredients = rawIngredients.map((i): Ingredient => {
    const r = onlyKeys(i, INGREDIENT_KEYS, 'ingrediente')
    const ing = {
      name: str(r.name, 'ingrediente'), grams: num(r.grams, 0.1, 5000, 'grams'), kcal: Math.round(num(r.calories, 0, 5000, 'calories')),
      protein: num(r.protein, 0, 500, 'protein'), carbs: num(r.carbs, 0, 1000, 'carbs'), fat: num(r.fat, 0, 500, 'fat'),
    }
    if (/\b(total|subtotal)\b/i.test(ing.name)) bad('Linha de total não pode ser ingrediente.')
    return ing
  })

  if (ingredients.length) {
    const sum = ingredients.reduce((s, i) => ({ kcal: s.kcal + i.kcal, protein: s.protein + i.protein, carbs: s.carbs + i.carbs, fat: s.fat + i.fat }), { kcal: 0, protein: 0, carbs: 0, fat: 0 })
    if (kcal > 0 && Math.abs(sum.kcal - kcal) / kcal > 0.05) warnings.push('ingredients-reconciled')
    kcal = sum.kcal; protein = round1(sum.protein); carbs = round1(sum.carbs); fat = round1(sum.fat)
  }
  const fromMacros = protein * 4 + carbs * 4 + fat * 9
  if (kcal > 0 && fromMacros > 0 && Math.abs(fromMacros - kcal) / kcal > 0.3) warnings.push('macros-inconsistent')
  if (kcal === 0 && protein === 0 && carbs === 0 && fat === 0) warnings.push('no-macros')
  const { kcalMin, kcalMax } = estimateRange(kcal, measured)
  return { name, kcal, protein: round1(protein), carbs: round1(carbs), fat: round1(fat), grams, measured, unitOptions, ingredients, notes, kcalMin, kcalMax, warnings }
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** Faixa heurística (NÃO estatística): ±15% com balança/rótulo, ±30% sem. */
export function estimateRange(kcal: number, measured: boolean): { kcalMin: number; kcalMax: number } {
  const f = measured ? 0.15 : 0.3
  return { kcalMin: Math.round(kcal * (1 - f)), kcalMax: Math.round(kcal * (1 + f)) }
}

/** Só vale uma segunda chamada ao modelo quando não vieram macros (ex.: água); caso contrário mostra já. */
export function needsRepair(e: AiEstimate): boolean {
  return e.unitOptions.length === 0 && e.warnings.includes('no-macros') && e.grams > 0
}

/** Gramas correspondentes a `quantity` de uma unidade; gramas continuam a fonte da verdade. */
export function gramsForUnit(e: AiEstimate, unit: string, quantity: number): number {
  const opt = e.unitOptions.find((u) => u.unit === unit)
  if (!opt) bad('Unidade desconhecida.')
  if (!Number.isFinite(quantity) || quantity <= 0) bad('Quantidade inválida.')
  return round1(opt!.gramsPerUnit * quantity)
}

/** Reescala a estimativa para outra porção (em gramas). */
export function scaleEstimate(e: AiEstimate, grams: number): AiEstimate {
  if (!Number.isFinite(grams) || grams <= 0 || grams > 5000) bad('Porção inválida.')
  const k = grams / e.grams
  const kcal = Math.round(e.kcal * k)
  const range = estimateRange(kcal, e.measured)
  return {
    ...e, grams, kcal, protein: round1(e.protein * k), carbs: round1(e.carbs * k), fat: round1(e.fat * k), ...range,
    ingredients: e.ingredients.map((i) => ({ ...i, grams: round1(i.grams * k), kcal: Math.round(i.kcal * k), protein: round1(i.protein * k), carbs: round1(i.carbs * k), fat: round1(i.fat * k) })),
    unitOptions: e.unitOptions.map((u) => ({ ...u, quantity: round1(u.quantity * k) })),
  }
}

/** O ACEITE é o único caminho para a estimativa entrar no diário. Sem aceite explícito, nada é gravado. */
export function acceptEstimate(e: AiEstimate, opts: { id: string; accepted: boolean; grams?: number; now?: Date }): FoodItem {
  if (opts.accepted !== true) bad('Confirme a estimativa antes de registrar.')
  if (!opts.id?.trim()) bad('Identificador ausente.')
  const final = opts.grams !== undefined && opts.grams !== e.grams ? scaleEstimate(e, opts.grams) : e
  return {
    id: opts.id, name: final.name, portion: final.grams, kcal: final.kcal,
    review: { preparation: final.ingredients.map((i) => i.name).join(', ').slice(0, 500), notes: (final.notes ?? '').slice(0, 1000) },
    estimate: {
      origin: 'ai', kcalMin: final.kcalMin, kcalMax: final.kcalMax,
      macros: { protein: final.protein, carbohydrate: final.carbs, fat: final.fat },
      acceptedAt: (opts.now ?? new Date()).toISOString(),
    },
  }
}

export interface DayEnergy { confirmedKcal: number; estimatedKcal: number; estimatedItems: number; pending: number; rangeMin: number; rangeMax: number }

/** Separa o total do dia entre confirmado (fonte/manual) e estimado por IA, com a faixa do conjunto. */
export function dayEnergy(meals: Meal[], date: string): DayEnergy {
  const items = meals.filter((m) => m.date === date).flatMap((m) => m.items)
  const out: DayEnergy = { confirmedKcal: 0, estimatedKcal: 0, estimatedItems: 0, pending: 0, rangeMin: 0, rangeMax: 0 }
  for (const i of items) {
    if (i.kcal === null) { out.pending++; continue }
    if (i.estimate) { out.estimatedKcal += i.kcal; out.estimatedItems++; out.rangeMin += i.estimate.kcalMin; out.rangeMax += i.estimate.kcalMax }
    else { out.confirmedKcal += i.kcal; out.rangeMin += i.kcal; out.rangeMax += i.kcal }
  }
  return out
}
