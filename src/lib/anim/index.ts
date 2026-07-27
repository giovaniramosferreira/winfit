// Mapa exercício → animação. Fica fora do catálogo para o domínio (src/data)
// continuar puro; o que falta cai no fallback por slot, então exercício novo
// nunca fica sem ilustração.

import type { SlotType } from '../../types'
import { MOVES, type Move, type MoveKey } from './moves'
import { GROUND, PALETTE, type Palette, drawFigure, groundShadow, lerpPose, solve } from './rig'

export type { Move, MoveKey }
export { MOVES, PALETTE, GROUND }

const BY_EXERCISE: Record<string, MoveKey> = {
  // empurrar horizontal
  'supino-reto-barra': 'benchPress',
  'supino-halteres': 'benchDumbbell',
  'supino-inclinado-halteres': 'inclinePress',
  'supino-maquina': 'chestPressMachine',
  flexao: 'pushup',
  'flexao-inclinada': 'pushup',
  'flexao-declinada': 'pushup',
  'supino-elastico': 'bandPress',
  // empurrar vertical
  'desenvolvimento-halteres': 'overheadPress',
  'desenvolvimento-maquina': 'shoulderPressMachine',
  'desenvolvimento-barra': 'overheadPressBar',
  'pike-pushup': 'pikePushup',
  'desenvolvimento-elastico': 'bandPress',
  // puxar horizontal
  'remada-curvada-barra': 'rowBent',
  'remada-serrote': 'rowSingle',
  'remada-maquina': 'rowSeated',
  'remada-baixa-polia': 'rowSeated',
  'remada-cavalinho': 'rowBent',
  'remada-elastico': 'rowSeated',
  'remada-toalha': 'towelRow',
  // puxar vertical
  'puxada-polia': 'pulldown',
  'barra-fixa': 'pullup',
  'puxada-elastico': 'bandPulldown',
  // joelho-dominante
  'agachamento-barra': 'squat',
  'agachamento-hack': 'squat',
  'leg-press': 'legPress',
  'agachamento-goblet': 'squatGoblet',
  'agachamento-corporal': 'squatGoblet',
  'agachamento-kettlebell': 'squatGoblet',
  'agachamento-elastico': 'squatGoblet',
  // quadril-dominante
  'terra-romeno-barra': 'hinge',
  'levantamento-terra': 'deadlift',
  'terra-romeno-halteres': 'hingeDumbbell',
  'hip-thrust-barra': 'hipThrust',
  'ponte-gluteo': 'gluteBridge',
  'ponte-unilateral': 'gluteBridge',
  'swing-kettlebell': 'kbSwing',
  'terra-romeno-elastico': 'hinge',
  // unilateral inferior
  'afundo-halteres': 'lunge',
  bulgaro: 'bulgarian',
  'avanco-corporal': 'lungeBody',
  'step-up': 'stepUp',
  // isolados superiores
  'crucifixo-halteres': 'chestFly',
  'voador-maquina': 'pecDeckMove',
  'crossover-polia': 'crossover',
  'crucifixo-elastico': 'crossover',
  'elevacao-lateral-halteres': 'lateralRaise',
  'elevacao-lateral-polia': 'lateralRaise',
  'elevacao-lateral-elastico': 'lateralRaise',
  'crucifixo-invertido-halteres': 'rearDelt',
  'face-pull': 'facePull',
  'band-pull-apart': 'pullApart',
  'rosca-direta-barra': 'curl',
  'rosca-alternada': 'curlDumbbell',
  'rosca-polia': 'curlCable',
  'rosca-elastico': 'curlBand',
  'rosca-martelo': 'curlHammer',
  'triceps-polia': 'pushdown',
  'triceps-frances-halter': 'tricepsOverhead',
  'triceps-banco': 'benchDip',
  'flexao-diamante': 'diamondPushup',
  'triceps-elastico': 'pushdownBand',
  // isolados inferiores
  'mesa-flexora': 'legCurl',
  'flexora-deslizante': 'slidingCurl',
  'flexora-elastico': 'standingLegCurl',
  'cadeira-extensora': 'legExtension',
  'abducao-maquina': 'abduction',
  'abducao-elastico': 'abductionBand',
  'coice-polia': 'kickback',
  'panturrilha-halteres': 'calfRaise',
  'panturrilha-maquina': 'calfBody',
  'panturrilha-corporal': 'calfBody',
  // core
  prancha: 'plank',
  'dead-bug': 'deadBug',
  'abdominal-infra': 'legRaiseFloor',
  'abdominal-supra': 'crunch',
  'prancha-lateral': 'sidePlank',
  'pallof-press': 'pallof',
  'elevacao-pernas-barra': 'hangingLegRaise',
}

const BY_SLOT: Record<SlotType, MoveKey> = {
  push_h_comp: 'pushup',
  push_v_comp: 'overheadPress',
  pull_h_comp: 'rowBent',
  pull_v_comp: 'pulldown',
  knee_comp: 'squatGoblet',
  hip_comp: 'hinge',
  lower_uni: 'lunge',
  iso_peito: 'chestFly',
  iso_ombro_lat: 'lateralRaise',
  iso_ombro_post: 'rearDelt',
  iso_biceps: 'curlDumbbell',
  iso_triceps: 'pushdown',
  iso_posterior: 'legCurl',
  iso_quad: 'legExtension',
  iso_gluteo: 'gluteBridge',
  iso_panturrilha: 'calfBody',
  core: 'plank',
}

export function moveFor(exerciseId: string, slot?: SlotType): Move {
  const key = BY_EXERCISE[exerciseId] ?? (slot ? BY_SLOT[slot] : undefined)
  return MOVES[key ?? 'squatGoblet']
}

/** Suavização das transições — sem isso a figura muda de direção em bico. */
const smooth = (t: number) => t * t * (3 - 2 * t)

export function poseAt(move: Move, t: number) {
  const f = move.frames
  const p = ((t % 1) + 1) % 1
  let i = 0
  while (i < f.length - 2 && p > f[i + 1].t) i++
  const a = f[i]
  const b = f[i + 1] ?? f[f.length - 1]
  const span = b.t - a.t || 1
  return lerpPose(a.pose, b.pose, smooth(Math.min(1, Math.max(0, (p - a.t) / span))))
}

export interface RenderOpts {
  /** largura/altura em px do canvas (já multiplicado por dpr) */
  w: number
  h: number
  dpr: number
  palette?: Palette
}

// Enquadramento apertado o bastante para a figura dominar o quadro numa miniatura
// de 70 px, e largo o bastante para não cortar torre de polia (x≈180) nem mãos
// acima da cabeça no desenvolvimento (y≈20).
const DEFAULT_VIEW = { x: 14, y: 18, w: 172, h: 124 }

/** Desenha um quadro completo: enquadra a view do movimento no canvas e compõe cenário → figura → equipamento. */
export function renderFrame(ctx: CanvasRenderingContext2D, move: Move, t: number, o: RenderOpts) {
  const P = o.palette ?? PALETTE
  const view = move.view ?? DEFAULT_VIEW
  const cw = o.w / o.dpr
  const ch = o.h / o.dpr

  ctx.setTransform(o.dpr, 0, 0, o.dpr, 0, 0)
  ctx.clearRect(0, 0, cw, ch)

  const scale = Math.min(cw / view.w, ch / view.h)
  ctx.save()
  ctx.translate((cw - view.w * scale) / 2, (ch - view.h * scale) / 2)
  ctx.scale(scale, scale)
  ctx.translate(-view.x, -view.y)

  const p = poseAt(move, t)
  const s = solve(p)

  groundShadow(ctx, s.hip[0], 46, P)
  move.back?.(ctx, s, P)
  drawFigure(ctx, s, P)
  move.front?.(ctx, s, P)

  ctx.restore()
}
