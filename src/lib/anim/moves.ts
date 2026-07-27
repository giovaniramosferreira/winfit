// Biblioteca de movimentos. Cada movimento é um ciclo de keyframes + o equipamento
// que o acompanha. A figura olha para a direita em todos eles — os aparelhos são
// posicionados em torno disso, então a leitura é sempre a mesma.

import { GROUND, type Pose, type Skel, type Palette, type Vec, pose } from './rig'
import * as prop from './props'

type Ctx = CanvasRenderingContext2D
export interface Frame { t: number; pose: Pose }
export interface Move {
  frames: Frame[]
  cycleMs: number
  /** atrás da figura */
  back?: (ctx: Ctx, s: Skel, P: Palette) => void
  /** na frente da figura */
  front?: (ctx: Ctx, s: Skel, P: Palette) => void
  view?: { x: number; y: number; w: number; h: number }
}

const mv = (m: Move): Move => m
const mid = (a: Vec, b: Vec): Vec => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]

// ============================================================
// INFERIORES
// ============================================================

const SQUAT_TOP = pose({ hip: [100, 84], torso: 6, armN: [232, 30], armF: [236, 34] })
const SQUAT_BOT = pose({
  hip: [96, 106], torso: 30, armN: [248, 42], armF: [252, 46],
  legN: [108, 202, 96], legF: [106, 200, 96],
})

export const squat = mv({
  cycleMs: 2600,
  frames: [{ t: 0, pose: SQUAT_TOP }, { t: 0.42, pose: SQUAT_BOT }, { t: 0.55, pose: SQUAT_BOT }, { t: 1, pose: SQUAT_TOP }],
  back: (ctx, s, P) => { prop.floor(ctx, P); prop.barbell(ctx, s.hands, P) },
})

export const squatGoblet = mv({
  cycleMs: 2600,
  frames: [
    { t: 0, pose: pose({ hip: [100, 84], torso: 6, armN: [200, 20], armF: [204, 24] }) },
    { t: 0.42, pose: pose({ hip: [96, 106], torso: 26, armN: [214, 30], armF: [218, 34], legN: [108, 202, 96], legF: [106, 200, 96] }) },
    { t: 0.55, pose: pose({ hip: [96, 106], torso: 26, armN: [214, 30], armF: [218, 34], legN: [108, 202, 96], legF: [106, 200, 96] }) },
    { t: 1, pose: pose({ hip: [100, 84], torso: 6, armN: [200, 20], armF: [204, 24] }) },
  ],
  back: (ctx, _s, P) => prop.floor(ctx, P),
  front: (ctx, s, P) => prop.dumbbell(ctx, s.hands, P, true),
})

const legPressPose = (legN: [number, number, number], legF: [number, number, number]) =>
  pose({ hip: [70, 116], torso: 300, head: 12, armN: [246, 250], armF: [250, 254], legN, legF })

export const legPress = mv({
  cycleMs: 2800,
  view: { x: 10, y: 60, w: 180, h: 92 },
  frames: [
    { t: 0, pose: legPressPose([80, 84, 84], [78, 82, 84]) },
    { t: 0.44, pose: legPressPose([30, 130, 120], [28, 128, 120]) },
    { t: 0.56, pose: legPressPose([30, 130, 120], [28, 128, 120]) },
    { t: 1, pose: legPressPose([80, 84, 84], [78, 82, 84]) },
  ],
  back: (ctx, s, P) => {
    prop.floor(ctx, P)
    prop.bench(ctx, 50, 120, P, -32, 60)
    prop.legPressRig(ctx, mid(s.toeN, s.toeF), P)
  },
})

const HINGE_TOP = pose({ hip: [100, 84], torso: 4, armN: [174, 176], armF: [178, 180] })
const HINGE_BOT = pose({
  hip: [104, 88], torso: 72, armN: [166, 170], armF: [170, 174],
  legN: [172, 186, 96], legF: [170, 184, 96],
})

export const hinge = mv({
  cycleMs: 2800,
  frames: [{ t: 0, pose: HINGE_TOP }, { t: 0.45, pose: HINGE_BOT }, { t: 0.56, pose: HINGE_BOT }, { t: 1, pose: HINGE_TOP }],
  back: (ctx, _s, P) => prop.floor(ctx, P),
  front: (ctx, s, P) => prop.barbell(ctx, s.hands, P),
})

export const hingeDumbbell = mv({
  ...hinge,
  front: (ctx, s, P) => { prop.dumbbell(ctx, s.handN, P); prop.dumbbell(ctx, s.handF, P) },
})

export const deadlift = mv({
  cycleMs: 3000,
  frames: [
    { t: 0, pose: pose({ hip: [102, 104], torso: 58, armN: [176, 178], armF: [180, 182], legN: [158, 196, 96], legF: [156, 194, 96] }) },
    { t: 0.42, pose: pose({ hip: [100, 84], torso: 4, armN: [176, 178], armF: [180, 182] }) },
    { t: 0.54, pose: pose({ hip: [100, 84], torso: 4, armN: [176, 178], armF: [180, 182] }) },
    { t: 1, pose: pose({ hip: [102, 104], torso: 58, armN: [176, 178], armF: [180, 182], legN: [158, 196, 96], legF: [156, 194, 96] }) },
  ],
  back: (ctx, _s, P) => prop.floor(ctx, P),
  front: (ctx, s, P) => prop.barbell(ctx, s.hands, P, 14),
})

export const kbSwing = mv({
  cycleMs: 1700,
  frames: [
    { t: 0, pose: pose({ hip: [104, 92], torso: 62, armN: [186, 190], armF: [190, 194], legN: [170, 188, 96], legF: [168, 186, 96] }) },
    { t: 0.4, pose: pose({ hip: [98, 82], torso: -4, armN: [86, 88], armF: [90, 92] }) },
    { t: 1, pose: pose({ hip: [104, 92], torso: 62, armN: [186, 190], armF: [190, 194], legN: [170, 188, 96], legF: [168, 186, 96] }) },
  ],
  back: (ctx, _s, P) => prop.floor(ctx, P),
  front: (ctx, s, P) => prop.kettlebell(ctx, s.hands, P),
})

// Ombros apoiados no banco: o tronco gira em torno do apoio enquanto o quadril sobe,
// então o ângulo do tronco muda junto com a altura do quadril para a nuca ficar parada.
const HT_DOWN = pose({ hip: [102, 122], torso: 50, armN: [128, 176], armF: [132, 180], legN: [285, 176, 96], legF: [283, 174, 96] })
const HT_UP = pose({ hip: [99, 112], torso: 71, armN: [140, 178], armF: [144, 182], legN: [268, 174, 96], legF: [266, 172, 96] })

export const hipThrust = mv({
  cycleMs: 2400,
  frames: [{ t: 0, pose: HT_DOWN }, { t: 0.4, pose: HT_UP }, { t: 0.55, pose: HT_UP }, { t: 1, pose: HT_DOWN }],
  back: (ctx, _s, P) => { prop.floor(ctx, P); prop.bench(ctx, 136, 106, P, 0, 46) },
  front: (ctx, s, P) => prop.barbell(ctx, [s.hip[0] + 1, s.hip[1] - 3], P, 12),
})

// Cabeça à direita ⇒ os pés têm de ficar à esquerda do quadril, senão pernas e
// tronco se sobrepõem e a figura vira uma mancha.
const GB_DOWN = pose({ hip: [92, 124], torso: 94, armN: [200, 190], armF: [204, 194], legN: [295, 178, 250], legF: [293, 176, 250] })
const GB_UP = pose({ hip: [92, 110], torso: 122, armN: [206, 196], armF: [210, 200], legN: [272, 176, 250], legF: [270, 174, 250] })

export const gluteBridge = mv({
  cycleMs: 2200,
  frames: [{ t: 0, pose: GB_DOWN }, { t: 0.4, pose: GB_UP }, { t: 0.55, pose: GB_UP }, { t: 1, pose: GB_DOWN }],
  back: (ctx, _s, P) => prop.floor(ctx, P),
})

const LUNGE_UP = pose({ hip: [98, 84], torso: 6, legN: [166, 184, 96], legF: [194, 180, 100] })
// Perna de trás: canela quase horizontal com o joelho baixo — é o que separa
// visualmente um afundo de um agachamento.
const LUNGE_DOWN = pose({ hip: [96, 98], torso: 10, legN: [135, 190, 96], legF: [200, 277, 200] })

export const lunge = mv({
  cycleMs: 2600,
  frames: [{ t: 0, pose: LUNGE_UP }, { t: 0.44, pose: LUNGE_DOWN }, { t: 0.56, pose: LUNGE_DOWN }, { t: 1, pose: LUNGE_UP }],
  back: (ctx, _s, P) => prop.floor(ctx, P),
  front: (ctx, s, P) => { prop.dumbbell(ctx, s.handN, P); prop.dumbbell(ctx, s.handF, P) },
})

export const lungeBody = mv({ ...lunge, front: undefined })

export const bulgarian = mv({
  cycleMs: 2800,
  frames: [
    { t: 0, pose: pose({ hip: [96, 88], torso: 10, legN: [162, 188, 96], legF: [214, 126, 150] }) },
    { t: 0.44, pose: pose({ hip: [96, 106], torso: 14, legN: [142, 208, 96], legF: [222, 118, 152] }) },
    { t: 0.56, pose: pose({ hip: [96, 106], torso: 14, legN: [142, 208, 96], legF: [222, 118, 152] }) },
    { t: 1, pose: pose({ hip: [96, 88], torso: 10, legN: [162, 188, 96], legF: [214, 126, 150] }) },
  ],
  back: (ctx, _s, P) => { prop.floor(ctx, P); prop.bench(ctx, 62, 116, P, 0, 42) },
  front: (ctx, s, P) => { prop.dumbbell(ctx, s.handN, P); prop.dumbbell(ctx, s.handF, P) },
})

export const legExtension = mv({
  cycleMs: 2300,
  frames: [
    { t: 0, pose: pose({ hip: [92, 100], torso: 12, armN: [150, 168], armF: [154, 172], legN: [96, 176, 120], legF: [94, 174, 120] }) },
    { t: 0.4, pose: pose({ hip: [92, 100], torso: 12, armN: [150, 168], armF: [154, 172], legN: [96, 100, 74], legF: [94, 98, 74] }) },
    { t: 0.55, pose: pose({ hip: [92, 100], torso: 12, armN: [150, 168], armF: [154, 172], legN: [96, 100, 74], legF: [94, 98, 74] }) },
    { t: 1, pose: pose({ hip: [92, 100], torso: 12, armN: [150, 168], armF: [154, 172], legN: [96, 176, 120], legF: [94, 174, 120] }) },
  ],
  back: (ctx, _s, P) => { prop.floor(ctx, P); prop.seat(ctx, 88, 104, P, 10) },
  front: (ctx, s, P) => prop.pad(ctx, s.ankleN, P, 7),
})

export const legCurl = mv({
  cycleMs: 2300,
  frames: [
    { t: 0, pose: pose({ hip: [96, 108], torso: 96, armN: [128, 148], armF: [132, 152], legN: [268, 268, 210], legF: [266, 266, 210] }) },
    { t: 0.4, pose: pose({ hip: [96, 108], torso: 96, armN: [128, 148], armF: [132, 152], legN: [268, 340, 250], legF: [266, 338, 250] }) },
    { t: 0.55, pose: pose({ hip: [96, 108], torso: 96, armN: [128, 148], armF: [132, 152], legN: [268, 340, 250], legF: [266, 338, 250] }) },
    { t: 1, pose: pose({ hip: [96, 108], torso: 96, armN: [128, 148], armF: [132, 152], legN: [268, 268, 210], legF: [266, 266, 210] }) },
  ],
  back: (ctx, _s, P) => { prop.floor(ctx, P); prop.bench(ctx, 112, 118, P, 0, 76) },
  front: (ctx, s, P) => prop.pad(ctx, s.ankleN, P, 7),
})

export const calfRaise = mv({
  cycleMs: 1800,
  frames: [
    { t: 0, pose: pose({ hip: [100, 88], legN: [180, 179, 104], legF: [180, 181, 104] }) },
    { t: 0.4, pose: pose({ hip: [100, 74], legN: [180, 179, 74], legF: [180, 181, 74] }) },
    { t: 0.55, pose: pose({ hip: [100, 74], legN: [180, 179, 74], legF: [180, 181, 74] }) },
    { t: 1, pose: pose({ hip: [100, 88], legN: [180, 179, 104], legF: [180, 181, 104] }) },
  ],
  back: (ctx, _s, P) => prop.floor(ctx, P),
  front: (ctx, s, P) => { prop.dumbbell(ctx, s.handN, P); prop.dumbbell(ctx, s.handF, P) },
})

export const calfBody = mv({ ...calfRaise, front: undefined })

export const abduction = mv({
  cycleMs: 2200,
  frames: [
    { t: 0, pose: pose({ hip: [96, 100], torso: 10, armN: [156, 166], armF: [160, 170], legN: [110, 176, 120], legF: [108, 174, 120] }) },
    { t: 0.4, pose: pose({ hip: [96, 100], torso: 10, armN: [156, 166], armF: [160, 170], legN: [122, 176, 122], legF: [96, 174, 118] }) },
    { t: 0.55, pose: pose({ hip: [96, 100], torso: 10, armN: [156, 166], armF: [160, 170], legN: [122, 176, 122], legF: [96, 174, 118] }) },
    { t: 1, pose: pose({ hip: [96, 100], torso: 10, armN: [156, 166], armF: [160, 170], legN: [110, 176, 120], legF: [108, 174, 120] }) },
  ],
  back: (ctx, _s, P) => { prop.floor(ctx, P); prop.seat(ctx, 92, 104, P, 10); prop.machineFrame(ctx, 40, P, 60) },
  front: (ctx, s, P) => { prop.pad(ctx, s.kneeN, P, 6); prop.pad(ctx, s.kneeF, P, 6) },
})

export const kickback = mv({
  cycleMs: 2200,
  frames: [
    { t: 0, pose: pose({ hip: [104, 92], torso: 52, armN: [150, 158], armF: [154, 162], legN: [188, 214, 96], legF: [206, 148, 120] }) },
    { t: 0.4, pose: pose({ hip: [104, 92], torso: 52, armN: [150, 158], armF: [154, 162], legN: [188, 214, 96], legF: [244, 196, 130] }) },
    { t: 0.55, pose: pose({ hip: [104, 92], torso: 52, armN: [150, 158], armF: [154, 162], legN: [188, 214, 96], legF: [244, 196, 130] }) },
    { t: 1, pose: pose({ hip: [104, 92], torso: 52, armN: [150, 158], armF: [154, 162], legN: [188, 214, 96], legF: [206, 148, 120] }) },
  ],
  back: (ctx, s, P) => { prop.floor(ctx, P); prop.cableTower(ctx, 24, s.ankleF, P, false) },
})

// ============================================================
// EMPURRAR
// ============================================================

const BENCH_HIP: Vec = [92, 100]
const benchPose = (armN: [number, number], armF: [number, number]) =>
  pose({ hip: BENCH_HIP, torso: 90, head: -6, armN, armF, legN: [246, 176, 96], legF: [242, 174, 96] })

export const benchPress = mv({
  cycleMs: 2600,
  frames: [
    { t: 0, pose: benchPose([352, 4], [356, 8]) },
    { t: 0.45, pose: benchPose([255, 10], [259, 14]) },
    { t: 0.57, pose: benchPose([255, 10], [259, 14]) },
    { t: 1, pose: benchPose([352, 4], [356, 8]) },
  ],
  back: (ctx, _s, P) => { prop.floor(ctx, P); prop.bench(ctx, 104, 110, P, 0, 72) },
  front: (ctx, s, P) => prop.barbell(ctx, s.hands, P),
})

export const benchDumbbell = mv({
  ...benchPress,
  front: (ctx, s, P) => { prop.dumbbell(ctx, s.handF, P); prop.dumbbell(ctx, s.handN, P) },
})

const inclinePose = (armN: [number, number], armF: [number, number]) =>
  pose({ hip: [86, 108], torso: 64, head: -4, armN, armF, legN: [214, 178, 96], legF: [210, 176, 96] })

export const inclinePress = mv({
  cycleMs: 2600,
  frames: [
    { t: 0, pose: inclinePose([2, 12], [6, 16]) },
    { t: 0.45, pose: inclinePose([268, 20], [272, 24]) },
    { t: 0.57, pose: inclinePose([268, 20], [272, 24]) },
    { t: 1, pose: inclinePose([2, 12], [6, 16]) },
  ],
  back: (ctx, _s, P) => { prop.floor(ctx, P); prop.bench(ctx, 104, 116, P, 26, 72) },
  front: (ctx, s, P) => { prop.dumbbell(ctx, s.handF, P); prop.dumbbell(ctx, s.handN, P) },
})

export const chestPressMachine = mv({
  cycleMs: 2500,
  frames: [
    { t: 0, pose: pose({ hip: [76, 102], torso: 8, armN: [96, 92], armF: [100, 96], legN: [162, 190, 96], legF: [160, 188, 96] }) },
    { t: 0.45, pose: pose({ hip: [76, 102], torso: 8, armN: [128, 60], armF: [132, 64], legN: [162, 190, 96], legF: [160, 188, 96] }) },
    { t: 0.57, pose: pose({ hip: [76, 102], torso: 8, armN: [128, 60], armF: [132, 64], legN: [162, 190, 96], legF: [160, 188, 96] }) },
    { t: 1, pose: pose({ hip: [76, 102], torso: 8, armN: [96, 92], armF: [100, 96], legN: [162, 190, 96], legF: [160, 188, 96] }) },
  ],
  back: (ctx, _s, P) => { prop.floor(ctx, P); prop.seat(ctx, 72, 106, P, 6); prop.machineFrame(ctx, 168, P, 50) },
  front: (ctx, s, P) => {
    ctx.strokeStyle = P.steel; ctx.lineWidth = 3; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(s.handN[0], s.handN[1]); ctx.lineTo(162, s.handN[1] - 4); ctx.stroke()
  },
})

// Pernas apontando para trás e levemente para baixo — corpo em prancha, não ajoelhado.
const PU_TOP = pose({ hip: [92, 112], torso: 74, head: 10, armN: [172, 176], armF: [176, 180], legN: [252, 250, 195], legF: [250, 248, 195] })
const PU_BOT = pose({ hip: [92, 121], torso: 74, head: 10, armN: [210, 125], armF: [214, 129], legN: [252, 250, 195], legF: [250, 248, 195] })

export const pushup = mv({
  cycleMs: 2400,
  frames: [{ t: 0, pose: PU_TOP }, { t: 0.45, pose: PU_BOT }, { t: 0.57, pose: PU_BOT }, { t: 1, pose: PU_TOP }],
  back: (ctx, _s, P) => prop.floor(ctx, P),
})

export const pikePushup = mv({
  cycleMs: 2400,
  frames: [
    { t: 0, pose: pose({ hip: [96, 84], torso: 128, head: -30, armN: [172, 176], armF: [176, 180], legN: [206, 180, 128], legF: [204, 178, 128] }) },
    { t: 0.45, pose: pose({ hip: [96, 84], torso: 128, head: -30, armN: [212, 140], armF: [216, 144], legN: [206, 180, 128], legF: [204, 178, 128] }) },
    { t: 0.57, pose: pose({ hip: [96, 84], torso: 128, head: -30, armN: [212, 140], armF: [216, 144], legN: [206, 180, 128], legF: [204, 178, 128] }) },
    { t: 1, pose: pose({ hip: [96, 84], torso: 128, head: -30, armN: [172, 176], armF: [176, 180], legN: [206, 180, 128], legF: [204, 178, 128] }) },
  ],
  back: (ctx, _s, P) => prop.floor(ctx, P),
})

const OHP_DOWN = pose({ hip: [100, 84], torso: -2, armN: [216, 22], armF: [220, 26] })
const OHP_UP = pose({ hip: [100, 84], torso: -2, armN: [4, 2], armF: [8, 6] })

export const overheadPress = mv({
  cycleMs: 2500,
  frames: [{ t: 0, pose: OHP_DOWN }, { t: 0.42, pose: OHP_UP }, { t: 0.55, pose: OHP_UP }, { t: 1, pose: OHP_DOWN }],
  back: (ctx, _s, P) => prop.floor(ctx, P),
  front: (ctx, s, P) => { prop.dumbbell(ctx, s.handF, P); prop.dumbbell(ctx, s.handN, P) },
})

export const overheadPressBar = mv({
  ...overheadPress,
  front: (ctx, s, P) => prop.barbell(ctx, s.hands, P, 11),
})

export const shoulderPressMachine = mv({
  cycleMs: 2500,
  frames: [
    { t: 0, pose: pose({ hip: [96, 100], torso: 4, armN: [216, 22], armF: [220, 26], legN: [162, 190, 96], legF: [160, 188, 96] }) },
    { t: 0.42, pose: pose({ hip: [96, 100], torso: 4, armN: [4, 2], armF: [8, 6], legN: [162, 190, 96], legF: [160, 188, 96] }) },
    { t: 0.55, pose: pose({ hip: [96, 100], torso: 4, armN: [4, 2], armF: [8, 6], legN: [162, 190, 96], legF: [160, 188, 96] }) },
    { t: 1, pose: pose({ hip: [96, 100], torso: 4, armN: [216, 22], armF: [220, 26], legN: [162, 190, 96], legF: [160, 188, 96] }) },
  ],
  back: (ctx, s, P) => {
    prop.floor(ctx, P)
    prop.seat(ctx, 92, 104, P, 6)
    prop.machineFrame(ctx, 152, P, 28)
    ctx.strokeStyle = P.steel; ctx.lineWidth = 2.6; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(s.handN[0] + 3, s.handN[1]); ctx.lineTo(148, s.handN[1] + 2); ctx.stroke()
  },
})

export const bandPress = mv({
  cycleMs: 2400,
  frames: [
    { t: 0, pose: pose({ hip: [96, 84], armN: [244, 34], armF: [248, 38] }) },
    { t: 0.42, pose: pose({ hip: [96, 84], armN: [86, 88], armF: [90, 92] }) },
    { t: 0.55, pose: pose({ hip: [96, 84], armN: [86, 88], armF: [90, 92] }) },
    { t: 1, pose: pose({ hip: [96, 84], armN: [244, 34], armF: [248, 38] }) },
  ],
  back: (ctx, s, P) => { prop.floor(ctx, P); prop.band(ctx, [s.shoulder[0] - 24, s.shoulder[1] + 8], s.handN, P) },
})

// ============================================================
// PUXAR
// ============================================================

const ROW_HIP: Vec = [102, 90]
const rowPose = (armN: [number, number], armF: [number, number]) =>
  pose({ hip: ROW_HIP, torso: 56, head: -22, armN, armF, legN: [170, 188, 96], legF: [168, 186, 96] })

export const rowBent = mv({
  cycleMs: 2500,
  frames: [
    { t: 0, pose: rowPose([166, 172], [170, 176]) },
    { t: 0.4, pose: rowPose([214, 150], [218, 154]) },
    { t: 0.55, pose: rowPose([214, 150], [218, 154]) },
    { t: 1, pose: rowPose([166, 172], [170, 176]) },
  ],
  back: (ctx, _s, P) => prop.floor(ctx, P),
  front: (ctx, s, P) => prop.barbell(ctx, s.hands, P),
})

export const rowSingle = mv({
  cycleMs: 2500,
  frames: [
    { t: 0, pose: pose({ hip: [104, 96], torso: 64, head: -30, armN: [172, 176], armF: [122, 150], legN: [176, 192, 96], legF: [140, 226, 130] }) },
    { t: 0.4, pose: pose({ hip: [104, 96], torso: 64, head: -30, armN: [226, 146], armF: [122, 150], legN: [176, 192, 96], legF: [140, 226, 130] }) },
    { t: 0.55, pose: pose({ hip: [104, 96], torso: 64, head: -30, armN: [226, 146], armF: [122, 150], legN: [176, 192, 96], legF: [140, 226, 130] }) },
    { t: 1, pose: pose({ hip: [104, 96], torso: 64, head: -30, armN: [172, 176], armF: [122, 150], legN: [176, 192, 96], legF: [140, 226, 130] }) },
  ],
  back: (ctx, _s, P) => { prop.floor(ctx, P); prop.bench(ctx, 130, 108, P, 0, 54) },
  front: (ctx, s, P) => prop.dumbbell(ctx, s.handN, P, true),
})

export const rowSeated = mv({
  cycleMs: 2500,
  frames: [
    { t: 0, pose: pose({ hip: [80, 104], torso: 16, armN: [104, 96], armF: [108, 100], legN: [118, 168, 110], legF: [116, 166, 110] }) },
    { t: 0.4, pose: pose({ hip: [80, 104], torso: 2, armN: [150, 40], armF: [154, 44], legN: [118, 168, 110], legF: [116, 166, 110] }) },
    { t: 0.55, pose: pose({ hip: [80, 104], torso: 2, armN: [150, 40], armF: [154, 44], legN: [118, 168, 110], legF: [116, 166, 110] }) },
    { t: 1, pose: pose({ hip: [80, 104], torso: 16, armN: [104, 96], armF: [108, 100], legN: [118, 168, 110], legF: [116, 166, 110] }) },
  ],
  back: (ctx, s, P) => { prop.floor(ctx, P); prop.seat(ctx, 76, 108, P, 0); prop.cableTower(ctx, 176, s.hands, P, false) },
})

const PULLDOWN_UP = pose({ hip: [96, 102], torso: 8, armN: [12, 6], armF: [16, 10], legN: [130, 178, 112], legF: [128, 176, 112] })
const PULLDOWN_DOWN = pose({ hip: [96, 102], torso: 14, armN: [46, 330], armF: [50, 334], legN: [130, 178, 112], legF: [128, 176, 112] })

export const pulldown = mv({
  cycleMs: 2600,
  frames: [
    { t: 0, pose: PULLDOWN_UP }, { t: 0.42, pose: PULLDOWN_DOWN },
    { t: 0.55, pose: PULLDOWN_DOWN }, { t: 1, pose: PULLDOWN_UP },
  ],
  back: (ctx, s, P) => { prop.floor(ctx, P); prop.seat(ctx, 92, 106, P, 0); prop.cableTower(ctx, 158, s.hands, P, true) },
  front: (ctx, s, P) => {
    ctx.strokeStyle = P.steel; ctx.lineWidth = 3.4; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(s.hands[0] - 16, s.hands[1]); ctx.lineTo(s.hands[0] + 16, s.hands[1]); ctx.stroke()
  },
})

// A barra é fixa no espaço: os ângulos do braço no topo foram resolvidos para a
// mão parar na mesma altura de baixo. Barra que sobe junto com o corpo denuncia
// a animação na hora.
const PULLUP_BAR_Y = 43

export const pullup = mv({
  cycleMs: 2800,
  view: { x: 6, y: 14, w: 188, h: 132 },
  frames: [
    { t: 0, pose: pose({ hip: [100, 104], torso: 4, armN: [8, 4], armF: [12, 8], legN: [186, 194, 116], legF: [184, 192, 116] }) },
    { t: 0.42, pose: pose({ hip: [100, 76], torso: 6, armN: [45, 246], armF: [49, 250], legN: [190, 200, 116], legF: [188, 198, 116] }) },
    { t: 0.55, pose: pose({ hip: [100, 76], torso: 6, armN: [45, 246], armF: [49, 250], legN: [190, 200, 116], legF: [188, 198, 116] }) },
    { t: 1, pose: pose({ hip: [100, 104], torso: 4, armN: [8, 4], armF: [12, 8], legN: [186, 194, 116], legF: [184, 192, 116] }) },
  ],
  back: (ctx, _s, P) => prop.pullupBar(ctx, PULLUP_BAR_Y, P),
})

export const bandPulldown = mv({
  cycleMs: 2500,
  frames: [
    { t: 0, pose: pose({ hip: [96, 102], torso: 8, armN: [12, 6], armF: [16, 10], legN: [130, 178, 112], legF: [128, 176, 112] }) },
    { t: 0.42, pose: pose({ hip: [96, 102], torso: 14, armN: [46, 330], armF: [50, 334], legN: [130, 178, 112], legF: [128, 176, 112] }) },
    { t: 0.55, pose: pose({ hip: [96, 102], torso: 14, armN: [46, 330], armF: [50, 334], legN: [130, 178, 112], legF: [128, 176, 112] }) },
    { t: 1, pose: pose({ hip: [96, 102], torso: 8, armN: [12, 6], armF: [16, 10], legN: [130, 178, 112], legF: [128, 176, 112] }) },
  ],
  back: (ctx, s, P) => { prop.floor(ctx, P); prop.band(ctx, [150, 22], s.handN, P) },
})

// ============================================================
// ISOLADOS SUPERIORES
// ============================================================

export const chestFly = mv({
  cycleMs: 2600,
  frames: [
    { t: 0, pose: benchPose([300, 300], [304, 304]) },
    { t: 0.45, pose: benchPose([352, 352], [356, 356]) },
    { t: 0.57, pose: benchPose([352, 352], [356, 356]) },
    { t: 1, pose: benchPose([300, 300], [304, 304]) },
  ],
  back: (ctx, _s, P) => { prop.floor(ctx, P); prop.bench(ctx, 104, 110, P, 0, 72) },
  front: (ctx, s, P) => { prop.dumbbell(ctx, s.handF, P, true); prop.dumbbell(ctx, s.handN, P, true) },
})

export const pecDeckMove = mv({
  cycleMs: 2500,
  frames: [
    { t: 0, pose: pose({ hip: [86, 102], torso: 6, armN: [122, 92], armF: [126, 96], legN: [160, 188, 96], legF: [158, 186, 96] }) },
    { t: 0.42, pose: pose({ hip: [86, 102], torso: 6, armN: [92, 84], armF: [96, 88], legN: [160, 188, 96], legF: [158, 186, 96] }) },
    { t: 0.55, pose: pose({ hip: [86, 102], torso: 6, armN: [92, 84], armF: [96, 88], legN: [160, 188, 96], legF: [158, 186, 96] }) },
    { t: 1, pose: pose({ hip: [86, 102], torso: 6, armN: [122, 92], armF: [126, 96], legN: [160, 188, 96], legF: [158, 186, 96] }) },
  ],
  back: (ctx, _s, P) => { prop.floor(ctx, P); prop.seat(ctx, 82, 106, P, 4) },
  front: (ctx, s, P) => prop.pecDeck(ctx, s.handN, s.handF, P),
})

export const crossover = mv({
  cycleMs: 2600,
  frames: [
    { t: 0, pose: pose({ hip: [100, 88], torso: 12, armN: [318, 300], armF: [322, 304] }) },
    { t: 0.42, pose: pose({ hip: [100, 88], torso: 16, armN: [88, 84], armF: [92, 88] }) },
    { t: 0.55, pose: pose({ hip: [100, 88], torso: 16, armN: [88, 84], armF: [92, 88] }) },
    { t: 1, pose: pose({ hip: [100, 88], torso: 12, armN: [318, 300], armF: [322, 304] }) },
  ],
  back: (ctx, s, P) => { prop.floor(ctx, P); prop.cableTower(ctx, 22, s.handF, P, true) },
})

export const lateralRaise = mv({
  cycleMs: 2200,
  frames: [
    { t: 0, pose: pose({ hip: [100, 84], armN: [172, 174], armF: [176, 178] }) },
    { t: 0.4, pose: pose({ hip: [100, 84], armN: [268, 266], armF: [272, 270] }) },
    { t: 0.52, pose: pose({ hip: [100, 84], armN: [268, 266], armF: [272, 270] }) },
    { t: 1, pose: pose({ hip: [100, 84], armN: [172, 174], armF: [176, 178] }) },
  ],
  back: (ctx, _s, P) => prop.floor(ctx, P),
  front: (ctx, s, P) => { prop.dumbbell(ctx, s.handF, P, true); prop.dumbbell(ctx, s.handN, P, true) },
})

export const rearDelt = mv({
  cycleMs: 2400,
  frames: [
    { t: 0, pose: pose({ hip: [102, 92], torso: 58, head: -26, armN: [166, 170], armF: [170, 174], legN: [172, 188, 96], legF: [170, 186, 96] }) },
    { t: 0.4, pose: pose({ hip: [102, 92], torso: 58, head: -26, armN: [250, 250], armF: [254, 254], legN: [172, 188, 96], legF: [170, 186, 96] }) },
    { t: 0.52, pose: pose({ hip: [102, 92], torso: 58, head: -26, armN: [250, 250], armF: [254, 254], legN: [172, 188, 96], legF: [170, 186, 96] }) },
    { t: 1, pose: pose({ hip: [102, 92], torso: 58, head: -26, armN: [166, 170], armF: [170, 174], legN: [172, 188, 96], legF: [170, 186, 96] }) },
  ],
  back: (ctx, _s, P) => prop.floor(ctx, P),
  front: (ctx, s, P) => { prop.dumbbell(ctx, s.handF, P, true); prop.dumbbell(ctx, s.handN, P, true) },
})

export const facePull = mv({
  cycleMs: 2400,
  frames: [
    { t: 0, pose: pose({ hip: [100, 88], torso: -2, armN: [76, 72], armF: [80, 76] }) },
    { t: 0.4, pose: pose({ hip: [100, 88], torso: -4, armN: [116, 8], armF: [120, 12] }) },
    { t: 0.52, pose: pose({ hip: [100, 88], torso: -4, armN: [116, 8], armF: [120, 12] }) },
    { t: 1, pose: pose({ hip: [100, 88], torso: -2, armN: [76, 72], armF: [80, 76] }) },
  ],
  back: (ctx, s, P) => { prop.floor(ctx, P); prop.cableTower(ctx, 172, s.hands, P, true) },
})

export const pullApart = mv({
  cycleMs: 2200,
  frames: [
    { t: 0, pose: pose({ hip: [100, 88], armN: [88, 86], armF: [92, 90] }) },
    { t: 0.4, pose: pose({ hip: [100, 88], armN: [96, 178], armF: [100, 182] }) },
    { t: 0.52, pose: pose({ hip: [100, 88], armN: [96, 178], armF: [100, 182] }) },
    { t: 1, pose: pose({ hip: [100, 88], armN: [88, 86], armF: [92, 90] }) },
  ],
  back: (ctx, s, P) => { prop.floor(ctx, P); prop.band(ctx, [s.handN[0] + 26, s.handN[1] - 4], s.handN, P) },
})

const CURL_DOWN = pose({ hip: [100, 84], armN: [176, 178], armF: [180, 182] })
const CURL_UP = pose({ hip: [100, 84], armN: [172, 40], armF: [176, 44] })

export const curl = mv({
  cycleMs: 2200,
  frames: [{ t: 0, pose: CURL_DOWN }, { t: 0.4, pose: CURL_UP }, { t: 0.52, pose: CURL_UP }, { t: 1, pose: CURL_DOWN }],
  back: (ctx, _s, P) => prop.floor(ctx, P),
  front: (ctx, s, P) => prop.barbell(ctx, s.hands, P, 10),
})

export const curlDumbbell = mv({
  ...curl,
  front: (ctx, s, P) => { prop.dumbbell(ctx, s.handF, P); prop.dumbbell(ctx, s.handN, P) },
})

export const curlHammer = mv({
  ...curl,
  front: (ctx, s, P) => { prop.dumbbell(ctx, s.handF, P, true); prop.dumbbell(ctx, s.handN, P, true) },
})

export const curlCable = mv({
  ...curl,
  back: (ctx, s, P) => { prop.floor(ctx, P); prop.cableTower(ctx, 168, s.hands, P, false) },
  front: undefined,
})

export const curlBand = mv({
  ...curl,
  back: (ctx, s, P) => { prop.floor(ctx, P); prop.band(ctx, [s.toeN[0] - 2, GROUND - 1], s.handN, P) },
  front: undefined,
})

export const pushdown = mv({
  cycleMs: 2200,
  frames: [
    { t: 0, pose: pose({ hip: [100, 86], torso: 8, armN: [186, 118], armF: [190, 122] }) },
    { t: 0.4, pose: pose({ hip: [100, 86], torso: 8, armN: [186, 180], armF: [190, 184] }) },
    { t: 0.52, pose: pose({ hip: [100, 86], torso: 8, armN: [186, 180], armF: [190, 184] }) },
    { t: 1, pose: pose({ hip: [100, 86], torso: 8, armN: [186, 118], armF: [190, 122] }) },
  ],
  back: (ctx, s, P) => { prop.floor(ctx, P); prop.cableTower(ctx, 168, s.hands, P, true) },
})

export const pushdownBand = mv({
  ...pushdown,
  back: (ctx, s, P) => { prop.floor(ctx, P); prop.band(ctx, [150, 24], s.handN, P) },
})

export const tricepsOverhead = mv({
  cycleMs: 2300,
  frames: [
    { t: 0, pose: pose({ hip: [100, 86], torso: -2, armN: [8, 168], armF: [12, 172] }) },
    { t: 0.4, pose: pose({ hip: [100, 86], torso: -2, armN: [8, 6], armF: [12, 10] }) },
    { t: 0.52, pose: pose({ hip: [100, 86], torso: -2, armN: [8, 6], armF: [12, 10] }) },
    { t: 1, pose: pose({ hip: [100, 86], torso: -2, armN: [8, 168], armF: [12, 172] }) },
  ],
  back: (ctx, _s, P) => prop.floor(ctx, P),
  front: (ctx, s, P) => prop.dumbbell(ctx, s.hands, P, true),
})

export const benchDip = mv({
  cycleMs: 2400,
  frames: [
    { t: 0, pose: pose({ hip: [104, 100], torso: 4, armN: [186, 184], armF: [190, 188], legN: [128, 176, 108], legF: [126, 174, 108] }) },
    { t: 0.45, pose: pose({ hip: [104, 116], torso: 6, armN: [206, 148], armF: [210, 152], legN: [116, 172, 104], legF: [114, 170, 104] }) },
    { t: 0.57, pose: pose({ hip: [104, 116], torso: 6, armN: [206, 148], armF: [210, 152], legN: [116, 172, 104], legF: [114, 170, 104] }) },
    { t: 1, pose: pose({ hip: [104, 100], torso: 4, armN: [186, 184], armF: [190, 188], legN: [128, 176, 108], legF: [126, 174, 108] }) },
  ],
  back: (ctx, s, P) => { prop.floor(ctx, P); prop.bench(ctx, s.handN[0] - 4, s.handN[1] + 4, P, 0, 40) },
})

export const diamondPushup = mv({ ...pushup })

// ============================================================
// CORE
// ============================================================

// Isometria: a "animação" é a respiração — quadril oscilando 2 unidades.
const plankPose = (dy: number) =>
  pose({ hip: [96, 116 + dy], torso: 72, head: 6, armN: [172, 92], armF: [176, 96], legN: [250, 254, 200], legF: [248, 252, 200] })

export const plank = mv({
  cycleMs: 3600,
  frames: [{ t: 0, pose: plankPose(0) }, { t: 0.5, pose: plankPose(1.6) }, { t: 1, pose: plankPose(0) }],
  back: (ctx, _s, P) => prop.floor(ctx, P),
})

const sidePlankPose = (dy: number) =>
  pose({ hip: [96, 116 + dy], torso: 72, head: 6, armN: [4, 0], armF: [176, 96], legN: [250, 254, 200], legF: [248, 252, 200] })

export const sidePlank = mv({
  cycleMs: 3600,
  frames: [{ t: 0, pose: sidePlankPose(0) }, { t: 0.5, pose: sidePlankPose(1.6) }, { t: 1, pose: sidePlankPose(0) }],
  back: (ctx, _s, P) => prop.floor(ctx, P),
})

// Braços estendidos em direção aos joelhos: num quadro de 150 px, mãos na nuca
// viram uma bola de cotovelo e cabeça.
const CRUNCH_DOWN = pose({ hip: [86, 126], torso: 92, head: -8, armN: [355, 355], armF: [359, 359], legN: [320, 190, 250], legF: [318, 188, 250] })
const CRUNCH_UP = pose({ hip: [86, 126], torso: 66, head: -14, armN: [330, 330], armF: [334, 334], legN: [320, 190, 250], legF: [318, 188, 250] })

export const crunch = mv({
  cycleMs: 2200,
  frames: [{ t: 0, pose: CRUNCH_DOWN }, { t: 0.4, pose: CRUNCH_UP }, { t: 0.52, pose: CRUNCH_UP }, { t: 1, pose: CRUNCH_DOWN }],
  back: (ctx, _s, P) => prop.floor(ctx, P),
})

export const legRaiseFloor = mv({
  cycleMs: 2600,
  frames: [
    { t: 0, pose: pose({ hip: [86, 126], torso: 94, head: -4, armN: [140, 168], armF: [144, 172], legN: [268, 266, 210], legF: [266, 264, 210] }) },
    { t: 0.4, pose: pose({ hip: [86, 126], torso: 94, head: -4, armN: [140, 168], armF: [144, 172], legN: [352, 350, 290], legF: [350, 348, 290] }) },
    { t: 0.52, pose: pose({ hip: [86, 126], torso: 94, head: -4, armN: [140, 168], armF: [144, 172], legN: [352, 350, 290], legF: [350, 348, 290] }) },
    { t: 1, pose: pose({ hip: [86, 126], torso: 94, head: -4, armN: [140, 168], armF: [144, 172], legN: [268, 266, 210], legF: [266, 264, 210] }) },
  ],
  back: (ctx, _s, P) => prop.floor(ctx, P),
})

// Braço e perna opostos estendem; o par contrário fica recolhido. Meio ciclo troca os lados.
const dbPose = (swap: boolean) => {
  const up: [number, number] = [0, 0]
  const reach: [number, number] = [60, 60]
  const tuck: [number, number, number] = [350, 270, 200]
  const out: [number, number, number] = [300, 285, 210]
  return pose({
    hip: [92, 126], torso: 94, head: -6,
    armN: swap ? reach : up, armF: swap ? up : reach,
    legN: swap ? tuck : out, legF: swap ? out : tuck,
  })
}

export const deadBug = mv({
  cycleMs: 3000,
  frames: [{ t: 0, pose: dbPose(false) }, { t: 0.45, pose: dbPose(true) }, { t: 1, pose: dbPose(false) }],
  back: (ctx, _s, P) => prop.floor(ctx, P),
})

export const hangingLegRaise = mv({
  cycleMs: 2800,
  view: { x: 6, y: 14, w: 188, h: 132 },
  frames: [
    { t: 0, pose: pose({ hip: [100, 100], torso: 2, armN: [4, 2], armF: [8, 6], legN: [180, 179, 112], legF: [180, 181, 112] }) },
    { t: 0.42, pose: pose({ hip: [100, 100], torso: 10, armN: [4, 2], armF: [8, 6], legN: [96, 96, 40], legF: [94, 94, 40] }) },
    { t: 0.55, pose: pose({ hip: [100, 100], torso: 10, armN: [4, 2], armF: [8, 6], legN: [96, 96, 40], legF: [94, 94, 40] }) },
    { t: 1, pose: pose({ hip: [100, 100], torso: 2, armN: [4, 2], armF: [8, 6], legN: [180, 179, 112], legF: [180, 181, 112] }) },
  ],
  back: (ctx, _s, P) => prop.pullupBar(ctx, 39, P),
})

export const pallof = mv({
  cycleMs: 2600,
  frames: [
    { t: 0, pose: pose({ hip: [100, 92], torso: 6, armN: [140, 44], armF: [144, 48], legN: [172, 186, 96], legF: [188, 190, 96] }) },
    { t: 0.42, pose: pose({ hip: [100, 92], torso: 2, armN: [96, 92], armF: [100, 96], legN: [172, 186, 96], legF: [188, 190, 96] }) },
    { t: 0.55, pose: pose({ hip: [100, 92], torso: 2, armN: [96, 92], armF: [100, 96], legN: [172, 186, 96], legF: [188, 190, 96] }) },
    { t: 1, pose: pose({ hip: [100, 92], torso: 6, armN: [140, 44], armF: [144, 48], legN: [172, 186, 96], legF: [188, 190, 96] }) },
  ],
  back: (ctx, s, P) => { prop.floor(ctx, P); prop.band(ctx, [28, 70], s.handN, P) },
})

export const towelRow = mv({
  cycleMs: 2500,
  frames: [
    { t: 0, pose: pose({ hip: [92, 98], torso: -16, armN: [112, 108], armF: [116, 112], legN: [166, 178, 96], legF: [164, 176, 96] }) },
    { t: 0.4, pose: pose({ hip: [100, 92], torso: -6, armN: [156, 40], armF: [160, 44], legN: [176, 182, 96], legF: [174, 180, 96] }) },
    { t: 0.55, pose: pose({ hip: [100, 92], torso: -6, armN: [156, 40], armF: [160, 44], legN: [176, 182, 96], legF: [174, 180, 96] }) },
    { t: 1, pose: pose({ hip: [92, 98], torso: -16, armN: [112, 108], armF: [116, 112], legN: [166, 178, 96], legF: [164, 176, 96] }) },
  ],
  back: (ctx, s, P) => { prop.floor(ctx, P); prop.band(ctx, [176, 60], s.handN, P) },
})

const STEP_DOWN = pose({ hip: [96, 88], torso: 10, legN: [100, 178, 96], legF: [186, 182, 96] })
const STEP_UP = pose({ hip: [116, 62], torso: 6, legN: [176, 178, 96], legF: [230, 190, 110] })

export const stepUp = mv({
  cycleMs: 2800,
  frames: [{ t: 0, pose: STEP_DOWN }, { t: 0.45, pose: STEP_UP }, { t: 0.57, pose: STEP_UP }, { t: 1, pose: STEP_DOWN }],
  back: (ctx, _s, P) => { prop.floor(ctx, P); prop.bench(ctx, 134, 114, P, 0, 48) },
})

export const abductionBand = mv({
  cycleMs: 2400,
  frames: [
    { t: 0, pose: pose({ hip: [100, 94], torso: 8, armN: [200, 30], armF: [204, 34], legN: [172, 190, 96], legF: [188, 178, 96] }) },
    { t: 0.45, pose: pose({ hip: [100, 94], torso: 8, armN: [200, 30], armF: [204, 34], legN: [162, 196, 96], legF: [196, 172, 96] }) },
    { t: 1, pose: pose({ hip: [100, 94], torso: 8, armN: [200, 30], armF: [204, 34], legN: [172, 190, 96], legF: [188, 178, 96] }) },
  ],
  back: (ctx, s, P) => { prop.floor(ctx, P); prop.band(ctx, s.kneeF, s.kneeN, P) },
})

const SLIDE_EXT = pose({ hip: [92, 116], torso: 98, head: -6, armN: [202, 192], armF: [206, 196], legN: [280, 207, 250], legF: [278, 205, 250] })
const SLIDE_CURL = pose({ hip: [92, 110], torso: 116, head: -6, armN: [206, 196], armF: [210, 200], legN: [275, 166, 250], legF: [273, 164, 250] })

export const slidingCurl = mv({
  cycleMs: 2600,
  frames: [{ t: 0, pose: SLIDE_EXT }, { t: 0.45, pose: SLIDE_CURL }, { t: 0.57, pose: SLIDE_CURL }, { t: 1, pose: SLIDE_EXT }],
  back: (ctx, _s, P) => prop.floor(ctx, P),
})

export const standingLegCurl = mv({
  cycleMs: 2300,
  frames: [
    { t: 0, pose: pose({ hip: [100, 86], torso: 6, legN: [180, 179, 96], legF: [182, 180, 96] }) },
    { t: 0.4, pose: pose({ hip: [100, 86], torso: 6, legN: [180, 179, 96], legF: [184, 268, 190] }) },
    { t: 0.52, pose: pose({ hip: [100, 86], torso: 6, legN: [180, 179, 96], legF: [184, 268, 190] }) },
    { t: 1, pose: pose({ hip: [100, 86], torso: 6, legN: [180, 179, 96], legF: [182, 180, 96] }) },
  ],
  back: (ctx, s, P) => { prop.floor(ctx, P); prop.band(ctx, [140, GROUND - 1], s.ankleF, P) },
})

export const MOVES = {
  squat, squatGoblet, legPress, hinge, hingeDumbbell, deadlift, kbSwing, hipThrust, gluteBridge,
  lunge, lungeBody, bulgarian, stepUp, legExtension, legCurl, standingLegCurl, slidingCurl,
  calfRaise, calfBody, abduction, abductionBand, kickback,
  benchPress, benchDumbbell, inclinePress, chestPressMachine, pushup, diamondPushup, pikePushup,
  overheadPress, overheadPressBar, shoulderPressMachine, bandPress,
  rowBent, rowSingle, rowSeated, towelRow, pulldown, pullup, bandPulldown,
  chestFly, pecDeckMove, crossover, lateralRaise, rearDelt, facePull, pullApart,
  curl, curlDumbbell, curlHammer, curlCable, curlBand,
  pushdown, pushdownBand, tricepsOverhead, benchDip,
  plank, sidePlank, crunch, legRaiseFloor, deadBug, hangingLegRaise, pallof,
} satisfies Record<string, Move>

export type MoveKey = keyof typeof MOVES
