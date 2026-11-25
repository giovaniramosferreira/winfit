import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger'
const CLASS: Record<BadgeTone, string> = { neutral: '', brand: 'accent', success: 'success', warning: 'warning', danger: 'danger' }

/** Selo curto de estado. Sempre leva texto: a cor sozinha não basta. */
export default function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={['pill', CLASS[tone]].filter(Boolean).join(' ')}>{children}</span>
}
