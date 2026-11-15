/** Interruptor com rótulo clicável; continua sendo um checkbox para leitores de tela. */
export default function Switch({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="switch-row">
    <span>{label}{hint && <small>{hint}</small>}</span>
    <input type="checkbox" role="switch" className="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
  </label>
}
