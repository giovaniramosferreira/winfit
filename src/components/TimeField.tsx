/** Campo de hora sempre exibido em 24 h; o seletor nativo continua por baixo. */
export default function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="field-row">
    <span>{label}</span>
    <span className="time-field"><span className="num" aria-hidden="true">{value || '--:--'}</span>
      <input type="time" aria-label={label} value={value} onChange={(e) => e.target.value && onChange(e.target.value)} /></span>
  </label>
}
