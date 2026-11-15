import type { ReactNode } from 'react'
import Icon, { type IconName } from './Icon'

/** Estado vazio: um ícone, uma frase e no máximo uma ação. */
export default function EmptyState({ icon, title, action }: { icon: IconName; title: string; action?: ReactNode }) {
  return <div className="empty-state">
    <span className="hub-row-icon"><Icon name={icon} /></span>
    <p>{title}</p>
    {action}
  </div>
}
