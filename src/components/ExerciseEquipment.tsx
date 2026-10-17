import type { MovementDemo, MovementPose } from '../data/movementDemos'

const points = (value: string) => value.split(' ').map((p) => p.split(',').map(Number))
const motion = { dur: '4s', repeatCount: 'indefinite', keyTimes: '0;0.5;1', calcMode: 'spline' as const, keySplines: '0.42 0 0.58 1;0.42 0 0.58 1' }
function position(pose: MovementPose, at: 'hands' | 'shoulders' | 'hip', other = false) {
  return at === 'hands' ? points(other ? pose.otherArm : pose.arm)[2] : points(pose.torso)[at === 'hip' ? 1 : 0]
}
function loop(pose: MovementPose, at: 'hands' | 'knees') {
  const a = points(at === 'hands' ? pose.arm : pose.leg)[at === 'hands' ? 2 : 1]
  const b = points(at === 'hands' ? pose.otherArm : pose.otherLeg)[at === 'hands' ? 2 : 1]
  return `M${a[0]},${a[1] - 3} L${b[0]},${b[1] - 3} L${b[0]},${b[1] + 3} L${a[0]},${a[1] + 3} Z`
}

export default function ExerciseEquipment({ demo, foreground = false }: { demo: MovementDemo; foreground?: boolean }) {
  const equipment = demo.equipment
  if (!equipment) return null
  const attachment = (pose: MovementPose) => points(equipment.anchorAt === 'feet' ? pose.otherLeg : pose.arm)[2]
  const start = position(demo.start, equipment.at ?? 'hands')
  const end = position(demo.end, equipment.at ?? 'hands')
  const cable = (pose: MovementPose) => `M${equipment.anchor!.join(',')} L${attachment(pose).join(',')}`
  if (foreground) return equipment.load ? <>
    {(equipment.load === 'dumbbells' && !equipment.at && !equipment.singleLoad ? [false, true] : [false]).map((other) => {
      const a = other ? position(demo.start, 'hands', true) : start
      const b = other ? position(demo.end, 'hands', true) : end
      return <g key={String(other)} className="ink-equipment" transform={`translate(${a.join(' ')})`}>
        {!demo.hold && <animateTransform attributeName="transform" type="translate" values={`${a.join(' ')};${b.join(' ')};${a.join(' ')}`} {...motion} />}
        <g transform={`rotate(${equipment.loadRotation ?? 0})`}>
          {equipment.load === 'kettlebell' ? <><path d="M-5 2v-5a5 5 0 0 1 10 0v5" /><circle cx="0" cy="8" r="8" /></>
            : <><path d={equipment.load === 'barbell' ? 'M-30 0h60' : 'M-13 0h26'} /><rect x={equipment.load === 'barbell' ? -27 : -12} y="-9" width="5" height="18" rx="1" /><rect x={equipment.load === 'barbell' ? 22 : 7} y="-9" width="5" height="18" rx="1" /></>}
        </g>
      </g>
    })}
  </> : null

  return <g className="ink-equipment ink-apparatus">
    {equipment.bench && <>
      <rect x={equipment.bench[0]} y={equipment.bench[1]} width={equipment.bench[2]} height="7" rx="2" />
      <path d={`M${equipment.bench[0] + 10} ${equipment.bench[1] + 7}v${Math.max(0, 164 - equipment.bench[1] - 7)} M${equipment.bench[0] + equipment.bench[2] - 10} ${equipment.bench[1] + 7}v${Math.max(0, 164 - equipment.bench[1] - 7)}`} />
    </>}
    {equipment.machine && <path d="M285 163V14h-28M274 135h22M272 147h25" />}
    {equipment.bar && <path d="M94 14h114M97 14v15M205 14v15" />}
    {equipment.handSupport && <path d={`M${equipment.handSupport[0]} 163V${equipment.handSupport[1] - 18}h18`} />}
    {equipment.anchor && <path d={cable(demo.start)} className={equipment.band ? 'ink-band' : ''}>
      {!demo.hold && <animate attributeName="d" values={`${cable(demo.start)};${cable(demo.end)};${cable(demo.start)}`} {...motion} />}
    </path>}
    {equipment.loopAt && <path d={loop(demo.start, equipment.loopAt)} className="ink-band">
      {!demo.hold && <animate attributeName="d" values={`${loop(demo.start, equipment.loopAt)};${loop(demo.end, equipment.loopAt)};${loop(demo.start, equipment.loopAt)}`} {...motion} />}
    </path>}
  </g>
}
