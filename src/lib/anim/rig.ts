// Rig 2D de animação de execução (seção 20 da spec — mídia por exercício).
// Cinemática direta com ângulos absolutos por segmento: os membros nunca esticam
// nem encolhem na interpolação, que é o que faz a figura parecer um corpo e não um elástico.

export type Vec = [number, number]

/** Ângulos em graus, sentido horário na tela. 0 = para cima, 90 = para frente (direita), 180 = para baixo. */
export interface Pose {
  hip: Vec
  torso: number
  head: number
  /** [braço, antebraço] — N = lado perto da câmera, F = lado longe */
  armN: [number, number]
  armF: [number, number]
  /** [coxa, canela, pé] */
  legN: [number, number, number]
  legF: [number, number, number]
}

export const SEG = {
  torso: 30,
  headR: 7.4,
  neck: 5,
  upperArm: 18,
  foreArm: 16.5,
  hand: 4.5,
  thigh: 26,
  shin: 24,
  foot: 10,
  /** deslocamento em x dos membros do lado oposto — dá profundidade sem virar a câmera */
  depth: 4,
}

export const GROUND = 137

export const STAND: Pose = {
  hip: [100, 84],
  torso: 0,
  head: 0,
  armN: [178, 176],
  armF: [182, 184],
  legN: [180, 179, 96],
  legF: [180, 181, 96],
}

export const pose = (o: Partial<Pose>): Pose => ({ ...STAND, ...o })

const RAD = Math.PI / 180
export function step(from: Vec, angleDeg: number, len: number): Vec {
  const a = angleDeg * RAD
  return [from[0] + Math.sin(a) * len, from[1] - Math.cos(a) * len]
}

export interface Skel {
  hip: Vec
  neck: Vec
  shoulder: Vec
  head: Vec
  elbowN: Vec; handN: Vec
  elbowF: Vec; handF: Vec
  kneeN: Vec; ankleN: Vec; toeN: Vec
  kneeF: Vec; ankleF: Vec; toeF: Vec
  /** ponto médio entre as mãos — âncora de barras, cabos e halteres */
  hands: Vec
}

export function solve(p: Pose): Skel {
  const hip = p.hip
  const neck = step(hip, p.torso, SEG.torso)
  const shoulder = step(hip, p.torso, SEG.torso * 0.9)
  const head = step(neck, p.torso + p.head, SEG.neck + SEG.headR)

  const d = SEG.depth
  const shF: Vec = [shoulder[0] - d, shoulder[1] + 1]
  const hipF: Vec = [hip[0] - d, hip[1] + 1]

  const elbowN = step(shoulder, p.armN[0], SEG.upperArm)
  const handN = step(elbowN, p.armN[1], SEG.foreArm)
  const elbowF = step(shF, p.armF[0], SEG.upperArm)
  const handF = step(elbowF, p.armF[1], SEG.foreArm)

  const kneeN = step(hip, p.legN[0], SEG.thigh)
  const ankleN = step(kneeN, p.legN[1], SEG.shin)
  const toeN = step(ankleN, p.legN[2], SEG.foot)
  const kneeF = step(hipF, p.legF[0], SEG.thigh)
  const ankleF = step(kneeF, p.legF[1], SEG.shin)
  const toeF = step(ankleF, p.legF[2], SEG.foot)

  return {
    hip, neck, shoulder, head,
    elbowN, handN, elbowF, handF,
    kneeN, ankleN, toeN, kneeF, ankleF, toeF,
    hands: [(handN[0] + handF[0]) / 2, (handN[1] + handF[1]) / 2],
  }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerpV = (a: Vec, b: Vec, t: number): Vec => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return {
    hip: lerpV(a.hip, b.hip, t),
    torso: lerp(a.torso, b.torso, t),
    head: lerp(a.head, b.head, t),
    armN: [lerp(a.armN[0], b.armN[0], t), lerp(a.armN[1], b.armN[1], t)],
    armF: [lerp(a.armF[0], b.armF[0], t), lerp(a.armF[1], b.armF[1], t)],
    legN: [lerp(a.legN[0], b.legN[0], t), lerp(a.legN[1], b.legN[1], t), lerp(a.legN[2], b.legN[2], t)],
    legF: [lerp(a.legF[0], b.legF[0], t), lerp(a.legF[1], b.legF[1], t), lerp(a.legF[2], b.legF[2], t)],
  }
}

// ---------- paleta ----------
export interface Palette {
  near: string
  far: string
  head: string
  steel: string
  steelDark: string
  accent: string
  line: string
  shadow: string
}

export const PALETTE: Palette = {
  near: '#ccd7e8',
  far: '#7d8ca4',
  head: '#dbe4f1',
  steel: '#9aa8bd',
  steelDark: '#39445a',
  accent: '#7d68ff',
  line: '#4b586e',
  shadow: 'rgba(0,0,0,0.28)',
}

// ---------- desenho ----------
/** Segmento cônico com juntas arredondadas — lê como membro, não como traço. */
export function limb(ctx: CanvasRenderingContext2D, a: Vec, b: Vec, wa: number, wb: number, color: string) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(a[0] + (nx * wa) / 2, a[1] + (ny * wa) / 2)
  ctx.lineTo(b[0] + (nx * wb) / 2, b[1] + (ny * wb) / 2)
  ctx.lineTo(b[0] - (nx * wb) / 2, b[1] - (ny * wb) / 2)
  ctx.lineTo(a[0] - (nx * wa) / 2, a[1] - (ny * wa) / 2)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.arc(a[0], a[1], wa / 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(b[0], b[1], wb / 2, 0, Math.PI * 2)
  ctx.fill()
}

export function dot(ctx: CanvasRenderingContext2D, c: Vec, r: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(c[0], c[1], r, 0, Math.PI * 2)
  ctx.fill()
}

function drawArm(ctx: CanvasRenderingContext2D, sh: Vec, el: Vec, hd: Vec, c: string) {
  limb(ctx, sh, el, 8.4, 6.6, c)
  limb(ctx, el, hd, 6.4, 5, c)
}

function drawLeg(ctx: CanvasRenderingContext2D, hip: Vec, kn: Vec, an: Vec, to: Vec, c: string) {
  limb(ctx, hip, kn, 12.5, 9, c)
  limb(ctx, kn, an, 8.8, 5.6, c)
  limb(ctx, an, to, 5.6, 3.6, c)
}

/** Desenha a figura. `far` sai primeiro para os membros distantes ficarem atrás do tronco. */
export function drawFigure(ctx: CanvasRenderingContext2D, s: Skel, P: Palette = PALETTE) {
  drawLeg(ctx, [s.hip[0] - SEG.depth, s.hip[1] + 1], s.kneeF, s.ankleF, s.toeF, P.far)
  drawArm(ctx, [s.shoulder[0] - SEG.depth, s.shoulder[1] + 1], s.elbowF, s.handF, P.far)

  // tronco: quadril estreito → ombro largo
  limb(ctx, s.hip, s.neck, 17, 21, P.near)
  limb(ctx, s.neck, [(s.neck[0] + s.head[0]) / 2, (s.neck[1] + s.head[1]) / 2], 9, 8, P.near)

  drawLeg(ctx, s.hip, s.kneeN, s.ankleN, s.toeN, P.near)
  dot(ctx, s.head, SEG.headR, P.head)
  drawArm(ctx, s.shoulder, s.elbowN, s.handN, P.near)
}

export function groundShadow(ctx: CanvasRenderingContext2D, cx: number, w: number, P: Palette = PALETTE) {
  const g = ctx.createRadialGradient(cx, GROUND + 1, 0, cx, GROUND + 1, w)
  g.addColorStop(0, P.shadow)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(cx, GROUND + 1, w, w * 0.17, 0, 0, Math.PI * 2)
  ctx.fill()
}
