// Equipamentos desenhados no mesmo espaço do rig. Cada primitiva recebe o
// contexto já transformado — as posições vêm do esqueleto, então a barra segue
// as mãos em vez de flutuar numa posição fixa.

import { GROUND, PALETTE, type Palette, type Vec, dot } from './rig'

type Ctx = CanvasRenderingContext2D

export function floor(ctx: Ctx, P: Palette = PALETTE, y = GROUND) {
  ctx.strokeStyle = P.line
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.moveTo(4, y)
  ctx.lineTo(196, y)
  ctx.stroke()
}

function rect(ctx: Ctx, x: number, y: number, w: number, h: number, color: string, r = 2) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
}

/** Barra olímpica vista de lado: anilhas em disco + luva. */
export function barbell(ctx: Ctx, c: Vec, P: Palette = PALETTE, plateR = 12) {
  ctx.strokeStyle = P.steel
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(c[0] - 26, c[1])
  ctx.lineTo(c[0] + 26, c[1])
  ctx.stroke()
  for (const sx of [-1, 1]) {
    rect(ctx, c[0] + sx * 19 - 2, c[1] - 3.5, 4, 7, P.steel, 1)
    dot(ctx, [c[0] + sx * 24, c[1]], plateR, P.accent)
    dot(ctx, [c[0] + sx * 24, c[1]], plateR * 0.34, P.steelDark)
  }
}

/** Par de halteres na mão indicada. */
export function dumbbell(ctx: Ctx, c: Vec, P: Palette = PALETTE, vertical = false) {
  const w = vertical ? 5.5 : 15
  const h = vertical ? 15 : 5.5
  rect(ctx, c[0] - w / 2, c[1] - h / 2, w, h, P.steel, 1.5)
  const bell = 4.6
  if (vertical) {
    dot(ctx, [c[0], c[1] - h / 2], bell, P.accent)
    dot(ctx, [c[0], c[1] + h / 2], bell, P.accent)
  } else {
    dot(ctx, [c[0] - w / 2, c[1]], bell, P.accent)
    dot(ctx, [c[0] + w / 2, c[1]], bell, P.accent)
  }
}

export function kettlebell(ctx: Ctx, c: Vec, P: Palette = PALETTE) {
  ctx.strokeStyle = P.steel
  ctx.lineWidth = 2.6
  ctx.beginPath()
  ctx.arc(c[0], c[1] + 2, 5, Math.PI * 1.15, Math.PI * 1.85)
  ctx.stroke()
  dot(ctx, [c[0], c[1] + 9], 7, P.accent)
}

/** Banco. `incline` em graus: 0 = reto, negativo = declinado. */
export function bench(ctx: Ctx, cx: number, cy: number, P: Palette = PALETTE, incline = 0, len = 62) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate((-incline * Math.PI) / 180)
  rect(ctx, -len / 2, -4, len, 8, P.steelDark, 3)
  ctx.restore()
  ctx.strokeStyle = P.steelDark
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  for (const sx of [-1, 1]) {
    const bx = cx + (sx * len) / 2.6
    ctx.beginPath()
    ctx.moveTo(bx, cy + 2)
    ctx.lineTo(bx + sx * 5, GROUND)
    ctx.stroke()
  }
}

/** Torre de polia com cabo até um ponto. `high` define a saída do cabo. */
export function cableTower(ctx: Ctx, x: number, to: Vec, P: Palette = PALETTE, high = true) {
  const topY = 26
  rect(ctx, x - 7, topY, 14, GROUND - topY, P.steelDark, 3)
  const outY = high ? topY + 6 : GROUND - 6
  dot(ctx, [x, outY], 4.5, P.steel)
  // pilha de pesos
  for (let i = 0; i < 5; i++) rect(ctx, x - 5, GROUND - 8 - i * 7, 10, 5.5, P.accent, 1)
  ctx.strokeStyle = P.steel
  ctx.lineWidth = 1.8
  ctx.beginPath()
  ctx.moveTo(x, outY)
  ctx.lineTo(to[0], to[1])
  ctx.stroke()
}

/** Elástico: curva que afrouxa conforme a distância cai. */
export function band(ctx: Ctx, a: Vec, b: Vec, P: Palette = PALETTE) {
  const dist = Math.hypot(b[0] - a[0], b[1] - a[1])
  const slack = Math.max(0, 34 - dist) * 0.5
  ctx.strokeStyle = P.accent
  ctx.lineWidth = 2.6
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(a[0], a[1])
  ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + slack + 3, b[0], b[1])
  ctx.stroke()
}

/** Estrutura genérica de máquina: coluna + braço de carga + pilha. */
export function machineFrame(ctx: Ctx, x: number, P: Palette = PALETTE, topY = 40) {
  rect(ctx, x - 6, topY, 12, GROUND - topY, P.steelDark, 3)
  for (let i = 0; i < 4; i++) rect(ctx, x - 4.5, GROUND - 8 - i * 7, 9, 5.5, P.accent, 1)
}

/** Assento com encosto — extensora, remada, desenvolvimento. */
export function seat(ctx: Ctx, cx: number, cy: number, P: Palette = PALETTE, backAngle = 8) {
  rect(ctx, cx - 20, cy - 3, 40, 7, P.steelDark, 3)
  ctx.save()
  ctx.translate(cx - 16, cy)
  ctx.rotate((backAngle * Math.PI) / 180)
  rect(ctx, -4, -34, 8, 34, P.steelDark, 3)
  ctx.restore()
  ctx.strokeStyle = P.steelDark
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(cx, cy + 3)
  ctx.lineTo(cx, GROUND)
  ctx.stroke()
}

/** Rolo acolchoado (extensora, flexora, panturrilha sentado). */
export function pad(ctx: Ctx, c: Vec, P: Palette = PALETTE, r = 6) {
  dot(ctx, c, r, P.steel)
  dot(ctx, c, r * 0.4, P.steelDark)
}

/** Plataforma inclinada do leg press. */
export function legPressRig(ctx: Ctx, plate: Vec, P: Palette = PALETTE) {
  ctx.save()
  ctx.translate(plate[0], plate[1])
  ctx.rotate(-0.5)
  rect(ctx, -3, -22, 6, 44, P.steel, 2)
  ctx.restore()
  ctx.strokeStyle = P.steelDark
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(plate[0] + 12, plate[1] - 26)
  ctx.lineTo(plate[0] + 30, GROUND)
  ctx.stroke()
  dot(ctx, [plate[0] + 16, plate[1] - 20], 9, P.accent)
}

/** Barra fixa suspensa. */
export function pullupBar(ctx: Ctx, y: number, P: Palette = PALETTE) {
  ctx.strokeStyle = P.steel
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(52, y)
  ctx.lineTo(148, y)
  ctx.stroke()
  ctx.lineWidth = 5
  ctx.strokeStyle = P.steelDark
  for (const x of [56, 144]) {
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x, 16)
    ctx.stroke()
  }
}

/** Almofadas do peck deck / crucifixo na máquina. */
export function pecDeck(ctx: Ctx, handN: Vec, handF: Vec, P: Palette = PALETTE) {
  machineFrame(ctx, 158, P, 44)
  for (const h of [handF, handN]) {
    ctx.strokeStyle = P.steel
    ctx.lineWidth = 2.4
    ctx.beginPath()
    ctx.moveTo(h[0], h[1])
    ctx.lineTo(h[0] + 8, h[1] - 16)
    ctx.stroke()
    rect(ctx, h[0] + 4, h[1] - 26, 9, 12, P.steelDark, 3)
  }
}
