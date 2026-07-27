import type { Equipment, Goal, SlotType } from '../types'

// Programas curados: prescrição fechada, escrita à mão, para quem quer seguir um
// plano pronto em vez do gerado pelo perfil. O gerador continua sendo o padrão —
// isto é a prateleira de "treinos prontos" que todo app pago tem.

export interface ProgramItem {
  exerciseId: string
  slot: SlotType
  sets: number
  repMin: number
  repMax: number
  restSec: number
  optional?: boolean
  /** por que este exercício está aqui, nesta ordem */
  note?: string
}

export interface ProgramDay {
  label: string
  focus: string
  items: ProgramItem[]
}

export interface Program {
  id: string
  name: string
  tagline: string
  goal: Goal
  daysPerWeek: number
  level: 'iniciante' | 'intermediário' | 'avançado'
  estMin: number
  /** equipamento sem o qual o programa perde a identidade */
  requires: Equipment[]
  highlights: string[]
  rationale: string[]
  days: ProgramDay[]
}

// Composto pesado → composto secundário → acessórios → isolados → core.
// Cada grupo grande volta 3×/semana: a frequência é o que separa este programa
// de um ABC clássico, onde cada músculo é treinado uma vez só.
const MASSA_TOTAL: Program = {
  id: 'massa-total-fb3',
  name: 'Massa Total',
  tagline: 'Corpo inteiro 3× por semana para ganho de massa',
  goal: 'hypertrophy',
  daysPerWeek: 3,
  level: 'intermediário',
  estMin: 65,
  requires: ['barra', 'banco', 'halteres', 'maquinas', 'polia'],
  highlights: [
    'Cada grupo muscular estimulado 3× por semana',
    'Composto pesado abrindo toda sessão',
    '16–20 séries semanais nos grupos grandes',
    'Dupla progressão em todos os exercícios',
  ],
  rationale: [
    'Corpo inteiro 3×/semana entrega a cada músculo três estímulos semanais, contra um único do ABC clássico — com o mesmo tempo de academia, é mais oportunidade de crescer.',
    'Cada sessão abre com um composto pesado em 6–8 repetições (força e tensão mecânica) e fecha em 10–15 (volume e estresse metabólico). Os dois estímulos importam para hipertrofia.',
    'Descansos longos nos compostos (150–180 s) e curtos nos isolados: a carga do agachamento depende de recuperação completa, a da rosca não.',
    'A ordem é fixa por um motivo: o que exige mais coordenação e carga vem quando você está inteiro. Trocar a ordem custa carga nos exercícios que mais rendem.',
  ],
  days: [
    {
      label: 'Massa A — Agachamento & Supino',
      focus: 'Quadríceps, peito, costas',
      items: [
        { exerciseId: 'agachamento-barra', slot: 'knee_comp', sets: 4, repMin: 6, repMax: 8, restSec: 165, note: 'Abre a sessão inteiro: é o exercício que mais exige de você.' },
        { exerciseId: 'supino-reto-barra', slot: 'push_h_comp', sets: 4, repMin: 6, repMax: 8, restSec: 150 },
        { exerciseId: 'remada-curvada-barra', slot: 'pull_h_comp', sets: 4, repMin: 8, repMax: 10, restSec: 120, note: 'Puxada horizontal equilibra o volume de empurrar do supino.' },
        { exerciseId: 'desenvolvimento-halteres', slot: 'push_v_comp', sets: 3, repMin: 8, repMax: 12, restSec: 90 },
        { exerciseId: 'rosca-direta-barra', slot: 'iso_biceps', sets: 3, repMin: 10, repMax: 12, restSec: 60 },
        { exerciseId: 'triceps-polia', slot: 'iso_triceps', sets: 3, repMin: 10, repMax: 12, restSec: 60 },
        { exerciseId: 'prancha', slot: 'core', sets: 3, repMin: 30, repMax: 60, restSec: 45, optional: true },
      ],
    },
    {
      label: 'Massa B — Terra & Puxada',
      focus: 'Posterior, costas, peito alto',
      items: [
        { exerciseId: 'terra-romeno-barra', slot: 'hip_comp', sets: 4, repMin: 8, repMax: 10, restSec: 150, note: 'Posterior e glúteo com a coluna neutra — desça até alongar, não até o chão.' },
        { exerciseId: 'puxada-polia', slot: 'pull_v_comp', sets: 4, repMin: 8, repMax: 12, restSec: 120 },
        { exerciseId: 'leg-press', slot: 'knee_comp', sets: 3, repMin: 10, repMax: 12, restSec: 120, note: 'Volume de quadríceps sem repetir a fadiga de coluna do agachamento.' },
        { exerciseId: 'supino-inclinado-halteres', slot: 'push_h_comp', sets: 3, repMin: 8, repMax: 12, restSec: 90 },
        { exerciseId: 'elevacao-lateral-halteres', slot: 'iso_ombro_lat', sets: 3, repMin: 12, repMax: 15, restSec: 45 },
        { exerciseId: 'mesa-flexora', slot: 'iso_posterior', sets: 3, repMin: 10, repMax: 12, restSec: 60 },
        { exerciseId: 'panturrilha-maquina', slot: 'iso_panturrilha', sets: 4, repMin: 10, repMax: 15, restSec: 45 },
      ],
    },
    {
      label: 'Massa C — Volume & Braço',
      focus: 'Corpo inteiro, ênfase em braço',
      items: [
        { exerciseId: 'levantamento-terra', slot: 'hip_comp', sets: 3, repMin: 5, repMax: 6, restSec: 180, note: 'Séries curtas e pesadas: terra em alta repetição custa técnica sem pagar em músculo.' },
        { exerciseId: 'supino-halteres', slot: 'push_h_comp', sets: 4, repMin: 8, repMax: 12, restSec: 120 },
        { exerciseId: 'remada-serrote', slot: 'pull_h_comp', sets: 3, repMin: 10, repMax: 12, restSec: 90 },
        { exerciseId: 'bulgaro', slot: 'lower_uni', sets: 3, repMin: 10, repMax: 12, restSec: 90, note: 'Unilateral corrige o desequilíbrio que o agachamento esconde.' },
        { exerciseId: 'voador-maquina', slot: 'iso_peito', sets: 3, repMin: 12, repMax: 15, restSec: 60 },
        { exerciseId: 'rosca-martelo', slot: 'iso_biceps', sets: 3, repMin: 10, repMax: 12, restSec: 60 },
        { exerciseId: 'triceps-frances-halter', slot: 'iso_triceps', sets: 3, repMin: 10, repMax: 12, restSec: 60 },
        { exerciseId: 'abdominal-infra', slot: 'core', sets: 3, repMin: 12, repMax: 15, restSec: 45, optional: true },
      ],
    },
  ],
}

const ESTRELA_ULF: Program = {
  id: 'estrela-ulf3',
  name: 'Superior / Inferior / Full',
  tagline: 'Três dias, cada músculo 2× por semana',
  goal: 'hypertrophy',
  daysPerWeek: 3,
  level: 'intermediário',
  estMin: 60,
  requires: ['barra', 'banco', 'halteres', 'maquinas', 'polia'],
  highlights: [
    'Divisão clássica de quem treina 3×',
    'Dia de perna dedicado, sem dividir atenção',
    'Fecha a semana com compostos de corpo inteiro',
  ],
  rationale: [
    'Superior / Inferior / Corpo inteiro dá a cada grupo duas exposições semanais e ainda concede um dia inteiro para as pernas — o melhor meio-termo quando são só três dias.',
    'O dia de corpo inteiro fecha a semana com os padrões de maior retorno (terra, supino inclinado, remada), cobrindo o que ficou de fora nos dois primeiros.',
    'Isolados sempre depois dos compostos: bíceps cansado antes da remada tira carga das costas, que é onde o crescimento acontece.',
  ],
  days: [
    {
      label: 'Superior',
      focus: 'Peito, costas, ombro, braço',
      items: [
        { exerciseId: 'supino-reto-barra', slot: 'push_h_comp', sets: 4, repMin: 6, repMax: 8, restSec: 150 },
        { exerciseId: 'remada-curvada-barra', slot: 'pull_h_comp', sets: 4, repMin: 6, repMax: 8, restSec: 150 },
        { exerciseId: 'desenvolvimento-halteres', slot: 'push_v_comp', sets: 3, repMin: 8, repMax: 10, restSec: 90 },
        { exerciseId: 'puxada-polia', slot: 'pull_v_comp', sets: 3, repMin: 10, repMax: 12, restSec: 60 },
        { exerciseId: 'voador-maquina', slot: 'iso_peito', sets: 3, repMin: 10, repMax: 12, restSec: 60 },
        { exerciseId: 'rosca-direta-barra', slot: 'iso_biceps', sets: 3, repMin: 10, repMax: 12, restSec: 60 },
        { exerciseId: 'triceps-polia', slot: 'iso_triceps', sets: 3, repMin: 10, repMax: 12, restSec: 60 },
      ],
    },
    {
      label: 'Inferior',
      focus: 'Pernas completo',
      items: [
        { exerciseId: 'agachamento-barra', slot: 'knee_comp', sets: 4, repMin: 6, repMax: 8, restSec: 165 },
        { exerciseId: 'leg-press', slot: 'knee_comp', sets: 4, repMin: 8, repMax: 10, restSec: 120 },
        { exerciseId: 'terra-romeno-barra', slot: 'hip_comp', sets: 3, repMin: 8, repMax: 10, restSec: 90 },
        { exerciseId: 'cadeira-extensora', slot: 'iso_quad', sets: 3, repMin: 12, repMax: 15, restSec: 60 },
        { exerciseId: 'mesa-flexora', slot: 'iso_posterior', sets: 3, repMin: 10, repMax: 12, restSec: 60 },
        { exerciseId: 'abducao-maquina', slot: 'iso_gluteo', sets: 3, repMin: 12, repMax: 15, restSec: 45, optional: true },
        { exerciseId: 'panturrilha-maquina', slot: 'iso_panturrilha', sets: 4, repMin: 12, repMax: 15, restSec: 45 },
      ],
    },
    {
      label: 'Corpo inteiro',
      focus: 'Compostos + core',
      items: [
        { exerciseId: 'levantamento-terra', slot: 'hip_comp', sets: 4, repMin: 5, repMax: 6, restSec: 180 },
        { exerciseId: 'supino-inclinado-halteres', slot: 'push_h_comp', sets: 3, repMin: 8, repMax: 10, restSec: 90 },
        { exerciseId: 'remada-serrote', slot: 'pull_h_comp', sets: 3, repMin: 8, repMax: 10, restSec: 90 },
        { exerciseId: 'elevacao-lateral-halteres', slot: 'iso_ombro_lat', sets: 3, repMin: 12, repMax: 15, restSec: 45 },
        { exerciseId: 'afundo-halteres', slot: 'lower_uni', sets: 3, repMin: 10, repMax: 12, restSec: 60 },
        { exerciseId: 'prancha', slot: 'core', sets: 3, repMin: 40, repMax: 60, restSec: 45 },
      ],
    },
  ],
}

export const PROGRAMS: Program[] = [MASSA_TOTAL, ESTRELA_ULF]
export const programById = new Map(PROGRAMS.map((p) => [p.id, p]))
