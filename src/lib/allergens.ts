// Alergênicos (AURAVIZ-166). Compara o alimento com as sensibilidades do usuário. É apoio à leitura do rótulo, NÃO garantia de segurança.
export type AllergenAssessment = 'declared' | 'may_contain' | 'possible' | 'unable_to_assess'

export interface AllergenSubject {
  name: string
  /** Alergênicos declarados no produto (ex.: tags do Open Food Facts "en:milk"). */
  declared?: string[]
  /** Avisos de traços ("pode conter"). */
  traces?: string[]
  ingredientsText?: string | null
  ingredientNames?: string[]
}
export interface AllergenResult { assessment: AllergenAssessment; matched: string[]; evidence: string[] }

/** Sensibilidade (como o usuário vê) → termos em português e tags em inglês. */
export const ALLERGEN_TERMS: Record<string, string[]> = {
  leite: ['leite', 'lactose', 'laticinio', 'manteiga', 'queijo', 'iogurte', 'milk', 'dairy'],
  ovo: ['ovo', 'ovos', 'egg', 'albumina', 'gema', 'clara'],
  amendoim: ['amendoim', 'peanut'],
  gluten: ['gluten', 'trigo', 'centeio', 'cevada', 'wheat', 'rye', 'barley'],
  soja: ['soja', 'soy', 'soya'],
  castanhas: ['castanha', 'nozes', 'noz', 'amendoa', 'avela', 'pistache', 'nuts', 'almond', 'hazelnut', 'cashew', 'walnut'],
  peixe: ['peixe', 'fish', 'atum', 'salmao', 'sardinha'],
  crustaceos: ['camarao', 'crustaceo', 'lagosta', 'caranguejo', 'crustaceans', 'shrimp'],
  gergelim: ['gergelim', 'sesame'],
}

const normalize = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/^[a-z]{2}:/, '').replace(/[-_]/g, ' ').trim()
const words = (s: string): string[] => normalize(s).split(/[^a-z0-9]+/).filter(Boolean)
const termsOf = (sensitivity: string): string[] => {
  const key = normalize(sensitivity)
  return ALLERGEN_TERMS[key] ?? [key]
}
const hits = (haystack: string[], terms: string[]): boolean => haystack.some((h) => terms.some((t) => { const w = words(h); return w.includes(t) || normalize(h) === t }))

/** Procura da fonte mais forte para a mais fraca; sem sensibilidades configuradas não há o que avaliar. */
export function evaluateAllergens(subject: AllergenSubject, sensitivities: string[]): AllergenResult {
  const configured = sensitivities.map((s) => s.trim()).filter(Boolean)
  if (configured.length === 0) return { assessment: 'unable_to_assess', matched: [], evidence: [] }
  const sources: Array<[AllergenAssessment, string, string[]]> = [
    ['declared', 'Alergênicos declarados no produto', subject.declared ?? []],
    ['may_contain', 'Aviso de traços', subject.traces ?? []],
    ['possible', 'Lista de ingredientes', subject.ingredientsText ? [subject.ingredientsText] : []],
    ['possible', 'Nome dos ingredientes', subject.ingredientNames ?? []],
    ['possible', 'Nome do alimento', [subject.name]],
  ]
  const matched = new Set<string>()
  const evidence: string[] = []
  let best: AllergenAssessment | null = null
  const rank: Record<AllergenAssessment, number> = { declared: 3, may_contain: 2, possible: 1, unable_to_assess: 0 }
  for (const [assessment, label, haystack] of sources) {
    if (haystack.length === 0) continue
    for (const sensitivity of configured) {
      if (hits(haystack, termsOf(sensitivity))) {
        matched.add(sensitivity)
        evidence.push(`${label}: ${sensitivity}`)
        if (best === null || rank[assessment] > rank[best]) best = assessment
      }
    }
  }
  // Sem correspondência não significa "seguro": pode faltar rótulo, então fica "não avaliável".
  if (best === null) return { assessment: 'unable_to_assess', matched: [], evidence: [] }
  return { assessment: best, matched: [...matched], evidence }
}

export const ALLERGEN_DISCLAIMER = 'Conferência automática de apoio. Leia sempre o rótulo: ela não garante que o alimento seja seguro para você.'
