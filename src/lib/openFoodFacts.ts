// Código de barras + Open Food Facts (AURAVIZ-166). Só validação e conversão: NENHUMA chamada de rede é feita aqui.
// Dados do Open Food Facts estão sob ODbL 1.0: exigem atribuição e compartilhamento pela mesma licença do banco derivado.
import type { NutritionSource } from './mealAnalysis'

export const OFF_LICENSE = 'ODbL 1.0 — © colaboradores do Open Food Facts (https://world.openfoodfacts.org/data)'
export const OFF_ATTRIBUTION = 'Dados de produtos: Open Food Facts (ODbL 1.0).'

/** Valida EAN-8, UPC-A (12), EAN-13 e GTIN-14 pelo dígito verificador GS1. */
export function isValidBarcode(code: string): boolean {
  if (!/^\d+$/.test(code) || ![8, 12, 13, 14].includes(code.length)) return false
  const digits = code.split('').map(Number)
  const check = digits.pop()!
  const sum = digits.reverse().reduce((s, d, i) => s + d * (i % 2 === 0 ? 3 : 1), 0)
  return (10 - (sum % 10)) % 10 === check
}

export interface OffProduct {
  barcode: string
  name: string
  brand: string | null
  kcalPer100g: number
  macrosPer100g: { protein: number; carbohydrate: number; fat: number } | null
  servingGrams: number | null
  declaredAllergens: string[]
  traces: string[]
  ingredientsText: string | null
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : null)
const tags = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length < 80).slice(0, 50) : [])

/** Converte a resposta de /api/v2/product/{code}. Lança erro se faltarem nome ou energia por 100 g. */
export function parseOffProduct(raw: unknown): OffProduct {
  const r = raw as { status?: unknown; code?: unknown; product?: Record<string, unknown> }
  if (!r || r.status !== 1 || !r.product || typeof r.product !== 'object') throw new Error('Produto não encontrado.')
  const p = r.product
  const barcode = String(r.code ?? p.code ?? '')
  if (!isValidBarcode(barcode)) throw new Error('Código de barras inválido.')
  const name = [p.product_name_pt, p.product_name].find((n): n is string => typeof n === 'string' && n.trim().length > 0)?.trim().slice(0, 200)
  const n = (p.nutriments ?? {}) as Record<string, unknown>
  let kcal = num(n['energy-kcal_100g'])
  if (kcal === null) { const kj = num(n['energy-kj_100g']); kcal = kj === null ? null : Math.round((kj / 4.184) * 10) / 10 }
  if (!name || kcal === null) throw new Error('O produto não tem nome ou energia por 100 g.')
  const protein = num(n.proteins_100g), carbs = num(n.carbohydrates_100g), fat = num(n.fat_100g)
  const serving = num(p.serving_quantity)
  return {
    barcode, name, brand: typeof p.brands === 'string' && p.brands.trim() ? p.brands.split(',')[0].trim().slice(0, 100) : null, kcalPer100g: kcal,
    macrosPer100g: protein !== null && carbs !== null && fat !== null ? { protein, carbohydrate: carbs, fat } : null,
    servingGrams: serving !== null && serving > 0 ? serving : null,
    declaredAllergens: tags(p.allergens_tags), traces: tags(p.traces_tags),
    ingredientsText: typeof p.ingredients_text_pt === 'string' ? p.ingredients_text_pt.slice(0, 2000) : typeof p.ingredients_text === 'string' ? p.ingredients_text.slice(0, 2000) : null,
  }
}

/** Fonte para o cálculo confirmado (gramas confirmadas pelo usuário). Mantém licença e atribuição. */
export function toNutritionSource(product: OffProduct, retrievedOn: string): NutritionSource {
  return {
    source: 'licensed-dataset', recordId: `OFF-${product.barcode}`, description: product.brand ? `${product.name} (${product.brand})` : product.name,
    kcalPer100g: product.kcalPer100g, version: `off-${retrievedOn}`, license: OFF_LICENSE, sourceUrl: `https://world.openfoodfacts.org/product/${product.barcode}`,
    ...(product.macrosPer100g ? { macrosPer100g: product.macrosPer100g } : {}),
  }
}
