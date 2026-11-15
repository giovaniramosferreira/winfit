/** Explosão curta e decorativa. Some com movimento reduzido. */
const COLORS = ['#7450bd', '#b6a1ff', '#f5b942', '#3ecf8e', '#f0616d']
export default function Confetti() {
  return <span className="confetti" aria-hidden="true">
    {Array.from({ length: 18 }, (_, i) => <i key={i} style={{
      background: COLORS[i % COLORS.length], left: `${(i * 37) % 100}%`,
      animationDelay: `${(i % 6) * 40}ms`, ['--dx' as string]: `${((i * 53) % 120) - 60}px`, ['--rot' as string]: `${(i * 71) % 360}deg`,
    }} />)}
  </span>
}
