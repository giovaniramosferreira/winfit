import type { ButtonHTMLAttributes, ReactNode } from 'react'
import Icon, { type IconName } from '../Icon'

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger'
const CLASS: Record<ButtonVariant, string> = { primary: 'btn-primary', secondary: 'btn-ghost', quiet: 'btn-quiet', danger: 'btn-danger' }

/** Botão do design system. Uma ação primária por tela; alvo de toque mínimo de 44 px. */
export default function Button({ variant = 'primary', small = false, icon, className = '', type = 'button', children, ...rest }: {
  variant?: ButtonVariant; small?: boolean; icon?: IconName; children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={['btn', CLASS[variant], small ? 'btn-sm' : '', className].filter(Boolean).join(' ')} {...rest}>
    {icon && <Icon name={icon} />}{children}
  </button>
}
