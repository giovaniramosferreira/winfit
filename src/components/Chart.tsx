import { fmtKg } from '../lib/progression'

interface Point { x: number; y: number; label: string; value: number }

/** Gráfico local de carga, repetições ou tempo por sessão. */
export default function Chart({ data, unit }: { data: { label: string; value: number }[]; unit: string }) {
  if (data.length < 2) return null
  const W = 320
  const H = 150
  const PAD = { l: unit ? 54 : 34, r: 16, t: 22, b: 24 }
  const vals = data.map((d) => d.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const iw = W - PAD.l - PAD.r
  const ih = H - PAD.t - PAD.b

  const pts: Point[] = data.map((d, i) => ({
    x: PAD.l + (i / (data.length - 1)) * iw,
    y: PAD.t + (1 - (d.value - min) / range) * ih,
    label: d.label,
    value: d.value,
  }))
  const path = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  const fmt = (v: number) => `${String(v).replace('.', ',')}${unit ? ` ${unit}` : ''}`
  const metric = unit === 'seg' ? 'Tempo' : unit === 'reps' ? 'Repetições' : 'Carga'
  const describe = (v: number) => unit ? fmt(v) : fmtKg(v)

  return (
    <div className="chart-wrap">
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}
        role="img" aria-label={`${metric} de ${describe(vals[0])} a ${describe(last.value)} em ${data.length} sessões`}>
        <line className="grid" x1={PAD.l} y1={PAD.t} x2={W - PAD.r} y2={PAD.t} />
        <line className="grid" x1={PAD.l} y1={PAD.t + ih / 2} x2={W - PAD.r} y2={PAD.t + ih / 2} />
        <line className="grid" x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} />
        <text x={0} y={PAD.t + 3}>{fmt(max)}</text>
        <text x={0} y={H - PAD.b + 3}>{fmt(min)}</text>
        <polyline className="ln" points={path} />
        {pts.slice(0, -1).map((p, i) => <circle key={i} className="pt" cx={p.x} cy={p.y} r={2.6} />)}
        <circle className="last" cx={last.x} cy={last.y} r={4.2} />
        <text className="val" x={last.x} y={last.y - 9} textAnchor="end">{fmt(last.value)}</text>
        <text x={pts[0].x} y={H - 6} textAnchor="start">{pts[0].label}</text>
        <text x={last.x} y={H - 6} textAnchor="end">{last.label}</text>
      </svg>
    </div>
  )
}
