import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { dialMotion, dialValue } from '../lib/numberDial'

interface Props {
  label: string
  value: number
  min: number
  integer?: boolean
  onChange: (value: number) => void
}

export default function NumberDial({ label, value, min, integer = false, onChange }: Props) {
  const id = useId()
  const [draft, setDraft] = useState(String(value))
  const typing = useRef(false)
  useEffect(() => {
    if (!typing.current) setDraft(String(value))
  }, [value])
  const drag = useRef<{ id: number; x: number; time: number; raw: number } | null>(null)
  const step = integer ? 1 : 0.1
  const update = (raw: number) => {
    const next = dialValue(raw, min, integer)
    if (next !== null) onChange(next)
  }
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const previous = drag.current
    if (!previous || previous.id !== event.pointerId) return
    const change = dialMotion(event.clientX - previous.x, event.timeStamp - previous.time, integer)
    previous.raw = Math.max(min, previous.raw + change)
    previous.x = event.clientX
    previous.time = event.timeStamp
    update(previous.raw)
  }
  const key = (event: KeyboardEvent<HTMLDivElement>) => {
    const direction = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key]
    if (direction) {
      event.preventDefault()
      update(value + direction * step * (event.shiftKey ? 10 : 1))
    } else if (event.key === 'Home') {
      event.preventDefault()
      update(min)
    }
  }

  return (
    <div className="number-dial">
      <label className="field" htmlFor={id}>{label}</label>
      <input id={id} className="dial-value num" type="number" inputMode={integer ? 'numeric' : 'decimal'}
        min={min} step={integer ? 1 : 'any'} required value={draft}
        onFocus={() => { typing.current = true }}
        onBlur={(event) => {
          typing.current = false
          if (event.target.value !== '' && event.target.validity.valid) {
            const normalized = dialValue(event.target.valueAsNumber, min, integer)
            if (normalized !== null) setDraft(String(normalized))
          }
        }}
        onChange={(event) => {
          setDraft(event.target.value)
          if (event.target.value !== '' && event.target.validity.valid) update(event.target.valueAsNumber)
        }} />
      <div className="dial-track" role="spinbutton" tabIndex={0} aria-label={`Ajustar ${label}`}
        aria-valuemin={min} aria-valuenow={value} aria-describedby={`${id}-hint`}
        onKeyDown={key}
        onPointerDown={(event) => {
          if (event.button !== 0 || drag.current) return
          event.currentTarget.setPointerCapture(event.pointerId)
          drag.current = { id: event.pointerId, x: event.clientX, time: event.timeStamp, raw: value }
        }}
        onPointerMove={move}
        onPointerUp={(event) => {
          if (drag.current?.id === event.pointerId) {
            drag.current = null
            event.currentTarget.releasePointerCapture(event.pointerId)
          }
        }}
        onPointerCancel={() => { drag.current = null }}
        onLostPointerCapture={() => { drag.current = null }}>
        <span className="dial-ticks" aria-hidden="true" style={{ transform: `translateX(${(value / step * 8) % 40}px)` }} />
        <span className="dial-marker" aria-hidden="true" />
        <span className="dial-directions" aria-hidden="true">− <span>arraste</span> +</span>
      </div>
      <p id={`${id}-hint`} className="tiny muted dial-hint">Arraste devagar para ajustar · toque no número para digitar</p>
    </div>
  )
}
