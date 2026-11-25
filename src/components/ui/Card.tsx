import type { HTMLAttributes, ReactNode } from 'react'

/** Superfície elevada padrão. `as` troca a tag (section, article, li…). */
export default function Card({ as: Tag = 'div', className = '', children, ...rest }: {
  as?: 'div' | 'section' | 'article' | 'li'; children: ReactNode
} & HTMLAttributes<HTMLElement>) {
  return <Tag className={['card', className].filter(Boolean).join(' ')} {...rest}>{children}</Tag>
}
