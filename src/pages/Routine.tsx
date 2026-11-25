import { useEffect, useState } from 'react'
import PageTop from '../components/PageTop'
import Switch from '../components/Switch'
import Icon from '../components/Icon'
import TimeField from '../components/TimeField'
import EmptyState from '../components/EmptyState'
import { calendarFile, duePrompt } from '../lib/routine'
import { useRoutineStore } from '../lib/routineStore'
import { confirmDialog } from '../components/ui'

const weekday = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export default function Routine() {
  const r = useRoutineStore((s) => s.data)
  const update = useRoutineStore((s) => s.update)
  const error = useRoutineStore((s) => s.error)
  const blocked = useRoutineStore((s) => s.blocked)
  const exportOriginal = () => {
    const url = URL.createObjectURL(new Blob([useRoutineStore.getState().exportData()], { type: 'application/json' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'winfit-rotina-original.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const [now, setNow] = useState(Date.now())
  const [place, setPlace] = useState('academia')
  const [item, setItem] = useState('')
  const [timezone, setTimezone] = useState(r.timezone)
  const [zoneError, setZoneError] = useState('')
  const [energy, setEnergy] = useState(3)
  const [note, setNote] = useState('')
  const [tab, setTab] = useState<'agenda' | 'checklist' | 'checkin'>('agenda')
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30000); return () => window.clearInterval(timer) }, [])
  const due = duePrompt(r, now)
  const acknowledge = () => { if (due) update({ delivered: [...r.delivered.slice(-89), due.date], snoozedUntil: 0 }) }
  const downloadCalendar = () => {
    const url = URL.createObjectURL(new Blob([calendarFile(r)], { type: 'text/calendar;charset=utf-8' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'winfit-lembrete.ics'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const toggleDay = (kind: 'reminder' | 'checkin', day: number) => { const current = r[kind]; update({ [kind]: { ...current, days: current.days.includes(day) ? current.days.filter((d) => d !== day) : [...current.days, day].sort() } }) }
  const Days = ({ kind }: { kind: 'reminder' | 'checkin' }) => <div className="day-chips" role="group" aria-label="Dias da semana">
    {weekday.map((name, day) => <button key={name} type="button" aria-label={name} aria-pressed={r[kind].days.includes(day)} onClick={() => toggleDay(kind, day)}>{name[0]}</button>)}
  </div>
  const list = r.checklists[place] ?? []
  return <div className="page routine-page fade-in">
    <PageTop title="Rotina" />
    <nav className="seg" aria-label="Seções da rotina">
      {([['agenda', 'Lembrete'], ['checklist', 'Checklist'], ['checkin', 'Check-in']] as const).map(([id, label]) =>
        <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}
    </nav>
    {error && <section className="card" role="alert"><p>{error}</p><button className="btn btn-ghost" onClick={exportOriginal}>Exportar dados originais da rotina</button>
      {blocked && <button className="btn btn-danger" onClick={async () => { if (await confirmDialog({ title: 'Redefinir a rotina local?', message: 'Exporte os dados originais antes de continuar.', confirmLabel: 'Redefinir', destructive: true })) useRoutineStore.getState().resetAll() }}>Redefinir somente a rotina</button>}</section>}
    <fieldset disabled={blocked} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
    {due && <section className="note" role="status" style={{ marginBottom: 12 }}><b>{due.kind === 'reminder' ? 'Hora do treino!' : due.kind === 'checkin' ? 'Como você está?' : 'Hora do treino e do check-in'}</b>
      <div className="row" style={{ marginTop: 10 }}><button className="btn btn-ghost btn-sm" onClick={acknowledge}>Dispensar hoje</button><button className="btn btn-ghost btn-sm" onClick={() => update({ snoozedUntil: Date.now() + 30 * 60000 })}>Adiar 30 min</button></div></section>}

    {tab === 'agenda' && <section className="card" id="routine-agenda">
      <Switch label="Lembrar de treinar" hint="Aparece com o app aberto" checked={r.reminder.enabled} onChange={(v) => update({ reminder: { ...r.reminder, enabled: v } })} />
      {r.reminder.enabled && <>
        <TimeField label="Horário" value={r.reminder.time} onChange={(time) => update({ reminder: { ...r.reminder, time } })} />
        <Days kind="reminder" />
        <button className="btn btn-ghost" style={{ marginTop: 14 }} disabled={!r.reminder.days.length} onClick={downloadCalendar}>Adicionar ao calendário do celular</button>
        <p className="small muted" style={{ marginTop: 6 }}>Para receber o aviso com o app fechado.</p>
      </>}
      <details className="more">
        <summary>Mais opções</summary>
        {r.pausedUntil > now
          ? <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => update({ pausedUntil: 0, snoozedUntil: 0 })}>Retomar avisos</button>
          : <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => update({ pausedUntil: Date.now() + 7 * 86400000 })}>Pausar avisos por 7 dias</button>}
        <button className="btn btn-quiet" onClick={() => update({ reminder: { ...r.reminder, enabled: false }, checkin: { ...r.checkin, enabled: false } })}>Desativar todos os avisos</button>
        <label className="field-row" style={{ marginTop: 8 }}><span>Fuso horário</span><input value={timezone} onChange={(e) => setTimezone(e.target.value)} onBlur={() => { try { new Intl.DateTimeFormat('pt', { timeZone: timezone }).format(); update({ timezone }); setZoneError('') } catch { setZoneError('Fuso inválido. Exemplo: America/Sao_Paulo') } }} /></label>
        {zoneError && <p role="alert">{zoneError}</p>}
        <p>Mudanças aqui não alteram eventos já adicionados ao calendário.</p>
      </details>
    </section>}

    {tab === 'checklist' && <section className="card" id="routine-checklist">
      <div className="seg" role="group" aria-label="Local">{([['academia', 'Academia'], ['casa', 'Casa'], ['viagem', 'Viagem']] as const).map(([id, label]) =>
        <button key={id} type="button" aria-pressed={place === id} onClick={() => setPlace(id)}>{label}</button>)}</div>
      {list.length === 0 && <EmptyState icon="bag" title="Nada na lista ainda." />}
      <ul className="check-list">{list.map((entry) => <li key={entry.id}>
        <input type="checkbox" aria-label={`Feito: ${entry.text}`} checked={entry.done} onChange={(e) => update({ checklists: { ...r.checklists, [place]: list.map((i) => i.id === entry.id ? { ...i, done: e.target.checked } : i) } })} />
        <input aria-label="Texto do item" className={entry.done ? 'done' : ''} maxLength={200} value={entry.text} onChange={(e) => update({ checklists: { ...r.checklists, [place]: list.map((i) => i.id === entry.id ? { ...i, text: e.target.value } : i) } })} />
        <button type="button" className="top-back" aria-label={`Remover ${entry.text}`} onClick={() => update({ checklists: { ...r.checklists, [place]: list.filter((i) => i.id !== entry.id) } })}><Icon name="close" size={18} /></button>
      </li>)}</ul>
      <form className="add-row" onSubmit={(e) => { e.preventDefault(); if (item.trim()) { update({ checklists: { ...r.checklists, [place]: [...list, { id: crypto.randomUUID(), text: item.trim(), done: false }] } }); setItem('') } }}>
        <input aria-label="Novo item" placeholder="Novo item" maxLength={200} value={item} onChange={(e) => setItem(e.target.value)} />
        <button className="btn btn-primary btn-sm" disabled={!item.trim()} aria-label="Adicionar item"><Icon name="plus" size={18} /></button>
      </form>
      {list.some((i) => i.done) && <button className="btn btn-quiet" onClick={() => update({ checklists: { ...r.checklists, [place]: list.map((i) => ({ ...i, done: false })) } })}>Desmarcar tudo</button>}
    </section>}

    {tab === 'checkin' && <section className="card" id="routine-checkin">
      <h2 className="field-title">Como está sua energia?</h2>
      <div className="seg" role="group" aria-label="Energia de 1 a 5">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" className="num" aria-pressed={energy === n} onClick={() => setEnergy(n)}>{n}</button>)}</div>
      <textarea className="input" aria-label="Observação" placeholder="Observação (opcional)" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => { const delivered = due ? [...r.delivered.slice(-89), due.date] : r.delivered; update({ entries: [{ id: crypto.randomUUID(), ts: Date.now(), energy, note: note.trim() }, ...r.entries], delivered }); setNote('') }}>Salvar check-in</button>
      <details className="more">
        <summary>Lembrete de check-in</summary>
        <Switch label="Lembrar de registrar" checked={r.checkin.enabled} onChange={(v) => update({ checkin: { ...r.checkin, enabled: v } })} />
        {r.checkin.enabled && <>
          <TimeField label="Horário" value={r.checkin.time} onChange={(time) => update({ checkin: { ...r.checkin, time } })} />
          <Days kind="checkin" />
          <TimeField label="Silêncio de" value={r.checkin.quietStart} onChange={(quietStart) => update({ checkin: { ...r.checkin, quietStart } })} />
          <TimeField label="até" value={r.checkin.quietEnd} onChange={(quietEnd) => update({ checkin: { ...r.checkin, quietEnd } })} />
        </>}
      </details>
      {r.entries.length > 0 && <><h2 className="field-title" style={{ marginTop: 18 }}>Registros</h2>
        {r.entries.map((entry) => <div className="list-item" key={entry.id}><div className="grow"><b className="num">Energia {entry.energy}/5</b><p className="small muted">{new Date(entry.ts).toLocaleString('pt-BR', { timeZone: r.timezone, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}{entry.note ? ` · ${entry.note}` : ''}</p></div>
          <button type="button" className="top-back" aria-label="Excluir check-in" onClick={() => update({ entries: r.entries.filter((i) => i.id !== entry.id) })}><Icon name="close" size={18} /></button></div>)}</>}
    </section>}
    </fieldset>
  </div>
}
