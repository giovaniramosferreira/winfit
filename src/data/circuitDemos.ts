/**
 * Demonstrações vetoriais do circuito (mesmo boneco em tinta de movementDemos.ts).
 * Duas poses por estação, animadas em vaivém. Chave `id` = versão original,
 * `id:mod` = versão modificada. Coordenadas no quadro 320 × 180, chão em y = 163.
 */
import type { MovementDemo, MovementPose } from './movementDemos'

const demo = (start: MovementPose, end: MovementPose, cue: string, view = 'Vista lateral'): MovementDemo => ({ start, end, cue, view })

// ── Em pé, de frente ─────────────────────────────────────────────────────────
const frontStand: MovementPose = {
  head: [160, 33], torso: '160,50 160,96', arm: '160,54 151,77 147,99', otherArm: '160,54 169,77 173,99',
  leg: '160,96 156,127 154,157', otherLeg: '160,96 164,127 166,157',
}
const jackOpen: MovementPose = {
  head: [160, 27], torso: '160,44 160,90', arm: '160,48 137,30 121,11', otherArm: '160,48 183,30 199,11',
  leg: '160,90 141,121 125,151', otherLeg: '160,90 179,121 195,151',
}
const stepOut: MovementPose = {
  ...frontStand, arm: '160,54 137,36 121,17', otherArm: '160,54 183,36 199,17', otherLeg: '160,96 182,127 198,157',
}

// ── Em pé, de lado (olhando para a esquerda) ─────────────────────────────────
const sideStand: MovementPose = {
  head: [150, 31], torso: '150,47 155,94', arm: '150,51 145,75 142,98', otherArm: '150,51 158,75 162,97',
  leg: '155,94 153,126 150,157', otherLeg: '155,94 158,126 160,157',
}
const kneeDrive: MovementPose = {
  ...sideStand, arm: '150,51 160,72 152,92', otherArm: '150,51 133,68 128,50', leg: '155,94 122,94 124,127',
}
const highKnee = (lift: number, knee: 'leg' | 'otherLeg'): MovementPose => {
  const y = (v: number) => v - lift
  const up = `155,${y(94)} 124,${y(91)} 127,${y(125)}`
  const support = `155,${y(94)} 154,${y(126)} 151,${y(157)}`
  return {
    head: [150, y(31)], torso: `150,${y(47)} 155,${y(94)}`,
    arm: knee === 'leg' ? `150,${y(51)} 138,${y(72)} 127,${y(88)}` : `150,${y(51)} 160,${y(73)} 156,${y(95)}`,
    otherArm: knee === 'otherLeg' ? `150,${y(51)} 138,${y(72)} 127,${y(88)}` : `150,${y(51)} 160,${y(73)} 156,${y(95)}`,
    leg: knee === 'leg' ? up : support, otherLeg: knee === 'otherLeg' ? up : support,
  }
}

// ── Sentado ──────────────────────────────────────────────────────────────────
const twistBase: MovementPose = {
  head: [203, 90], torso: '194,106 170,148', arm: '194,108 170,118 148,126', otherArm: '194,108 172,124 150,131',
  leg: '170,148 136,117 105,127', otherLeg: '170,148 133,121 102,131',
}
const twistSide: MovementPose = { ...twistBase, arm: '194,108 192,134 170,150', otherArm: '194,108 188,138 166,153' }
const twistFeetDown = (p: MovementPose): MovementPose => ({ ...p, head: [196, 86], torso: '188,103 170,148', leg: '170,148 136,118 108,157', otherLeg: '170,148 133,121 104,157' })

const seatedTuck: MovementPose = {
  head: [207, 93], torso: '198,109 170,150', arm: '198,111 214,132 222,157', otherArm: '198,111 210,134 230,157',
  leg: '170,150 141,121 118,135', otherLeg: '170,150 138,124 115,138',
}
const seatedLong: MovementPose = { ...seatedTuck, leg: '170,150 130,139 88,129', otherLeg: '170,150 130,141 88,132' }
const footDown = '170,150 139,119 118,157'

// ── Deitado (cabeça à esquerda) ──────────────────────────────────────────────
const lying: MovementPose = {
  head: [74, 143], torso: '95,150 172,150', arm: '95,150 126,156 158,156', otherArm: '95,150 123,148 153,148',
  leg: '172,150 214,150 260,150', otherLeg: '172,150 214,151 260,152',
}
const legsUp: MovementPose = { ...lying, leg: '172,150 172,104 172,58', otherLeg: '172,150 173,104 174,58' }
const kneesBent: MovementPose = { ...lying, leg: '172,150 210,107 242,157', otherLeg: '172,150 218,113 256,157' }
const kneeToChest: MovementPose = { ...kneesBent, leg: '172,150 158,110 190,99' }

const starFlat: MovementPose = { ...lying, arm: '95,150 62,152 30,154', otherArm: '95,150 62,148 30,146' }
const starReach: MovementPose = {
  head: [96, 108], torso: '112,121 172,150', arm: '112,121 152,107 196,96', otherArm: '112,121 96,140 82,156',
  leg: '172,150 206,121 239,93', otherLeg: '172,150 214,151 260,152',
}
const crossReach: MovementPose = {
  ...kneesBent, head: [88, 117], torso: '106,129 172,150', arm: '106,129 150,119 197,109', otherArm: '106,129 112,147 126,157',
}

const crunchTorso = { head: [88, 124] as [number, number], torso: '104,135 172,150', arm: '104,135 113,115 92,117', otherArm: '104,135 101,116 86,121' }
const bikeA: MovementPose = { ...lying, ...crunchTorso, leg: '172,150 151,114 186,104', otherLeg: '172,150 215,139 258,129' }
const bikeB: MovementPose = { ...lying, ...crunchTorso, leg: '172,150 215,139 258,129', otherLeg: '172,150 151,114 186,104' }
const shortBikeA: MovementPose = { ...bikeA, leg: '172,150 156,108 186,94', otherLeg: '172,150 196,108 226,102' }
const shortBikeB: MovementPose = { ...bikeA, leg: '172,150 196,108 226,102', otherLeg: '172,150 156,108 186,94' }

const deadBug: MovementPose = {
  head: [76, 140], torso: '98,149 178,149', arm: '98,149 101,114 104,78', otherArm: '98,149 113,115 117,80',
  leg: '178,149 184,100 230,100', otherLeg: '178,149 199,105 244,105',
}

// ── Prancha ──────────────────────────────────────────────────────────────────
const forearmPlank: MovementPose = {
  head: [83, 108], torso: '103,120 183,140', arm: '103,120 103,157 70,157', otherArm: '103,120 115,157 84,157',
  leg: '183,140 219,149 254,157', otherLeg: '183,140 224,148 264,157',
}
const hipDrop: MovementPose = { ...forearmPlank, torso: '103,120 180,154', leg: '180,154 219,155 254,157', otherLeg: '180,154 224,155 264,157' }

const highPlank: MovementPose = {
  head: [83, 76], torso: '103,88 183,119', arm: '103,88 108,122 112,157', otherArm: '103,88 123,123 128,157',
  leg: '183,119 219,139 254,157', otherLeg: '183,119 221,137 264,157',
}
const climbA: MovementPose = { ...highPlank, leg: '183,119 151,135 163,153' }
const climbB: MovementPose = { ...highPlank, otherLeg: '183,119 151,134 162,152' }

export const CIRCUIT_DEMOS: Record<string, MovementDemo> = {
  polichinelo: demo(frontStand, jackOpen, 'Abra pernas e braços no salto e aterrisse com os joelhos levemente dobrados.', 'Vista frontal'),
  'polichinelo:mod': demo(frontStand, stepOut, 'Passo para o lado enquanto os braços sobem. Alterne o lado, sem saltar.', 'Vista frontal'),
  'rotacao-russa': demo(twistBase, twistSide, 'Pés fora do chão; leve as mãos de um lado ao outro girando o tronco.'),
  'rotacao-russa:mod': demo(twistFeetDown(twistBase), twistFeetDown(twistSide), 'Calcanhares no chão e tronco pouco inclinado. Gire devagar.'),
  'elevacao-pernas': demo(lying, legsUp, 'Suba as pernas até 90° e desça devagar sem tirar a lombar do chão.'),
  'elevacao-pernas:mod': demo(kneesBent, kneeToChest, 'Joelhos dobrados; leve um joelho ao peito por vez.'),
  'abdominal-estrela': demo(starFlat, starReach, 'Do X no chão, leve a mão em direção ao pé oposto. Alterne o lado.'),
  'abdominal-estrela:mod': demo(kneesBent, crossReach, 'Pés apoiados; tire as escápulas do chão e alcance o joelho oposto.'),
  'prancha-giro': demo(forearmPlank, hipDrop, 'Na prancha, gire o quadril em direção ao chão e volte ao centro. Alterne.'),
  'prancha-giro:mod': demo(deadBug, { ...deadBug, arm: '98,149 64,134 30,124', leg: '178,149 222,151 267,154' }, 'Estenda braço e perna opostos sem arquear a lombar. Alterne.'),
  escalador: demo(climbA, climbB, 'Troque os joelhos em direção ao peito com o quadril alinhado aos ombros.'),
  'escalador:mod': demo(sideStand, kneeDrive, 'Em pé, eleve um joelho em direção ao peito. Alterne sem saltar.'),
  'chute-sentado': demo(seatedTuck, seatedLong, 'Mãos atrás; estenda e dobre as pernas sem apoiar os pés.'),
  'chute-sentado:mod': demo({ ...seatedTuck, otherLeg: footDown }, { ...seatedLong, otherLeg: footDown }, 'Um pé apoiado; estenda e dobre a outra perna. Troque o lado.'),
  bicicleta: demo(bikeA, bikeB, 'Cotovelo em direção ao joelho oposto enquanto a outra perna estende.'),
  'bicicleta:mod': demo(shortBikeA, shortBikeB, 'Pernas mais altas e amplitude curta, em ritmo lento.'),
  'joelho-alto': demo(highKnee(5, 'leg'), highKnee(5, 'otherLeg'), 'Joelhos na altura do quadril, tocando as mãos a cada passada.'),
  'joelho-alto:mod': demo(highKnee(0, 'leg'), highKnee(0, 'otherLeg'), 'Marche elevando os joelhos e tocando a mão, sem saltar.'),
}

export const circuitDemoFor = (moveId: string, modified: boolean): MovementDemo | undefined =>
  CIRCUIT_DEMOS[modified ? `${moveId}:mod` : moveId]
