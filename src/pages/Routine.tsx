import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { calendarFile, duePrompt } from '../lib/routine'
import { useRoutineStore } from '../lib/routineStore'

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
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30000); return () => window.clearInterval(timer) }, [])
  const due = duePrompt(r, now)
  const acknowledge = () => { if (due) update({ delivered: [...r.delivered.slice(-89), due.date], snoozedUntil: 0 }) }
  const downloadCalendar = () => {
    const url = URL.createObjectURL(new Blob([calendarFile(r)], { type: 'text/calendar;charset=utf-8' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'winfit-lembrete.ics'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const toggleDay = (kind: 'reminder' | 'checkin', day: number) => { const current = r[kind]; update({ [kind]: { ...current, days: current.days.includes(day) ? current.days.filter((d) => d !== day) : [...current.days, day].sort() } }) }
  return <div className="page routine-page"><Link to="/home">← Início</Link><h1>Minha rotina</h1>
    {error && <section className="card" role="alert"><p>{error}</p><button className="btn" onClick={exportOriginal}>Exportar dados originais da rotina</button>
      {blocked && <button className="btn" onClick={() => { if (window.confirm('Redefinir a rotina local? Exporte os dados originais antes de continuar.')) useRoutineStore.getState().resetAll() }}>Redefinir somente a rotina</button>}</section>}
    <fieldset disabled={blocked} style={{ border: 0, padding: 0, margin: 0 }}>
    <p>Os avisos aparecem nesta tela enquanto o aplicativo está aberto. Para lembrar com o navegador fechado, importe o arquivo no seu calendário e confirme os alertas nele.</p>
    {due && <section className="card" role="status"><h2>{due.kind === 'reminder' ? 'Hora do treino' : due.kind === 'checkin' ? 'Como você está?' : 'Hora do treino e do check-in'}</h2>
      <button className="btn" onClick={acknowledge}>Dispensar hoje</button><button className="btn" onClick={() => update({ snoozedUntil: Date.now() + 30 * 60000 })}>Adiar 30 min</button></section>}
    <section className="card"><h2>Agenda</h2><label>Fuso horário<input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="America/Sao_Paulo" /></label>
      <button className="btn" onClick={() => { try { new Intl.DateTimeFormat('pt', { timeZone: timezone }).format(); update({ timezone }); setZoneError('') } catch { setZoneError('Fuso inválido. Exemplo: America/Sao_Paulo') } }}>Salvar fuso</button>{zoneError && <p role="alert">{zoneError}</p>}
      <label><input type="checkbox" checked={r.reminder.enabled} onChange={(e) => update({ reminder: { ...r.reminder, enabled: e.target.checked } })} /> Lembrete de treino</label>
      <label>Horário do treino<input type="time" value={r.reminder.time} onChange={(e) => update({ reminder: { ...r.reminder, time: e.target.value } })} /></label>
      <fieldset><legend>Dias de treino</legend>{weekday.map((name, day) => <label key={name}><input type="checkbox" checked={r.reminder.days.includes(day)} onChange={() => toggleDay('reminder', day)} />{name} </label>)}</fieldset>
      <button className="btn" disabled={!r.reminder.enabled || !r.reminder.days.length} onClick={downloadCalendar}>Baixar lembrete para calendário (.ics)</button>
      <p className="small muted">Alterar ou desativar aqui não altera eventos já importados. Atualize ou remova o evento no calendário também.</p>
      <button className="btn" onClick={() => update({ pausedUntil: Date.now() + 7 * 86400000 })}>Pausar avisos por 7 dias</button>
      {r.pausedUntil > now && <button className="btn" onClick={() => update({ pausedUntil: 0, snoozedUntil: 0 })}>Retomar avisos</button>}
      <button className="btn" onClick={() => update({ reminder: { ...r.reminder, enabled: false }, checkin: { ...r.checkin, enabled: false } })}>Desativar todos os avisos</button>
    </section>
    <section className="card"><h2>Checklist por local</h2><label>Local<select value={place} onChange={(e) => setPlace(e.target.value)}><option value="academia">Academia</option><option value="casa">Casa</option><option value="viagem">Viagem</option></select></label>
      {(r.checklists[place] ?? []).map((entry) => <div key={entry.id}><label><input type="checkbox" checked={entry.done} onChange={(e) => update({ checklists: { ...r.checklists, [place]: r.checklists[place].map((i) => i.id === entry.id ? { ...i, done: e.target.checked } : i) } })} />
        <input aria-label="Texto do item" maxLength={200} value={entry.text} onChange={(e) => update({ checklists: { ...r.checklists, [place]: r.checklists[place].map((i) => i.id === entry.id ? { ...i, text: e.target.value } : i) } })} /></label>
        <button className="btn" onClick={() => update({ checklists: { ...r.checklists, [place]: r.checklists[place].filter((i) => i.id !== entry.id) } })}>Remover</button></div>)}
      <form onSubmit={(e) => { e.preventDefault(); if (item.trim()) { update({ checklists: { ...r.checklists, [place]: [...(r.checklists[place] ?? []), { id: crypto.randomUUID(), text: item.trim(), done: false }] } }); setItem('') } }}>
        <label>Novo item<input maxLength={200} value={item} onChange={(e) => setItem(e.target.value)} /></label><button className="btn" disabled={!item.trim()}>Adicionar</button></form>
      <button className="btn" onClick={() => update({ checklists: { ...r.checklists, [place]: (r.checklists[place] ?? []).map((i) => ({ ...i, done: false })) } })}>Desmarcar checklist</button>
    </section>
    <section className="card"><h2>Check-in opcional</h2><label><input type="checkbox" checked={r.checkin.enabled} onChange={(e) => update({ checkin: { ...r.checkin, enabled: e.target.checked } })} /> Quero registrar como estou</label>
      {r.checkin.enabled && <><label>Horário do check-in<input type="time" value={r.checkin.time} onChange={(e) => update({ checkin: { ...r.checkin, time: e.target.value } })} /></label>
        <fieldset><legend>Dias de check-in</legend>{weekday.map((name, day) => <label key={name}><input type="checkbox" checked={r.checkin.days.includes(day)} onChange={() => toggleDay('checkin', day)} />{name} </label>)}</fieldset>
        <label>Silêncio a partir de<input type="time" value={r.checkin.quietStart} onChange={(e) => update({ checkin: { ...r.checkin, quietStart: e.target.value } })} /></label>
        <label>Silêncio até<input type="time" value={r.checkin.quietEnd} onChange={(e) => update({ checkin: { ...r.checkin, quietEnd: e.target.value } })} /></label>
        <p>Um único aviso por dia coordena treino e check-in. Você pode registrar manualmente quando quiser.</p>
        <label>Energia<select value={energy} onChange={(e) => setEnergy(Number(e.target.value))}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} de 5</option>)}</select></label>
        <label>Observação opcional<textarea maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} /></label>
        <button className="btn btn-primary" onClick={() => { const delivered = due ? [...r.delivered.slice(-89), due.date] : r.delivered; update({ entries: [{ id: crypto.randomUUID(), ts: Date.now(), energy, note: note.trim() }, ...r.entries], delivered }); setNote('') }}>Salvar check-in local</button></>}
      {r.entries.map((entry) => <article key={entry.id}><p>{new Date(entry.ts).toLocaleString('pt-BR', { timeZone: r.timezone })} · Energia {entry.energy}/5</p><p>{entry.note}</p><button className="btn" onClick={() => update({ entries: r.entries.filter((i) => i.id !== entry.id) })}>Excluir check-in</button></article>)}
    </section>
    </fieldset>
  </div>
}
