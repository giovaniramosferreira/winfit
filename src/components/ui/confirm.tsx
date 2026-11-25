import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import Button from './Button'
import Sheet from './Sheet'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Ação destrutiva: botão vermelho e foco inicial em Cancelar. */
  destructive?: boolean
}

/** Conteúdo do diálogo, separado para testes de renderização. */
export function ConfirmContent({ title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', destructive = false, onChoose }: ConfirmOptions & { onChoose: (ok: boolean) => void }) {
  return <>
    <h2 id="confirm-title">{title}</h2>
    {message && <p className="small muted" style={{ marginTop: 6 }}>{message}</p>}
    <div className="confirm-actions">
      <Button variant="secondary" data-autofocus={destructive ? '' : undefined} onClick={() => onChoose(false)}>{cancelLabel}</Button>
      <Button variant={destructive ? 'danger' : 'primary'} data-autofocus={destructive ? undefined : ''} onClick={() => onChoose(true)}>{confirmLabel}</Button>
    </div>
  </>
}

function ConfirmView({ options, done }: { options: ConfirmOptions; done: (ok: boolean) => void }) {
  const [open, setOpen] = useState(true)
  const choose = (ok: boolean) => { setOpen(false); done(ok) }
  if (!open) return null
  return <Sheet labelledBy="confirm-title" className="confirm-sheet" onClose={() => choose(false)}><ConfirmContent {...options} onChoose={choose} /></Sheet>
}

/** Substitui window.confirm: abre o diálogo e resolve true (confirmou) ou false (cancelou, Esc ou toque fora). */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    root.render(<ConfirmView options={options} done={(ok) => { resolve(ok); setTimeout(() => { root.unmount(); host.remove() }, 0) }} />)
  })
}
