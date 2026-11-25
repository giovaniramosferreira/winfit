import type { ReactNode } from 'react'
import Icon from '../Icon'

export type AlertTone = 'info' | 'warning' | 'danger'

/** Aviso em linha. `danger` usa role="alert"; os demais, role="status". */
export default function Alert({ tone = 'info', children }: { tone?: AlertTone; children: ReactNode }) {
  return <div className={`alert alert-${tone}`} role={tone === 'danger' ? 'alert' : 'status'}><Icon name="info" /><div>{children}</div></div>
}
