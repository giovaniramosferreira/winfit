import { inkFigurePaths } from '../lib/inkFigure'
import type { MovementDemo } from '../data/movementDemos'

export default function InkFigure({ demo, patternId }: { demo: MovementDemo; patternId: string }) {
  const start = inkFigurePaths(demo.start)
  const end = inkFigurePaths(demo.end)
  return <>
    <defs>
      <pattern id={patternId} width="5" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
        <rect width="5" height="9" fill="#fffefa" />
        <path d="M.5 -1 L1.2 10 M3.3 -1 L3.7 10" fill="none" stroke="#655f5b" strokeWidth=".65" />
      </pattern>
    </defs>
    {start.map((part, index) => <path key={part.id}
      d={part.d} className={`ink-${part.material}${part.back ? ' ink-back' : ''}`}
      style={part.material === 'cloth' ? { fill: `url(#${patternId})` } : undefined}>
      {!demo.hold && <animate attributeName="d" values={`${part.d};${end[index].d};${part.d}`}
        keyTimes="0;0.5;1" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" dur="4s" repeatCount="indefinite" />}
    </path>)}
  </>
}
