/** Desenhos vetoriais originais do WinFit. Ver docs/media-licenses.md. */
import { EXERCISES } from './exercises'
import { catalogMovementDemo } from './catalogMovementDemos'
export interface MovementPose {
  head: [number, number]
  torso: string
  arm: string
  otherArm: string
  leg: string
  otherLeg: string
  toeSupport?: 'both' | 'leg'
}

export interface MovementDemo {
  start: MovementPose
  end: MovementPose
  cue: string
  view: string
  hold?: boolean
  equipment?: {
    load?: 'barbell' | 'dumbbells' | 'kettlebell'
    at?: 'hands' | 'shoulders' | 'hip'
    loadRotation?: number
    singleLoad?: boolean
    handSupport?: [number, number]
    bench?: [number, number, number]
    anchor?: [number, number]
    anchorAt?: 'hands' | 'feet'
    loopAt?: 'hands' | 'knees'
    band?: boolean
    machine?: boolean
    bar?: boolean
  }
}

const standing: MovementPose = {
  head: [150, 31], torso: '150,47 155,94', arm: '150,51 119,71 90,73', otherArm: '150,51 128,76 100,80',
  leg: '155,94 153,126 150,157', otherLeg: '155,94 174,126 180,157',
}
const squat: MovementPose = {
  head: [137, 66], torso: '140,82 175,111', arm: '142,85 113,90 82,90', otherArm: '142,85 121,98 94,98',
  leg: '175,111 133,117 150,157', otherLeg: '175,111 161,129 180,157',
}
const pushUp: MovementPose = {
  head: [83, 76], torso: '103,88 183,119', arm: '103,88 108,122 112,157', otherArm: '103,88 123,123 128,157',
  leg: '183,119 219,139 254,157', otherLeg: '183,119 221,137 264,157',
}
const pushDown: MovementPose = {
  head: [88, 121], torso: '108,133 186,144', arm: '108,133 135,143 112,157', otherArm: '108,133 147,144 128,157',
  leg: '186,144 220,150 254,157', otherLeg: '186,144 224,149 264,157',
}
const kneesUp: MovementPose = { ...pushUp,
  leg: '183,119 225,157 258,135', otherLeg: '183,119 235,157 268,137',
}
const kneesDown: MovementPose = { ...pushDown,
  leg: '186,144 225,157 258,135', otherLeg: '186,144 235,157 268,137',
}
const bridgeLow: MovementPose = {
  head: [74, 143], torso: '95,150 172,150', arm: '95,150 126,156 158,156', otherArm: '95,150 123,148 153,148',
  leg: '172,150 210,105 242,157', otherLeg: '172,150 218,113 256,157',
}
const bridgeHigh: MovementPose = {
  ...bridgeLow, torso: '95,150 166,110', leg: '166,110 210,105 242,157', otherLeg: '166,110 218,113 256,157',
}
const prone: MovementPose = {
  head: [90, 92], torso: '115,92 195,92', arm: '115,92 78,58 40,58', otherArm: '115,92 78,126 40,126',
  leg: '195,92 235,76 278,76', otherLeg: '195,92 235,108 278,108',
}
const pronePull: MovementPose = {
  ...prone, arm: '115,92 149,47 109,45', otherArm: '115,92 149,137 109,139',
}
const plank: MovementPose = {
  head: [83,108], torso: '103,120 183,140', arm: '103,120 103,157 70,157', otherArm: '103,120 115,157 84,157',
  leg: '183,140 219,149 254,157', otherLeg: '183,140 224,148 264,157',
}
const kneePlank: MovementPose = { ...plank, leg: '183,140 225,157 258,135', otherLeg: '183,140 235,157 268,137' }
const sidePlank: MovementPose = {
  head: [83,103], torso: '103,115 180,137', arm: '103,115 103,157 70,157', otherArm: '103,115 149,105 180,137',
  leg: '180,137 218,147 256,157', otherLeg: '180,137 218,147 256,157',
}
const sideKnees: MovementPose = { ...sidePlank, leg: '180,137 225,157 245,125', otherLeg: '180,137 225,157 245,125' }
const deadBug: MovementPose = {
  head: [76, 140], torso: '98,149 178,149', arm: '98,149 101,114 104,78', otherArm: '98,149 113,115 117,80',
  leg: '178,149 184,100 230,100', otherLeg: '178,149 199,105 244,105',
}
const pike: MovementPose = {
  head: [105, 104], torso: '128,89 193,43', arm: '128,89 119,123 111,157', otherArm: '128,89 134,126 127,157',
  leg: '193,43 229,100 266,157', otherLeg: '193,43 233,100 277,157',
}

const demo = (start: MovementPose, end: MovementPose, cue: string, view = 'Vista lateral'): MovementDemo => ({ start, end, cue, view })
const hold = (pose: MovementPose, cue: string): MovementDemo => ({ start: pose, end: pose, cue, view: 'Vista lateral', hold: true })

const BODYWEIGHT_DEMOS: Record<string, MovementDemo> = {
  'agachamento-corporal': demo(standing, squat, 'Desça com controle e mantenha os pés inteiros no chão.'),
  flexao: demo(pushUp, pushDown, 'Desça o peito mantendo ombros, quadril e calcanhares alinhados.'),
  'flexao-diamante': demo({ ...pushUp, otherArm: pushUp.arm }, { ...pushDown, otherArm: pushDown.arm }, 'Mãos próximas sob o peito; cotovelos acompanham o tronco.'),
  'flexao-joelhos': demo(kneesUp, kneesDown, 'Os joelhos ficam apoiados; ombros e quadril descem juntos.'),
  'puxada-prona-solo': demo(prone, pronePull, 'De barriga para baixo, leve os cotovelos às costelas sem forçar a lombar.', 'Vista superior'),
  'ponte-gluteo': demo(bridgeLow, bridgeHigh, 'Suba o quadril contraindo os glúteos, sem arquear a lombar.'),
  'ponte-unilateral': demo(
    { ...bridgeLow, otherLeg: '172,150 211,113 253,84' },
    { ...bridgeHigh, otherLeg: '166,110 209,90 253,70' },
    'Uma perna sustenta o movimento; repita do outro lado.'),
  prancha: hold(plank, 'Sustente o corpo alinhado e respire normalmente.'),
  'prancha-joelhos': hold(kneePlank, 'Joelhos no chão, abdômen firme e ombros alinhados ao quadril.'),
  'prancha-lateral': hold(sidePlank, 'Sustente o quadril, sem girar o tronco. Repita do outro lado.'),
  'prancha-lateral-joelhos': hold(sideKnees, 'Apoie os joelhos dobrados e mantenha o quadril elevado. Troque o lado.'),
  'avanco-corporal': demo(
    { ...standing, leg: '155,94 124,124 104,157', otherLeg: '155,94 199,124 222,157' },
    { ...standing, head: [150,61], torso: '150,77 155,124', arm: '150,81 120,95 90,95', otherArm: '150,81 132,105 108,105', leg: '155,124 104,119 104,157', otherLeg: '155,124 192,151 222,157' },
    'Desça entre os pés e volte com controle. Alterne as pernas.'),
  'pike-pushup': demo(pike,
    { ...pike, head: [104, 134], torso: '128,119 193,65', arm: '128,119 143,148 111,157', otherArm: '128,119 156,148 127,157', leg: '193,65 230,111 266,157', otherLeg: '193,65 240,111 277,157' },
    'Dobre os cotovelos com quadril alto. A cabeça não sustenta o peso.'),
  'dead-bug': demo(deadBug,
    { ...deadBug, arm: '98,149 64,134 30,124', leg: '178,149 222,151 267,154' },
    'Estenda braço e perna opostos sem arquear a lombar. Alterne os lados.'),
  'abdominal-infra': demo(
    { ...bridgeLow, arm: '95,150 126,156 158,156', leg: '172,150 214,150 260,150', otherLeg: '172,150 214,150 260,150' },
    { ...bridgeLow, arm: '95,150 126,156 158,156', leg: '172,150 172,104 172,58', otherLeg: '172,150 172,104 172,58' },
    'Eleve e desça as pernas mantendo a lombar apoiada.'),
  'abdominal-supra': demo(bridgeLow,
    { ...bridgeLow, head: [88, 117], torso: '106,129 172,150', arm: '106,129 135,130 160,130', otherArm: '106,129 130,125 154,125' },
    'Tire as escápulas do chão com controle, sem puxar o pescoço.'),
}

export const MOVEMENT_DEMOS: Record<string, MovementDemo> = Object.fromEntries(
  EXERCISES.map((exercise) => [exercise.id, BODYWEIGHT_DEMOS[exercise.id] ?? catalogMovementDemo(exercise)]),
)
