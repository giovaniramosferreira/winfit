import { useId } from 'react'
import type { CSSProperties } from 'react'
import type { MuscleGroup } from '../types'
import { BODY_CHARACTER_IMAGES, BODY_REGIONS } from '../data/bodyRegions'

/** The approved ink character, with translucent muscle masks over the original lines. */
export default function BodyPlate({ primary, secondary = [], views = 'both', label }: {
  primary?: MuscleGroup | null
  secondary?: MuscleGroup[]
  views?: 'both' | 'front' | 'back'
  label?: string
}) {
  const uid = useId().replace(/:/g, '')
  const hatch = `fibers-${uid}`
  const cls = (group: MuscleGroup) => group === primary ? 'rg pri' : secondary.includes(group) ? 'rg sec' : 'rg'
  const regionStyle = (group: MuscleGroup): CSSProperties => ({
    fill: group === primary ? `url(#${hatch})` : secondary.includes(group) ? 'rgba(170, 164, 173, 0.27)' : 'transparent',
    stroke: 'none',
    mixBlendMode: 'multiply',
  })
  const visibleViews = views === 'both' ? ['front', 'back'] as const : [views]

  return (
    <svg className="body" viewBox={`0 0 ${views === 'both' ? 460 : 220} 460`} role="img"
      aria-label={label ?? `Figura do corpo, ${views === 'both' ? 'vistas anterior e posterior' : views === 'front' ? 'vista anterior' : 'vista posterior'}${primary ? ', com o músculo trabalhado em destaque' : ''}`}
      style={{ background: '#fffefa', isolation: 'isolate' }}>
      <defs>
        <pattern id={hatch} width="15" height="15" patternUnits="userSpaceOnUse" patternTransform="rotate(-32)">
          <rect width="15" height="15" style={{ fill: 'rgba(160, 153, 164, 0.24)' }} />
          <line x1="0" y1="0" x2="0" y2="15" strokeWidth="4" style={{ stroke: '#777078' }} />
        </pattern>
      </defs>
      {visibleViews.map((view, index) => (
        <g key={view} transform={`translate(${index * 240} 0)`} data-view={view}>
          <svg width="220" height="432" viewBox="140 25 744 1405" aria-hidden="true">
            <image className="ink-contour" href={BODY_CHARACTER_IMAGES[view]} width="1024" height="1536" />
            {BODY_REGIONS[view].map(({ group, path }, regionIndex) => (
              <g key={`${group}-${regionIndex}`}>
                <path className={cls(group)} data-muscle={group} d={path} style={regionStyle(group)} />
                <path className={cls(group)} data-muscle={group} d={path} style={regionStyle(group)} transform="translate(1024 0) scale(-1 1)" />
              </g>
            ))}
          </svg>
          <text x="110" y="450" textAnchor="middle" style={{ fontSize: 12, fill: '#716576' }}>
            {view === 'front' ? 'Anterior' : 'Posterior'}
          </text>
        </g>
      ))}
    </svg>
  )
}
