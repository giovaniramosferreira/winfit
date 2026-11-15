import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'

/** Cabeçalho das telas internas: voltar + título curto + ação opcional à direita. */
export default function PageTop({ title, back = '/home', tagline, action }: { title: string; back?: string | false; tagline?: string; action?: ReactNode }) {
  const nav = useNavigate()
  return <>
    <header className="top">
      {back !== false && <button type="button" className="top-back" aria-label="Voltar" onClick={() => window.history.length > 1 ? nav(-1) : nav(back)}><Icon name="back" /></button>}
      <h1 style={back === false ? { marginLeft: 10 } : undefined}>{title}</h1>
      {action && <div style={{ marginLeft: 'auto' }}>{action}</div>}
    </header>
    {tagline && <p className="top-tagline">{tagline}</p>}
  </>
}
