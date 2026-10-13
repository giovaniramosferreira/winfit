import { useId } from 'react'
import type { MuscleGroup } from '../types'

/**
 * Prancha do corpo em traço de tinta, vistas anterior e posterior.
 * Músculo principal em hachura vermelha; secundários em vermelho claro tracejado.
 * Cada região é desenhada só do lado esquerdo e espelhada — figura simétrica por construção.
 */

const OUTLINE =
  'M50 31 V40 C38 42 26 42 19 47 C11 53 10 66 10 80 L8 116 L7 148 L13 149 L16 118 L21 84 L26 96 ' +
  'C28 108 30 120 30 130 L31 170 L33 206 L35 244 L47 244 L49 206 L52 160 L55 140 L58 160 L61 206 ' +
  'L63 244 L75 244 L77 206 L79 170 L80 130 C80 120 82 108 84 96 L89 84 L94 118 L97 149 L103 148 ' +
  'L102 116 L100 80 C100 66 99 53 91 47 C84 42 72 42 60 40 V31'

type Region = { g: MuscleGroup; d: string }

const FRONT: Region[] = [
  { g: 'ombro', d: 'M21 47 C14 51 11 61 12 73 L21 71 C23 61 27 53 33 48 Z' },
  { g: 'peito', d: 'M54 50 C44 47 34 49 27 55 C27 68 35 78 54 80 Z' },
  { g: 'biceps', d: 'M12 77 C10 87 10 98 11 108 L19 108 C21 98 22 87 21 76 Z' },
  { g: 'core', d: 'M44 84 L55 84 L55 124 L45 124 Z' },
  { g: 'quadriceps', d: 'M33 134 C30 154 31 176 36 196 L50 196 C52 176 53 154 53 138 Z' },
]

const BACK: Region[] = [
  { g: 'ombro', d: 'M21 47 C14 51 11 61 12 73 L21 71 C23 61 27 53 33 48 Z' },
  { g: 'costas', d: 'M54 43 C46 44 37 48 31 54 C31 74 37 94 46 110 L54 112 Z' },
  { g: 'triceps', d: 'M12 77 C10 87 10 98 11 108 L19 108 C21 98 22 87 21 76 Z' },
  { g: 'gluteo', d: 'M54 124 C45 122 35 124 31 133 C31 145 39 151 54 150 Z' },
  { g: 'posterior', d: 'M33 155 C32 170 34 186 37 198 L50 198 C51 186 52 170 53 157 Z' },
  { g: 'panturrilha', d: 'M35 204 C33 214 34 226 37 234 L47 234 C49 226 49 214 48 204 Z' },
]

const MIRROR = 'translate(110 0) scale(-1 1)'

export default function BodyPlate({ primary, secondary = [], views = 'both', label }: {
  primary?: MuscleGroup | null
  secondary?: MuscleGroup[]
  views?: 'both' | 'front' | 'back'
  label?: string
}) {
  const uid = useId().replace(/:/g, '')
  const hatch = `fibers-${uid}`
  const cls = (g: MuscleGroup) => (g === primary ? 'rg pri' : secondary.includes(g) ? 'rg sec' : 'rg')
  const fill = (g: MuscleGroup) => (g === primary ? { fill: `url(#${hatch})` } : undefined)

  const figure = (regions: Region[], x: number, caption: string) => (
    <g transform={`translate(${x} 0)`}>
      <ellipse className="outline" cx="55" cy="17" rx="10.5" ry="13.5" />
      <path className="outline" d={OUTLINE} />
      {regions.map((r) => (
        <g key={r.g}>
          <path className={cls(r.g)} d={r.d} style={fill(r.g)} />
          <path className={cls(r.g)} d={r.d} style={fill(r.g)} transform={MIRROR} />
        </g>
      ))}
      <text x="55" y="258" textAnchor="middle">{caption}</text>
    </g>
  )

  const both = views === 'both'
  const width = both ? 240 : 110

  return (
    <svg className="body" viewBox={`-2 0 ${width + 4} 262`} role="img"
      aria-label={label ?? (primary ? 'Figura do corpo com o músculo trabalhado em destaque' : 'Figura do corpo')}>
      <defs>
        <pattern id={hatch} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
          <rect className="hatch-bg" width="4" height="4" />
          <line className="hatch-ln" x1="0" y1="0" x2="0" y2="4" strokeWidth="1.2" />
        </pattern>
      </defs>
      {(both || views === 'front') && figure(FRONT, 0, 'Anterior')}
      {(both || views === 'back') && figure(BACK, both ? 130 : 0, 'Posterior')}
    </svg>
  )
}
