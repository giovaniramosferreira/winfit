import type { MovementPose } from '../data/movementDemos'

type Point = { x: number; y: number }
export interface InkPath { id: string; d: string; material: 'skin' | 'cloth' | 'detail' | 'shoe'; back?: boolean }
const point = (x: number, y: number): Point => ({ x, y })
const add = (a: Point, b: Point, scale = 1) => point(a.x + b.x * scale, a.y + b.y * scale)
const mix = (a: Point, b: Point, t: number) => point(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)
const fmt = (p: Point) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`
const parse = (s: string) => s.trim().split(/\s+/).map((p) => { const [x, y] = p.split(',').map(Number); return point(x, y) })
function basis(a: Point, b: Point) {
  const length = Math.max(Math.hypot(b.x - a.x, b.y - a.y), .01)
  const axis = point((b.x - a.x) / length, (b.y - a.y) / length)
  return { axis, normal: point(-axis.y, axis.x), length }
}

/** Contornos preenchidos com espessura anatômica; juntas continuam articuladas. */
function segment(a: Point, b: Point, top: number, bottom: number): string {
  const { normal } = basis(a, b)
  return `M${fmt(add(a, normal, top))} C${fmt(add(mix(a, b, .3), normal, top * 1.12))} ${fmt(add(mix(a, b, .72), normal, bottom * 1.12))} ${fmt(add(b, normal, bottom))} Q${fmt(b)} ${fmt(add(b, normal, -bottom))} C${fmt(add(mix(a, b, .72), normal, -bottom * 1.12))} ${fmt(add(mix(a, b, .3), normal, -top * 1.12))} ${fmt(add(a, normal, -top))} Q${fmt(a)} ${fmt(add(a, normal, top))} Z`
}

export function inkFigurePaths(pose: MovementPose): InkPath[] {
  const [shoulder, hip] = parse(pose.torso)
  const head = point(...pose.head)
  const { axis, normal } = basis(shoulder, hip)
  const local = (t: number, n: number) => add(mix(shoulder, hip, t), normal, n)
  const paths: InkPath[] = []
  const put = (id: string, d: string, material: InkPath['material'], back = false) => paths.push({ id, d, material, back })

  const leg = (key: 'leg' | 'otherLeg', back: boolean) => {
    const [joint, knee, ankle] = parse(pose[key])
    put(`${key}-thigh`, segment(joint, knee, 8.8, 5.2), 'cloth', back)
    put(`${key}-shin`, segment(knee, ankle, 4.8, 2.7), 'skin', back)
    const { axis: down, normal: side } = basis(knee, ankle)
    const onToes = pose.toeSupport === 'both' || (pose.toeSupport === 'leg' && key === 'leg')
    const shoe = (x: number, y: number) => {
      if (!onToes) return fmt(add(add(ankle, side, -x), down, y))
      // A ponta do calçado fica apoiada; só o calcanhar sobe.
      const angle = Math.PI / 6, dx = x - 10, dy = y - 6
      return fmt(point(ankle.x + 10 + dx * Math.cos(angle) - dy * Math.sin(angle), 163 + dx * Math.sin(angle) + dy * Math.cos(angle)))
    }
    put(`${key}-shoe`, `M${shoe(-3, -3)} Q${shoe(0, -5)} ${shoe(4, -1)} L${shoe(11, 2)} Q${shoe(14, 5)} ${shoe(10, 6)} L${shoe(-4, 6)} Q${shoe(-6, 2)} ${shoe(-3, -3)} Z`, 'shoe', back)
    put(`${key}-seam`, `M${fmt(mix(joint, knee, .24))} Q${fmt(add(mix(joint, knee, .5), side, 2))} ${fmt(mix(joint, knee, .84))}`, 'detail', back)
  }
  const arm = (key: 'arm' | 'otherArm', back: boolean) => {
    const [joint, elbow, wrist] = parse(pose[key])
    put(`${key}-upper`, segment(joint, elbow, 5.3, 3.4), 'skin', back)
    put(`${key}-forearm`, segment(elbow, wrist, 3.8, 2), 'skin', back)
    const { axis: fore, normal: side } = basis(elbow, wrist)
    const hand = (x: number, y: number) => fmt(add(add(wrist, fore, x), side, y))
    put(`${key}-hand`, `M${hand(0, -2)} L${hand(5, -2.5)} Q${hand(9, -1.5)} ${hand(8, 1.2)} L${hand(3, 2)} Q${hand(1, 5)} ${hand(-1, 2)} Z`, 'skin', back)
    put(`${key}-crease`, `M${fmt(mix(joint, elbow, .36))} Q${fmt(add(mix(joint, elbow, .59), side, 2))} ${fmt(mix(joint, elbow, .8))}`, 'detail', back)
  }

  arm('otherArm', true)
  leg('otherLeg', true)
  put('neck', segment(add(head, basis(head, shoulder).axis, 6), shoulder, 4.2, 5), 'skin')
  put('torso', `M${fmt(local(0, 9))} C${fmt(local(.18, 14))} ${fmt(local(.42, 10))} ${fmt(local(.68, 9))} Q${fmt(local(.9, 12))} ${fmt(local(1, 10))} L${fmt(local(1, -10))} Q${fmt(local(.85, -11))} ${fmt(local(.68, -8))} C${fmt(local(.43, -9))} ${fmt(local(.16, -13))} ${fmt(local(0, -9))} Q${fmt(add(shoulder, axis, -4))} ${fmt(local(0, 9))} Z`, 'skin')
  put('shorts', `M${fmt(local(.78, 10))} Q${fmt(local(.86, 0))} ${fmt(local(.78, -9))} L${fmt(local(1.08, -11))} Q${fmt(local(1.15, 0))} ${fmt(local(1.08, 12))} Z`, 'cloth')
  leg('leg', false)
  put('chest-contour', `M${fmt(local(.16, 8))} Q${fmt(local(.24, 3))} ${fmt(local(.23, -5))} M${fmt(local(.38, 8))} Q${fmt(local(.43, 1))} ${fmt(local(.55, 0))} M${fmt(local(.68, 7))} L${fmt(local(.7, 2))}`, 'detail')
  arm('arm', false)

  const { axis: headDown, normal: headSide } = basis(head, shoulder)
  const face = (x: number, y: number) => fmt(add(add(head, headSide, x), headDown, y))
  put('head', `M${face(-6, -10)} C${face(-14, -5)} ${face(-10, 7)} ${face(-5, 11)} L${face(3, 12)} Q${face(9, 7)} ${face(8, 2)} L${face(10, -1)} Q${face(8, -11)} ${face(1, -12)} Q${face(-3, -13)} ${face(-6, -10)} Z`, 'skin')
  put('face-detail', `M${face(4, 6)} Q${face(1, 9)} ${face(-3, 9)} M${face(-7, -9)} Q${face(-2, -12)} ${face(2, -10)}`, 'detail')
  return paths
}
