import type { Limitation } from '../types'

/**
 * Circuito por tempo, sem equipamento. Fica fora de `EXERCISES` de propósito:
 * o catálogo principal alimenta o gerador por séries/repetições e exige arte
 * em tinta para cada item. Aqui as instruções são só textuais por enquanto.
 */
export type CircuitLevel = 'beginner' | 'intermediate' | 'advanced'

export interface CircuitVariant { name: string; how: string[] }

export interface CircuitMove {
  id: string
  name: string
  focus: string
  /** Movimento com salto ou aterrissagem. */
  impact: boolean
  /** Limitações do perfil que trocam o movimento pela versão modificada. */
  stresses: Limitation[]
  how: string[]
  /** Cuidado de segurança exibido junto do exercício. */
  watch: string
  /** Versão de baixo impacto e para iniciantes. */
  modified: CircuitVariant
}

export interface CircuitStep { id: string; name: string; how: string }

export interface CircuitProgram {
  id: string
  version: number
  title: string
  description: string
  prepareSec: number
  roundRestSec: number
  maxRounds: number
  levels: Record<CircuitLevel, { label: string; workSec: number; restSec: number; description: string }>
  warmup: CircuitStep[]
  cooldown: CircuitStep[]
  moves: CircuitMove[]
}

export const LEVEL_ORDER: CircuitLevel[] = ['beginner', 'intermediate', 'advanced']

export const cardioCoreCircuit: CircuitProgram = {
  id: 'cardio-core-v1',
  version: 1,
  title: 'Circuito cardio e core',
  description: 'Nove estações sem equipamento que alternam cardio e abdômen. Uma volta no ritmo avançado leva cerca de 9 minutos; aquecimento e desaquecimento somam mais 4 min 30 s.',
  prepareSec: 10,
  roundRestSec: 60,
  maxRounds: 3,
  levels: {
    beginner: { label: 'Iniciante', workSec: 25, restSec: 20, description: '25 s de trabalho, 20 s de descanso e versões modificadas em todas as estações.' },
    intermediate: { label: 'Intermediário', workSec: 35, restSec: 15, description: '35 s de trabalho e 15 s de descanso.' },
    advanced: { label: 'Avançado', workSec: 45, restSec: 15, description: '45 s de trabalho e 15 s de descanso, o ritmo do circuito original.' },
  },
  warmup: [
    { id: 'marcha', name: 'Marcha no lugar', how: 'Marche sem pressa, balançando os braços.' },
    { id: 'bracos', name: 'Círculos de braço', how: 'Braços estendidos ao lado, faça círculos para frente e depois para trás.' },
    { id: 'quadril', name: 'Círculos de quadril', how: 'Mãos na cintura, gire o quadril devagar nos dois sentidos.' },
    { id: 'tronco', name: 'Giro de tronco em pé', how: 'Pés afastados, gire o tronco de um lado para o outro sem forçar.' },
    { id: 'agachamento', name: 'Agachamento curto', how: 'Desça só até onde for confortável, com os calcanhares no chão.' },
  ],
  cooldown: [
    { id: 'respiracao', name: 'Respiração em pé', how: 'Caminhe devagar ou fique parado e solte o ar pela boca até a respiração acalmar.' },
    { id: 'quadriceps', name: 'Alongamento da coxa', how: 'Em pé, segure um pé atrás e mantenha os joelhos juntos. Troque o lado na metade.' },
    { id: 'posterior', name: 'Alongamento posterior sentado', how: 'Sentado, pernas estendidas, leve o tronco à frente sem arredondar as costas.' },
    { id: 'rotacao', name: 'Rotação deitado', how: 'Deitado, leve os joelhos dobrados para um lado e depois para o outro, ombros no chão.' },
  ],
  moves: [
    { id: 'polichinelo', name: 'Polichinelo', focus: 'Cardio global', impact: true, stresses: ['joelho'],
      how: ['Salte abrindo pernas e braços ao mesmo tempo.', 'Volte unindo as pernas e baixando os braços.', 'Aterrisse na ponta dos pés, com os joelhos levemente dobrados.'],
      watch: 'Aterrisse suave. Se houver dor no joelho ou tornozelo, use a versão sem salto.',
      modified: { name: 'Polichinelo sem salto', how: ['Dê um passo para o lado enquanto eleva os braços.', 'Volte ao centro e alterne o lado.'] } },
    { id: 'rotacao-russa', name: 'Rotação russa', focus: 'Oblíquos e rotação de tronco', impact: false, stresses: ['lombar'],
      how: ['Sentado, incline o tronco para trás com as costas retas e tire os pés do chão.', 'Gire o tronco levando as mãos de um lado ao outro.', 'O movimento vem das costelas, não só dos braços.'],
      watch: 'Mantenha a coluna longa. Pare se sentir dor lombar.',
      modified: { name: 'Rotação russa com pés no chão', how: ['Sentado, calcanhares apoiados e tronco pouco inclinado.', 'Gire devagar de um lado ao outro.'] } },
    { id: 'elevacao-pernas', name: 'Elevação de pernas', focus: 'Abdômen inferior e flexores do quadril', impact: false, stresses: ['lombar'],
      how: ['Deitado, mãos ao lado do corpo ou sob o quadril.', 'Suba as pernas estendidas até cerca de 90°.', 'Desça devagar sem deixar a lombar sair do chão.'],
      watch: 'Se a lombar descolar do chão, diminua a amplitude ou dobre os joelhos.',
      modified: { name: 'Elevação alternada com joelhos dobrados', how: ['Deitado, joelhos dobrados e lombar apoiada.', 'Leve um joelho ao peito e volte, alternando as pernas.'] } },
    { id: 'abdominal-estrela', name: 'Abdominal estrela', focus: 'Abdômen e oblíquos com equilíbrio', impact: false, stresses: ['lombar'],
      how: ['Deitado em X, braços e pernas abertos.', 'Suba o tronco e uma perna, levando a mão em direção ao pé oposto.', 'Desça com controle e alterne o lado.'],
      watch: 'Não puxe o pescoço. Mantenha a cabeça alinhada com a coluna.',
      modified: { name: 'Abdominal com alcance cruzado', how: ['Deitado, joelhos dobrados e pés apoiados.', 'Tire as escápulas do chão e leve a mão em direção ao joelho oposto. Alterne.'] } },
    { id: 'prancha-giro', name: 'Prancha com giro de quadril', focus: 'Core dinâmico e estabilidade de ombros', impact: false, stresses: ['ombro', 'punho'],
      how: ['Em prancha nos antebraços, cotovelos abaixo dos ombros.', 'Gire o quadril até quase tocar o chão de um lado.', 'Volte ao centro e gire para o outro lado.'],
      watch: 'Abdômen firme e ombros longe das orelhas. Sem dor nos ombros.',
      modified: { name: 'Dead bug alternado', how: ['Deitado, braços para cima e joelhos dobrados a 90°.', 'Estenda braço e perna opostos sem tirar a lombar do chão. Alterne.'] } },
    { id: 'escalador', name: 'Escalador', focus: 'Cardio intenso, core e ombros', impact: false, stresses: ['ombro', 'punho'],
      how: ['Em prancha alta, mãos abaixo dos ombros.', 'Leve um joelho ao peito e troque as pernas em ritmo.', 'Quadril alinhado com os ombros, sem subir.'],
      watch: 'Não deixe o quadril subir nem cair. Ombros sobre as mãos.',
      modified: { name: 'Joelho ao peito em pé', how: ['Em pé, eleve um joelho em direção ao peito.', 'Alterne as pernas em ritmo confortável, sem saltar.'] } },
    { id: 'chute-sentado', name: 'Chute sentado', focus: 'Abdômen e flexores do quadril', impact: false, stresses: [],
      how: ['Sentado, mãos apoiadas atrás e tronco levemente inclinado.', 'Estenda e dobre as pernas juntas, sem tocar os pés no chão.', 'Mantenha o peito aberto.'],
      watch: 'Menos carga na lombar que os exercícios deitados. Não afunde os ombros.',
      modified: { name: 'Chute sentado alternado', how: ['Sentado, mãos atrás, um pé apoiado no chão.', 'Estenda e dobre uma perna por vez.'] } },
    { id: 'bicicleta', name: 'Abdominal bicicleta', focus: 'Oblíquos e reto abdominal', impact: false, stresses: ['lombar'],
      how: ['Deitado, mãos ao lado da cabeça e escápulas fora do chão.', 'Leve o cotovelo em direção ao joelho oposto enquanto estende a outra perna.', 'Alterne com controle.'],
      watch: 'As mãos só apoiam a cabeça, sem puxar o pescoço. Ritmo controlado vale mais que velocidade.',
      modified: { name: 'Bicicleta lenta com amplitude curta', how: ['Mesma posição, pernas mais altas e joelhos mais dobrados.', 'Gire devagar, sem estender a perna até o fim.'] } },
    { id: 'joelho-alto', name: 'Joelho alto com toque', focus: 'Cardio intenso', impact: true, stresses: ['joelho'],
      how: ['Corra no lugar elevando os joelhos à altura do quadril.', 'Toque as mãos nos joelhos a cada passada.', 'Pise na ponta dos pés com o tronco ereto.'],
      watch: 'Tem impacto em joelhos e tornozelos. Se doer, use a versão de marcha.',
      modified: { name: 'Marcha alta com toque', how: ['Marche elevando os joelhos sem saltar.', 'Toque a mão no joelho a cada passo.'] } },
  ],
}

export const circuitPrograms: CircuitProgram[] = [cardioCoreCircuit]
export const circuitById = new Map(circuitPrograms.map((p) => [p.id, p]))
