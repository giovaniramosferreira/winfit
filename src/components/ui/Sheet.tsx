import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { createSheetStack, FOCUSABLE, nextFocusIndex } from './sheetLogic'

const stack = createSheetStack()

/** Marca como inertes os demais filhos de <body> (inclui o app e painéis abaixo). Devolve a função que desfaz. */
function inertOthers(except: HTMLElement): () => void {
  const touched: HTMLElement[] = []
  for (const el of Array.from(document.body.children)) {
    if (el === except || !(el instanceof HTMLElement) || el.hasAttribute('inert')) continue
    el.setAttribute('inert', '')
    touched.push(el)
  }
  return () => touched.forEach((el) => el.removeAttribute('inert'))
}

/** Marcação do painel, sem comportamento. Usada pelo Sheet e nos testes de renderização. */
export function SheetPanel({ label, labelledBy, className = '', style, children, panelRef, onKeyDown }: {
  label?: string; labelledBy?: string; className?: string; style?: CSSProperties; children: ReactNode
  panelRef?: React.Ref<HTMLDivElement>; onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>
}) {
  return <div ref={panelRef} className={['modal', className].filter(Boolean).join(' ')} role="dialog" aria-modal="true"
    aria-label={labelledBy ? undefined : label} aria-labelledby={labelledBy} tabIndex={-1} style={style} onKeyDown={onKeyDown}>{children}</div>
}

/**
 * Painel inferior acessível: fundo inerte, foco preso, Esc e toque fora fecham, foco volta a quem abriu.
 * Use `data-autofocus` num controle para escolher o foco inicial.
 */
export default function Sheet({ onClose, label, labelledBy, className, style, dismissible = true, children }: {
  onClose: () => void; label?: string; labelledBy?: string; className?: string; style?: CSSProperties
  dismissible?: boolean; children: ReactNode
}) {
  const backRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const id = Symbol('sheet')
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    stack.push(id)
    const restoreInert = inertOthers(backRef.current!)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const panel = panelRef.current
    ;(panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel)?.focus()

    const onKey = (event: KeyboardEvent) => {
      if (!stack.isTop(id)) return
      if (event.key === 'Escape' && dismissible) { event.stopPropagation(); closeRef.current(); return }
      if (event.key !== 'Tab' || !panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null)
      if (!items.length) { event.preventDefault(); panel.focus(); return }
      const at = items.indexOf(document.activeElement as HTMLElement)
      const next = nextFocusIndex(at, items.length, event.shiftKey)
      if (at < 0 || (!event.shiftKey && at === items.length - 1) || (event.shiftKey && at === 0)) { event.preventDefault(); items[next].focus() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      stack.remove(id)
      restoreInert()
      document.body.style.overflow = previousOverflow
      if (opener?.isConnected) opener.focus()
    }
  }, [dismissible])

  return createPortal(
    <div ref={backRef} className="modal-back" onClick={(event) => { if (dismissible && event.target === event.currentTarget) closeRef.current() }}>
      <SheetPanel panelRef={panelRef} label={label} labelledBy={labelledBy} className={className} style={style}>{children}</SheetPanel>
    </div>,
    document.body,
  )
}
