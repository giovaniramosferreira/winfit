import type { MuscleGroup } from '../types'
import { EXERCISES } from './exercises'

/**
 * Conteúdo anatômico do atlas, por grupo muscular. Fonte: anatomia descritiva
 * clássica (Gray's Anatomy). Conteúdo educativo, não substitui orientação profissional.
 * O app usa um nome latino por grupo — o músculo principal do grupo.
 */
export interface MuscleEntry {
  latin: string
  also?: string
  origin: string
  insertion: string
  action: string
  view: 'front' | 'back' | 'both'
}

export const ANATOMY: Record<MuscleGroup, MuscleEntry> = {
  peito: {
    latin: 'Pectoralis major',
    origin: 'Metade medial da clavícula, esterno e cartilagens costais 1 a 6.',
    insertion: 'Crista do tubérculo maior do úmero.',
    action: 'Aduz, flexiona e roda o braço para dentro.',
    view: 'front',
  },
  costas: {
    latin: 'Latissimus dorsi',
    also: 'com trapézio e romboides',
    origin: 'Processos espinhosos de T7 a L5, fáscia toracolombar, crista ilíaca e últimas costelas.',
    insertion: 'Sulco intertubercular do úmero.',
    action: 'Estende, aduz e roda o braço para dentro; puxa o corpo em direção à barra.',
    view: 'back',
  },
  ombro: {
    latin: 'Deltoideus',
    origin: 'Terço lateral da clavícula, acrômio e espinha da escápula.',
    insertion: 'Tuberosidade deltoidea do úmero.',
    action: 'Abduz o braço; a porção anterior flexiona e a posterior estende.',
    view: 'both',
  },
  biceps: {
    latin: 'Biceps brachii',
    origin: 'Cabeça longa no tubérculo supraglenoidal; cabeça curta no processo coracoide.',
    insertion: 'Tuberosidade do rádio.',
    action: 'Flexiona o cotovelo e gira o antebraço com a palma para cima.',
    view: 'front',
  },
  triceps: {
    latin: 'Triceps brachii',
    origin: 'Cabeça longa no tubérculo infraglenoidal; cabeças lateral e medial na face posterior do úmero.',
    insertion: 'Olécrano da ulna.',
    action: 'Estende o cotovelo.',
    view: 'back',
  },
  quadriceps: {
    latin: 'Quadriceps femoris',
    also: 'reto femoral e três vastos',
    origin: 'Reto femoral na espinha ilíaca anteroinferior; vastos no corpo do fêmur.',
    insertion: 'Tuberosidade da tíbia, pelo tendão patelar.',
    action: 'Estende o joelho; o reto femoral também flexiona o quadril.',
    view: 'front',
  },
  posterior: {
    latin: 'Musculi ischiocrurales',
    also: 'bíceps femoral, semitendíneo e semimembranáceo',
    origin: 'Tuberosidade isquiática; cabeça curta do bíceps femoral na linha áspera do fêmur.',
    insertion: 'Cabeça da fíbula e face medial da tíbia.',
    action: 'Flexionam o joelho e estendem o quadril.',
    view: 'back',
  },
  gluteo: {
    latin: 'Gluteus maximus',
    origin: 'Face posterior do ílio, sacro e cóccix.',
    insertion: 'Tuberosidade glútea do fêmur e trato iliotibial.',
    action: 'Estende o quadril e roda a coxa para fora.',
    view: 'back',
  },
  panturrilha: {
    latin: 'Triceps surae',
    also: 'gastrocnêmio e sóleo',
    origin: 'Gastrocnêmio nos côndilos do fêmur; sóleo na tíbia e na fíbula.',
    insertion: 'Calcâneo, pelo tendão calcâneo (de Aquiles).',
    action: 'Faz a flexão plantar: fica na ponta dos pés.',
    view: 'back',
  },
  core: {
    latin: 'Rectus abdominis',
    also: 'com oblíquos e transverso',
    origin: 'Crista e sínfise púbica.',
    insertion: 'Cartilagens costais 5 a 7 e processo xifoide.',
    action: 'Flexiona o tronco e estabiliza a coluna contra rotação e extensão.',
    view: 'both',
  },
}

/** Regiões do índice do atlas, na ordem de leitura do livro. */
export const REGIONS: { title: string; groups: MuscleGroup[] }[] = [
  { title: 'Tronco', groups: ['peito', 'costas', 'core'] },
  { title: 'Ombro e braço', groups: ['ombro', 'biceps', 'triceps'] },
  { title: 'Quadril e coxa', groups: ['gluteo', 'quadriceps', 'posterior'] },
  { title: 'Perna', groups: ['panturrilha'] },
]

/** Número de prancha estável: ordem de leitura do atlas (região → grupo → nome). */
const ORDER: string[] = REGIONS.flatMap((r) => r.groups).flatMap((g) =>
  EXERCISES.filter((e) => e.primary === g)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .map((e) => e.id),
)
const PLATE = new Map(ORDER.map((id, i) => [id, i + 1]))

export const plateNo = (exerciseId: string): number => PLATE.get(exerciseId) ?? 0

const ROMAN: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
export function roman(n: number): string {
  let out = ''
  for (const [v, s] of ROMAN) while (n >= v) { out += s; n -= v }
  return out
}
