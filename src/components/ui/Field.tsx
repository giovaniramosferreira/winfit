import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

/** Campo de texto com rótulo, dica e erro ligados por aria. */
export default function Field({ label, hint, error, ...input }: { label: ReactNode; hint?: ReactNode; error?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  const note = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return <div className="ds-field-wrap">
    <label className="field" htmlFor={id}>{label}</label>
    <input id={id} className="input" aria-invalid={error ? true : undefined} aria-describedby={note} {...input} />
    {error ? <p id={`${id}-error`} className="field-note field-error" role="alert">{error}</p>
      : hint ? <p id={`${id}-hint`} className="field-note">{hint}</p> : null}
  </div>
}
